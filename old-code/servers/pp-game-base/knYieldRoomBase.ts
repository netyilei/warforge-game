import { kdyield } from "kdweb-core/lib/tools/yield";
import { knRoomBase } from "./knRoomBase";
import { knRoomRealtime } from "./knRoomRealtime";
import { kdutils } from "kdweb-core/lib/utils";
import { GSUserMsg } from "../pp-base-define/GSUserMsg";
import { GSRpcMethods } from "../pp-base-define/GSRpcMethods";
import { RoomDefine } from "../pp-base-define/RoomDefine";


export class knYieldRoomBase extends knRoomBase {
	
	handleInit(params?:GSRpcMethods.tCreateRoomExtensionParams): void {
		this.regStatus(knRoomRealtime.Status.RoundStart,this.step_RoundStart)
		this.regStatus(knRoomRealtime.Status.GameStart,this.step_GameStart)
		this.regStatus(knRoomRealtime.Status.Wait,this.step_Waiting)
		this.regStatus(knRoomRealtime.Status.Playing,this.step_Playing)
		this.regStatus(knRoomRealtime.Status.Result,this.step_Result)
		this.regStatus(knRoomRealtime.Status.JuEnd,this.step_JuEnd)
		this.regStatus(knRoomRealtime.Status.RoundEnd,this.step_RoundEnd)
	}
	private stepMaps_ = new Map<number,kdyield.entity>()
	private cacheMsgs_:knRoomRealtime.MsgType[] = []
	handleMessage(chairNo:number,msgName:string,jsonObj) {
		this.cacheMsgs_.push({
			chairNo:chairNo,
			msgName:msgName,
			jsonObj:jsonObj
		})

	}

	handleRoomStatus(status: knRoomRealtime.Status, prevStatus: knRoomRealtime.Status): void {
		this.log("[yield] swtich to status = " + status)
		this.yieldUseTimeOut_ = null
		
		for(let s of this.stepMaps_.keys()) {
			let entity = this.stepMaps_.get(s)
			entity.shutdown()
		}
		let entity = this.stepMaps_.get(status)
		if(entity) {
			entity.start()
		} else {
			this.log("[yield] cannot start step entity status = " + status)
		}
	}
	handleUpdate() {
		//if(this.yieldUseTimeOut_ == null) {
		if(this.cacheMsgs_.length > 0) {
			{
				let len = this.cacheMsgs_.length
				let i = 0
				let count = 0
				for (i = 0; i < len; i++) {
					let msg = this.cacheMsgs_[i]
					
					let oldStatus = this.status
					let entity = this.stepMaps_.get(oldStatus)
					if(entity == null) {
						break 
					}
					if (this.status != oldStatus) {
						break;
					}
					entity.tick(msg)
					count++
					break 
				}
				if (count > 0) {
					this.cacheMsgs_.splice(0, count)
				}
			}
		} else {
			let entity = this.stepMaps_.get(this.status)
			if(entity) {
				entity.tick(null)
			}
			//this.log("[yield] wait for timer = " + this.yieldUseTimeOut_)
		}
		// 定时
	}
	private yieldUseTimeOut_:number
	regStatus(status:number,func:()=>Promise<void>) {
		if(this.stepMaps_.has(status)) {
			this.stepMaps_.get(status).shutdown()
		}
		let self = this 
		let entity = new kdyield.entity(function() {
			return func.call(self)
		},function(error) {
			self.log("status step func error status = " + status,error)
			if(self.status != knRoomRealtime.Status.RoundEnd) {
				self.setRoomStatus(knRoomRealtime.Status.RoundEnd)
			}
		})
		this.stepMaps_.set(status,entity)
	}

	yieldWaitMsg(chairNo:number,msgName:string,timeoutSec?:number) {
		let self = this 
		this.yieldUseTimeOut_ = null
		if(timeoutSec) {
			this.yieldUseTimeOut_ = timeoutSec
		} 
		let entity = this.stepMaps_.get(this.status)
		return entity.block<knRoomRealtime.MsgType>(function(msg:knRoomRealtime.MsgType) {
			if(msg && (msgName == null || msg.msgName == msgName)) {
				if(chairNo < 0 || chairNo == msg.chairNo) {
					// self.log("[yield] accept for",{chairNo,msgName,timeoutSec})
					// self.log("[yield] msg = ",msg)
					self.yieldUseTimeOut_ = null
					return true 
				}
			} 
			let dt:number = self.dt
			if(self.yieldUseTimeOut_ != null) {
				self.yieldUseTimeOut_ -= dt 
				if(!msg) {
					if(self.yieldUseTimeOut_ <= 0) {
						self.yieldUseTimeOut_ = null
						// self.log("[yield] timeout: accept for",{chairNo,msgName,timeoutSec})
						// self.log("[yield] msg = ",msg)
						return true 
					}
				}
			}
			return false 
		})
	}
	yieldWaitAllUserMsg(msgName?:string,timeoutSec?:number) {
		return this.yieldWaitMsg(-1,msgName,timeoutSec)
	}

	yieldTimeout(timeoutSec:number) {
		let self = this 
		this.yieldUseTimeOut_ = timeoutSec
		let entity = this.stepMaps_.get(this.status)
		return entity.block<knRoomRealtime.MsgType>(function(msg:knRoomRealtime.MsgType) {
			let dt:number = self.dt
			if(self.yieldUseTimeOut_ != null) {
				self.yieldUseTimeOut_ -= dt 
				if(self.yieldUseTimeOut_ <= 0) {
					self.yieldUseTimeOut_ = null
					return true 
				}
			}
			return false 
		})
	}

	async step_RoundStart() {
		await this.yieldTimeout(0.01)
		this.setRoomStatus(knRoomRealtime.Status.GameStart)
	}

	async step_Waiting() {
		let waitAllReadyTime = 0
		while(true) {
			let time = kdutils.getMillionSecond()
			let users = this.users.filter(v=>!this.isChainNoWatcher(v.chairNo))
			let watchUsers = this.users.filter(v=>this.isChainNoWatcher(v.chairNo))
			let readyNT:GSUserMsg.tReadyNT = {
				users:[]
			}
			for(let watchUser of watchUsers) {
				if(watchUser.readyToExit) {
					if(this.doUserExit(watchUser)) {
						this.log("user exit userID = " + watchUser.userID + " chairNo = " + watchUser.chairNo)
						continue 
					} else {
						this.log("user exit failed userID = " + watchUser.userID + " chairNo = " + watchUser.chairNo)
					}
				}
				if(watchUser.enter && !watchUser.online) {
					switch(this.roomData.roomType) {
						case RoomDefine.RoomType.Club:
						case RoomDefine.RoomType.Group: {
							if(watchUser.juCount > 0) {
								if(this.doUserExit(watchUser)) {
									this.log("user offline exit userID = " + watchUser.userID + " chairNo = " + watchUser.chairNo)
									continue 
								}
							}
						} break 
						case RoomDefine.RoomType.Match: {

						} break 
						case RoomDefine.RoomType.Custom: {
							this.log("custom room user offline userID = " + watchUser.userID + " chairNo = " + watchUser.chairNo)
							if(watchUser.userID != this.roomData.boss?.userID) {
								if(this.doUserExit(watchUser)) {
									this.log("user offline exit userID = " + watchUser.userID + " chairNo = " + watchUser.chairNo)
									continue 
								}
							}
						} break 
							
					}
				}
			}

			for(let user of users) {
				if(user.readyToExit) {
					if(this.doUserExit(user)) {
						this.log("user exit userID = " + user.userID + " chairNo = " + user.chairNo)
						continue 
					} else {
						this.log("user exit failed userID = " + user.userID + " chairNo = " + user.chairNo)
					}
				}
				if(user.enter && !user.online) {
					switch(this.roomData.roomType) {
						case RoomDefine.RoomType.Club:
						case RoomDefine.RoomType.Group: {
							if(user.juCount > 0) {
								if(this.doUserExit(user)) {
									this.log("user offline exit userID = " + user.userID + " chairNo = " + user.chairNo)
									continue 
								}
							}
						} break 
						case RoomDefine.RoomType.Match: {

						} break 
						case RoomDefine.RoomType.Custom: {
							this.log("custom room user offline userID = " + user.userID + " chairNo = " + user.chairNo)
							if(user.userID != this.roomData.boss?.userID) {
								if(this.doUserExit(user)) {
									this.log("user offline exit userID = " + user.userID + " chairNo = " + user.chairNo)
									continue 
								}
							}
						} break 
							
					}
				}
				if(user.readyToStandUp){
					if(this.setUserSitdown(user,false)) {
						continue 
					}
				}
				let sendReady = false 
				if(!this.getUserReadyEnabled(user)) {
					if(user.ready) {
						sendReady = true 
					}
					user.ready = false 
				} else {
					if(!user.ready) {
						if(this.getAutoReady()) {
							user.ready = true 
							sendReady = true 
						} else if(!user.waitReadyTime) {
							user.waitReadyTime = time
						} else {
							if(this.d.waitReadyTimeout) {
								if(time - user.waitReadyTime >= this.d.waitReadyTimeout) {
									this.doUserExit(user)
									this.log("user ready timeout userID = " + user.userID + " chairNo = " + user.chairNo)
									continue 
								}
							}
						}
					}
				}
				if(sendReady) {
					readyNT.users.push({
						chairNo:user.chairNo,
						ready:user.ready,
					})
				}
			}
			if(readyNT.users.length > 0) {
				this.sendToAllUser(GSUserMsg.Ready,readyNT)
			}
			// let readyCount = users.reduce((n,v)=>n+((v.ready && !v.readyToExit) ? 1 : 0),0)
			let ctrlPause = this.checkWaitOrPause()
			let readyCount = this.getValidReadyChairNos().length
			if(!ctrlPause && readyCount >= this.getMinPlayingUserCount()) {
				this.log("ready user count =",readyCount)
				if(this.isRoundStart) {
					if(this.getGameWaitAllReadyWaitTimeout()) {
						if(!waitAllReadyTime) {
							waitAllReadyTime = kdutils.getMillionSecond()
						} else {
							if(time - waitAllReadyTime >= this.getGameWaitAllReadyWaitTimeout()) {
								if(this.getGameWaitNoReadyEnabled()) {
									break 
								}else if(this.getGameWaitAllIsReady()){
									break
								}
							}
						}
					} else {
						// 检查是否所有玩家都准备
						if(this.getGameWaitNoReadyEnabled()) {
							break 
						}else if(this.getGameWaitAllIsReady()){
							break
						}
					}
				} else {
					break 
				}
			} else {
				// this.log("waiting user ready count =",readyCount,"ctrlPause =",ctrlPause,this.matchControl)
			}
			let msg = await this.yieldWaitAllUserMsg(GSUserMsg.Ready,0.1)
			if(msg) {
				let data:GSUserMsg.tReadyReq = msg.jsonObj
				data.b = !!data.b
				let user = this.getUser(msg.chairNo)
				if(this.getUserReadyEnabled(user)) {
					if(!user.readyToExit && !user.readyToStandUp && data.b != user.ready) {
						let nt:GSUserMsg.tReadyNT = {
							users:[{
								chairNo:user.chairNo,
								ready:user.ready,
							}]
						}
						this.sendToAllUser(GSUserMsg.Ready,nt)
					}
				}
			}
		}
		if(this.isRoundStart) {
			this.setRoomStatus(knRoomRealtime.Status.GameStart)
		} else {
			this.setRoomStatus(knRoomRealtime.Status.RoundStart)
		}
	}

	async step_GameStart() {
		await this.yieldTimeout(0.01)
		this.setRoomStatus(knRoomRealtime.Status.Playing)
	}

	async step_Playing() {
		await this.yieldTimeout(0.01)
		this.setRoomStatus(knRoomRealtime.Status.Result)
	}
	
	async step_Result() {
		await this.yieldTimeout(0.01)
		this.setRoomStatus(knRoomRealtime.Status.JuEnd)
	}
	async step_JuEnd() {
		await this.yieldTimeout(0.01)
		if(this.matchID) {
			if(this.matchControl && this.matchControl.roundEndWait) { 
				this.log("match control round end wait...")
				this.setupMatchControlRoundEnd(this.matchControl.roundEndRemoveType != null ? this.matchControl.roundEndRemoveType : RoomDefine.RemoveType.Match)
				return 
			}
			while(true) {
				if(this.checkWaitOrPause()) {
					await this.yieldTimeout(0.1)
					continue
				}
				break
			}
			if(this.matchControl.nextWait) {
				this.matchControl.wait = true 
				this.matchControl.timeoutSec = this.matchControl.nextWaitTimeoutSec
				this.matchControl.startTime = null 
				this.matchControl.nextWait = null 
				this.matchControl.nextWaitTimeoutSec = null 
				this.log("match control next wait...")
			}
		}
		this.setRoomStatus(knRoomRealtime.Status.Wait)
	}

	async step_RoundEnd() {
	}

	getValidReadyChairNos() {
		return this.users.filter(v=>v.ready && !v.readyToExit && !v.readyToStandUp).map(v=>v.chairNo)
	}

	getUserReadyEnabled(user:knRoomRealtime.UserData) {
		return true
	}
}