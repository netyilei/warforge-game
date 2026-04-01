import { knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine"
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods"
import { Log } from "../log"
import { Rpc } from "../rpc"
import { DB } from "../../src/db"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { SrsDefine } from "../../pp-base-define/SrsDefine"
import { kdutils } from "kdweb-core/lib/utils"
import { Config } from "../config"
import { kdreq } from "kdweb-core/lib/service/req"
import { GSRpcMethods } from "../../pp-base-define/GSRpcMethods"
import { Module_RoomGSSrsNode } from "../../pp-base-define/DM_RoomDefine"


export class GSManager {

	private gsNodes_:{
		h:string,
		name:string,
		gameID:number,
		main:boolean,
		status:number,
	}[] = []
	get gsNodes() {
		return this.gsNodes_
	}
	private dbLayer_ = DB.get()
	get dbLayer() {
		return this.dbLayer_
	}

	private redis_ = DB.getRedis()
	get redis() {
		return this.redis_
	}
	async login(h:string,name:string,gameID:number,main?:boolean) {
		this.log("gs login h = " + h + " name = " + name + " gameID = " + gameID + " main = " + main)
		let info = this.gsNodes_.find(v=>v.name == name)
		if(info) {
			this.logError("gs login twice, shutdown prev")
			info.h = h 
			info.gameID = gameID
			info.main = !!main
		} else {
			info = {
				h,name,gameID,main:!!main,status:0
			}
			this.gsNodes_.push(info)
		}
		Rpc.node.call(SrsRpcMethods.Layer.gsOnline,name,gameID,true)
	}

	async gsClosed(name:string) {
		let idx = this.gsNodes_.findIndex(v=>v.name == name)
		if(idx < 0) {
			return 
		}
		let info = this.gsNodes_[idx]
		this.log("gs offline h = " + info.h + "name = " + name)
		this.gsNodes_.splice(idx,1)
		Rpc.node.call(SrsRpcMethods.Layer.gsOnline,name,info.gameID,false)
	}

	async setGSStatus(gsName:string,status:number) {
		let count = 0
		for(let gs of this.gsNodes) {
			if(gs.name == gsName) {
				gs.status = status
				count ++ 
				this.log("set gs status name = " + gsName + " status = " + status + " h = " + gs.h)
			}
		}
		return count 
	}

	async callGameServer(name:string,method:string,...params) {
		let info = this.gsNodes_.find(v=>v.name == name)
		if(!info) {
			this.log("gs offline h = " + info.h + "name = " + name)
			return null 
		}
		if(!method.startsWith(GSRpcMethods.prefix)) {
			method = GSRpcMethods.prefix + "." + method
		}
		return await Rpc.node.callServerException(name,method,...params)
	}

	async callGameServerByH(h:string,method:string,...params) {
		let info = this.gsNodes_.find(v=>v.h == h)
		if(!info) {
			return null 
		}
		return await Rpc.node.callServerException(info.name,method,...params)
	}

	async callAllGameServers(method:string,...params) {
		let ps:Promise<knRpcDefine.ClientCallReturn>[] = []
		for(let info of this.gsNodes_) {
			ps.push(Rpc.node.callServer(info.name,method,...params))
		}
		let datas = await Promise.all(ps)
		let ret = datas.map(v=>v ? v.data : null)
		return ret 
	}
	async callAllMainGameServers(method:string,...params) {
		let ps:Promise<knRpcDefine.ClientCallReturn>[] = []
		for(let info of this.gsNodes_) {
			if(info.main) {
				ps.push(Rpc.node.callServer(info.name,method,...params))
			}
		}
		let datas = await Promise.all(ps)
		let ret = datas.map(v=>v ? v.data : null)
		return ret 
	}

	private gsLayerCaches_:{
		name:string,
		layerNames:string[],
		prevTime:number,
	}[] = []
	async selectGSLayer(name:string) {
		let idx = this.gsLayerCaches_.findIndex(v=>v.name == name)
		let cache = idx >= 0 ? this.gsLayerCaches_[idx] : null 
		if(cache) {
			let time = kdutils.getMillionSecond()
			if(time - cache.prevTime >= 30000) {
				cache = null 
				this.gsLayerCaches_.splice(idx,1)
			}
		}
		if(!cache) {
			let gsInfos = await Module_RoomGSSrsNode.get({name:name,layer:{$ne:Config.localConfig.layerName}}) || []
			cache = {
				name,
				layerNames:gsInfos.map(v=>v.layer),
				prevTime:kdutils.getMillionSecond(),
			}
			this.gsLayerCaches_.push(cache)
		}
		if(cache && cache.layerNames.length > 0) {
			return cache.layerNames[kdutils.intRandom(0,cache.layerNames.length)]
		}
		return null 
	}
	setGSLayerInvalid(name:string,layerName:string) {
		let idx = this.gsLayerCaches_.findIndex(v=>v.name == name)
		if(idx >= 0) {
			let cache = this.gsLayerCaches_[idx]
			let layerIdx = cache.layerNames.indexOf(layerName)
			if(layerIdx >= 0) {
				cache.layerNames.splice(layerIdx,1)
				if(cache.layerNames.length == 0) {
					cache.prevTime = 0
				}
			}
		}
	}
	async callGameServerThroughLayer(name:string,method:string,...params) {
		let info = this.gsNodes_.find(v=>v.name == name)
		if(!info) {
			let layerName = await this.selectGSLayer(name)
			if(!layerName) {
				this.logError("[callGameServerThroughLayer] cannot find layer gsName = " + name)
				return null 
			}
			let layer:SrsDefine.LayerOtherConfig = await this.redis.hget(SrsDefine.Redis.tableLayer,layerName,true)
			if(!layer) {
				this.logError("[callGameServerThroughLayer] cannot find layer config gsName = " + name + " layer = " + layerName)
				return null 
			}
			let res = await kdreq.postJson(layer.httpHost + SrsDefine.Http.Layer.pathCallGS,<SrsDefine.Http.Layer.tCallGSReq>{
				name,
				method,
				params
			})
			if(res.error || !res.body) {
				this.logError("[callGameServerThroughLayer] post layer failed gsName = " + name + " layer = " + layerName,res.error)
				this.setGSLayerInvalid(name,layerName)
				return null 
			}
			let body:SrsDefine.Http.Layer.tCallGSRes = res.body
			if(body.code != "success") {
				this.logError("[callGameServerThroughLayer] post layer res not success gsName = " + name + " layer = " + layerName,body)
				if(body.code == "not exist") {
					this.setGSLayerInvalid(name,layerName)
				}
				return null 
			}
			return body.data
		}
		return await Rpc.node.callServerException(name,method,...params)
	}

	async onLayerLogin(layerName:string) {
		let infos:SrsRpcMethods.Layer.tGSOnlines = this.gsNodes_.map(v=>{
			return {
				name:v.name,
				gameID:v.gameID,
				b:true,
			}
		})
		await Rpc.node.callServer(layerName,SrsRpcMethods.Layer.gsOnlines,infos,true)
	}

	log(title:string,...params) {
		Log.oth.info("[LayerManager] " + title,...params)
	}
	logError(title:string,...params) {
		Log.oth.error("[LayerManager] " + title,...params)
	}
}