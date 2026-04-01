import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine"
import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager"
import { knRpcTools } from "../src/knRpcTools"
import { ServerConfig, ServerValues } from "../pp-base-define/ServerConfig"
import { Log } from "./log"
import { kdutils } from "kdweb-core/lib/utils"
import { GameServerCenterDelegate, GameServerSrsDelegate } from "./gameServerDelegate"
import { SrsRpcMethods } from "../pp-base-define/SrsRpcMethods"
import { GSRpcMethods } from "../pp-base-define/GSRpcMethods"
import { knRoomBase } from "./knRoomBase"
import { mongoDB } from "kdweb-core/lib/mongo/controller"
import { DB } from "../src/db"
import { DBDefine } from "../pp-base-define/DBDefine"
import { UserFlag } from "../src/UserFlag"
import { UserFlagDefine } from "../pp-base-define/UserFlag"
import { RoomDefine } from "../pp-base-define/RoomDefine"
import { kds } from "../pp-base-define/GlobalMethods"
import { GameSet } from "../pp-base-define/GameSet"
import { TimeDate } from "../src/TimeDate"
import { IDUtils } from "../src/IDUtils"
import { gzip, gzipSync } from "zlib"
import { knRoomRealtime } from "./knRoomRealtime"
import { RobotRpcMethods } from "../pp-base-define/RobotRpcMethods"
import { Config } from "./config"
import { SrsDefine } from "../pp-base-define/SrsDefine"
import { Module_UserRoomID } from "../pp-base-define/DM_UserDefine"
import { Module_RoomData, Module_RoomRealtime } from "../pp-base-define/DM_RoomDefine"
import { MatchDefine } from "../pp-base-define/MatchDefine"
import { UserDefine } from "../pp-base-define/UserDefine"


enum UserStatus {
	Enter,
	Room,
}
let redis = DB.getRedis()
export class GameServerBase {
	constructor() {
		GameServerBase.instance = this 
		this.init()
	}
	private srsRpc_:knRpcManager.base
	get srsRpc() {
		return this.srsRpc_
	}
	private centerRpc_:knRpcManager.base = null 
	get centerRpc() {
		return this.centerRpc_
	}
	private robotRpc_:knRpcManager.base = null 
	get robotRpc() {
		return this.robotRpc_
	}
	private config_:GameServerBase.OtherConfig
	get config() {
		return this.config_
	}
	private serviceInfo_:knRpcDefine.ServiceInfo
	get serviceInfo() {
		return this.serviceInfo_
	}

	private nodeServiceInfos_:knRpcDefine.ServiceInfo[] = []
	get nodeServiceInfos() {
		return this.nodeServiceInfos_
	}
	set nodeServiceInfos(v) {
		this.nodeServiceInfos_ = v
	}

	private nodeLayerNames_:{
		nodeName:string,
		layerName:string,
	}[] = []

	private dbRoom_:mongoDB = DB.get()
	get dbRoom() {
		return this.dbRoom_
	}
	private dbLogin_:mongoDB = DB.get()
	get dbLogin() {
		return this.dbLogin_
	}
	private dbAccount_:mongoDB = DB.get()
	get dbAccount() {
		return this.dbAccount_
	}
	private rooms_:knRoomBase[] = []
	private users_:{
		userID:number,
		room:knRoomBase,
		status:UserStatus,
		nodeName:string,
		robot?:boolean,
		robotServiceName?:string,
	}[] = []
	async init() {
		let myName = process.env.sname
		knRpcTools.setupEnv()
		this.serviceInfo_ = await knRpcTools.getConfig(myName)
		if(!this.serviceInfo_) {
			this.logError("get service info failed name = " + myName)
			return false 
		}
		let kdsConfig = await knRpcTools.getKDSConfig(myName)
		this.config_ = kdsConfig.other
		this.config_.centerHost = this.config_.centerPort ? "ws://" + this.config_.ip + ":" + this.config_.centerPort : null 
		this.config_.robotHost = this.config_.robotPort ? "ws://" + this.config_.ip + ":" + this.config_.robotPort : null 

		let nodeConfig = await knRpcTools.getConfig(this.config_.nodeName)
		if(!nodeConfig) {
			this.logError("get node service info failed name = " + nodeConfig.name)
			
		}
		{
			let rpc = new knRpcManager.base({
				authToken: ServerValues.srsToken,
				serviceName: process.env.sname,
			})
			let b = await rpc.start()
			if(!b) {
				this.logError("start srs rpc failed")
				return false 
			}
			this.srsRpc_ = rpc 

			let delegate = new GameServerSrsDelegate()
			rpc.delegate = delegate

			delegate.funcOnRegToService = async (serviceInfo)=>{
				if(!this.nodeServiceInfos_.find(v=>v.name == serviceInfo.name)) {
					return 
				}
				this.log("srs server online, send login name = " + serviceInfo.name)
				let res:SrsRpcMethods.GameServer.tLoginRes 
					= await rpc.callServerException(serviceInfo.name,SrsRpcMethods.GameServer.login,this.serviceInfo.name,this.config.gameID,false)
				this.log("srs server login res ",res)
				let nodeLayer = this.nodeLayerNames_.find(v=>v.nodeName == res.nodeName)
				if(nodeLayer) {
					nodeLayer.layerName = res.layerName
				} else {
					this.nodeLayerNames_.push({
						nodeName:res.nodeName,
						layerName:res.layerName
					})
				}
				if(res.nodes && res.nodes.length > 0) {
					let newInfos = res.nodes.map(v=>v.serviceInfo)
					let changed = newInfos.length != this.nodeServiceInfos_.length
					this.nodeServiceInfos_ = newInfos
					if(changed) {
						this.onUpdateRpcWatch()
					}
				}
			}

			delegate.funcOnCloseToService = (serviceInfo)=>{
				this.log("srs server closed name = " + serviceInfo.name)
			}
			this.nodeServiceInfos_ = [nodeConfig]
			// rpc.startClient(nodeConfig,{
			// 	keep:true
			// })
		}

		if(this.config_.centerHost) {
			let rpc = new knRpcManager.base({
				authToken: ServerValues.rpcToken,
				serviceInfo:{
					name: this.serviceInfo_.name,
					serverHost: this.config_.centerHost,
					serverPort: this.config_.centerPort,
					startTime: kdutils.getMillionSecond(),
					startDate: null,
				}
			})
			rpc.delegate = new GameServerCenterDelegate(this)
			let b = await rpc.start()
			if(!b) {
				this.logError("start center rpc failed")
				return false 
			}
			this.centerRpc_ = rpc
		} else {
			this.logError("ignore center rpc")
		}

		if(this.config.robotHost) {
			let rpc = new knRpcManager.base({
				authToken: ServerValues.robotToken,
				serviceInfo:{
					name: this.serviceInfo_.name,
					serverHost: this.config_.robotHost,
					serverPort: this.config_.robotPort,
					startTime: kdutils.getMillionSecond(),
					startDate: null,
				}
			})
			let b = await rpc.start()
			if(!b) {
				this.logError("start center rpc failed")
				return false 
			}
			this.robotRpc_ = rpc
		} else {
			this.logError("ignore robot rpc")
		}

		this.initRpc()

		setInterval(()=>{
			this.onUpdate()
		},50)
		setInterval(()=>{
			this.onUpdateRpcWatch()
		},30000)
		this.onUpdateRpcWatch()
	}
	log(title:string,...params) {
		Log.oth.info("[GameServer] " + title,...params)
	}
	logError(title:string,...params) {
		Log.oth.error("[GameServer] " + title,...params)
	}

	initRpc() {
		this.srsRpc.methodGroup.addGroup(GSRpcMethods.prefix,{
			nodeChanged:async (h:string,configs:GSRpcMethods.tNodeChangedItem[])=>{
				this.nodeServiceInfos_ = configs.map(v=>v.serviceInfo)
			},
			
			createRoom:async (h:string,roomData:RoomDefine.RoomData,params:GSRpcMethods.tCreateRoomExtensionParams)=>{
				params = params || {}
				let room = this.rooms_.find(v=>v.roomID == roomData.roomID)
				if(room) {
					return false 
				}
				let nodeServiceInfo = this.srsRpc.getClientInfoByH(h)
				this.log("create room id = " + roomData.roomID,roomData)
				this.log("nodeName = " + nodeServiceInfo.name)
				room = new GameServerBase.roomClazz(roomData,this)
				
				if(!await room.initRoom(params)) {
					this.logError("room init failed id = " + roomData.roomID)
					return false 
				}
				this.rooms_.push(room)
				
				let nodeLayer = this.nodeLayerNames_.find(v=>v.nodeName == nodeServiceInfo.name)
				let realtime:RoomDefine.RoomRealtime = {
					roomID:roomData.roomID,
					gameData:roomData.gameData,
					status:RoomDefine.RoomStatus.None,
					boxCode:roomData.boxCode,
					templateID:roomData.club? roomData.club.templateID : null,
					clubID:roomData.club ? roomData.club.clubID : null,
					matchID:roomData.matchID,
					groupID:roomData.groupID,
					gsName:this.serviceInfo.name,
					gsTimestamp:kdutils.getMillionSecond(),
					roundStartTimestamp:null,
					layerName:nodeLayer ? nodeLayer.layerName : null,
					nodeName:nodeLayer.nodeName,
					users:[],
				}
				await this.centerRpc.call("kds.room.realtime.update",roomData.roomID,realtime)
				return true 
			},
			
			jiesanRoom:async (h:string,roomID:number,removeType:RoomDefine.RemoveType)=>{
				let room = this.rooms_.find(v=>v.roomID == roomID)
				if(!room) {
					return false 
				}
				room.setupRoundEnd(removeType == null ? RoomDefine.RemoveType.Jiesan : removeType)
				return true 
			},
			
			tryUserExit:async (h:string,roomID:number,userID:number)=>{
				let user = this.users_.find(v=>v.userID == userID)
				if(!user || user.status != UserStatus.Room || !user.room || user.room.roomID != roomID) {
					return false 
				}
				return user.room.userExit(userID,false)
			},
			forceUserExit:async (h:string,roomID:number,userID:number)=>{
				let user = this.users_.find(v=>v.userID == userID)
				if(!user || user.status != UserStatus.Room || !user.room || user.room.roomID != roomID) {
					return false 
				}
				return user.room.userExit(userID,true)
			},
			
			verifyGameData:async (h:string,gameData:RoomDefine.GameData)=>{
				return true 
			},
			
			userEnter:async (h:string,roomID:Number,userID:number,params:GSRpcMethods.tUserEnterReq)=>{
				let user = this.users_.find(v=>v.userID == userID)
				if(user) {
					if(user.status == UserStatus.Enter) {
						this.log("enter failed status is enter")
						return false 
					}
					if(user.room.roomID == roomID) {
						return true 
					}
					this.logError("user already in gs roomID = " + user.room?.roomID)
					return false 
				}
				let room = this.rooms_.find(v=>v.roomID == roomID)
				if(!room || room.isReadyToDestroy) {
					this.logError("enter room failed room not found roomID = " + roomID)
					return false 
				}
				user = {
					userID,room,status:UserStatus.Enter,nodeName:this.srsRpc.getClientInfoByH(h).name,
				}
				this.users_.push(user)
				let b = await room.userEnter(userID,params)
				if(!b || room.isReadyToDestroy) {
					let idx = this.users_.indexOf(user)
					if(idx >= 0) {
						this.users_.splice(idx,1)
					}
					this.log("enter failed userID = " + user.userID + " roomID = " + roomID)
					return false 
				}
				let roomUser = room.getUserByUserID(userID)
				if(!roomUser) {
					let idx = this.users_.indexOf(user)
					if(idx >= 0) {
						this.users_.splice(idx,1)
					}
					this.log("enter failed get room user is null userID = " + user.userID + " roomID = " + roomID)
					return false 
				}
				user.status = UserStatus.Room
				this.centerRpc.call("kds.room.realtime.add",room.roomID,user.userID,roomUser.chairNo,roomUser.score)
				this.Flag_AddUser(room.roomID,[user.userID],{
					matchID:room.matchID,
				})
				return true 
			},
			
			userOnline:async (h:string,userID:number,roomID:number)=>{
				let room = this.rooms_.find(v=>v.roomID == roomID)
				if(!room) {
					this.logError("cannot find room userOnline userID = " + userID + " roomID = " + roomID)
					return false 
				}
				let roomUser = room.getUserByUserID(userID)
				if(!roomUser) {
					this.logError("cannot find room user userOnline userID = "+ userID + " roomID = " + roomID)
					return false 
				}
				let serviceInfo = this.srsRpc_.getClientInfoByH(h)
				let user = this.users_.find(v=>v.userID == userID)
				if(user) {
					user.room = room 
					user.nodeName = serviceInfo.name
				} else {
					user = {
						userID,
						room,
						nodeName:serviceInfo.name,
						status:UserStatus.Room,
					}
					this.users_.push(user)
				}
				room.setUserOnline(roomUser.chairNo,true)
				return true 
			},
			
			userOffline:async (h:string,userID:number)=>{
				let idx = this.users_.findIndex(v=>v.userID == userID)
				if(idx < 0) {
					this.logError("user offline error not found userID = " + userID)
					return false 
				}
				let user = this.users_[idx]
				if(user.status == UserStatus.Enter) {
					this.logError("user offline error status is enter userID = " + userID)
					return false 
				}
				let serviceInfo = this.srsRpc_.getClientInfoByH(h)
				if(user.nodeName != serviceInfo.name) {
					this.logError("user offline error node invalid name = " + serviceInfo.name + " cur = " + user.nodeName + " userID = " + userID)
					return false 
				}
				if(user.room) {
					let roomUser = user.room.getUserByUserID(userID)
					if(!roomUser) {
						this.logError("cannot find room user userOffline userID = "+ userID + " roomID = " + user.room.roomID)
						this.users_.splice(idx,1)
						return false 
					}
					let serviceInfo = this.srsRpc_.getClientInfoByH(h)
					if(user.nodeName && user.nodeName == serviceInfo.name) {
						user.nodeName = null 
						user.room.setUserOnline(roomUser.chairNo,false)
					}
					return true 
				}
				this.logError("user.room is null userOffline userID = "+ userID + " roomID = " + user.room.roomID)
				this.users_.splice(idx,1)
				return false 
			},
			userMessage:async (h:string,userID:number,msgName:string,jsonObj)=>{
				let user = this.users_.find(v=>v.userID == userID)
				if(!user) {
					this.logError("recv user msg user not found userID = " + userID + " msg = " + msgName)
					return false 
				}
				if(!user.room) {
					this.logError("recv user msg room not found userID = " + userID + " msg = " + msgName)
					return false 
				}
				user.room.onMessage(userID,msgName,jsonObj)
				return true 
			},
			roomMessage:async (h:string,roomID:number,msgName:string,jsonObj)=>{
				let room = this.rooms_.find(v=>v.roomID == roomID)
				if(!room) {
					this.logError("recv room msg room not found roomID = " + roomID + " msg = " + msgName,jsonObj)
					return false 
				}
				room.onMessage(-1,msgName,jsonObj)
				return true 
			},
			getRoomInfos:async (h:string)=>{
				return this.rooms_.map(v=>{
					return {
						roomID:v.roomID,
						users:v.users.map(v=>{
							return {
								userID:v.userID,
								chairNo:v.chairNo,
								robot:v.robot,
							}
						})
					}
				})
			},
			matchControl:async(h:string,roomID:number,msgName:string,jsonObj:any)=>{
				let room = this.rooms_.find(v=>v.roomID == roomID)
				if(!room) {
					this.logError("recv match control room not found roomID = " + roomID + " msg = " + msgName,jsonObj)
					return false 
				}
				return await room.onMatchControl(msgName,jsonObj)
			},
		})

		this.robotRpc.methodGroup.addGroup(GSRpcMethods.prefix,{
			getInfo:async ()=>{
				return {
					gameID:this.config.gameID
				}	
			},
			userMessage:async (h:string,userID:number,msgName:string,jsonObj)=>{
				let serviceInfo = this.robotRpc.getClientInfoByH(h)
				let user = this.users_.find(v=>v.userID == userID)
				if(!user || !user.room) {
					return false 
				}
				user.robot = true 
				user.robotServiceName = serviceInfo.name
				this.log("recv robot msg userID = " + userID + " msgName = " + msgName + " from = " + serviceInfo.name,jsonObj)
				user.room.onMessage(userID,msgName,jsonObj)
				return true 
			},
			userOnline:async (h:string,userID:number)=>{
				let serviceInfo = this.robotRpc.getClientInfoByH(h)
				let user = this.users_.find(v=>v.userID == userID)
				if(user) {
					this.log("robot online userID = " + userID + " serviceName = " + serviceInfo.name)
					user.robot = true
					user.robotServiceName = serviceInfo.name
					if(user.room) {
						let roomUser = user.room.getUserByUserID(user.userID)
						if(roomUser) {
							user.room.setUserOnline(roomUser,true)
						} else {
							// user.room = null 
							this.log("room not contains robot user roomID = " + user.room.roomID)
						}
					}
				}
			},
			userEnter:async (h:string,roomID:Number,userID:number,params:GSRpcMethods.tUserEnterReq)=>{
				let serviceInfo = this.robotRpc.getClientInfoByH(h)
				let user = this.users_.find(v=>v.userID == userID)
				if(user) {
					user.robot = true
					user.robotServiceName = serviceInfo.name

					if(user.status == UserStatus.Enter) {
						this.log("enter failed status is enter")
						return false 
					}
					if(user.room.roomID == roomID) {
						return true 
					}
					this.logError("user already in gs roomID = " + user.room?.roomID)
					return false 
				}
				let room = this.rooms_.find(v=>v.roomID == roomID)
				if(!room || room.isReadyToDestroy) {
					this.logError("enter room failed room not found roomID = " + roomID)
					return false 
				}
				user = {
					userID,room,status:UserStatus.Enter,nodeName:null,
					robot:true,robotServiceName:serviceInfo.name
				}
				this.users_.push(user)
				let b = await room.userEnter(userID,params)
				if(!b || room.isReadyToDestroy) {
					let idx = this.users_.indexOf(user)
					if(idx >= 0) {
						this.users_.splice(idx,1)
					}
					this.log("enter failed userID = " + user + " roomID = " + roomID)
					return false 
				}
				let roomUser = room.getUserByUserID(userID)
				if(!roomUser) {
					let idx = this.users_.indexOf(user)
					if(idx >= 0) {
						this.users_.splice(idx,1)
					}
					this.log("enter failed get room user is null userID = " + user + " roomID = " + roomID)
					return false 
				}
				user.status = UserStatus.Room
				this.centerRpc.call("kds.room.realtime.add",room.roomID,user.userID,roomUser.chairNo,roomUser.score)
				this.Flag_AddUser(room.roomID,[user.userID],{
					matchID:room.matchID,
				})
				return true 
			},
			isRoomExist:async(h:string,roomID:number)=>{
				return !!this.rooms_.find(v=>v.roomID == roomID)
			},
			isRoomsExist:async(h:string,roomIDs:number[])=>{
				let rets:{
					roomID:number,b:boolean
				}[] = []
				for(let roomID of roomIDs) {
					rets.push({
						roomID,
						b:!!this.rooms_.find(v=>v.roomID == roomID)
					})
				}
				return rets
			}
		}) 
	}
	private prevRoomUpdateTime_:number
	private dt_:number
	onUpdate() {
		let dt = 0
		let timestamp = kdutils.getMillionSecond()
		if(this.prevRoomUpdateTime_ != null) {
			dt = timestamp - this.prevRoomUpdateTime_
		}
		this.prevRoomUpdateTime_ = timestamp
		this.dt_ = dt / 1000
		for(let room of this.rooms_) {
			if(room.isReadyToDestroy) {
				continue 
			}
			try {
				room.onUpdate(this.dt_)
			} catch (error) {
				this.logError("update error roomID = " + room.roomID,error)
			}
		}
		for(let i = this.rooms_.length - 1 ; i >= 0 ; i --) {
			let room = this.rooms_[i]
			let check = room.handleCheckGameEnd()

			if(room.isReadyToDestroy) {
				this.rooms_.splice(i,1)
				this.log("remove room id = " + room.roomID)
				this.centerRpc.call("kds.room.remove",room.roomID,room.roundEndRemoveType)

				redis.hdel(DBDefine.rTableGameStepRecord,String(room.roomID))
				redis.hdel(DBDefine.tableRoomUserScores,String(room.roomID))
			}else if(room.status == knRoomRealtime.Status.Wait && check){
				room.setupRoundEnd(RoomDefine.RemoveType.NormalEnd);
			}
		}
	}

	private isUpdateRpcWatchWorking_ = false 
	async onUpdateRpcWatch() {
		if(this.isUpdateRpcWatchWorking_) {
			return 
		}
		this.isUpdateRpcWatchWorking_ = true 
		try {
			for(let node of this.nodeServiceInfos) {
				// if(node.name == this.config_.nodeName) {
				// 	continue 
				// }
				this.srsRpc.startClient(node,{
					keep:this.config.nodeName == node.name
				})
			}

			let configs = await knRpcTools.getConfigBlur({
				prefix:"pp-room"
			})
			if(configs && configs.length > 0) {
				for(let config of configs) {
					this.centerRpc.startClient(config)
				}
			}
			configs = await knRpcTools.getConfigBlur({
				prefix:"pp-account"
			})
			if(configs && configs.length > 0) {
				for(let config of configs) {
					this.centerRpc.startClient(config)
				}
			}
			configs = await knRpcTools.getConfigBlur({
				prefix:"pp-club"
			})
			if(configs && configs.length > 0) {
				for(let config of configs) {
					this.centerRpc.startClient(config)
				}
			}
			configs = await knRpcTools.getConfigBlur({
				prefix:"pp-match"
			})
			if(configs && configs.length > 0) {
				for(let config of configs) {
					this.centerRpc.startClient(config)
				}
			}
		} catch (error) {
			this.logError("update error rpc watch",error)
		}
		this.isUpdateRpcWatchWorking_ = false 
	}

	private removePrevRooms_ = false 
	async onCenterRpc_RegToService(serviceInfo: knRpcDefine.ServiceInfo) {
		if(serviceInfo.name.startsWith("pp-room")) {
			if(!this.removePrevRooms_) {
				this.removePrevRooms_ = true 
				let realtimes:RoomDefine.RoomRealtime[] = await Module_RoomRealtime.get({
					gsName:this.serviceInfo.name,
					gsTimestamp:{$lte:kdutils.getMillionSecond()}
				}) || []
				let roomDatas = await Module_RoomData.get({roomID:{$in:realtimes.map(v=>v.roomID)}})
				let ps = []
				for(let realtime of realtimes) {
					this.log("remove prev room roomID = " + realtime.roomID)
					ps.push(
						this.centerRpc.call(kds.room.remove,realtime.roomID,RoomDefine.RemoveType.System)
					)
					let userIDs = realtime.users.map(v=>v.userID)
					if(userIDs.length > 0) {
						this.Flag_RemoveUser(realtime.roomID,userIDs)
					}
					let roomData = roomDatas.find(v=>v.roomID == realtime.roomID)
					if(roomData) {
						let lockID = this.getLockID(roomData)
						let gameSet = GameSet.createWithData(roomData.gameData)
						let payType = RoomDefine.getPayType(gameSet.getPayType())
						if(roomData.matchID) {

						} else {
							if(payType == RoomDefine.PayType.Club) {
								ps.push(
									this.centerRpc.call(kds.club.account.unlockAll,roomData.club?.clubID,lockID)
								)
							} else {
								ps.push(
									this.centerRpc.call(kds.item.unlockAll,lockID)
								)
							}
						}
					}
				}
				if(ps.length > 0) {
					await Promise.all(ps)
				}
				redis.del(DBDefine.tableRoomUserScores)
			}
		}

	}

	async onRobotRpcReg(serviceInfo:knRpcDefine.ServiceInfo) {
		this.log("robot rpc connected name = " + serviceInfo.name)
		// robot 再次连接后会触发断线重连，此处不需要处理
	}

	async onRobotRpcClosed(serviceInfo:knRpcDefine.ServiceInfo) {
		this.log("robot rpc disconnected name = " + serviceInfo.name)
		for(let user of this.users_) {
			if(user.robotServiceName == serviceInfo.name) {
				user.robotServiceName = null 
				try {
					if(user.room) {
						let roomUser = user.room.getUserByUserID(user.userID)
						if(roomUser) {
							this.log("robot offline id = " + roomUser.userID + " roomID = " + user.room.roomID)
							user.room.setUserOnline(roomUser,false)
						}
					}
				} catch(error) {
					this.logError("robot offline error userID = " + user.userID,error)
				}
			}
		}
	}

	async Room_SendToUser(userID:number,msgName:string,jsonObj) {
		let user = this.users_.find(v=>v.userID == userID)
		if(!user) {
			return false 
		}
		if(user.robot) {
			if(user.robotServiceName) {
				if(user.room.roomData.matchID){
					this.robotRpc.callServer(user.robotServiceName,RobotRpcMethods.logic_gsSendMessage,userID,msgName,jsonObj)
				}else{
					this.robotRpc.callServer(user.robotServiceName,RobotRpcMethods.logic_gsSendMessage,userID,msgName,jsonObj)
				}
			} else {
				this.log("cannot send to robot service name is null userID = " + userID)
			}
		} else {
			if(!user.nodeName) {
				return false 
			}
			if(this.nodeServiceInfos.find(v=>v.name == user.nodeName)) {
				this.srsRpc.callServer(user.nodeName,SrsRpcMethods.GameServer.sendToUser,userID,msgName,jsonObj)
			} else {
				this.srsRpc.call(SrsRpcMethods.GameServer.sendToUser,userID,msgName,jsonObj)
			}
		}
		return true 
	}
	async Room_SendToUsers(userIDs:number[],msgName:string,jsonObj) {
		let sendInfos:{
			nodeName:string,
			userIDs:number[]
		}[] = []
		for(let userID of userIDs) {
			let user = this.users_.find(v=>v.userID == userID)
			if(user.robot) {
				if(user.robotServiceName) {
					if(user.room.roomData.matchID){
						this.robotRpc.callServer(user.robotServiceName,RobotRpcMethods.logic_gsSendMessage,userID,msgName,jsonObj)
					}else{
						this.robotRpc.callServer(user.robotServiceName,RobotRpcMethods.logic_gsSendMessage,userID,msgName,jsonObj)
					}
				}
				continue 
			}
			if(user && user.nodeName) {
				let info = sendInfos.find(v=>v.nodeName == user.nodeName)
				if(!info) {
					info = {
						nodeName:user.nodeName,
						userIDs:[]
					}
					sendInfos.push(info)
				}
				info.userIDs.push(user.userID)
			}
		}
		if(sendInfos.length == 0) {
			return false 
		}
		for(let info of sendInfos){
			if(this.nodeServiceInfos.find(v=>v.name == info.nodeName)) {
				this.srsRpc.callServer(info.nodeName,SrsRpcMethods.GameServer.sendToUsers,info.userIDs,msgName,jsonObj)
			} else {
				this.srsRpc.call(SrsRpcMethods.GameServer.sendToUsers,info.userIDs,msgName,jsonObj)
			}
		}
	}

	Room_UserExit(roomID:number,userID:number) {
		let idx = this.users_.findIndex(v=>v.userID == userID)
		if(idx < 0) {
			return false 
		}
		let user = this.users_[idx]
		if(user.robot) {
			if(user.robotServiceName) {
				if(user.room.roomData.matchID){
					this.robotRpc.callServer(user.robotServiceName,RobotRpcMethods.logic_gsUserExit,userID,roomID)
				}
				else{
					this.robotRpc.callServer(user.robotServiceName,RobotRpcMethods.logic_gsUserExit,userID,roomID)
				}
			}
		} else if(user.nodeName) {
			this.srsRpc.callServer(user.nodeName,SrsRpcMethods.GameServer.gsUserExit,userID,roomID)
		}

		this.users_.splice(idx,1)
		this.centerRpc.call("kds.room.realtime.remove",roomID,userID)
		return true 
	}

	Room_UsersExit(roomID:number,userIDs:number[]) {
		let changed = false 
		for(let userID of userIDs) {
			let idx = this.users_.findIndex(v=>v.userID == userID)
			if(idx < 0) {
				continue 
			}
			let user = this.users_[idx]
			this.srsRpc.callServer(user.nodeName,SrsRpcMethods.GameServer.gsUserExit,userID,roomID)
			
			this.users_.splice(idx,1)
			changed = true 
		}
		if(changed) {
			this.centerRpc.call("kds.room.realtime.removes",roomID,userIDs)
		}
		return true 
	}

	// 同步房间状态，JuEnd时可附带用户分数变更
	Room_Status(roomID:number,status:RoomDefine.RoomStatus,users?:RoomDefine.tRoomRpcUserScoreChanged[]) {
		this.centerRpc.call("kds.room.realtime.status",roomID,status,users)
	}

	// noused
	Room_UserChanged(roomID:number,userID:number,chairNo:number,score:string) {
		this.centerRpc.call("kds.room.realtime.changed",roomID,userID,chairNo,score)
	}
	// noused
	Room_MultiUserChanged(roomID:number,users:RoomDefine.tRoomRpcUserScoreChanged[]) {
		this.centerRpc.call(kds.room.realtime.multiChanged,roomID,users)
	}
	// noused
	Room_UserTotalScore(matchID:number, roomID:number,userID:number,score:string) {
		this.centerRpc.call("kds.room.realtime.totalScore",matchID,roomID,userID,score)
	}

	async Room_Bill(roomID:number,bill:RoomDefine.BillData,roomData:RoomDefine.RoomData) {
		bill.billID = await IDUtils.getRoomBillID()
		if(bill.clubID) {
			this.centerRpc.call(kds.club.bill.room,bill,roomData)
		}
		this.dbRoom.insert(DBDefine.tableBill,bill)
	}

	async Room_Fupan(roomID:number,fupanMsgs:any[]) {
		let str = JSON.stringify(fupanMsgs)
		let buffer = Buffer.from(str,"utf8")
		gzip(buffer,(error,zipBuffer)=>{
			if(error) {
				this.logError("zip fupan error roomID = " + roomID + " first = ",fupanMsgs[0])
				return 
			}
			this.dbRoom.insert(DBDefine.tableFupan,<RoomDefine.FupanRecord>{
				roomID,
				juCount:fupanMsgs[0]?.jsonObj?.juCount,
				content:zipBuffer.toString("base64"),
				timestamp:kdutils.getMillionSecond(),
				date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
			})
		})
	}

	async Room_RoundBill(roomID:number,bill:RoomDefine.FinalBillData,roomData:RoomDefine.RoomData) {
		bill.billID = await IDUtils.getRoomBillID()
		if(bill.clubID) {
			this.centerRpc.call(kds.club.bill.round,bill,roomData)
		}
		this.dbRoom.insert(DBDefine.tableRoundBill,bill)
	}

	Room_GameStepRecord(roomID:number,recordData:any) {
		let room = this.rooms_.find(v=>v.roomID == roomID)
		if(!room) {
			return false 
		}
		let t:RoomDefine.GameStepRecord = {
			gameID:room.gameData.gameID,
			roomID,
			juCount:room.juCount,
			data:recordData,
			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		}
		this.dbRoom.insert(DBDefine.tableGameStepRecord,t)
		return true 
	}
	Room_CurrentGameStepRecord(roomID:number,recordData:any) {
		let room = this.rooms_.find(v=>v.roomID == roomID)
		if(!room) {
			return false 
		}
		let t:RoomDefine.GameStepRecord = {
			gameID:room.gameData.gameID,
			roomID,
			juCount:room.juCount,
			data:recordData,
			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		}
		redis.hset(DBDefine.rTableGameStepRecord,String(roomID),t,true)
		return true 
	}
	Room_UserScoresRecord(roomID:number,userScores:RoomDefine.UserScore[]) {
		let room = this.rooms_.find(v=>v.roomID == roomID)
		if(!room) {
			return false 
		}
		redis.hset(DBDefine.tableRoomUserScores,String(roomID),userScores,true)
	}

	Room_RobotSupport(roomID:number,support:RoomDefine.RobotSupport) {
		support.roomID = roomID
		this.centerRpc.call(kds.room.realtime.robotSupport,roomID,support)
	}

	Flag_AddUser(roomID:number,userIDs:number[],opt?:{
		matchID?:number,
	}) {
		let timestamp = kdutils.getMillionSecond()
		for(let userID of userIDs) {
			UserFlag.set(userID,UserFlagDefine.RoomID,roomID)
			let roomIDInfo:UserDefine.tUserRoomID = {
				userID,
				roomID,
				matchID:opt?.matchID,
				timestamp
			}
			Module_UserRoomID.updateOrInsert({userID,roomID},roomIDInfo)
		}
	}

	Flag_RemoveUser(roomID:number,userIDs:number[]) {
		Module_UserRoomID.delMany({userID:{$in:userIDs},roomID})
		for(let userID of userIDs) {
			UserFlag.remove(userID,UserFlagDefine.RoomID,roomID)
		}
	}

	getLockID(roomData:RoomDefine.RoomData) {
		if(roomData.matchID) {
			return MatchDefine.getLockID(roomData.matchID, roomData.gameData.gameID)
		}
		return "ROOM:" + roomData.roomID + "GAMEID:" + roomData.gameData.gameID
	}
}

export namespace GameServerBase {
	export type OtherConfig = {
		gameID:number,
		modeType:SrsDefine.NodeType,
		ip:string,
		centerHost?:string,
		centerPort:number,
		robotHost?:string,
		robotPort:number,
		nodeName:string,
	}
	export let instance:GameServerBase

	export let roomClazz:any 
}
