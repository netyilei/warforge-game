
export type EventFunc = (...datas)=>any

type funcInfo = {
	func:EventFunc,
	enabled:boolean,
	thiz?:any,
}

type childInfo = {
	child:rcEventDispatcher,
	enabled:boolean,
}

class EventComponent extends cc.Component {
	private disps_:rcEventDispatcher[] = []
	addDisp(disp:rcEventDispatcher) {
		if(this.disps_.find((v)=>v == disp) == null) {
			this.disps_.push(disp)
		}
	}
	onDestroy() {
		for(let disp of this.disps_) {
			disp.removeFromParent()
		}
	}
}
export class rcEventDispatcher implements kcore.IEventDispatcher {
	static bind(node:cc.Node,name:string) {
		let disp:rcEventDispatcher = node[name]
		if(disp == null) {
			disp = new rcEventDispatcher
			disp.link(node)
			node[name] = disp
		}
		return disp 
	}

	private defaultThiz_:any
	constructor(defaultThiz?:any) {
		this.defaultThiz_ = defaultThiz
		// cc.director.getScheduler().scheduleUpdate(this,-1,false)
	}
	
	private funcs_ = new Map<string,funcInfo[]>()
	private childs_:childInfo[] = []
	private parent_:rcEventDispatcher
	get parent() {
		return this.parent_
	}

	link(node:cc.Node) {
		let self = this 
		kcore.nodeCycle.listenDestroy(node,function() {
			self.clear()
		})
	}

	listen(eventName:string,func:EventFunc,thiz?:any) {
		let infos = this.funcs_.get(eventName)
		if(infos == null) {
			infos = []
			this.funcs_.set(eventName,infos)
		}
		infos.push({
			func:func,
			enabled:true,
			thiz:thiz,
		})
		return this
	}

	removeEventFuncs(eventName:string) {
		let infos = this.funcs_.get(eventName)
		if(infos) {
			for(let info of infos) {
				info.enabled = false 
			}
			this.refresh()
		}
		return this
	}

	removeFunc(func:EventFunc) {
		let self = this 
		this.funcs_.forEach(function(infos,eventName) {
			for(let info of infos) {
				if(info.func == func) {
					info.enabled = false 
				}
			}
		})
		this.refresh()
		return this
	}

	addNode(node:cc.Node,dispName?:string,defaultThiz?:any) {
		dispName = dispName || "_default_child_disp_"
		let disp:rcEventDispatcher = node[dispName]
		if(disp) {
			return disp
		}
		
		disp = new rcEventDispatcher(defaultThiz)
		this.addChild(disp)
		node[dispName] = disp

		disp.link(node)
		// let eventNodeName = "_kd_event_node_"
		// let eventNode = node.getChildByName(eventNodeName)
		// let com:EventComponent = null
		// if(eventNode == null) {
		// 	eventNode = new cc.Node(eventNodeName)
		// 	com = eventNode.addComponent(EventComponent)
		// 	node.addChild(eventNode)
		// } else {
		// 	com = eventNode.getComponent(EventComponent)
		// }
		// com.addDisp(disp)
		return disp 
	}

	getDisp(node:cc.Node,dispName?:string) {
		dispName = dispName || "_default_child_disp_"
		let disp:rcEventDispatcher = node[dispName]
		return disp
	}

	addChild(disp:rcEventDispatcher) {
		if(disp.parent_ != null) {
			return null
		}
		let childInfo = this.childs_.find((v)=>v.child == disp)
		if(childInfo == null) {
			childInfo = {
				child:disp,
				enabled:true 
			}
			this.childs_.push(childInfo)
		} 
		childInfo.enabled = true 

		disp.parent_ = this 
		return this
	}

	removeChild(disp:rcEventDispatcher) {
		let info = this.childs_.find((v)=>v.child == disp)
		if(info) {
			info.enabled = false
			info.child.parent_ = null
			this.refresh()
		}
		return this
	}

	removeAllChildren() {
		for(let child of this.childs_) {
			child.enabled = false 
		}
		this.refresh()
		return this
	}

	removeFromParent() {
		if(this.parent_) {
			this.parent_.removeChild(this)
		}
		return this
	}

	removeAll() {
		for(let child of this.childs_) {
			child.enabled = false 
		}
		this.funcs_.forEach(function(infos,eventName) {
			for(let info of infos) {
				info.enabled = false 
			}
		})
		this.refresh()
		return this
	}

	clear() {
		this.removeFromParent()
		this.removeAll()
	}

	private cacheEvents_:{
		eventName:string,
		datas:any[],
	}[] = []
	private isDispatching_ = false 
	dispatch(eventName:string,...datas) {
		if(this.isDispatching_) {
			this.cacheEvents_.push({
				eventName,datas,
			})
			return 
		}
		this.isDispatching_ = true 
		let tempChilds = this.childs_.slice()
		for(let info of tempChilds) {
			if(info.enabled) {
				//EventDispatcher.prototype.dispatch.apply(child.child,datas)
				info.child.dispatch(eventName,...datas)
			}
		}
		let self = this 
		let infos = this.funcs_.get(eventName)
		if(infos) {
			let tempInfos = infos.slice()
			for(let info of tempInfos) {
				if(info.enabled) {
					try {
						//info.func.apply(null,datas)
						let thiz = info.thiz || this.defaultThiz_
						if(thiz) {
							info.func.apply(thiz,datas)
						} else {
							info.func(...datas)
						}
					} catch (error) {
						kcore.log.error(error)
					}
				}
			}
		}
		this.isDispatching_ = false 
		this.refresh()
		this.clearCache()
		return this
	}

	private isDirty_ = false 
	private refresh() {
		if(this.isDispatching_) {
			this.isDirty_ = true 
			return 
		}
		if(this.isDirty_ == false) {
			return 
		}
		this.isDirty_ = false 

		let len = 0
		len = this.childs_.length
		let count = 0
		for(let i = len - 1 ; i >= 0 ; i --) {
			let child = this.childs_[i]
			if(child.enabled == false) {
				this.childs_.splice(i,1)
				count ++ 
			}
		}

		let self = this 
		this.funcs_.forEach(function(infos,eventName) {
			let len = infos.length
			for(let i = len - 1 ; i >= 0 ; i --) {
				let info = infos[i]
				if(info.enabled == false) {
					infos.splice(i,1)
				}
			}
		})
	}

	private clearCache() {
		if(this.cacheEvents_.length <= 0) {
			return 
		}
		let info = this.cacheEvents_.splice(0,1)
		this.dispatch(info[0].eventName,...info[0].datas)
	}
}