

function findNodeDeep(root:cc.Node,name:string) {
	for(let node of root.children) {
		if(node.name == name) {
			return node 
		}
		let ret = findNodeDeep(node,name)
		if(ret) {
			return ret 
		}
	}
	return null
}

export namespace NodeUtils {
	export function init() {
		cc.Node.prototype.child = function(name:string) {
			this.childCache_ = this.childCache_ || {}
			let node:cc.Node = this.childCache_[name]
			if(node == null) {
				node = findNodeDeep(this,name)
				if(node) {
					this.childCache_[name] = node 
				}
			}
			return node 
		}
		
		cc.Node.prototype.childCom = function<T extends cc.Component>(name,comType: {prototype: T}):T {
			let node = this.child(name)
			if(node) {
				return node.getComponent(comType)
			}
			return null
		}
		
		Object.defineProperty(cc.Node.prototype, "position2", {
			get: function () {
				let pos = this.position
				return cc.v2(pos.x,pos.y)
			},
			set: function (v) {
				this.position = cc.v3(v.x,v.y)
			},
			enumerable: false,
			configurable: true
		});

		cc.Component.prototype.child = function(name:string) {
			this.childCache_ = this.childCache_ || {}
			let node:cc.Node = this.childCache_[name]
			if(node == null) {
				node = findNodeDeep(this.node,name)
				if(node) {
					this.childCache_[name] = node 
				}
			}
			return node 
		}

		cc.Component.prototype.childCom = function<T extends cc.Component>(name,comType: {prototype: T}):T {
			let node = this.child(name)
			if(node) {
				return node.getComponent(comType)
			}
			return null
		}
		
		Object.defineProperty(cc.Node.prototype, "position2", {
			get: function () {
				let pos = this.position
				return cc.v2(pos.x,pos.y)
			},
			set: function (v) {
				this.position = cc.v3(v.x,v.y)
			},
			enumerable: false,
			configurable: true
		});

	}
}