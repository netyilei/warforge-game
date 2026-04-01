import { IncomingMessage } from "http";
import { kdws } from "kdweb-core/lib/ws/websocket";
import { Log } from "../log";
import { kdutils } from "kdweb-core/lib/utils";
import { Config } from "../config";
import { DB } from "../../src/db";
import { Module_LoginAccessToken, Module_UserLoginData } from "../../pp-base-define/DM_UserDefine";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { UserFlag } from "../../src/UserFlag";
import { UserFlagDefine } from "../../pp-base-define/UserFlag";
import { CustomerDefine, CustomerMsgDefine } from "../../pp-base-define/CustomerDefine";
import { Module_CustomerChatRoom } from "../../pp-base-define/DM_CustomerDefine";
import { ChatInternalUtils } from "../service/ChatInternalService";

enum UserStatus {
	None,
	Authing,
	Ready,
}
type NodeUserType = {
	h:string,

	request:IncomingMessage,
	status:UserStatus,

	userID:number,

	prevHeartTime:number,

	admin?:boolean,

	online:boolean,
}
let loginTimeout = 5000
let heartTimeout = 60000

let db = DB.get()
let redis = DB.getRedis()
export class ChatWSServer extends kdws.server {
	constructor() {
		super(null,Config.otherConfig.userWSPort)

		Log.oth.info("init user port = " + Config.otherConfig.userWSPort)

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
			request:null,
			userID:null,
		
			status:UserStatus.None,
			online:true ,
			prevHeartTime:kdutils.getMillionSecond(),
		})
	}

	shutdown(h:string) {
		let idx = this.users_.findIndex(v=>v.h == h)
		let user = idx >= 0 ? this.users_[idx] : null
		if(user == null) {
			return super.shutdown(h)
		}
		
		Log.oth.info("[user] robot exit userID = " + user.userID)
		this.users_.splice(idx,1)
		return 
	}
	onMessage(h: string, msgName: string, jsonObj: any) {
		let user = this.users_.find((v)=>v.h == h)
		if(user == null) {
			if(msgName == CustomerMsgDefine.Login || msgName == CustomerMsgDefine.LoginConsole) {
				user = this.unLoginUsers_.find((v)=>v.h == h)
				if(user == null) {
					Log.oth.info("cannot find unlogined user when recv meg name = "+ msgName + " | h = " + h)
					return 
				}
				this.handleMsg(h,msgName,jsonObj)
				return 
			} else {
				if(msgName == CustomerMsgDefine.Heart || msgName == CustomerMsgDefine.SimpleHeart) {
					return 
				}
				Log.oth.info("cannot find logined user when recv meg name = "+ msgName + " | h = " + h)
				return 
			}
		}
		if(msgName == CustomerMsgDefine.Heart) {
			// 只有登录后才能发送心跳
			user.prevHeartTime = kdutils.getMillionSecond()
			this.sendnst(h,CustomerMsgDefine.Heart,{})
			return 
		}
		if(msgName == CustomerMsgDefine.SimpleHeart) {
			// 只有登录后才能发送心跳
			user.prevHeartTime = kdutils.getMillionSecond()
			this.sendnst(h,CustomerMsgDefine.SimpleHeart,{})
			return 
		}
		this.handleMsg(h,msgName,jsonObj)
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

			this.clearUserFlag(user)
			return 
		}
		Log.oth.info("[user] unhandled close client h = " + h)
	}

	async clearUserFlag(user:NodeUserType) {
		let flag = await UserFlag.get(user.userID,UserFlagDefine.CustomerChatServer)
		if(flag && flag.rpcName == Config.myName) {
			await UserFlag.remove(user.userID,UserFlagDefine.CustomerChatServer)
			if(user.admin) {
				await Module_CustomerChatRoom.updateOrigin({
					fromUserID:user.userID,
				},{
					$set:{
						fromStatus:CustomerDefine.RoomUserStatus.Offline,
					}
				})
				ChatInternalUtils.roomsChange({
					fromUserID:user.userID,
				})
			} else {
				await Module_CustomerChatRoom.updateOrigin({
					toUserID:user.userID,
				},{
					$set:{
						toStatus:CustomerDefine.RoomUserStatus.Offline,
					}
				})
				ChatInternalUtils.roomsChange({
					toUserID:user.userID,
				})
			}
		}
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
	getUser(hOrUserID:string | number) {
		let user:NodeUserType = null
		if(typeof(hOrUserID) == "string") {
			user = this.users_.find((v)=>v.h == hOrUserID)
		} else {
			user = this.users_.find((v)=>v.userID == hOrUserID)
		}
		return user
	}

	async handleMsg(h:string,msgName:string,jsonObj:any) {
		switch(msgName) {
			case CustomerMsgDefine.Login:
			case CustomerMsgDefine.LoginConsole: {
				let user = this.unLoginUsers_.find((v)=>v.h == h)
				if(user == null) {
					Log.oth.error("[handle] login: cannot find unlogined user h = " + h)
					return
				}
				let t:CustomerMsgDefine.tLoginReq = jsonObj
				try {
					Log.oth.info("[handle] login: received login req ak = " + t.ak)
					let user = this.unLoginUsers_.find((v)=>v.h == h)
					if(user == null) {
						Log.oth.error("[handle] login: user lose connect ak = " + t.ak + " h = " + h)
						return 
					}
					let akInfo = msgName == CustomerMsgDefine.Login ? 
						await Module_LoginAccessToken.getSingle({
							ak:t.ak,
							target:UserDefine.LoginTarget.App,
						}) : await Module_LoginAccessToken.getSingle({
							ak:t.ak,
							target:UserDefine.LoginTarget.Console,
						})
					if(akInfo == null) {
						Log.oth.error("[handle] login: verify sk failed ak = " + t.ak)
						this.send(h,CustomerMsgDefine.Login,{success:false})
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
						this.send(h,CustomerMsgDefine.Login,{success:false})
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
					user.admin = msgName == CustomerMsgDefine.LoginConsole
					// 报告玩家位置
					await UserFlag.set(user.userID,UserFlagDefine.CustomerChatServer,<CustomerDefine.WSUserFlag>{
						rpcName:Config.myName,
						internalHost:Config.otherConfig.internalHost,
					})

					if(msgName == CustomerMsgDefine.LoginConsole) {
						Module_CustomerChatRoom.updateOrigin({
							fromUserID:loginData.userID,
						},{
							$set:{
								fromStatus:CustomerDefine.RoomUserStatus.Online,
							}
						})
					}
					this.send(h,CustomerMsgDefine.Login,<CustomerMsgDefine.tLoginRes>{
						success:true,
					})
				} catch (error) {
					Log.oth.info("[handle] login: error ", error)
					this.send(h,CustomerMsgDefine.Login,{
						success:false,
					})
				}
				return 
			} break 
			case CustomerMsgDefine.SendChat: {
				let t:CustomerMsgDefine.tSendChatReq = jsonObj
				let msgID:number = null 
				let user = this.getUser(h)
				if(user == null) {
					Log.oth.error("handle send chat: cannot find user h = " + h)
					return 
				}
				do {
					msgID = await ChatInternalUtils.chat(t.roomID,t.type,t.content,t.data,{
						fromUserID:user.admin ? user.userID : null,
						toUserID:user.admin ? null : user.userID,
					})
				} while (false);
				this.send(h,CustomerMsgDefine.SendChat,{
					msgID,
				})
			} break 
		}
	}


	sendToUserFromHttp(userID:number,msgName:string,jsonObj:any) {
		let user = this.getUser(userID)
		if(user == null) {
			return false 
		}
		this.send(user.h,msgName,jsonObj)
		return true
	}
}