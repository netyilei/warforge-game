import { UIBase } from "../../../core/ui/UIBase";
import { ReqChat } from "../../../requests/ReqChat";
import { CustomerDefine, CustomerMsgDefine } from "../../../ServerDefines/CustomerDefine";
import CustomerItemWidget from "./CustomerItemWidget";


const { ccclass, property, menu } = cc._decorator


enum DataType {
	Chat,
	Log,
}

type CacheData = {
	type:DataType,
	chat?:CustomerDefine.tChat,
	log?:string,
}
@ccclass
@menu("cpp/lobby/customer/CustomerLayer")
export default class CustomerLayer extends UIBase {
	@property(cc.ScrollView)
	list:cc.ScrollView = null
	@property(cc.Node)
	nodeTemplate:cc.Node = null
	@property()
	maxDataLength:number = 100
	@property(cc.EditBox)
	edit:cc.EditBox = null

	onPush(...params: any[]): void {
		this.maskPopEnabled = false 
		
		this.nodeTemplate.active = false

		this.disp_ = kcore.disp()
		this.disp_.link(this.node)

		this.disp_.listen(kcore.TcpEvent.Message,			kcore.api.handler(this,this.handleMessage))
		this.disp_.listen(kcore.TcpEvent.Connected,			kcore.api.handler(this,this.handleConnected))
		this.disp_.listen(kcore.TcpEvent.ConnectFailed,		kcore.api.handler(this,this.handleConnectFailed))
		this.disp_.listen(kcore.TcpEvent.Closed,			kcore.api.handler(this,this.handleClosed))
		this.disp_.listen(kcore.TcpEvent.Error,				kcore.api.handler(this,this.handleError))

		this.initData()
	}
	private room_:CustomerDefine.tRoom
	async initData() {
		let res = await ReqChat.startChat({})
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			this.popSelf()
			return
		}
		this.room_ = res.room
		{
			let res = await ReqChat.getChats({
				roomID: this.room_.roomID,
				page: 0,
				limit: 50,
			})
			if(res && res.datas) {
				res.datas.sort((a,b)=>a.msgID - b.msgID)
				for(let chat of res.datas) {
					this.addChat(chat)
				}
			}
		}
		this.startConnect()
	}

	async updateRoom() {
		let res = await ReqChat.getRoom({})
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			return false 
		}
		if(this.room_ && res.room.roomID != this.room_.roomID) {
			this.addLog("客服已接入")
		}
		this.room_ = res.room
		return true 
	}
	private tcp_:kcore.Tcp
	private disp_:kcore.IEventDispatcher
	private waitConnecting_:boolean = false
	private ready_ = false 
	private prevHeartTime_:number = 0
	async startConnect(delaySeconds:number = 0) {
		if(this.waitConnecting_) {
			return
		}
		this.ready_ = false 
		this.prevHeartTime_ = 0
		if(this.tcp_) {
			this.tcp_.close()
			this.disp_.removeFromParent()
			this.tcp_ = null 
		}
		if(delaySeconds > 0) {
			this.waitConnecting_ = true
			this.addLog(`等待${delaySeconds}秒后重连...`)
			await kcore.async.timeout(delaySeconds * 1000)
			this.waitConnecting_ = false
		}
		let wsHost = kcore.data.get("login/customer/wsHost")
		if(!wsHost) {
			kcore.tip.push("提示","客服功能未开放")
			this.scheduleOnce(()=>{
				this.popSelf()
			})
			return 
		}
		this.tcp_ = new kcore.Tcp()
		this.tcp_.listenDisp(this.disp_)
		this.tcp_.connect(wsHost)
	}

	private data_:CacheData[] = []
	addLog(content:string) {
		let data:CacheData = {
			type: DataType.Log,
			log: content,
		}
		this.addData(data)
	}

	addChat(chat:CustomerDefine.tChat) {
		let data:CacheData = {
			type: DataType.Chat,
			chat: chat,
		}
		this.addData(data)
	}

	addData(data:CacheData) {
		this.data_.push(data)
		if(this.data_.length > this.maxDataLength) {
			this.data_.splice(0,this.data_.length - this.maxDataLength)
			this.list.content.children[0]?.destroy()
		}
		let node = kcore.display.instantiate(this.nodeTemplate)
		node.active = true 
		this.list.content.addChild(node)
		this.list.scrollToBottom()
		let com = node.getComponent(CustomerItemWidget)
		switch(data.type) {
			case DataType.Chat:
				com.setChat(data.chat)
				break
			case DataType.Log:
				com.setLog(data.log)
				break
		}
	}

	protected update(dt: number): void {
		if(this.ready_) {
			let time = Date.now()
			if(time - this.prevHeartTime_ > 10000) {
				this.prevHeartTime_ = time
				this.tcp_.send(CustomerMsgDefine.SimpleHeart,{})
			}
		}
	}
	async handleMessage(msgName:string,data:any) {
		if(msgName == CustomerMsgDefine.Heart || msgName == CustomerMsgDefine.SimpleHeart) {
			this.tcp_.send(CustomerMsgDefine.SimpleHeart,{})
			return 
		}
		switch(msgName) {
			case CustomerMsgDefine.Login:{
				let t:CustomerMsgDefine.tLoginRes = data
				kcore.log.info("Login:",t)
				if(!t.success) {
					this.addLog("登录失败，无法使用客服功能")
					return 
				}
				this.prevHeartTime_ = 0
				this.ready_ = true
				this.addLog("连接成功")
			} break 
			case CustomerMsgDefine.Chat:{
				let t:CustomerMsgDefine.tChatNT = data
				kcore.log.info("Chat:",t)
				let cache = this.data_.find(v=>v.chat && v.chat.msgID == t.chat.msgID)
				if(cache) {
					cache.chat = t.chat
					let idx = this.data_.indexOf(cache)
					let node = this.list.content.children[idx]
					let com = node.getComponent(CustomerItemWidget)
					com.setChat(t.chat)
					return 
				}
				this.addChat(t.chat)
			} break 
			case CustomerMsgDefine.RoomChanged:{
				let t:CustomerMsgDefine.tRoomChangedNT = data
				if(t.fromUserID) {
					this.addLog("已为您转接至其他客服")
					this.room_.fromUserID = t.fromUserID
				}
				kcore.log.info("RoomChanged:",t)
			} break 
			case CustomerMsgDefine.SendChat:{
				let t:CustomerMsgDefine.tSendChatRes = data
				kcore.log.info("SendChat:",t)
			} break

		}
	}
	async handleConnected() {
		kcore.log.info("Tcp connected")
		this.tcp_.send(CustomerMsgDefine.Login,{
			ak: kcore.data.get("login/ak"),
		})

	}
	async handleConnectFailed() {
		kcore.log.info("Tcp connect failed")
		this.addLog("连接失败")
		this.scheduleOnce(()=>{
			this.startConnect(2)
		})
	}
	async handleClosed() {
		kcore.log.error("Tcp closed")
		this.addLog("连接已断开")
		this.scheduleOnce(()=>{
			this.startConnect(2)
		})
	}
	async handleError(errMsg:string) {
		kcore.log.error("Tcp error: ",errMsg)
		this.addLog("连接已断开")
		this.scheduleOnce(()=>{
			this.startConnect(2)
		})
	}

	onClickSend() {
		kcore.click.playAudio()
		let content = this.edit.string
		if(!content) {
			kcore.toast.push("请输入内容")
			return 
		}
		if(!this.ready_) {
			kcore.toast.push("连接未就绪")
			return 
		}
		if(content.length > 500) {
			kcore.toast.push("内容过长，限制500字以内")
			return 
		}
		this.tcp_.send(CustomerMsgDefine.SendChat,{
			roomID: this.room_.roomID,
			content: content,
			type: CustomerDefine.ChatType.Text,
		})
		this.edit.string = ""
	}

	async onClickSelectImage() {
		kcore.click.playAudio()
		if(!this.ready_) {
			kcore.toast.push("连接未就绪")
			return 
		}
		let info = await kcore.file.selectLocalFileBase64(this.node)
		if(!info) {
			return 
		}
		if(!this.isValid) {
			return 
		}
		this.tcp_.send(CustomerMsgDefine.SendChat,{
			roomID: this.room_.roomID,
			content: "." + info.ext,
			data: info.base64,
			type: CustomerDefine.ChatType.Image,
		})
	}
}