
const {ccclass, property, requireComponent} = cc._decorator;

type LogicInfo = {
	clazz:any,
	com:kcore.LogicBase,
	enabled:boolean,
}

function handleStart(info:LogicInfo,params:any[]) {
	info.enabled = true 
	info.com.onLogicStart(...params)

}

function handleStop(info:LogicInfo) {
	if(info.com == null) {
		return 
	}
	kcore.log.info("[logic-center] stop logic " + info.clazz)
	kcore.gnet(info.com.node).clear()
	
	info.com.onLogicStop()
	info.enabled = false 

	info.com.node.destroy()
	info.com = null
}

@ccclass
export default class LogicCenter extends cc.Component implements kcore.ILogicCenter {
	static instance:LogicCenter = null
	protected onLoad() {
		LogicCenter.instance = this 
		if(window["kcore"]) {
			kcore.logic = this
			this.blocker_ = kcore.block.create()
		}
	}

	protected start() {

	}
	
	private contentDirty_ : boolean = false ;
	public get contentDirty() : boolean {
		return this.contentDirty_;
	}
	public set contentDirty(v : boolean) {
		this.contentDirty_ = v;
	}
	
	private logics_:LogicInfo[] = []
	private cacheUpdateLogics_:LogicInfo[] = []
	private blocker_:kcore.IBlocker
	protected update(dt:number) {
		if(this.logics_.length > 0) {
			for(let info of this.logics_) {
				this.cacheUpdateLogics_.push(info)
			}
			for(let info of this.cacheUpdateLogics_) {
				if(info.enabled) {
					info.com.onLogicUpdate(dt)	
				}
			}
			this.cacheUpdateLogics_.splice(0)
		}
		let len = this.logics_.length
		let content:string = null
		for(let i = len - 1 ; i >= 0 ; i --) {
			let info = this.logics_[i]
			if(info.enabled == false) {
				this.logics_.splice(i,1)
			} else {
				if(content == null && info.com.isBlockVisible()) {
					content = info.com.onLogicBlock()
				}
			}
		}
		if(this.contentDirty_) {
			this.contentDirty_ = false 
			if(content != null) {
				this.blocker_.setContent(content)
				if(this.blocker_.isStart() == false) {
					this.blocker_.start()
				}
			} else {
				this.blocker_.stop()
			}
		}
	}

	startLogic<T extends kcore.LogicBase>(clazz: {new():T},...params): T {
		let info:LogicInfo = {
			com:null,
			clazz:clazz,
			enabled:true,
		}
		let node = new cc.Node()
		this.node.addChild(node)
		let com = node.addComponent(clazz)
		info.com = com
		node.name = com.constructor.name
		this.logics_.push(info)
		handleStart(info,params)
		this.contentDirty = true 
		return <T>info.com 
	}

	stopLogic(logic:kcore.LogicBase) {
		let info = this.logics_.find((v)=>v.com == logic)
		if(info == null || info.enabled == false ) {
			return false 
		}
		handleStop(info)
		this.contentDirty = true 
		return true 
	}

	stopAll<T extends kcore.LogicBase>(clazz?: {new():T}) {
		if(clazz) {
			for(let info of this.logics_) {
				if(info.clazz == clazz) {
					if(info.enabled) {
						handleStop(info)
					}
				}
			}
		} else {
			for(let info of this.logics_) {
				if(info.enabled) {
					handleStop(info)
				}
			}
			this.node.destroyAllChildren()
		}
		this.contentDirty = true 
	}

	stopBut<T extends kcore.LogicBase>(clazz: {new():T}) {
		for(let info of this.logics_) {
			if(info.clazz == clazz) {
				continue
			}
			if(info.enabled) {
				handleStop(info)
			}
		}
		this.contentDirty = true 
	}

	isLogicRunning(logic:kcore.LogicBase) {
		let info = this.logics_.find((v)=>v.com == logic)
		if(info == null || info.enabled == false ) {
			return false 
		}
		return true 
	}

	isLogicClassRunning<T extends kcore.LogicBase>(clazz: {new():T}) {
		let info = this.logics_.find((v)=>v.clazz == clazz)
		if(info == null || info.enabled == false ) {
			return false 
		}
		return true 
	}

	getLogic<T extends kcore.LogicBase>(clazz?: {new():T}):T {
		for(let info of this.logics_) {
			if(info.clazz == clazz) {
				if(info.enabled) {
					return <T>info.com
				}
			}
		}
		return null
	}

	getCount(clazz: {prototype: kcore.LogicBase},...params): number {
		let ret = 0
		for(let info of this.logics_) {
			if(info.clazz == clazz) {
				if(info.enabled) {
					ret ++
				}
			}
		}
		return ret 
	}
}
