import { kdws } from "kdweb-core/lib/ws/websocket"
import { SrsDefine } from "../../pp-base-define/SrsDefine"
import { Config } from "../config"
import { IncomingMessage } from "http"
import { Log } from "../log"
import { kdutils } from "kdweb-core/lib/utils"
import { GSRpcMethods } from "../../pp-base-define/GSRpcMethods"
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods"
import { Rpc } from "../rpc"
import { SrsUserMsg, SrsUserNotify } from "../../pp-base-define/SrsUserMsg"
import { UserDefine } from "../../pp-base-define/UserDefine"
import { LoginLobbyDefine } from "../../pp-base-define/LoginLobbyDefine"
import { UserAccess } from "../../src/UserAccess"
import { DB } from "../../src/db"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { kdreq } from "kdweb-core/lib/service/req"
import { RedisLock } from "../../src/RedisLock"
import { UserFlagDefine } from "../../pp-base-define/UserFlag"
import { UserFlag } from "../../src/UserFlag"
import { RoomDefine } from "../../pp-base-define/RoomDefine"
import { SrsMessageLink } from "../../src/SrsMessageLink"
import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine"
import { Module_LoginAccessToken, Module_UserLoginData, Module_UserRoomID } from "../../pp-base-define/DM_UserDefine"
import { Module_RoomData, Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine"
enum UserStatus {
	None,
	Authing,
	Ready,
}

export type UserData = {
	h:string,
	request:IncomingMessage,
	
	status:UserStatus,

	userID:number,
	onlineTime:number,

	roomID:number,
	gsName:string,

	prevRecvTimestamp:number,
	prevSendTimestamp:number,
}
export type NodeUserType = {
	h:string,

	request:IncomingMessage,
	status:UserStatus,

	userID:number,
	roomID?:number,
	gsName?:string,

	prevHeartTime:number,

	online:boolean,

	robot?:boolean,

	dcnKeys:string[],
}
let loginTimeout = 5000
let heartTimeout = 60000

let db = DB.get()
let redis = DB.getRedis()
export class WSUserServer extends kdws.server {
	
	constructor() {
		let other:SrsDefine.NodeOtherConfig = Config.otherConfig
		super(null,other.userWSPort)

		Log.oth.info("init user port = " + other.userWSPort)

		setInterval(()=>{
			this.onUpdate()
		},100)
		this.listen()
	}
	private users_:NodeUserType[] = []
	get userCount() {
		return this.users_.length
	}
	get unLoginUserCount() {
		return this.unLoginUsers_.length
	}
	private unLoginUsers_:NodeUserType[] = []
	onError(h: string, error: Error) {
		let user = this.getUser(h)
		Log.oth.error("ws user error h = " + h,user,error)
	}
	onAccept(h: string, request: IncomingMessage) {
		Log.oth.info("[user] accept h = " + h)
		this.unLoginUsers_.push({
			h:h,
			request,
			userID:null,
		
			status:UserStatus.None,
			online:true ,
			prevHeartTime:kdutils.getMillionSecond(),

			dcnKeys:[],
		})
	}
	
	shutdown(h:string) {
		let idx = this.users_.findIndex(v=>v.h == h)
		let user = idx >= 0 ? this.users_[idx] : null
		if(user == null || !user.robot) {
			return super.shutdown(h)
		}
		
		Log.oth.info("[user] robot exit userID = " + user.userID)
		this.users_.splice(idx,1)
		return 
	}

	onCloseClient(h: string) {
		let idx = this.unLoginUsers_.findIndex(v=>v.h == h)
		if(idx >= 0) {
			let user = this.unLoginUsers_[idx]
			this.unLoginUsers_.splice(idx,1)
			Log.oth.info("[user] remove unlogined user h = " + h)
			return 
		}
		idx = this.users_.findIndex(v=>v.h == h)
		if(idx >= 0) {
			let user = this.users_[idx]
			user.online = false 
			user.status = UserStatus.None
			Log.oth.info("[user] logined user offline h = " + h + " | userID = " + user.userID)
			this.users_.splice(idx,1)
			Log.oth.info("[user] shutdown connect info")
			if(user.userID) {
				Rpc.node.call(SrsRpcMethods.Layer.userOnline,user.userID,false)
			}
			if(user.gsName) {
				Rpc.gsMgr.callGameServerThroughLayer(user.gsName,GSRpcMethods.userOffline,user.userID)
			}
			return 
		}
		Log.oth.info("[user] unhandled close client h = " + h)
	}
	onMessage(h: string, msgName: string, jsonObj: any) {
		let user = this.users_.find((v)=>v.h == h)
		if(user == null) {
			if(msgName == SrsUserMsg.Login) {
				let user = this.unLoginUsers_.find((v)=>v.h == h)
				if(user == null) {
					Log.oth.info("cannot find unlogined user when recv meg name = "+ msgName + " | h = " + h)
					return 
				}
				this.handleMsg(h,msgName,jsonObj)
				return 
			} else {
				if(msgName == SrsUserMsg.Heart || msgName == SrsUserMsg.SimpleHeart) {
					return 
				}
				Log.oth.info("cannot find logined user when recv meg name = "+ msgName + " | h = " + h)
				return 
			}
		}
		if(msgName == SrsUserMsg.Heart) {
			// 只有登录后才能发送心跳
			user.prevHeartTime = kdutils.getMillionSecond()
			this.sendnst(h,SrsUserMsg.Heart,{})
			return 
		}
		if(msgName == SrsUserMsg.SimpleHeart) {
			// 只有登录后才能发送心跳
			user.prevHeartTime = kdutils.getMillionSecond()
			this.sendnst(h,SrsUserMsg.SimpleHeart,{})
			return 
		}
		this.handleMsg(h,msgName,jsonObj)
	}

	onUpdate() {
		let time = kdutils.getMillionSecond()
		{
			let rmvHs:string[] = []
			for(let user of this.users_) {
				if(!user.online) {
					continue
				}
				let timeout = heartTimeout
				if(time - user.prevHeartTime >= timeout) {
					Log.oth.info("user heart timeout ", user)
					rmvHs.push(user.h)
				}
			}
			for(let h of rmvHs) {
				this.shutdown(h)
			}
		}
		{
			let rmvHs:string[] = []
			for(let user of this.unLoginUsers_) {
				let timeout = loginTimeout
				if(time - user.prevHeartTime >= timeout) {
					Log.oth.info("unlogined user heart timeout ", user)
					rmvHs.push(user.h)
				}
			}
			for(let h of rmvHs) {
				this.shutdown(h)
			}
		}
	}

	async handleMsg(h:string,msgName:string,jsonObj:any) {
		switch(msgName) {
			case SrsUserMsg.Login: {
				let user = this.unLoginUsers_.find((v)=>v.h == h)
				if(user == null) {
					Log.oth.error("[handle] login: cannot find unlogined user h = " + h)
					return
				}
				let t:SrsUserMsg.tLoginReq = jsonObj
				try {
					Log.oth.info("[handle] login: received login req ak = " + t.ak)
					let user = this.unLoginUsers_.find((v)=>v.h == h)
					if(user == null) {
						Log.oth.error("[handle] login: user lose connect ak = " + t.ak + " h = " + h)
						return 
					}
					let akInfo = await Module_LoginAccessToken.getSingle({
						ak:t.ak,
						target:UserDefine.LoginTarget.App,
					})
					if(akInfo == null) {
						Log.oth.error("[handle] login: verify sk failed ak = " + t.ak)
						this.send(h,SrsUserMsg.Login,{success:false})
						return 
					}
					if(user.status != UserStatus.None) {
						Log.oth.error("[handle] login: user.status != None ak = " + t.ak + " userID = " + akInfo.userID + " " + UserStatus[user.status])
						return 
					}
					user.status = UserStatus.Authing

					let loginData:UserDefine.tLoginData = await Module_UserLoginData.getMain(akInfo.userID)
					
					if(loginData == null) {
						Log.oth.error("[handle] login: get login data failed ak = " + t.ak + " | userID = " + akInfo.userID)
						this.send(h,SrsUserMsg.Login,{success:false})
						return 
					}
					Log.oth.info("[handle] login: start login userID = " + loginData.userID)
					let loginedUser = this.users_.find((v)=>v.userID == loginData.userID)
					// 断线重连
					if(loginedUser) {
						let idx = this.unLoginUsers_.findIndex((v)=>v.h == h)
						if(idx < 0) {
							Log.oth.info("[handle] login: user already lose connect after logined 1 h = " + h)
							return 
						}
						this.unLoginUsers_.splice(idx,1)
						Log.oth.info("[handle] login: user already login, online status = " + loginedUser.online)
						// 挤掉线，关掉前一个连接
						if(loginedUser.online) {
							// shutdown 会回调 onCloseClient 清除连接
							this.shutdown(loginedUser.h)
							// 保留信息并再次加入
							this.users_.push(loginedUser)
						}

						loginedUser.h = h 
						loginedUser.online = true 
						loginedUser.prevHeartTime = kdutils.getMillionSecond()
						user = loginedUser
					} else {
						let idx = this.unLoginUsers_.findIndex((v)=>v.h == h)
						if(idx < 0) {
							Log.oth.info("[handle] login: user already lose connect after logined 2 h = " + h)
							return 
						}
						this.unLoginUsers_.splice(idx,1)

						this.users_.push(user)

						user.userID = loginData.userID
						user.online = true 
						user.prevHeartTime = kdutils.getMillionSecond()

						loginedUser = user 
					}
					if(!this.isValid(h)) {
						return 
					}
					user.status = UserStatus.Ready
					// 报告玩家位置
					Rpc.node.call(SrsRpcMethods.Layer.userOnline,user.userID,true)

					this.send(h,SrsUserMsg.Login,<SrsUserMsg.tLoginRes>{
						success:true,
						roomID:await UserFlag.get(user.userID,UserFlagDefine.RoomID),
						roomIDs:(await Module_UserRoomID.get({userID:user.userID})).map(r=>r.roomID),
					})
				} catch (error) {
					Log.oth.info("[handle] login: error ", error)
					this.send(h,SrsUserMsg.Login,{
						success:false,
					})
				}
				return 
			}
		}
		let user = this.users_.find((v)=>v.h == h)
		if(user == null) {
			Log.oth.info("[handle] user unlogin msgName = " + msgName + " h = " + h)
			this.shutdown(h)
			return 
		}
		switch(msgName) {
			case SrsUserMsg.DCNListen: {
				let t:SrsUserMsg.tDCNListenReq = jsonObj
				let idx = user.dcnKeys.indexOf(t.dkey)
				if(idx < 0) {
					user.dcnKeys.push(t.dkey)
				}
			} break 
			case SrsUserMsg.DCNUnListen: {
				let t:SrsUserMsg.tDCNUnListenReq = jsonObj
				let idx = user.dcnKeys.indexOf(t.dkey)
				if(idx >= 0) {
					user.dcnKeys.splice(idx,1)
				}
			} break 
			case SrsUserMsg.DCNUnListenAll: {
				user.dcnKeys.splice(0)
			} break 
			case SrsUserMsg.EnterRoom:{
				let t:SrsUserMsg.tEnterRoomReq = jsonObj
				this.userEnterRoom(user.userID,t.roomID || t.boxCode,t.enterReq)
			} break 
			default: {
				SrsMessageLink.ifGetMethod(user.userID,msgName,jsonObj)
				.then((method)=>{
					if(method) {
						Rpc.node.call(SrsRpcMethods.Layer.callCenter,method,<SrsMessageLink.tLinkCallData>{
							userID:user.userID,
							msgName,
							data:jsonObj,
							fromNodeName:Config.myName,
						})
						.then((ret)=>{
							if(ret.type != knRpcDefine.ClientCallReturnType.Success) {
								this.sendToUser(h,SrsUserMsg.IfCallFailed,<SrsUserMsg.tIfCallFailedNT>{
									code:ret.type,
									reason:knRpcDefine.ClientCallReturnType.Success[ret.type],
								})
								Log.oth.error("ifcall failed userID = " + user.userID + " msg = " + msgName + " method = " + method,jsonObj)
							}
						})
					} else {
						if(user.gsName) {
							Rpc.gsMgr.callGameServerThroughLayer(user.gsName,GSRpcMethods.userMessage,user.userID,msgName,jsonObj)
						}
					}
				})
			} break;
		}
	}


	getUser(hOrUserID:string | number) {
		let user:NodeUserType = null
		if(typeof(hOrUserID) == "string") {
			user = this.users_.find((v)=>v.h == hOrUserID)
		} else {
			user = this.users_.find((v)=>v.userID == hOrUserID)
		}
		return user
	}

	getUserIDs() {
		return this.users_.map(v=>v.userID)
	}

	onDCNChanged(dkey:string,data:any) {
		let msg:SrsUserNotify.tDCNChanged = {
			dkey:dkey,
			data:data,
		}
		for(let user of this.users_) {
			if(user.dcnKeys && user.dcnKeys.includes(dkey)) {
				this.sendToUser(user.userID,SrsUserNotify.DCNChanged,msg)
			}
		}
	}
	onDCNFilterChanged(userIDs:number[],dkey:string,data:any) {
		let msg:SrsUserNotify.tDCNChanged = {
			dkey:dkey,
			data:data,
		}
		for(let user of this.users_) {
			if(user.dcnKeys && userIDs.includes(user.userID) && user.dcnKeys.includes(dkey)) {
				this.sendToUser(user.userID,SrsUserNotify.DCNChanged,msg)
			}
		}
	}
	///////
	sendErrorToUser(hOrUserID:string | number,code:SrsUserNotify.ErrorCode,msg?:string) {
		return this.sendToUser(hOrUserID,SrsUserNotify.Error,{
			code:code,
			msg:msg || "系统错误"
		})
	}

	sendToUser(hOrUserID:string | number,msgName:string,jsonObj:any) {
		let user = this.getUser(hOrUserID)
		if(user == null) {
			Log.oth.info("send msg failed , cannot find user " + hOrUserID)
			return false 
		}
		if(!user.online) {
			Log.oth.info("send msg failed, user offline user " + hOrUserID)
			return false 
		}
		return this.send(user.h,msgName,jsonObj)
	}

	async gsSendToUser(userID:number,msgName:string,jsonObj:any) {
		let user = this.getUser(userID)
		if(user) {
			this.send(user.h,msgName,jsonObj)
			return true 
		}
		let nodeName = await redis.hget(SrsDefine.Redis.tableUserSrsNode,String(userID))
		if(!nodeName) {
			return false 
		}
		let info:SrsDefine.Redis.tSrsNodeMap = await redis.hget(SrsDefine.Redis.tableSrsNodeMap,nodeName,true)
		if(!info) {
			Log.oth.error("cannot find node map info name = " + nodeName + " when send to user id = " + userID + " msgName = " + msgName)
			return false 
		}
		
		let url = info.layerConfig.httpHost + SrsDefine.Http.Layer.pathSendToUser
		let t:SrsDefine.Http.Layer.tSendToUserReq = {
			userID,
			msg:{
				name:msgName,
				data:jsonObj,
			}
		}
		Log.oth.info("send req to url = " + url,t)
		let res = await kdreq.postJson(url,t)
		Log.oth.info("",res)
		if(res.body) {
			let t:SrsDefine.Http.Layer.tSendToUserRes = res.body
			if(t.code == "success") {
				return true 
			}
		}
		return false 
	}

	gsUserExitRoom(userID:number,roomID:number) {
		let user = this.getUser(userID)
		if(!user) {
			return false 
		}
		if(user.roomID == roomID) {
			Log.oth.info("user exit from gs roomID = " + roomID + " gs = " + user.gsName)
			user.roomID = null 
			user.gsName = null
			return true 
		}
		return false 
	}
	
	sendToAllUsers(msgName:string,jsonObj:any) {
		for(let user of this.users_) {
			// if(user.robot) {
			// 	Rpc.robotManager.sendToRobot(user.userID,msgName,jsonObj)
			// 	return true 
			// }
			// if(!user.online) {
			// 	Log.oth.info("send msg failed, user offline user " + hOrUserID)
			// 	return false 
			// }
			this.send(user.h,msgName,jsonObj)
		}
	}

	async userEnterRoom(userID:number,roomID:number | string,enterReq:any) {
		Log.oth.info("userEnterRoom",{
			userID,roomID,enterReq
		})
		let b = await RedisLock.callInLock(RedisLock.SRSUserEnter(userID),5,async ()=>{
			let result = false 
			let online = false 
			do {
				let roomIndex:any = {}
				if(typeof(roomID) == "number") {
					roomIndex.roomID = roomID
				} else {
					roomIndex.boxCode = roomID
				}
				let roomData = await Module_RoomData.getSingle(roomIndex)
				if(!roomData) {
					Log.oth.error("room not exist ",roomIndex)
					break 
				}
				roomID = roomData.roomID
				let roomIDInfo = await Module_UserRoomID.getSingle({userID,roomID})
				let flagRoomID = await UserFlag.get(userID,UserFlagDefine.RoomID)
				if(roomIDInfo) {
				// if(flagRoomID) {
					Log.oth.error("user already in other room id = " + flagRoomID + " user = " + userID + " enter room = " + roomID)
					if(roomID != flagRoomID) {
						break 
					}
					let roomRealtime = await Module_RoomRealtime.getMain(roomID)
					if(!roomRealtime) {
						Log.oth.error("user room id invalid realtime not found userID = " + userID + " roomID = " + roomID)
						await UserFlag.remove(userID,UserFlagDefine.RoomID,roomID)
						await Module_UserRoomID.del({userID,roomID})
						break 
					}

					let ret = await Rpc.gsMgr.callGameServerThroughLayer(
						roomRealtime.gsName,GSRpcMethods.userOnline,userID,roomID)
					result = ret 
					if(!result) {
						Log.oth.error("user online failed userID = " + userID + " roomID = " + roomID)
						await UserFlag.remove(userID,UserFlagDefine.RoomID,roomID)
						await Module_UserRoomID.del({userID,roomID})
						break 
					}
					let user = this.users_.find((v)=>v.userID == userID)
					if(!user) {
						return false 
					}
					user.roomID = roomID
					user.gsName = roomRealtime.gsName
					break 
				}
				let roomRealtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
				if(!roomRealtime) {
					Log.oth.error("room not exist " + roomID)
					break 
				}
				if(!roomRealtime.gsName) {
					Log.oth.error("room not init " + roomID)
					break 
				}
				let ret = await Rpc.gsMgr.callGameServerThroughLayer(
					roomRealtime.gsName,GSRpcMethods.userEnter,roomID,userID,enterReq)
				result = ret
				if(ret) {
					let user = this.users_.find((v)=>v.userID == userID)
					if(!user) {
						return false 
					}
					user.roomID = roomID
					user.gsName = roomRealtime.gsName
					result = true 
					
					await UserFlag.set(userID,UserFlagDefine.RoomID,roomID)
					await Module_UserRoomID.updateOrInsert({userID,roomID})
				}
			} while (false);
			let roomData:RoomDefine.RoomData
			if(result) {
				roomData = await Module_RoomData.getMain(roomID)
				if(!roomData) {
					result = false 
				}
			}
			if(result) {
				this.sendToUser(userID,SrsUserMsg.EnterRoom,<SrsUserMsg.tEnterRoomRes>{
					b:true,
					gameID:roomData.gameData.gameID
				})
			} else {
				this.sendToUser(userID,SrsUserMsg.EnterRoom,<SrsUserMsg.tEnterRoomRes>{
					b:false,
				})
			}
			return result 
		})
		return b 
	}
}