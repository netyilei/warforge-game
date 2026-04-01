import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript"
import { Log } from "./log"
import { knRoomRealtime } from "./knRoomRealtime"
import { GameSet } from "../pp-base-define/GameSet"
import { kdutils } from "kdweb-core/lib/utils"
import { GSUserMsg } from "../pp-base-define/GSUserMsg"
import { GameServerBase } from "./gameServerBase"
import { DBDefine } from "../pp-base-define/DBDefine"
import { GSRpcMethods } from "../pp-base-define/GSRpcMethods"
import { RoomDefine, RoomSystemRule, RoomSystemRule_UserCannotEnterBySelf } from "../pp-base-define/RoomDefine"
import { GSCommonMsg } from "./GSCommonMsg"
import Decimal from "decimal.js"
import { kds } from "../pp-base-define/GlobalMethods"
import { RobotEnvTools } from "../src/RobotEnvTools"
import { ItemDefine } from "../pp-base-define/ItemDefine"
import { GSMatchControl } from "../pp-base-define/GSMatchControl"
import { RewardDefine } from "../pp-base-define/RewardDefine"
import { GlobalUtils } from "../src/GlobalUtils"
import { Module_UserLoginData } from "../pp-base-define/DM_UserDefine"
import { GSMatchUserMsg } from "../pp-base-define/GSMatchUserMsg"


export class knRoomBase {
	constructor(roomData:RoomDefine.RoomData,gameServer:GameServerBase) {
		this.roomData_ = roomData
		this.gameData_ = roomData.gameData
		this.gameSet_ = GameSet.createWithData(this.gameData_)
		this.server_ = gameServer

		this.lockID_ = this.server_.getLockID(roomData)
	}

	async initRoom(params?:GSRpcMethods.tCreateRoomExtensionParams) {
		this.startParams_ = params || {}
		if(params.matchID && params.lockID) {
			this.lockID_ = params.lockID
			this.isMatchLockID_ = true 
		} else {
			this.isMatchLockID_ = false 
		}
		if(this.roomData.matchID) {
			this.matchWater_ = await GlobalUtils.getMatchWater(this.roomData.matchID)
		} else if(this.roomData.groupID) {
			this.groupWater_ = await GlobalUtils.getGroupWater(this.roomData.groupID)
		} else {
			this.friendWater_ = await GlobalUtils.getFriendWater()
		}
		
		try {
			this.handleInit(params)
		} catch (error) {
			this.logError("init failed ",error)			
			return false 
		}

		this.roomStartTime_ = kdutils.getMillionSecond()
		this.setRoomStatus(knRoomRealtime.Status.Wait)
		return true 
	}
	private startParams_:GSRpcMethods.tCreateRoomExtensionParams = null
	get startParams() {
		return this.startParams_
	}
	
	private server_:GameServerBase
	get server() {
		return this.server_
	}

	private roomData_:RoomDefine.RoomData = null 
	get roomData() {
		return this.roomData_
	}
	private gameData_:RoomDefine.GameData = null 
	get gameData() {
		return this.gameData_
	}
	private gameSet_:GameSet = null 
	get gameSet() {
		return this.gameSet_
	}
	get roomID() {
		return this.roomData_.roomID
	}
	get clubID() {
		return this.roomData_.club ? this.roomData_.club.clubID : null
	}
	get groupID() {
		return this.roomData.groupID
	}
	get matchID() {
		return this.roomData.matchID
	}
	private groupWater_:RewardDefine.tGroupWater
	get groupWater() {
		return this.groupWater_
	}
	private friendWater_:RewardDefine.tFriendWater
	get friendWater() {
		return this.friendWater_
	}
	private matchWater_:RewardDefine.tMatchWater
	get matchWater() {
		return this.matchWater_
	}

	private matchControl_:{
		pause?:boolean,	// 暂停
		wait?:boolean,	// 本局结束暂停
		roundEndWait?:boolean, // 本局结束解散
		roundEndRemoveType?:RoomDefine.RemoveType,
		timeoutSec?:number, // 暂停时长
		startTime?:number,	// 暂停开始时间
		nextWait?:boolean,
		nextWaitTimeoutSec?:number,
	} = {}
	get matchControl() {
		return this.matchControl_
	}

	checkPause() {
		return this.matchControl.pause
	}

	checkWait() {
		if(this.matchControl.wait) {
			if(this.matchControl.timeoutSec) {
				let time = kdutils.getMillionSecond()
				if(!this.matchControl.startTime) {
					this.matchControl.startTime = time
				}
				if(time - this.matchControl.startTime >= this.matchControl.timeoutSec * 1000) {
					this.matchControl.wait = false
					this.matchControl.pause = false 
					this.matchControl.startTime = null
					return false 
				}
			}
			return true 
		}
		return false 
	}

	checkWaitOrPause() {
		return this.checkWait() || this.checkPause()
	}
	
	private status_:knRoomRealtime.Status = null 
	get status() {
		return this.status_
	}

	private lockID_:string = null
	get lockID() {
		return this.lockID_
	}
	private isMatchLockID_:boolean = false
	get isMatchLockID() {
		return this.isMatchLockID_
	}

	private users_:knRoomRealtime.UserData[] = []
	get users() {
		return this.users_
	}
	// 从1开始 RoundStart juCount == 0 GameStart +1
	private juCount_:number = 0
	get juCount() {
		return this.juCount_
	}
	set juCount(v) {
		this.juCount_ = v
	}

	private roomStartTime_:number = null 
	get roomStartTime() {
		return this.roomStartTime_
	}
	private roomEndTime_:number = null 
	get roomEndTime() {
		return this.roomEndTime_
	}
	private roundStartTime_:number = null 
	get roundStartTime() {
		return this.roundStartTime_
	}
	private juStartTime_:number = null 
	get juStartTime() {
		return this.juStartTime_
	}
	private juEndTime_:number = null 
	get juEndTime() {
		return this.juEndTime_
	}
	private roundEndTime_:number = null 
	get roundEndTime() {
		return this.roundEndTime_
	}

	private isReadyToDestroy_:boolean = false 
	get isReadyToDestroy() {
		return this.isReadyToDestroy_
	}

	private isRoundStart_:boolean = false 
	get isRoundStart() {
		return this.isRoundStart_
	}

	protected realtime_:knRoomRealtime 
	get d() {
		return this.realtime_
	}

	protected stepRecordData_:any = null
	get stepRecordData() {
		return this.stepRecordData_
	}
	set stepRecordData(v) {
		this.stepRecordData_ = v
	}
	setRoomStatus(status:knRoomRealtime.Status) {
		let oldStatus = this.status_
		this.status_ = status
		// 前置处理
		switch(status) {
			case knRoomRealtime.Status.Wait:{
				
			} break 
			case knRoomRealtime.Status.RoundStart:{
				this.isRoundStart_ = true 
				let nt:GSUserMsg.tRoundStartNT = {

				}
				this.sendToAllUser(GSUserMsg.RoundStart,nt)
				this.roundStartTime_ = kdutils.getMillionSecond()
			} break 
			case knRoomRealtime.Status.GameStart:{
				this.juCount ++
				this.juStartTime_ = kdutils.getMillionSecond()
				this.fupans_ = []
				this.billDatas_ = []
				this.userScores_ = []
				let startNT:GSUserMsg.tFupanStartNT = {
					roomID:this.roomData.roomID,
					roomInfo:this.getRoomInfoNT(),
					users:[],
					juCount:this.juCount,
					juEndTime:0,
				}
				for(let user of this.users_) {
					if(this.isChainNoWatcher(user.chairNo)) {
						continue 
					}
					startNT.users.push(this.getUserEnterData(user))
				}
				this.recordFupanMsg(GSUserMsg.FupanStart,startNT)
			} break 
			case knRoomRealtime.Status.Playing:{
				
			} break 
			case knRoomRealtime.Status.Result:{
				
			} break 
			case knRoomRealtime.Status.JuEnd:{
				this.juEndTime_ = kdutils.getMillionSecond()
				this.recordFupanMsg(GSUserMsg.FupanEnd,<GSUserMsg.tFupanEndNT>{
					roomID:this.roomData.roomID,
				})
				this.reportBillToServer()
				if(this.stepRecordData) {
					this.server_.Room_GameStepRecord(this.roomID,this.stepRecordData)
					this.stepRecordData = null 
				}
				this.sendToAllUser(GSUserMsg.GameEnd,{})
				for(let user of this.users_) {
					if(this.isChainNoWatcher(user.chairNo)) {
						continue 
					}
					user.ready = this.getGameWaitReady()
				}
				this.sendReadyToAllUser()
				if(this.fupans_.length > 0) {
					let startNT:GSUserMsg.tFupanStartNT = this.fupans_[0].jsonObj || {}
					startNT.juEndTime = this.juEndTime_

					this.server.Room_Fupan(this.roomID,this.fupans_)
				}
				if(this.fullUserScores_.length > 0){
					let userScoresRecord:RoomDefine.UserScore[] = []
					for(let userScore of this.fullUserScores_) {
						userScoresRecord.push({
							userID:userScore.userID,
							chairNo:userScore.chairNo,
							score:userScore.score.toString(),
							scoreChanged:userScore.scoreChanged.toString(),
							charge:userScore.charge.toString(),
							fee:userScore.fee.toString(),	
						})		
					}
					this.server.Room_UserScoresRecord(this.roomID,userScoresRecord)
				}
			} break 
			case knRoomRealtime.Status.RoundEnd:{
				this.roundEndTime_ = kdutils.getMillionSecond()
				this.reportRoundBillToServer()
				this.sendToAllUser(GSUserMsg.RoundEnd,<GSUserMsg.tRoundEndNT>{
					removeType:this.roundEndRemoveType_
				})
			} break 
		}
		this.handleRoomStatus(status,oldStatus)
		// 后置处理
		switch(status) {
			case knRoomRealtime.Status.Wait:{
				 
			} break 
			case knRoomRealtime.Status.RoundStart:{
				if(this.status == knRoomRealtime.Status.RoundStart) {
					this.setRoomStatus(knRoomRealtime.Status.GameStart)
				}
				this.server.Room_Status(this.roomID,RoomDefine.RoomStatus.Start)
			} break 
			case knRoomRealtime.Status.GameStart:{
				
				this.server.Room_Status(this.roomID,RoomDefine.RoomStatus.Start)
			} break 
			case knRoomRealtime.Status.Playing:{
				 
			} break 
			case knRoomRealtime.Status.Result:{

			} break 
			case knRoomRealtime.Status.JuEnd:{
				this.gameStartNT_ = null 

				// let check = this.getRoundEndAutoCheck()
				// if(check.juCount) {
				// 	if(this.juCount >= this.gameSet.getJuCount()) {
				// 		this.setupRoundEnd(RoomDefine.RemoveType.NormalEnd)
				// 	}
				// } else if(check.waterTimeoutSec != null) {
				// 	if((kdutils.getMillionSecond() - this.roundStartTime_) / 1000 >= check.waterTimeoutSec) {
				// 		this.setupRoundEnd(RoomDefine.RemoveType.NormalEnd)
				// 	}
				// }
				// 两个if调换位置，先通知realtime
				if(this.status == knRoomRealtime.Status.JuEnd) {
					let users:RoomDefine.tRoomRpcUserScoreChanged[] = []
					for(let user of this.users_) {
						if(this.isChainNoWatcher(user.chairNo)) {
							continue 
						}
						users.push({
							userID:user.userID,
							chairNo:user.chairNo,
							score:user.score.toString(),
						})
					}
					this.server.Room_Status(this.roomID,RoomDefine.RoomStatus.JuEnd,users)
				}
				
				if(this.readyToRoundEnd) {
					this.setupRoundEnd(this.roundEndRemoveType)
				} else if(this.handleCheckGameEnd()){
					this.setupRoundEnd(RoomDefine.RemoveType.NormalEnd)
				} else {
					// if(this.status == knRoomRealtime.Status.JuEnd) {
					// 	this.setRoomStatus(knRoomRealtime.Status.Wait)
					// }
				}
			} break 
			case knRoomRealtime.Status.RoundEnd:{
				this.server.Room_Status(this.roomID,RoomDefine.RoomStatus.End)
				this.release()
				this.isReadyToDestroy_ = true 
			} break 
		}
	}

	private gameStartData_:any = null 
	get gameStartData() {
		return this.gameStartData_
	}
	private gameStartNT_:GSUserMsg.tGameStartNT = null 
	get gameStartNT() {
		return this.gameStartNT_
	}
	sendGameStart(playingChairNos?:number[],data?:any) {
		if(playingChairNos) {
			for(let user of this.users_) {
				if(this.isChainNoWatcher(user.chairNo)) {
					user.play = false 
					continue 
				}
				user.play = playingChairNos.includes(user.chairNo)
				if(user.play) {
					user.juCount ++
				}
			}
		} else {
			for(let user of this.users_) {
				if(this.isChainNoWatcher(user.chairNo)) {
					user.play = false 
					continue 
				}
				user.play = user.ready
				user.juCount ++
			}
		}
		this.gameStartData_ = data 
		let startNT:GSUserMsg.tGameStartNT = {
			juCount:this.juCount,
			playingChairNos:playingChairNos.slice(),
			data,
			gameData:this.gameData,
		}
		this.gameStartNT_ = startNT
		this.sendToAllUser(GSUserMsg.GameStart,startNT)
	}

	setupRoundEnd(removeType?:RoomDefine.RemoveType) {
		if(this.status_ != knRoomRealtime.Status.RoundEnd) {
			this.roundEndRemoveType_ = removeType
			this.setRoomStatus(knRoomRealtime.Status.RoundEnd)
		}
	}

	setupJuEndRoundEnd(removeType?:RoomDefine.RemoveType) {
		if(this.status_ != knRoomRealtime.Status.RoundEnd) {
			this.readyToRoundEnd_ = true
			this.roundEndRemoveType_ = removeType
		}
	}
	isChainNoWatcher(chairNo:number) {
		return chairNo >= this.getWatchChairNoOffset()
	}

	getUser(chairNo:number) {
		return this.users_.find(v=>v.chairNo == chairNo)
	}
	getUserData<T = any>(chairNo:number) {
		let user = this.getUser(chairNo)
		return user ? <T>user.extData : null
	}
	getUserByUserID(userID:number) {
		return this.users_.find(v=>v.userID == userID)
	}

	lockUser(chairNo:number,promise:Promise<any>) {
		let user = this.getUser(chairNo)
		if(!user) {
			return false 
		}
		let p = new Promise(async (resolve,reject)=>{
			await promise
			let idx = user.locks.indexOf(p)
			if(idx >= 0) {
				user.locks.splice(idx,1)
			}
			resolve(null)
		})
		user.locks.push(p)
		return true 
	}
	getPlayingChairNos() {
		return this.users_.filter(v=>v.play).map(v=>v.chairNo)
	}

	getSitChairNos() {
		return this.users.filter(v=>!this.isChainNoWatcher(v.chairNo)).map(v=>v.chairNo)
	}
	getSitChairNosCount() {
		return this.users.reduce((n,v)=>!this.isChainNoWatcher(v.chairNo) ? n + 1 : n,0)
	}
	selectPlayChairNo() {
		let chairNos:number[] = []
		for(let i = 0 ; i < this.getMaxPlayingUserCount() ; i ++) {
			if(this.getUser(i)) {
				continue 
			}
			chairNos.push(i)
		}
		return chairNos.length == 0 ? -1 : chairNos[kdutils.intRandom(0,chairNos.length)]
	}

	selectWatchChairNo() {
		let chairNo = this.getWatchChairNoOffset()
		let count = 0
		let maxCount = this.getWatchMaxCount()
		while(true) {
			if(this.getUser(chairNo)) {
				chairNo ++
				count ++ 
				if(count >= maxCount) {
					return -1
				}
				continue 
			}
			return chairNo
		}
	}

	async userEnter(userID:number,params:GSRpcMethods.tUserEnterReq) {
		if(params.chairNo != null) {
			if(!!this.users_.find(v=>v.chairNo == params.chairNo && v.userID != userID)) {
				return false 
			}
			if(params.chairNo < 0 || params.chairNo >= this.getMaxPlayingUserCount()) {
				return false 
			}
		}
		if(this.gameSet.checkRule(RoomSystemRule,RoomSystemRule_UserCannotEnterBySelf)) {
			if(!params.system) {
				return false 
			}
		}
		let user:knRoomRealtime.UserData = {
			userID,
			chairNo:this.handleUserEnterWithChairNo(userID),
			loginData:null,

			juCount:0,

			score:new Decimal(0),
			scoreChange:new Decimal(0),
			scoreCharge:new Decimal(0),
	
			robot:false,
			play:false,
			ready:false,
	
			online:true,
			tuoguan:false,
			enter:false,
			process:true,
	
			extData:null,

			locks:[],

			readyToExit:false,
			readyToStandUp:false,
			
			waitReadyTime:0,
		}
		if(user.chairNo < 0) {
			this.logError("user enter failed chairNo < 0 userID = " + userID)
			return false 
		}
		this.users_.push(user)
		user.robot = await RobotEnvTools.isRobot(userID)
		let success = true 
		do {
			let loginData = await Module_UserLoginData.getMain(userID)
			if(!loginData) {
				this.logError("user enter failed get login data failed userID = " + userID,params)
				success = false 
				break 
			}
			user.loginData = loginData
			let b = await this.handleInitUserScore(user,params)
			if(!b) {
				this.logError("user enter failed init user score failed userID = " + userID,params)
				success = false 
				break 
			}
		} while(false);
		user.process = false 
		if(!success) {
			let idx = this.users_.indexOf(user)
			if(idx >= 0) {
				this.users_.splice(idx,1)
			}
			this.logError("user enter failed userID = " + userID,params)
			return false 
		}
		user.extData = this.handleCreateUserData(user)
		this.handleUserEnter(user)
		this.sendUserEnterToAll(user)
		this.handleAfterUserEnter(user)
		return true 
	}

	userExit(userID:number,force?:boolean) {
		let user = this.getUserByUserID(userID)
		if(!user) {
			return false 
		}
		return this.doUserExit(user,force)
	}

	userExitByChairNo(chairNo:number,force?:boolean) {
		let user = this.getUser(chairNo)
		if(!user) {
			return false 
		}
		return this.doUserExit(user,force)
	}
	
	doUserExit(user:knRoomRealtime.UserData,force?:boolean) {
		user.readyToExit = true 
		if(!this.handleUserCanExit(user,force)) {
			return false 
		}
		let idx = this.users_.indexOf(user)
		let nt:GSUserMsg.tUserExitNT = {
			chairNo:user.chairNo
		}
		this.setIgnoreRecordFupanOnce();
		this.sendToAllUser(GSUserMsg.UserExit,nt)
		this.users_.splice(idx,1)
		this.server.Room_UserExit(this.roomID,user.userID)
		this.server.Flag_RemoveUser(this.roomID,[user.userID])

		this.handleUserExit(user)
		Promise.all(user.locks)
		.then(()=>{
			user.locks.splice(0)
			if(this.matchID && this.startParams.lockID) {
				return 
			}
			switch(this.d.payMainType) {
				case RoomDefine.PayType.Item:{
					this.server.centerRpc.call(
						kds.item.unlockUser,user.loginData.userID,this.d.lockID,ItemDefine.SerialType.Game)
				} break 
				case RoomDefine.PayType.Club:{
					this.server.centerRpc.call(
						kds.club.account.unlockUser,this.clubID,user.loginData.userID,this.d.lockID,ItemDefine.SerialType.Game)
				} break 
			}
		})
		return true 
	}

	async handleInitUserScore(user:knRoomRealtime.UserData,params:GSRpcMethods.tUserEnterReq) {
		return true 
	}

	sendToUser(chairNo:number,msgName:string,jsonObj) {
		let user = this.getUser(chairNo)
		if(user.online && user.enter) {
			this.log("send to user id = " + user.loginData.userID + " | msgName = " + msgName + " msg = " + JSON.stringify(jsonObj || {}))
			this.server_.Room_SendToUser(user.loginData.userID,msgName,jsonObj)
			return true 
		}
		return false 
	}

	sendErrorToUser(chairNo:number,errCode:number,errMsg?:string,needRestart?:boolean) {
		this.log("[error] chairNo = " + chairNo + " | code = " + errCode + " | msg = " + errMsg + " | ns = " + needRestart)
		return this.sendToUser(chairNo,GSUserMsg.Error,{
			errCode:errCode,
			errMsg:errMsg,
			needRestart:needRestart == null ? false : needRestart,
		})
	}
	
	sendToAllUser(msgName:string,jsonObj,exceptChairNo:number = -1) {
		this.sendToAllPlayingUser(msgName,jsonObj,exceptChairNo)
		this.sendToAllWatcher(msgName,jsonObj)
		// if(this.server.isPeek(msgName)) {
		// 	this.server.Room_SendPeek(this,msgName,jsonObj)
		// }
	}

	sendToAllPlayingUser(msgName:string,jsonObj,exceptChairNo:number = -1) {
		this.log("send to all user msgName = " + msgName + " msg = " + JSON.stringify(jsonObj || {}))
		for(let user of this.users_) {
			if(user.chairNo == exceptChairNo) {
				continue
			}
			if(!user.online || !user.enter) {
				continue
			}
			if(this.isChainNoWatcher(user.chairNo)) {
				continue
			}
			this.server_.Room_SendToUser(user.loginData.userID,msgName,jsonObj)
		}
		if(exceptChairNo == -1 || exceptChairNo == null) {
			this.recordFupanMsg(msgName,jsonObj)
		}
	}

	sendToAllWatcher(msgName:string,jsonObj) {
		this.log("send to all watcher msgName = " + msgName + " msg = " + JSON.stringify(jsonObj || {}))
		for(let user of this.users_) {
			if(!this.isChainNoWatcher(user.chairNo)) {
				continue
			}
			if(!user.online || !user.enter) {
				continue
			}
			this.server_.Room_SendToUser(user.loginData.userID,msgName,jsonObj)
		}
	}
	sendToAllNotPlayUser(msgName:string,jsonObj) {
		this.log("send to all not play users msgName = " + msgName + " msg = " + JSON.stringify(jsonObj || {}))
		for(let user of this.users_) {
			if(!user.online || !user.enter) {
				continue
			}
			if(user.play) {
				continue 
			}
			this.server_.Room_SendToUser(user.loginData.userID,msgName,jsonObj)
		}
	}

	sendToAllWatcherAndRecord(msgName:string,jsonObj) {
		this.sendToAllWatcher(msgName,jsonObj)
		this.recordFupanMsg(msgName,jsonObj)
	}

	sendReadyToAllUser(exceptChairNo?:number) {
		let readyNT:GSUserMsg.tReadyNT = {
			users:[]
		}
		for(let user of this.users_) {
			if(this.isChainNoWatcher(user.chairNo)) {
				continue 
			}
			readyNT.users.push({
				chairNo:user.chairNo,
				ready:user.ready,
			})
		}
		this.sendToAllUser(GSUserMsg.Ready,readyNT,exceptChairNo)
	}

	sendAllReadyToUser(chairNo:number) {
		let readyNT:GSUserMsg.tReadyNT = {
			users:[]
		}
		for(let user of this.users_) {
			if(this.isChainNoWatcher(user.chairNo)) {
				continue 
			}
			readyNT.users.push({
				chairNo:user.chairNo,
				ready:user.ready,
			})
		}
		this.sendToUser(chairNo,GSUserMsg.Ready,readyNT)
	}

	getRoomInfoNT() {
		let roomNT:GSUserMsg.tRoomInfoNT = {
			roomID:this.roomData.roomID,
			boxCode:this.roomData.boxCode,
			gameData:this.gameData,
			club:this.roomData.club,
			juCount:this.juCount,
			groupID:this.roomData.groupID,
			matchID:this.roomData.matchID,
			bossUserID:this.roomData.boss?.userID,
			roomType:this.roomData.roomType,
		}
		return roomNT
	}

	sendRoomInfoToUser(chairNo:number) {
		this.sendToUser(chairNo,GSUserMsg.RoomInfo,this.getRoomInfoNT())
	}

	sendUserEnterToAll(chairNo:number | knRoomRealtime.UserData) {
		let enterNT:GSUserMsg.tUserEnterNT = {
			users:[]
		}
		let user = typeof(chairNo) == "number" ? this.getUser(chairNo) : chairNo
		if(!user) {
			return false 
		}
		enterNT.users.push(this.getUserEnterData(user))
		this.sendToAllUser(GSUserMsg.UserEnter,enterNT,user.chairNo)
		return true 
	}

	sendAllUserEntersToUser(chairNo:number) {
		let enterNT:GSUserMsg.tUserEnterNT = {
			users:[]
		}
		for(let user of this.users_) {
			if(user.chairNo == chairNo) {
				continue 
			}
			enterNT.users.push(this.getUserEnterData(user))
		}
		this.sendToUser(chairNo,GSUserMsg.UserEnter,enterNT)
	}

	protected getUserEnterData(user:knRoomRealtime.UserData) {
		if(!user.loginData) {
			this.log("getUserEnterData: user.loginData is null chairNo = " + user.chairNo + " userID = " + user.userID)
		}
		return <GSUserMsg.tUserEnterData> {
			chairNo:user.chairNo,
			userID:user.userID,
			nickName:user.loginData?.nickName,
			iconUrl:user.loginData?.iconUrl,
			sex:user.loginData?.sex,
			score:user.score.toString(),
			online:user.online,
			tuoguan:user.tuoguan,
		}
	}

	setUserOnline(chairNo:number | knRoomRealtime.UserData,b:boolean) {
		let user = typeof(chairNo) == "number" ? this.getUser(chairNo) : chairNo
		if(!user) {
			return false 
		}
		user.online = !!b
		if(!b) {
			// user.enter = false 
		}
		let nt:GSUserMsg.tOnlineNT = {
			chairNo:user.chairNo,
			b:user.online,
		}
		this.setIgnoreRecordFupanOnce()
		this.sendToAllUser(GSUserMsg.Online,nt)
		if(b) {
			// this.handleChairOnline(user.chairNo)
		} else {
			this.handleChairOffline(user.chairNo)
		}
		return true 
	}

	setUserTuoguan(chairNo:number | knRoomRealtime.UserData,b:boolean) {
		let user = typeof(chairNo) == "number" ? this.getUser(chairNo) : chairNo
		if(!user) {
			return 
		}
		user.tuoguan = !!b
		let nt:GSUserMsg.tTuoguanNT = {
			chairNo:user.chairNo,
			b:user.tuoguan,
		}
		this.sendToAllUser(GSUserMsg.Tuoguan,nt)
	}

	/**
	 * 
	 * @param chairNo 
	 * @param b false stand true sit
	 * @returns 
	 */
	setUserSitdown(chairNo:number | knRoomRealtime.UserData,b:boolean,newChairNo?:number) {
		let user = typeof(chairNo) == "number" ? this.getUser(chairNo) : chairNo
		if(!user) {
			return false
		}
		if(newChairNo != null) {
			if(newChairNo < 0 || newChairNo >= this.getMaxPlayingUserCount()) {
				return false 
			}
			let newUser = this.getUser(newChairNo)
			if(newUser) {
				return false 
			}
		}
		if(!b) {
			if(this.isChainNoWatcher(user.chairNo)) {
				return false 
			}
			if(this.matchID) {
				return false 
			}
			newChairNo = newChairNo != null ? newChairNo : this.selectWatchChairNo()
			if(newChairNo < 0) {
				return false 
			}
			let oldChairNo = user.chairNo
			user.chairNo = newChairNo
			// user.play = false 
			let nt:GSUserMsg.tUserStandUpNT = {
				chairNo:oldChairNo,
				toChairNo:newChairNo
			}
			this.standupResetUser(user);
			this.sendToAllUser(GSUserMsg.UserStandUp,nt)
			this.handleUserStandup(user)
		} else {
			if(!this.isChainNoWatcher(user.chairNo)) {
				return false 
			}
			newChairNo = newChairNo != null ? newChairNo : this.selectPlayChairNo()
			if(newChairNo < 0) {
				return false 
			}
			let oldChairNo = user.chairNo
			user.chairNo = newChairNo
			// user.play = true 
			let nt:GSUserMsg.tUserSitdownNT = {
				chairNo:oldChairNo,
				toChairNo:newChairNo
			}
			this.sendToAllUser(GSUserMsg.UserSitdown,nt)
			this.handleUserSitdown(user)
		}
		return true 
	}
	standupResetUser(user:knRoomRealtime.UserData) {
		user.readyToExit = false;
		user.readyToStandUp = false;
		user.juCount = 0;
		user.score = new Decimal(0);
		user.scoreChange = new Decimal(0);
		user.scoreCharge = new Decimal(0);
		user.play = false;
		user.ready = false;
		user.locks = [];
		user.locks = [];
		//不重新创建 需要把buyinStatus = TexasBuyinStatus.Need
		user.extData = this.handleCreateUserData(user)
	}

	sendScoreChanged(chairNo:number | knRoomRealtime.UserData,changed?:number | Decimal,type?:GSUserMsg.ScoreChangeType) {
		let user = typeof(chairNo) == "number" ? this.getUser(chairNo) : chairNo
		if(!user) {
			return false 
		}
		let nt:GSUserMsg.tScoreChangeNT = {
			chairNo:user.chairNo,
			score:user.score.toString(),
			scoreChanged:changed.toString(),
			type,
		}
		this.sendToAllUser(GSUserMsg.ScoreChange,nt)
		return true 
	}

	private fupans_:{
		msgName:string,
		jsonObj:any,
		timestamp:number,
	}[] = []
	get fupans() {
		return this.fupans_
	}

	private ignoreRecordFupanOnce_ = false 
	setIgnoreRecordFupanOnce() {
		this.ignoreRecordFupanOnce_ = true 
	}
	recordFupanMsg(msgName:string,jsonObj) {
		if(this.ignoreRecordFupanOnce_) {
			this.ignoreRecordFupanOnce_ = false 
			return 
		}
		this.fupans_.push({
			msgName,
			jsonObj,
			timestamp:kdutils.getMillionSecond(),
		})
	}

	private userScores_:{
		userID:number,
		chairNo:number,
		scoreChanged:Decimal,
		charge:Decimal,
		fee:Decimal,
	}[] = []
	private fullUserScores_:{
		userID:number,
		chairNo:number,
		score:Decimal,
		scoreChanged:Decimal,
		charge:Decimal,
		fee:Decimal,
	}[] = []
	reportScore(chairNo:number,scoreChanged:number | Decimal) {
		let user = this.getUser(chairNo)
		if(!user) {
			return false 
		}
		user.scoreChange = user.scoreChange.add(scoreChanged)
		user.score = user.score.add(scoreChanged)
		{
			let userScore = this.fullUserScores_.find(v=>v.chairNo == chairNo)
			if(!userScore) {
				userScore = {
					userID:user.userID,
					chairNo,
					score:user.score,
					scoreChanged:new Decimal(0),
					charge:new Decimal(0),
					fee:new Decimal(0),
				}
				this.fullUserScores_.push(userScore)
			}
			userScore.score = user.score
			userScore.scoreChanged = userScore.scoreChanged.add(scoreChanged)
		}

		{
			let userScore = this.userScores_.find(v=>v.chairNo == chairNo)
			if(!userScore) {
				userScore = {
					userID:user.userID,
					chairNo,
					scoreChanged:new Decimal(0),
					charge:new Decimal(0),
					fee:new Decimal(0),
				}
				this.userScores_.push(userScore)
			}
			userScore.scoreChanged = userScore.scoreChanged.add(scoreChanged)
		}
		this.log("score changed chairNo = " + chairNo + " user.scoreChange = " + user.scoreChange + " userScore.scoreChanged = " + this.userScores_.find(v=>v.chairNo == chairNo).scoreChanged)
		this.sendScoreChanged(chairNo,scoreChanged,GSUserMsg.ScoreChangeType.Game)
		this.handleScoreChanged(user,scoreChanged,GSUserMsg.ScoreChangeType.Game)
		return true 
	}
	/**
	 * 
	 * @param chairNo 
	 * @param fee 一定大于等于0
	 * @returns 
	 */
	reportFee(chairNo:number,fee:number | string | Decimal) {
		fee = new Decimal(fee).abs()
		let user = this.getUser(chairNo)
		if(!user) {
			return false 
		}
		user.score = user.score.sub(fee)
		{
			let userScore = this.fullUserScores_.find(v=>v.chairNo == chairNo)
			if(!userScore) {
				userScore = {
					userID:user.userID,
					chairNo,
					score:user.score,
					scoreChanged:new Decimal(0),
					charge:new Decimal(0),
					fee:new Decimal(0),
				}
				this.fullUserScores_.push(userScore)
			}
			userScore.score = user.score
			userScore.fee = userScore.fee.add(fee)
		}
		{
			let userScore = this.userScores_.find(v=>v.chairNo == chairNo)
			if(!userScore) {
				userScore = {
					userID:user.userID,
					chairNo,
					scoreChanged:new Decimal(0),
					charge:new Decimal(0),
					fee:new Decimal(0),
				}
				this.userScores_.push(userScore)
			}
			userScore.fee = userScore.fee.add(fee)
		}
		this.sendScoreChanged(chairNo,fee.neg(),GSUserMsg.ScoreChangeType.Fee)
		this.handleScoreChanged(user,fee.neg(),GSUserMsg.ScoreChangeType.Fee)
		return true 
	}

	reportCharge(chairNo:number,score:number | Decimal) {
		score = new Decimal(score)
		let user = this.getUser(chairNo)
		if(!user) {
			return false 
		}
		user.score = user.score.add(score)
		{
			let userScore = this.fullUserScores_.find(v=>v.chairNo == chairNo)
			if(!userScore) {
				userScore = {
					userID:user.userID,
					chairNo,
					score:user.score,
					scoreChanged:new Decimal(0),
					charge:new Decimal(0),
					fee:new Decimal(0),
				}
				this.fullUserScores_.push(userScore)
			}
			userScore.score = user.score
			userScore.charge = userScore.charge.add(score)
		}
		{
			let userScore = this.userScores_.find(v=>v.chairNo == chairNo)
			if(!userScore) {
				userScore = {
					userID:user.userID,
					chairNo,
					scoreChanged:new Decimal(0),
					charge:new Decimal(0),
					fee:new Decimal(0),
				}
				this.userScores_.push(userScore)
			}
			userScore.charge = userScore.charge.add(score)
		}
		this.sendScoreChanged(chairNo,score,GSUserMsg.ScoreChangeType.Charge)
		this.handleScoreChanged(user,score,GSUserMsg.ScoreChangeType.Charge)
		this.server.Flag_AddUser
		return true 
	}

	private billDatas_:any[] = []
	reportBillData(billData:any) {
		this.billDatas_.push(billData)
	}

	private roundBillDatas_:any[] = []
	reportRoundBillData(billData:any) {
		this.roundBillDatas_.push(billData)
	}

	reportBillToServer() {
		let bill:RoomDefine.BillData = {
			roomID:this.roomID,
			clubID:this.clubID,
			groupID:this.groupID,
			matchID:this.matchID,
			juCount:this.juCount,
			gameData:this.gameData,
			users:[],
			startTimestamp:this.juStartTime,
			startDate:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",this.juStartTime),
			endTimestamp:this.juEndTime,
			endDate:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",this.juEndTime),
			datas:this.billDatas_,
		}
		for(let chairNo of this.getPlayingChairNos()) {
			let user = this.getUser(chairNo)
			let userScore = this.userScores_.find(v=>v.chairNo == chairNo)
			bill.users.push({
				nickName:user.loginData.nickName,
				iconUrl:user.loginData.iconUrl,
				sex:user.loginData.sex,
				chairNo:chairNo,
				userID:user.userID,
				score:user.score.toString(),		// 最后剩余
				scoreChanged:userScore ? userScore.scoreChanged.toString() : "0",// 输赢
				scoreCharge:userScore ? userScore.charge.toString() : "0",	// 入场充值
				fee:userScore ? userScore.fee.toString() : "0",			
			})
		}
		this.server_.Room_Bill(this.roomID,bill,this.roomData)
	}
	private roundEndRemoveType_:RoomDefine.RemoveType
	get roundEndRemoveType() {
		return this.roundEndRemoveType_
	}
	private readyToRoundEnd_:boolean = false 
	get readyToRoundEnd() {
		return this.readyToRoundEnd_
	}
	reportRoundBillToServer() {
		let bill:RoomDefine.FinalBillData = {
			roomID:this.roomID,
			clubID:this.clubID,
			groupID:this.groupID,
			matchID:this.matchID,
			juCount:-1,
			gameData:this.gameData,
			users:[],
			removeType:this.roundEndRemoveType_ != null ? this.roundEndRemoveType_ : RoomDefine.RemoveType.NormalEnd,
			startTimestamp:this.roundStartTime,
			startDate:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",this.roundStartTime),
			endTimestamp:this.roundEndTime,
			endDate:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",this.roundEndTime),
			datas:this.roundBillDatas_,
		}
		for(let userScore of this.fullUserScores_) {
			bill.users.push({
				nickName:null,
				iconUrl:null,
				sex:null,
				chairNo:userScore.chairNo,
				userID:userScore.userID,
				score:userScore ? userScore.score.toString() : "0",		// 最后剩余
				scoreChanged:userScore ? userScore.scoreChanged.toString() : "0",// 输赢
				scoreCharge:userScore ? userScore.charge.toString() : "0",	// 入场充值
				fee:userScore ? userScore.fee.toString() : "0",
			})
		}
		this.server_.Room_RoundBill(this.roomID,bill,this.roomData)
	}
	log(title:string,...params) {
		Log.oth.info("[Room=" + this.roomID + "] " + title,...params)
	}
	logError(title:string,...params) {
		Log.oth.error("[Room=" + this.roomID + "] " + title,...params)
	}

	private dt_:number = null 
	get dt() {
		return this.dt_
	}
	onUpdate(dt) {
		this.dt_ = dt 
		this.handleUpdate()

		this.onLateUpdate(dt)
		this.handleLaterUpdate()
	}

	onLateUpdate(dt) {
		if(this.isRoundStart) {
			if(this.status == knRoomRealtime.Status.Wait) {
				if(this.handleCheckGameEnd()) {
					this.setupRoundEnd(RoomDefine.RemoveType.NormalEnd)
				}
			}
		} else {
			if(this.status == knRoomRealtime.Status.Wait) {
				if(this.handleCheckGameEnd()) {
					this.setupRoundEnd(RoomDefine.RemoveType.NormalEnd)
				}
			}
		}
	}

	release() {
		let users = this.users_
		let userIDs = users.map(v=>v.userID)
		this.server.Flag_RemoveUser(this.roomID,userIDs)
		for(let user of users) {
			let nt:GSUserMsg.tUserExitNT = {
				chairNo:user.chairNo
			}
			this.sendToUser(user.chairNo,GSUserMsg.UserExit,nt)
			this.handleUserExit(user)
	
			Promise.all(user.locks)
			.then(()=>{
				user.locks.splice(0)
				if(this.matchID && this.startParams.lockID) {
					return 
				}
				switch(this.d.payMainType) {
					case RoomDefine.PayType.Item:{
						this.server.centerRpc.call(
							"kds.item.unlockUser",user.loginData.userID,this.d.lockID)
					} break 
					case RoomDefine.PayType.Club:{
						this.server.centerRpc.call(
							"kds.club.account.unlockUser",this.clubID,user.loginData.userID,this.d.lockID)
					} break 
				}
			})
		}
		this.server.Room_UsersExit(this.roomID,userIDs)
		this.handleRelease()
		this.users_ = []
	}
	
	onMessage(userID:number,msgName:string,data:any) {
		let user = this.getUserByUserID(userID)
		if(!user) {
			return false 
		}
		this.log("on message userID = " + userID + " chairNo = " + user.chairNo + " msgName = " + msgName + " data = " + JSON.stringify(data))
		switch(msgName) {
			case GSUserMsg.ReadyToEnter: {
				user.enter = true 
				// 执行下断线重连
				this.log("user ready enter")
				this.handleChairOnline(user.chairNo)
			} break 
			case GSUserMsg.Chat:{
				let interval = this.getChatIntervalSec()
				let curTime = kdutils.getMillionSecond()
				if(user.prevChatTime && (curTime - user.prevChatTime < interval * 1000)) {
					break 
				}
				if(this.isChainNoWatcher(user.chairNo)) {
					if(!this.getWatchChatEnabled()) {
						break 
					}
				}
				let t:GSUserMsg.tChatReq = data 
				if(typeof(t.type) != "number") {
					this.sendErrorToUser(user.chairNo,99,"chat type invalid 1")
					break 
				}
				if((this.getEnabledChatType() & t.type) != t.type) {
					this.sendErrorToUser(user.chairNo,99,"chat type invalid 2")
					break 
				}
				user.prevChatTime = curTime
				let userIDs = this.users_.map(v=>v.userID)
				this.server_.Room_SendToUsers(userIDs,GSUserMsg.Chat,<GSUserMsg.tChatNT>{
					type:t.type,
					fromChairNo:user.chairNo,
					text:t.text,
					toChairNo:t.toChairNo,
					index:t.index,
				})
			} break 
			case GSUserMsg.Jiesan:{
				if(this.roomData.boss?.userID == user.userID) {
					if(this.status == knRoomRealtime.Status.Wait) {
						this.log("boss jiesan room")
						this.sendToAllUser(GSUserMsg.Jiesan,<GSUserMsg.tJiesanNT>{
							chairNo:user.chairNo,
						})
						this.setupRoundEnd(RoomDefine.RemoveType.BossJiesan)
					} else if(this.status < knRoomRealtime.Status.JuEnd) {
						this.sendToAllUser(GSUserMsg.Jiesan,<GSUserMsg.tJiesanNT>{
							chairNo:user.chairNo,
							juEnd:true,
						})
						this.setupJuEndRoundEnd(RoomDefine.RemoveType.BossJiesan)
					}
				} break 
			}
		}
		this.handleMessage(user.chairNo,msgName,data)
		return true 
	}

	async setupMatchControlRoundEnd(removeType:RoomDefine.RemoveType) {
		this.setupRoundEnd(removeType)
		let locks = this.users_.map(v=>v.locks).reduce((prev,curr)=>prev.concat(curr),[])
		this.log("wait all user locks count = " + locks.length)
		await Promise.all(locks)
	}
	
	async onMatchControl(msgName:string,jsonObj:any) {
		this.log("on match control msgName = " + msgName + " jsonObj = " + JSON.stringify(jsonObj || {}))
		switch(msgName) {
			case GSMatchControl.GamePause:{
				let t:GSMatchControl.tGamePause = jsonObj
				this.matchControl.pause = true
				this.matchControl.timeoutSec = t.timeoutSec
				this.matchControl.startTime = kdutils.getMillionSecond()
			} break 
			case GSMatchControl.GameResume:{
				let t:GSMatchControl.tGameResume = jsonObj
				if(t.resumeContainsWait) {
					this.matchControl.wait = false
				} 
				this.matchControl.pause = false
				this.matchControl.startTime = null 
				this.matchControl.timeoutSec = null 
				
				this.matchControl.nextWait = !!t.nextWait
				this.matchControl.nextWaitTimeoutSec = t.nextWait?.timeoutSec
			} break
			case GSMatchControl.GameWaitOnEnd:{
				let t:GSMatchControl.tGameWaitOnEnd = jsonObj
				this.matchControl.wait = true 
				this.matchControl.timeoutSec = t.timeoutSec
				this.matchControl.startTime = null 
			} break
			case GSMatchControl.GameRoundEnd:{
				let t:GSMatchControl.tGameRoundEnd = jsonObj
				this.matchControl.roundEndRemoveType = t.roundEndRemoveType != null ? t.roundEndRemoveType : RoomDefine.RemoveType.MatchForce
				if(t.waitEnd) {
					this.matchControl.roundEndWait = true
					return true 
				}
				await this.setupMatchControlRoundEnd(this.matchControl.roundEndRemoveType)
				return true 
			} break
			case GSMatchControl.UserOut:{
				let t:GSMatchControl.tUserOut = jsonObj
				if(this.status != knRoomRealtime.Status.JuEnd && this.status != knRoomRealtime.Status.Wait) {
					this.logError("match user out failed status invalid status = " + this.status)
					return false 
				}
				let user = this.getUserByUserID(t.userID)
				if(!user) {
					this.logError("match user out failed user not in room userID = " + t.userID)
					return false 
				}
				this.userExit(t.userID,true)
				await Promise.all(user.locks)
				return true
			} break
			case GSMatchControl.RoomCombine:{
				let t:GSMatchControl.tRoomCombine = jsonObj
				if(t.fromRoomID == this.roomID) {
					if(this.status != knRoomRealtime.Status.JuEnd && this.status != knRoomRealtime.Status.Wait) {
						this.logError("match room combine failed status invalid status = " + this.status)
						return false 
					}
					this.setupRoundEnd(RoomDefine.RemoveType.MatchCombine)
					let locks = this.users_.map(v=>v.locks).reduce((prev,curr)=>prev.concat(curr),[])
					this.log("wait all user locks count = " + locks.length)
					await Promise.all(locks)
				} else if(t.toRoomID == this.roomID) {
					// for(let userID of t.userIDs) {
					// 	let b = await this.userEnter(userID,t.enterReq || {
					// 		chairNo:null,
					// 		system:{
					// 			matchID:this.matchID,
					// 		}
					// 	})
					// 	if(!b) {
					// 		this.logError("match room combine user enter failed userID = " + userID)
					// 	}
					// }
				}
				return true 
			} break
			case GSMatchControl.GameForceWaitCombine:{
				let t:GSMatchControl.tGameForceWaitCombine = jsonObj
				this.sendToAllUser(GSMatchUserMsg.WaitForCombine,<GSMatchUserMsg.tWaitForCombineNT>{
					force:t.b
				})
			} break 
		}
		return false 
	}

	protected enabledPots_:GlobalUtils.tSelectPot[] = []
	get enabledPots() {
		return this.enabledPots_
	}
	async updateEnabledPots() {
		let chairNos = this.getPlayingChairNos()
		let userIDs = chairNos.map(v=>this.getUser(v))
						.filter(v=>!!v && !v.robot)
						.map(v=>v.userID)
		if(userIDs.length > 0) {
			this.enabledPots_ = await GlobalUtils.getPotsByDefault(userIDs,{
				groupID:this.groupID,
				matchID:this.matchID,
				roomData:this.roomData,
			})
		} else {
			this.enabledPots_ = []
		}
	}

	getWatchChairNoOffset() {
		return 100000
	}

	getWatchEnabled() {
		return false 
	}

	getWatchMaxCount() {
		return 100
	}

	/**
	 * 进入的玩家先watch
	 * @returns 
	 */
	getDefaultWatchEnter() {
		return false 
	}

	getAutoReady() {
		if(this.matchID) {
			return true 
		}
		return true 
	}
	
	getGameWaitReady() {
		return true 
	}

	getRoomTimeout() {
		return 2 * 60 * 60000
	}

	getMaxPlayingUserCount() {
		return this.gameSet.getUserCount()
	}

	getMinPlayingUserCount() {
		return 2
	}

	/**
	 * 局间准备是否有超时
	 * @returns 
	 */
	getGameWaitAllReadyWaitTimeout() {
		return 0
	}

	/**
	 * 局间是否可以不准备
	 * @returns 
	 */
	getGameWaitNoReadyEnabled() {
		return false 
	}

	getGameWaitAllIsReady() {
		let users = this.users.filter(v=>!this.isChainNoWatcher(v.chairNo))
		return users.every(v=>v.ready && !v.readyToExit && !v.readyToStandUp)
	}
	/**
	 * 是否可以游戏间进入
	 * @returns 
	 */
	getUserEnterWhileGameStart() {
		return true 
	}

	getRoundEndAutoCheck() {
		let ret:{
			waterTimeoutSec?:number,
			juCount?:number,
		} = {
			waterTimeoutSec:null,
			juCount:this.gameSet.getJuCount()
		}
		return ret
	}

	/**
	 * 可用的聊天类型
	 */
	getEnabledChatType() {
		return GSUserMsg.ChatType.Text | GSUserMsg.ChatType.Fast | GSUserMsg.ChatType.Emoji | GSUserMsg.ChatType.ToEmoji
	}

	/**
	 * 旁边是否可以聊天
	 */
	getWatchChatEnabled() {
		return false 
	}

	/**
	 * 两次聊天间隔
	 */
	getChatIntervalSec() {
		return 1
	}

	// virtual functions:
	/**
	 * 房间初始化
	 */
	handleInit(params?:GSRpcMethods.tCreateRoomExtensionParams) {
	}
	/**
	 * 当修改了房间状态
	 * @param status 新状态
	 * @param prevStatus 旧状态
	 */
	handleRoomStatus(status:knRoomRealtime.Status,prevStatus:knRoomRealtime.Status) {
	}

	handleUpdate() {
	}

	handleLaterUpdate() {
	}

	handleRelease() {

	}
	handleChairOnline(chairNo:number) {
		let syncNT:GSUserMsg.tGameSyncNT = {
			gameStartNT:this.gameStartNT,
			roomNT:this.getRoomInfoNT(),
			users:[],
			syncData:null
		}
		for(let user of this.users_) {
			syncNT.users.push(this.getUserEnterData(user))
		}
		syncNT.syncData = this.handleSyncGameData(chairNo)
		this.log("send to user sync datas chairNo = " + chairNo,syncNT)
		this.sendToUser(chairNo,GSUserMsg.GameSync,syncNT)
	}

	handleSyncGameData(chairNo:number) {
		return null 
	}
	handleChairOffline(chairNo:number) {
		let user = this.getUser(chairNo)
		if(!user) {
			return 
		}
		if(this.isChainNoWatcher(chairNo)) {
			switch(this.roomData.roomType) {
				case RoomDefine.RoomType.Group:{
					this.doUserExit(user)
				} break 
				case RoomDefine.RoomType.Match:{

				} break
				default:{
					//普通房间旁观断线不处理
				} break 
			}
		}
	}

	handleMessage(chairNo:number,msgName:string,jsonObj) {

	}
	handleCheckGameEnd(){
		if(this.startParams?.lastForever) {
			return false 
		}
		if(this.groupID) {
			if(this.users.length == 0) {
				if(kdutils.getMillionSecond() - this.roomStartTime >= 30000) {
					return this.status != knRoomRealtime.Status.RoundEnd
				}
			}
		}
		let check = this.getRoundEndAutoCheck()
		if(check.juCount) {
			if(this.juCount >= this.gameSet.getJuCount()) {
				return true
			}
		} else if(check.waterTimeoutSec != null) {
			if(!this.roundStartTime_ ){
				//未开始
				return false
			}
			if((kdutils.getMillionSecond() - this.roundStartTime_) / 1000 >= check.waterTimeoutSec) {
				return true
			}
		}
		return false
	}

	handleUserCanEnter(userID:number) {
		if(this.status == knRoomRealtime.Status.Wait) {
			return true 
		}
		let count = this.getSitChairNosCount()
		if(count >= this.getMaxPlayingUserCount()) {
			if(this.getWatchEnabled()) {

			} else {
				return false 
			}
		}
		return true 
	}

	handleUserEnterWithChairNo(userID:number) {
		if(this.getDefaultWatchEnter()) {
			if(this.getWatchEnabled()) {
				return this.selectWatchChairNo()
			}
			return -1
		}
		if(this.status == knRoomRealtime.Status.Wait) {
			return this.selectPlayChairNo()
		} 
		if(this.getWatchEnabled()) {
			return this.selectWatchChairNo()
		} 
		return this.selectPlayChairNo()
	}

	handleUserEnter(user:knRoomRealtime.UserData) {

	}

	handleAfterUserEnter(user:knRoomRealtime.UserData) {

	}

	handleUserExit(user:knRoomRealtime.UserData) {
		
	}

	handleUserCanExit(user:knRoomRealtime.UserData,force?:boolean) {
		if(this.roomData.roomType == RoomDefine.RoomType.Custom && this.roomData.boss?.userID == user.userID) {
			if(this.users.length == 1) {
				this.setupRoundEnd(RoomDefine.RemoveType.BossJiesan)
				return false 
			}
			user.readyToExit = false 
			return false 
		}
		return this.status == knRoomRealtime.Status.Wait || this.status == knRoomRealtime.Status.RoundEnd
	}

	handleCreateUserData(user:knRoomRealtime.UserData) {
		return null 
	}
	
	handleUserSitdown(user:knRoomRealtime.UserData) {

	}
	handleUserStandup(user:knRoomRealtime.UserData) {

	}
	
	async handleScoreChanged(user:knRoomRealtime.UserData,scoreChanged:number | Decimal,type:GSUserMsg.ScoreChangeType) {
		scoreChanged = new Decimal(scoreChanged)
		this.lockUser(user.chairNo,(async ()=>{
			let serialType:ItemDefine.SerialType
			switch(type) {
				case GSUserMsg.ScoreChangeType.Game:
					serialType = ItemDefine.SerialType.GameJu
					break
				case GSUserMsg.ScoreChangeType.Fee:
					serialType = ItemDefine.SerialType.GameFee
					break 
			}
			switch(type) {
				case GSUserMsg.ScoreChangeType.Game:
				case GSUserMsg.ScoreChangeType.Fee:{
					if(scoreChanged.greaterThan(0)) {
						switch(this.d.payMainType) {
							case RoomDefine.PayType.Item:{
								await this.server.centerRpc.callException(
									kds.item.addLockItem,user.loginData.userID,this.d.lockID,this.d.payIndex,scoreChanged.toString(),serialType)
							} break 
							case RoomDefine.PayType.Club:{
								await this.server.centerRpc.callException(
									kds.club.account.addLockValue,this.clubID,user.loginData.userID,this.d.lockID,this.d.payIndex,scoreChanged.toString(),serialType)
							} break 
						}
					} else if(scoreChanged.lessThan(0)) {
						switch(this.d.payMainType) {
							case RoomDefine.PayType.Item:{
								await this.server.centerRpc.callException(
									kds.item.useLockItem,user.loginData.userID,this.d.lockID,this.d.payIndex,scoreChanged.abs().toString(),true,serialType)
							} break 
							case RoomDefine.PayType.Club:{
								await this.server.centerRpc.callException(
									kds.club.account.useLockValue,this.clubID,user.loginData.userID,this.d.lockID,this.d.payIndex,scoreChanged.abs().toString(),true,serialType)
							} break 
						}
					}
				} break 
			}
		})())
		// if(this.roomData.matchID){
		// 	//比赛房间同步分数
		// 	this.server.Room_UserTotalScore(this.roomData.matchID,this.roomID,user.loginData.userID,user.score.toString())
		// }
	}

	handleCalcWater(scoreChanged:string | Decimal) {
		if(typeof(scoreChanged) == "string") {
			scoreChanged = new Decimal(scoreChanged)
		}
		if(scoreChanged.greaterThan(0)) {
			if(this.matchWater) {
				let water = scoreChanged.mul(this.matchWater.percent).div(100)
				water = GlobalUtils.roundUp(water)
				if(this.matchWater.maxValue && this.matchWater.maxValue != "0" && water.greaterThan(this.matchWater.maxValue)) {
					water = new Decimal(this.matchWater.maxValue)
				} else if(this.matchWater.minValue && this.matchWater.minValue != "0" && water.lessThan(this.matchWater.minValue)) {
					water = new Decimal(this.matchWater.minValue)
				}
				return water
			} else if(this.groupWater) {
				let water = scoreChanged.mul(this.groupWater.percent).div(100)
				water = GlobalUtils.roundUp(water)
				if(this.groupWater.maxValue && this.groupWater.maxValue != "0" && water.greaterThan(this.groupWater.maxValue)) {
					water = new Decimal(this.groupWater.maxValue)
				} else if(this.groupWater.minValue && this.groupWater.minValue != "0" && water.lessThan(this.groupWater.minValue)) {
					water = new Decimal(this.groupWater.minValue)
				} 
				return water
			} else if(this.friendWater) {
				let payType = RoomDefine.getPayType(this.gameSet.getPayType())
				let payIndex = RoomDefine.getPayIndex(this.gameSet.getPayType())

				if(payType == RoomDefine.PayType.Item) {
					let itemID = String(payIndex)
					let item = this.friendWater.items.find(v=>v.itemID == itemID)
					if(item) {
						let water = scoreChanged.mul(item.percent).div(100)
						water = GlobalUtils.roundUp(water)
						if(item.maxValue && item.maxValue != "0" && water.greaterThan(item.maxValue)) {
							water = new Decimal(item.maxValue)
						} else if(item.minValue && item.minValue != "0" && water.lessThan(item.minValue)) {
							water = new Decimal(item.minValue)
						}
						return water
					}
				}
			}
		}
		return null
	}
}