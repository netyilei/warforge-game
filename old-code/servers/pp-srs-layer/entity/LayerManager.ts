import { kdasync } from "kdweb-core/lib/tools/async"
import { SrsDefine } from "../../pp-base-define/SrsDefine"
import { Log } from "../log"
import { DB } from "../../src/db"
import { redisDB } from "kdweb-core/lib/redis/controller"
import { Config } from "../config"
import { Rpc } from "../rpc"
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods"
import { mongoDB } from "kdweb-core/lib/mongo/controller"
import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine"
import { Module_RoomGSSrsNode } from "../../pp-base-define/DM_RoomDefine"


export class LayerManager {
	constructor() {
	}
	private redis_:redisDB
	private db_:mongoDB
	async init() {
		this.log("init start")
		this.waitInit_ = new kdasync.wait
		this.redis_ = DB.getRedis()
		this.db_ = DB.get()
		let obj = await this.redis_.hgetall(SrsDefine.Redis.tableSrsNodeMap,true) || {}
		let ps = []
		for(let srsNodeName of Object.keys(obj)) {
			let info:SrsDefine.Redis.tSrsNodeMap = obj[srsNodeName]
			if(info.layer == Config.myName) {
				ps.push(this.redis_.hdel(SrsDefine.Redis.tableSrsNodeMap,srsNodeName))
				this.log("delete redis cacha for name = " + srsNodeName)
			}
		}
		await Promise.all(ps)
		await this.redis_.del(SrsDefine.Redis.ftableLayerMap(Config.myName))
		this.log("init end")
		this.waitInit_.resolve()
		this.waitInit_ = null 
	}
	private waitInit_:kdasync.wait
	async doWaitInit() {
		if(this.waitInit_) {
			await this.waitInit_.promise
		}
	}
	private nodes_:{
		h:string,
		name:string,
		type:SrsDefine.NodeType,
		serviceInfo:knRpcDefine.ServiceInfo,
		other:SrsDefine.NodeOtherConfig,
	}[] = [] 
	get nodes() {
		return this.nodes_
	}
	async nodeLogin(h:string,name:string,type:SrsDefine.NodeType,other:any) {
		await this.doWaitInit()
		this.log("login start name = " + name + " type = " + SrsDefine.NodeType[type],other)
		let info = this.nodes_.find(v=>v.name == name)
		if(info) {
			if(info.h == h) {
				info.other = other 
				info.type = type 
				this.log("login: refresh info name = " + name)
				this.redis_.hset(SrsDefine.Redis.tableSrsNodeMap,info.name,<SrsDefine.Redis.tSrsNodeMap>{
					layer:Config.myName,
					layerConfig:Config.otherConfig,
					otherConfig:other,
				},true)
				this.redis_.hset(SrsDefine.Redis.ftableLayerMap(Config.myName),info.name,"1")
				return 
			}
			this.logError("login: failed login twice, shutdown prev name = " + info.name + " type = " + SrsDefine.NodeType[info.type],info.other)
			let clientInfo = Rpc.layer.getClientInfoByH(info.h)
			if(clientInfo) {
				Rpc.layer.stopClient(clientInfo.name)
			}
			let idx = this.nodes_.indexOf(info)
			this.nodes_.splice(idx,1)
			this.redis_.hdel(SrsDefine.Redis.tableSrsNodeMap,info.name)
			this.redis_.hdel(SrsDefine.Redis.ftableLayerMap(Config.myName),info.name)
		}
		info = {
			h,
			name,
			type,
			other,
			serviceInfo:Rpc.layer.getClientInfoByH(h)
		}
		this.nodes_.push(info)
		this.redis_.hset(SrsDefine.Redis.tableSrsNodeMap,info.name,<SrsDefine.Redis.tSrsNodeMap>{
			layer:Config.myName,
			layerConfig:Config.otherConfig,
			otherConfig:other,
		},true)
		this.redis_.hset(SrsDefine.Redis.ftableLayerMap(Config.myName),info.name,"1")
		this.sendNodeChanged()
	}

	async onNodeClosed(name:string) {
		{
			let ps = []
			for(let i = this.gss_.length - 1 ; i >= 0 ; i --) {
				let gs = this.gss_[i]
				if(gs.nodeName == name) {
					this.gss_.splice(i,1)
					ps.push(
						Module_RoomGSSrsNode.del({name:name,layer:Config.myName,nodeName:name}),
					)
				}
			}
			await Promise.all(ps)
		} 
		do {
			let info = this.nodes_.find(v=>v.name == name)
			if(!info) {
				break  
			}
			this.log("handle node closed name = " + name)
			let idx = this.nodes_.indexOf(info)
			this.nodes_.splice(idx,1)
			this.redis_.hdel(SrsDefine.Redis.tableSrsNodeMap,info.name)
			this.redis_.hdel(SrsDefine.Redis.ftableLayerMap(Config.myName),info.name)
			this.sendNodeChanged()
		} while (false);
	}

	private users_:{
		userID:number,
		nodeName:string,
	}[] = []
	private devices_:{
		deviceID:string,
		nodeName:string,
		deviceH:string,
	}[] = []
	private gss_:{
		name:string,
		nodeName:string,
		gameID:number,
	}[] = []
	get gss() {
		return this.gss_
	}
	async userOnline(h:string,userID:number,b:boolean) {
		let clientInfo = Rpc.layer.getClientInfoByH(h)
		if(!clientInfo) {
			this.log("user online failed: unhandled client h = " + h + " userID = " + userID + " b = " + b)
			return false 
		}
		if(b) {
			await this.redis_.hset(SrsDefine.Redis.tableUserSrsNode,String(userID),clientInfo.name)
			let user = this.users_.find(v=>v.userID == userID)
			if(user) {
				user.nodeName = clientInfo.name
			} else {
				user = {
					userID:userID,
					nodeName:clientInfo.name
				}
				this.users_.push(user)
			}
		} else {
			let nodeName = await this.redis_.hget(SrsDefine.Redis.tableUserSrsNode,String(userID),false)
			if(nodeName == clientInfo.name) {
				await this.redis_.hdel(SrsDefine.Redis.tableUserSrsNode,String(userID))
			}
			let idx = this.users_.findIndex(v=>v.userID == userID)
			if(idx >= 0) {
				this.users_.splice(idx,1)
			}
		}
	}

	async userOnlines(h:string,infos:SrsRpcMethods.Layer.tUserOnlines,force?:boolean) {
		let clientInfo = Rpc.layer.getClientInfoByH(h)
		if(!clientInfo) {
			this.log("user onlines failed: unhandled client h = " + h)
			return false 
		}
		let ps = []
		for(let i = this.users_.length - 1; i >= 0 ; i --) {
			let user = this.users_[i]
			if(user.nodeName == clientInfo.name) {
				this.users_.splice(i,1)
				ps.push(this.redis_.hdel(SrsDefine.Redis.tableUserSrsNode,String(user.userID)))
			}
		}
		await Promise.all(ps)
		for(let info of infos) {
			this.userOnline(h,info.userID,info.b)
		}
		return true 
	}

	async deviceOnline(h:string,deviceID:string,deviceH:string,b:boolean) {
		let clientInfo = Rpc.layer.getClientInfoByH(h)
		if(!clientInfo) {
			this.log("device online failed: unhandled client h = " + h + " deviceID = " + deviceID + " deviceH = " + deviceH + " b = " + b)
			return false 
		}
		if(b) {
			this.log("device online redis set deviceID = "+deviceID)
			let p1 = this.redis_.hset(SrsDefine.Redis.tableDeviceSrsNode,String(deviceID),clientInfo.name)
			let p2 = this.redis_.hset(SrsDefine.Redis.tableDeviceServerH,String(deviceID),deviceH)
			await Promise.all([p1,p2])
			let device = this.devices_.find(v=>v.deviceID == deviceID)
			if(device) {
				device.nodeName = clientInfo.name
				device.deviceH = deviceH
			} else {
				device = {
					deviceID:deviceID,
					nodeName:clientInfo.name,
					deviceH:deviceH,
				}
				this.devices_.push(device)
			}
		} else {
			let arr:string[] = await Promise.all([
				this.redis_.hget(SrsDefine.Redis.tableDeviceSrsNode,String(deviceID),false),
				this.redis_.hget(SrsDefine.Redis.tableDeviceServerH,String(deviceID),false)
			]) || []
			let nodeName = arr[0]
			let nodeDeviceH = arr[1]
			if(nodeName == clientInfo.name && nodeDeviceH == deviceH) {
				this.log("device offline redis del deviceID = " + deviceID)
				await this.redis_.hdel(SrsDefine.Redis.tableDeviceSrsNode,String(deviceID))
				// deviceH不关键，节省cpu时间
				// await this.redis_.hdel(SrsDefine.Redis.tableDeviceServerH,String(deviceID))
			}
			this.log("device offline redis nodeName = " + nodeName + " clientInfo name "+clientInfo.name + " deviceH = " + deviceH)
			let idx = this.devices_.findIndex(v=>v.deviceID == deviceID && v.nodeName == clientInfo.name && v.deviceH == deviceH)
			if(idx >= 0) {
				this.devices_.splice(idx,1)
			}
		}
	}
	
	async gsOnline(h:string,name:string,gameID:number,b:boolean) {
		let clientInfo = Rpc.layer.getClientInfoByH(h)
		if(!clientInfo) {
			this.log("gs online failed: unhandled client h = " + h + " name = " + name + " b = " + b)
			return false
		}
		if(b) {
			await Module_RoomGSSrsNode.updateOrInsert({name,layer:Config.myName,nodeName:clientInfo.name},{
				name,
				gameID,
				layer:Config.myName,
				nodeName:clientInfo.name,
			})
			let gs = this.gss_.find(v=>v.name == name && v.nodeName == clientInfo.name)
			if(gs) {
				gs.nodeName = clientInfo.name
				gs.gameID = gameID
			} else {
				gs = {
					name:name,
					gameID:gameID,
					nodeName:clientInfo.name,
				}
				this.gss_.push(gs)
			}
		} else {
			Module_RoomGSSrsNode.del({name:name,layer:Config.myName,nodeName:clientInfo.name})
			let idx = this.gss_.findIndex(v=>v.name == name)
			if(idx >= 0) {
				this.gss_.splice(idx,1)
			}
		}
	}

	async gsOnlines(h:string,infos:SrsRpcMethods.Layer.tGSOnlines,force?:boolean) {
		let clientInfo = Rpc.layer.getClientInfoByH(h)
		if(!clientInfo) {
			this.log("gs offline all failed: unhandled client h = " + h)
			return false
		}
		for(let i = this.gss_.length - 1 ; i >= 0 ; i --) {
			let gs = this.gss_[i]
			if(gs.nodeName == clientInfo.name) {
				this.gss_.splice(i,1)
			}
		}
		if(force) {
			await Module_RoomGSSrsNode.delMany({
				layer:Config.myName,
				nodeName:clientInfo.name
			})
		}
		for(let info of infos) {
			this.gsOnline(h,info.name,info.gameID,info.b)
		}
		return true 
	}
	

	sendNodeChanged(exceptNodeName?:string) {
		for(let node of this.nodes_) {
			if(node.name == exceptNodeName) {
				continue 
			}
			Rpc.layer.callServer(node.name,SrsRpcMethods.Node.layerNodesChanged)
		}
	}

	getUserNodeName(userID:number) {
		let user = this.users_.find(v=>v.userID == userID)
		return user ? user.nodeName : null
	}
	getDeviceNodeName(deviceID:string) {
		let device = this.devices_.find(v=>v.deviceID == deviceID)
		return device ? device.nodeName : null 
	}

	log(title:string,...params) {
		Log.oth.info("[LayerManager] " + title,...params)
	}
	logError(title:string,...params) {
		Log.oth.error("[LayerManager] " + title,...params)
	}
}