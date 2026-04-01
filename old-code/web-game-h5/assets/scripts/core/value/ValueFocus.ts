
const {ccclass, property, executeInEditMode, menu} = cc._decorator;

const ccValueFocusListenDefine = cc.Class({
	name:"ccValueFocusListenDefine",
	properties:{
		tag:{
			default:"noname",
		},
		com:{
			type:cc.Component,
			default:null,
		},
		valueName:{
			default:"valueName"
		}
	}
})
type ValueFocusListenDefine = {
	tag:string,
	com:cc.Component,
	valueName:string,
}

function getSubDict (obj, key) {
    return obj[key] || (obj[key] = {});
}
export function ValueFocusDecorator_FocusSetup<T extends cc.Component = cc.Component>(
	comType?:{new():T},
	valueName?:string,
) {
	if(!comType) {
		return property(ccValueFocusListenDefine)
	}
	return function(ctor,propertyName) {
		let focusRoot = getSubDict(ctor,"__kfocus_root__")
		focusRoot[propertyName] = {
			tag:propertyName,comType,valueName,
		}
		return property(ctor,propertyName)
	}
}
@ccclass
@menu("kcore/ValueFocus")
export default class ValueFocus extends cc.Component {
	@property([ccValueFocusListenDefine])
	defaultDefines:ValueFocusListenDefine[] = []

	protected onLoad(): void {
		this.disp_ = kcore.disp()

		let focusRoot = getSubDict(this.constructor,"__kfocus_root__")
		for(let key of Object.keys(focusRoot)) {
			let info = focusRoot[key]
			let com = this.getComponent(info.comType)
			if(!com) {
				kcore.log.error("value focus init failed name = " + this.node.name + " tag = " + info.tag)
				continue 
			}
			this.focuss_.push({
				tag:info.tag,
				comType:info.comType,
				com,
				valueName:info.valueName,
				selfSetup:true,
			})
		}
		for(let info of this.defaultDefines) {
			if(!info.com) {
				continue 
			}
			this.focuss_.push({
				tag:info.tag,
				comType:null,
				com:info.com,
				valueName:info.valueName
			})
		}
		
		let cache = getSubDict(this.constructor,"__ccclassCache__")
		let ccclassProto = getSubDict(cache, 'proto');
		let properties = getSubDict(ccclassProto, 'properties');
		for(let key of Object.keys(properties)) {
			if(properties[key] == ccValueFocusListenDefine) {
				let info:ValueFocusListenDefine = this[key]
				if(!info.com) {
					continue 
				}
				this.focuss_.push({
					tag:info.tag,
					comType:null,
					com:info.com,
					valueName:info.valueName
				})
			}
		}
		this.update(0)
	}

	private focuss_:{
		tag:string,
		comType:any,
		com:cc.Component,
		valueName:string,
		cache?:any
		selfSetup?:boolean,
	}[] = []
	get focuss() {
		return this.focuss_
	}

	private disp_:kcore.IEventDispatcher
	get disp() {
		return this.disp_
	}

	listen(node:cc.Node,tag:string,func:(value)=>any) {
		let disp = this.disp_.addNode(node,"__valuefocus__" + this.node.name)
		disp.listen(tag,func)
	}

	listenget(node:cc.Node,tag:string,func:(value)=>any) {
		let disp = this.disp_.addNode(node,"__valuefocus__" + this.node.name)
		let info = this.focuss_.find(v=>!tag || v.tag == tag)
		if(!tag && !info) {
			return 
		}
		disp.listen(info.tag,func)
		if(info) {
			func(info.cache)
		} else {
			func(null)
		}
	}

	protected update(dt: number): void {
		for(let focus of this.focuss_) {
			let value = focus.com[focus.valueName]
			focus.cache = value
			if(focus.selfSetup) {
				this[focus.tag] = value
			}
			this.disp.dispatch(focus.tag,value)
		}
	}
}
