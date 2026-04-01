
import { gunzipSync } from "zlib";
import { SrsUserMsg } from "../../ServerDefines/SrsUserMsg";
import { Config } from "../Config";

export type TcpComonMsg = {
	msgName:string,
	data:any,
	m?:string,
	d?:any,
}

export namespace TcpEvent {
	export const Connected = "TcpEventConnect"
	export const ConnectFailed = "TcpEventConnectFailed"
	export const Error = "TcpEventError"
	export const Closed = "TcpEventClosed"
	export const Message = "TcpEventMessage"
}

function decodeMsg(crypto:kcore.ICrypto,str):TcpComonMsg {
	try {
		let obj = JSON.parse(str)
		if(obj == null) {
			return null
		}
		if(crypto) {
			obj = crypto.decodeRes(obj)
		}
		
		if(obj.m) {
			obj.msgName = obj.m 
			obj.data = obj.d || "{}"
		}
		let data = null 
		if(obj.gdata) {
			let str = gunzipSync(Buffer.from(obj.gdata,"base64")).toString("utf8")
			data = JSON.parse(str)
		} else {
			data = JSON.parse(obj.data)
		}
		let ret:TcpComonMsg = {
			msgName:obj.msgName,
			data:data
		}
		return ret 
	} catch (error) {
		kcore.log.info(error)
	}
	return null
}

function makeMsgEventName(msgName:string) {
	if(msgName.indexOf("TcpEvent") == 0) {
		return msgName
	}
	return "TcpEvent|Msg=" + msgName
}
let MAGIC_CODE = 3099
export class Tcp {
	constructor(host?:string) {
		this.host_ = host
		this.disp_ = kcore.disp()
	}

	private crypto_:kcore.ICrypto
	get crypto() {
		if(this.crypto_ === undefined) {
			this.crypto_ = kcore.crypto
		}
		return this.crypto_ 
	}
	set crypto(v) {
		this.crypto_ = v
	}
	private host_:string = null
	private ws_:WebSocket = null
	private disp_:kcore.IEventDispatcher = null
	private isReady_:boolean = false 
	private isConnecting_:boolean = false 
	private connectFailedSended_:boolean = false 
	get ready() {
		return this.isReady_
	}
	get connecting() {
		return this.isConnecting_
	}
	connect(host?:string) {
		if(host) {
			this.host_ = host 
		}

		this.closeInternal(true)
		this.isConnecting_ = true 

		let self = this 
		if(CC_JSB && this.host_.startsWith("wss://") && Config.wssCertNativeUrl) {
			// @ts-ignore
			this.ws_ = new WebSocket(this.host_,[],Config.wssCertNativeUrl)
			// this.ws_ = new WebSocket(this.host_)
		} else {
			this.ws_ = new WebSocket(this.host_)
		}
		kcore.log.info("ws connect to host = " + this.host_)
		this.ws_.onopen = function(e) {
			kcore.log.info("ws connected")
			self.isReady_ = true 
			self.isConnecting_ = false 
			self.disp_.dispatch(TcpEvent.Connected,null)
		}

		this.ws_.onerror = function(e) {
			if(self.isReady_ == false && self.isConnecting_) {
				kcore.log.info("ws connect failed",e)
				self.isConnecting_ = false 
				self.disp_.dispatch(TcpEvent.ConnectFailed,null)
			} else {
				kcore.log.info("ws handle error",e)
				self.disp_.dispatch(TcpEvent.Error,e)
			}
			self.closeInternal()
		}

		this.ws_.onmessage = function(e) {
			let data = e.data.toString()
			//kcore.log.info("handle msg len = " + data.length)
			let msg = decodeMsg(self.crypto,data)
			if(msg == null) {
				kcore.log.info("ws received msg is invalid")
				return 
			}
			if(self.caching_ && msg.msgName != SrsUserMsg.Heart && msg.msgName != SrsUserMsg.SimpleHeart) {
				kcore.log.info("ws cache msg name = " + msg.msgName)
				self.cacheMsgs_.push(msg) 
			} else {
				try {
					self.disp_.dispatch(makeMsgEventName(msg.msgName),msg.data)
					self.disp_.dispatch(TcpEvent.Message,msg.msgName,msg.data)
				} catch (error) {
					kcore.log.info("ws exception when dispatch ",error)
				}
			}
		}

		this.ws_.onclose = function(e) {
			kcore.log.info("ws closed")
			// 主动close的不执行下面的逻辑
			if(e.code == MAGIC_CODE) {
				return 
			}
			if(self.isConnecting_) {
				kcore.log.info("ws connect closed",e)
				self.isConnecting_ = false 
				self.disp_.dispatch(TcpEvent.ConnectFailed,null)
			}
			if(self.isReady_ == false) {
				return 
			}
			self.closeInternal()
			//self.disp_.dispatch(TcpEvent.Closed,null)
		}
		return this 
	}

	close() {
		kcore.log.info("close ws entity")
		this.closeInternal(true)
		return this 
	}


	private closeInternal(ignoreSendClose?:boolean) {
		this.removeCache()
		let sendClose = this.ws_ != null
		if(this.ws_) {
			if(this.ws_.readyState != WebSocket.CLOSED) {
				try {
					this.ws_.close(MAGIC_CODE)
				} catch (error) {
					console.log("close ws failed error: ",error)
				}
			}
			this.ws_ = null
		}
		this.isReady_ = false 
		this.isConnecting_ = false 

		if(ignoreSendClose) {
			return 
		}
		this.disp_.dispatch(TcpEvent.Closed,null)
	}

	private cacheMsgs_:TcpComonMsg[] = []
	private caching_ = false 
	startCache() {
		kcore.log.info("ws start cache")
		if(this.caching_) {
			return 
		}
		this.caching_ = true 
		this.cacheMsgs_.splice(0)
	}

	endCache() {
		kcore.log.info("ws end cache")
		this.caching_ = false 
		for(let msg of this.cacheMsgs_) {
			kcore.log.info("ws disp cache data name = " + msg.msgName)
			try {
				this.disp_.dispatch(makeMsgEventName(msg.msgName),msg.data)
				this.disp_.dispatch(TcpEvent.Message,msg.msgName,msg.data)
			} catch (error) {
				kcore.log.info("exception when dispatch ",error)
			}
		}
		this.cacheMsgs_.splice(0)
	}

	removeCache() {
		kcore.log.info("ws remove cache")
		this.caching_ = false 
		this.cacheMsgs_.splice(0)
	}

	send(msgName:string,jsonObj) {
		if(this.isReady_ == false) {
			return false 
		}
		let msg = {
			m:msgName,
			d:JSON.stringify(jsonObj || {}),
		}
		if(msgName != "SSH") {
			if(this.crypto) {
				msg = <any>this.crypto.encodeReq(msg)
			}
		}
		let data = JSON.stringify(msg)
		this.ws_.send(data)
		return true 
	}

	listen(msgName:string,func:kcore.EventFunc) {
		this.disp_.listen(makeMsgEventName(msgName),func)
		return this 
	}

	unlisten(func:kcore.EventFunc) {
		this.disp_.removeFunc(func)
		return this 
	}

	listenNode(node:cc.Node,dispName?:string) {
		return this.disp_.addNode(node,dispName || "_default_tcp_nodedisp_")
	}

	listenDisp(disp:kcore.IEventDispatcher) {
		this.disp_.addChild(disp)
		return this 
	}

	removeAllListener() {
		this.disp_.removeAll()
		return this 
	}
}

export namespace Tcp {
	export let makeEventName = makeMsgEventName
}