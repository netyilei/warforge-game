import { Log } from "../../log"


export class BaseTreeNode<DataType = any,ActionDataType = any> {
	constructor(name:string) {
		this.name_ = name 
	}

	private name_:string = null
	get name() {
		return this.name_
	}
	set name(v) {
		this.name_ = v
	}

	private parent_:BaseTreeNode = null
	get parent() {
		return this.parent_
	}
	set parent(v) {
		this.parent_ = v
	}

	private data_:DataType = null
	get data() {
		return this.data_
	}
	set data(v) {
		this.data_ = v
	}
	private childs_:BaseTreeNode[] = []

	/**
	 * 
	 * @param name 
	 * @param clazz 
	 * @returns child
	 */
	addChild<T extends BaseTreeNode>(name:string,clazz:{new(name:string):T}) {
		let entity = new clazz(name)
		entity.parent = this 
		entity.data = this.data
		entity.init()
		this.childs_.push(entity)
		return entity
	}

	getChild(name:string) {
		return this.childs_.find(v=>v.name == name)
	}

	log(msg:string,...params) {
		let ctor = (<any>this).constructor.name
		Log.oth.info("[ctor="+ctor+"]"+"[tree="+this.name+"] " + msg,...params)
	}
	static log(msg:string,...params) {
		Log.oth.info("[tree-static] " + msg,...params)
	}
	private init() {
		this.log("init")
		this.onInit()
	}
	decide(params?:ActionDataType) {
		let b = this.onDecide(params)
		if(b) {
			this.log("decide = true")
		} else {
			this.log("decide = false")
		}
		return b 
	}

	action(params?:ActionDataType) {
		if(this.onAction(params)) {
			this.log("action = true")
			return true 
		}
		this.log("action = false")
		for(let child of this.childs_) {
			if(child.decide(params)) {
				if(child.action(params)) {
					return true 
				}
			}
		}
		return false 
	}

	// virtual functions
	onInit() {

	}
	onAction(params:ActionDataType) {
		return false 
	}
	onDecide(params:ActionDataType) {
		return true 
	}
}