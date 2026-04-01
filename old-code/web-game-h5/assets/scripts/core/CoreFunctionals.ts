
export namespace CoreFunctionals {
	export function req<ReqType = any, ResType = any>(path: string, blockContent?: string):
		(jsonObj: ReqType) => Promise<ResType> {
		let t = {
			func:null
		}
		return async (jsonObj: ReqType)=>{
			if(!t.func) {
				t.func = kcore.SHAKFuncs.req(path,blockContent)
			}
			return await t.func(jsonObj)
		}
	}

	export function reqAK<ReqType = any, ResType = any>(path: string, blockContent?: string):
		(jsonObj: ReqType) => Promise<ResType> {
		let t = {
			func:null
		}
		return async (jsonObj: ReqType)=>{
			if(!t.func) {
				t.func = kcore.SHAKFuncs.reqAK(path,blockContent)
			}
			return await t.func(jsonObj)
		}
	}
	export function reqCustomer<ReqType = any, ResType = any>(path: string, blockContent?: string):
		(jsonObj: ReqType) => Promise<ResType> {
		let t = {
			func:null
		}
		return async (jsonObj: ReqType)=>{
			if(!t.func) {
				t.func = kcore.SHAKFuncs.reqCustomer(path,blockContent)
			}
			return await t.func(jsonObj)
		}
	}
}

