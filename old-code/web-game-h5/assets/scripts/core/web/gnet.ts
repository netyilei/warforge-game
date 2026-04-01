import { SrsUserMsg } from "../../ServerDefines/SrsUserMsg"
import { rcEventDispatcher } from "../utils/EventDispatcher"
import { Tcp, TcpEvent } from "./Tcp"

let tcp:Tcp
let gDisp:kcore.IEventDispatcher

class GNetNode implements kcore.IGNetNode {
	private disp_:kcore.IEventDispatcher
	constructor(disp:kcore.IEventDispatcher) {
		this.disp_ = disp
	}

	listen(eventName:string,func) {
		this.disp_.listen(Tcp.makeEventName(eventName),func)
		return this 
	}

	listenConnected(func) {
		this.disp_.listen(TcpEvent.Connected,func)
		return this
	}
	listenClosed(func) {
		this.disp_.listen(TcpEvent.Closed,func)
		return this
	}
	listenConnectFailed(func) {
		this.disp_.listen(TcpEvent.ConnectFailed,func)
		return this
	}

	dispatchTcp(eventName:string,jsonObj) {
		this.disp_.dispatch(Tcp.makeEventName(eventName),jsonObj)
	}
	
	clear() {
		this.disp_.clear()
	}
}

export function gnet(node:cc.Node) {
	return new GNetNode(gDisp.addNode(node,"_default_webcenter_nodedisp_"))
}

export namespace gnet {
	export let wsHost:string = null 

	export function init() {
		tcp = new Tcp()
		gDisp = new rcEventDispatcher()
		tcp.listenDisp(gDisp)
		gDisp.listen(TcpEvent.Message,function(msgName,jsonObj) {
			if(msgName == SrsUserMsg.Heart || msgName == SrsUserMsg.SimpleHeart) {
				return 
			}
			kcore.log.info("[gnet] recv msgName = " + msgName,jsonObj)
			kcore.log.info(JSON.stringify(jsonObj))
		})

	}

	export function setCrypto(crypto:kcore.ICrypto) {
		tcp.crypto = crypto
	}

	export function getTcp() {
		return tcp 
	}

	export function send(msgName:string,jsonObj) {
		if(msgName != SrsUserMsg.Heart && msgName != SrsUserMsg.SimpleHeart) {
			kcore.log.info("[gnet] send msgName = " + msgName,jsonObj)
			kcore.log.info(JSON.stringify(jsonObj))
		}
		tcp.send(msgName,jsonObj)
	}
	export function isConnected() {
		return tcp.ready
	}
	export function isConnecting() {
		return tcp.connecting
	}
	export function close() {
		tcp.close()
	}
	export function connect() {
		gnet.close()
		tcp.connect(wsHost)
	}
	export function dispatchTcp(eventName:string,jsonObj) {
		gDisp.dispatch(Tcp.makeEventName(eventName),jsonObj)
	}
}
