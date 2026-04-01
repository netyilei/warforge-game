
let commonDate = "t_common_date"
let commonFirst = "t_common_first"
class _Internal_rcStorage implements kcore.IStorage {
	getValue(key:string) {
		let ret = cc.sys.localStorage.getItem(key)
		if(ret) {
			try {
				return JSON.parse(ret)
			} catch (error) {
				kcore.log.error(error)
			}
			return null 
		}
		return null 
	}

	setValue(key:string,obj:any) {
		cc.sys.localStorage.setItem(key,JSON.stringify(obj))
	}

	clearValue(key:string) {
		cc.sys.localStorage.removeItem(key)
	}

	/**
	 * 查询首次记录
	 * @param name 
	 * @param use 标记为使用
	 * @returns true 首次无记录
	 */
	checkFirst(name:string,use?:boolean) {
		let t = this.getValue(commonFirst) || {}
		let ret = t[name] == null
		if(use) {
			this.useFirst(name)
		}
		return ret 
	}

	useFirst(name:string) {
		let t = this.getValue(commonFirst) || {}
		t[name] = true 
		this.setValue(commonFirst,t)
	}

	clearFirst(name:string) {
		let t = this.getValue(commonFirst) || {}
		t[name] = null 
		this.setValue(commonFirst,t)
	}
}

export const rcStorage = new _Internal_rcStorage