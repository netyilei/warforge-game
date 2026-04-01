
let cache: any = {}
let datadisp:kcore.IEventDispatcher
function getDataDisp() {
	datadisp = datadisp || kcore.disp()
	return datadisp
}

function tostring(v) {
	return v.toString()
}

function tonumber(v) {
	return Number.parseInt(v)
}

function isnumber(v) {
	return !Number.isNaN(tonumber(v))
}

class _Internal_rcData_ implements kcore.IData {
	get(path:string, dv?:any) {
		if (path == null) { return null }
		let paths = path.split("/")
		let cur = cache

		let prev
		let len = paths.length
		let name = null
		for(let i = 0 ; i < len ; i ++) {
			name = paths[i]
			if (typeof (cur) != "object") {
				//kcore.log.info("[kd-data] get data failed by path = "+path+ " | before ["+name+ "] is not table")
				return null
			}
			let isArr = false 
			if (isnumber(name)) {
				name = tonumber(name)

				isArr = true 
			}

			prev = cur
			cur = cur[name]
			if (cur == null && i < len - 1 && len > 1) {
				if(isArr) {
					cur = []
				} else {
					cur = {}
				}
				prev[name] = cur
			}
		}
		if (cur == null) {
			prev[name] = dv
			cur = dv
		}
		if(cur != null && typeof(cur) == "object") {
			cur["__path__"] = path 
		}
		return cur 
	}

	private loopDisp(path:string, t) {
		////kcore.log.info("[kd-data] handle dirty path = " + path)
		if (typeof (t) == "object") {
			let keys = Object.keys(t)
			for (let i of keys) {
				let v = t[i]
				
				let p = path+ "."+tostring(i) 
				this.loopDisp(p, v)
			}
		}
	} 

	set<T>(path:string, v:T, ignoreEvent?:boolean):T {
		if (path == null) { return null }
		let paths = path.split("/")
		let cur = cache
		let prev
		for(let i = 0 ; i < paths.length - 1 ; i ++) {
			let name:any = paths[i]
			if (typeof (cur) != "object") {
				//kcore.log.info("[kd-data] set data failed by path = "+path+ " | "+name+ " is not table")
				return null
			}
			if (isnumber(name)) {
				name = tonumber(name)
			}
			prev = cur
			cur = cur[name]
			if (cur == null) {
				cur = {}
				prev[name] = cur
			}
		}
		let last = paths[paths.length - 1]
		if (typeof (cur) != "object") {
			//kcore.log.info("[kd-data] set data failed by path = "+path+ " | "+last+ " is not a table")
			return null
		}
		cur[last] = v
		if(!ignoreEvent) {
			getDataDisp().dispatch(path, v)
		}
		//loopDisp(path,v)
	}

	change(input:string | any, dv?:any) {
		let path = ""
		if(typeof(input) == "string") {
			path = input
		} else {
			if(typeof(input) != "object") {
				return false 
			}
			path = input["__path__"]
		}
		let value = this.get(path, dv)
		getDataDisp().dispatch(path, value)
		return true 
	}

	clear() {
		//kcore.log.info("[kd-data] clear data")
		cache = {}
	}

	listen(path, node, func) {
		getDataDisp().addNode(node,"__datadisp").listen(path,func)
	}

	unlisten(path, node) {
		let disp = getDataDisp().getDisp(node,"__datadisp")
		if(disp) {
			disp.removeEventFuncs(path)
		}
	}
	unlistenall(node) {
		let disp = getDataDisp().getDisp(node,"__datadisp")
		if(disp) {
			disp.removeAll()
		}
	}
	// another format:
	// path,node,func
	listenget(path, dv, node, func) {
		if (func == null) {
			func = node
			node = dv
			dv = null
		}
		getDataDisp().addNode(node,"__datadisp").listen(path,func)
		let value = this.get(path, dv)
		func(value)
	}

	// if(not exist , get 
	listencallget(path, node, func, getfunc) {
		getDataDisp().addNode(node,"__datadisp").listen(path,func)
		let value = this.get(path, null)
		if (value == null) {
			getfunc()
		} else {
			func(value)
		}
	}

	getDisp() {
		return getDataDisp()
	}

	dump() {
		//kcore.log.info("",cache)
	} 

}

export const rcData = new _Internal_rcData_
