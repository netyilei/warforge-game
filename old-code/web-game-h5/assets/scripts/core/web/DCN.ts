import { SrsUserMsg, SrsUserNotify } from "../../ServerDefines/SrsUserMsg"


let cacheDKeyInfos:{
	dkey:string,
	nodes:cc.Node[],
}[] = []

function getDKeyDataPath(dkey:string) {
	return "remote/dcn/" + dkey
}
function checkListen() {
	let dcnObj = kcore.data.get("remote/dcn",{})
	for(let i = cacheDKeyInfos.length - 1; i >= 0 ; i --) {
		let info = cacheDKeyInfos[i]
		if(info.nodes.length == 0) {
			kcore.gnet.send(SrsUserMsg.DCNUnListen,{
				dkey:info.dkey
			})
			cacheDKeyInfos.splice(i,1)
			delete dcnObj[info.dkey]
		}
	}
}
function _unlisten(dkey:string,node:cc.Node) {
	let path = getDKeyDataPath(dkey)
	kcore.data.unlisten(path,node)
	let info = cacheDKeyInfos.find(v=>v.dkey == dkey)
	if(info) {
		let idx = info.nodes.indexOf(node)
		if(idx >= 0) {
			info.nodes.splice(idx,1)
		}
		checkListen()
	}
}

function _unlistenNode(node:cc.Node) {
	for(let info of cacheDKeyInfos) {
		let idx = info.nodes.indexOf(node)
		if(idx >= 0) {
			let path = getDKeyDataPath(info.dkey)
			kcore.data.unlisten(path,node)

			info.nodes.splice(idx,1)
		}
	}
	checkListen()
}

const {ccclass, property} = cc._decorator;

@ccclass
export class DCN extends cc.Component {

	onLoad() {
		kcore.gnet(this.node) 
			.listen(SrsUserMsg.Login,kcore.api.handler(this,this.handleLogin))
			.listen(SrsUserNotify.DCNChanged,kcore.api.handler(this,this.handleDCNChanged))

	}
	handleLogin(t:SrsUserMsg.tLoginRes) {
		if(t.success) {
			for(let cache of cacheDKeyInfos) {
				kcore.gnet.send(SrsUserMsg.DCNListen,{
					dkey:cache.dkey
				})
			}
		}
	}
	handleDCNChanged(t:SrsUserNotify.tDCNChanged) {
		let path = getDKeyDataPath(t.dkey)
		kcore.data.set(path,t.data)
	}
}

export namespace DCN {

	export function listen(dkey:string,node:cc.Node,func) {
		let path = getDKeyDataPath(dkey)

		let info = cacheDKeyInfos.find(v=>v.dkey == dkey)
		if(info == null) {
			info = {
				dkey:dkey,
				nodes:[]
			}
			cacheDKeyInfos.push(info)
			kcore.gnet.send(SrsUserMsg.DCNListen,{
				dkey:dkey
			})
			kcore.data.set(path,null)
		}
		if(!info.nodes.includes(node)) {
			info.nodes.push(node)
			if(!node["_dcn_"]) {
				node["_dcn_"] = true 
				kcore.nodeCycle.listenDestroy(node,function() {
					_unlistenNode(node)
				})
			}
			// rcDestroy(node,function() {
			// 	rcLog("unlisten node = " + node.name + " dkey = " + dkey)
			// 	_unlisten(dkey,node)
			// })
		}

		kcore.data.listen(path,node,func)
	}

	export function unlisten(dkey:string,node:cc.Node) {
		_unlisten(dkey,node)
	}

	export function unlistenNode(node:cc.Node) {
		_unlistenNode(node)
	}

	export function clear() {
		if(kcore.gnet.isConnected) {
			kcore.gnet.send(SrsUserMsg.DCNUnListenAll,{})
			cacheDKeyInfos = []
		}
	}
}
