
export namespace Web {
	export let headUrl:string = ""

	export let defaultErrorFunc:Function = null
	export type CallbackFunc = (data:any)=>void
	type CacheHttpInfo = {
		path:string,
		func:CallbackFunc,
	}
	let cacheInfos = new Array<CacheHttpInfo>()
	export function stopAll() {
		cacheInfos.splice(0)
	}

	export function stopPath(path:string) {
		let count = cacheInfos.length;
		for(let i = count - 1; i >= 0 ; i --) {
			let info = cacheInfos[i]
			if(info.path == path) {
				cacheInfos.splice(i,1)
			}
		}
	}

	export function isWorking(path:string) {
		let info = cacheInfos.find((value,index,arr)=>value.path == path)
		return info != null
	}


	function stop(info:CacheHttpInfo):boolean {
		let idx = cacheInfos.findIndex((value,index,arr)=>value == info)
		if(idx < 0) {
			return false 
		}
		cacheInfos.splice(idx,1)
		return true 
	}
	export function post(path:string,data:any,func:CallbackFunc,ignoreBlock?:boolean) {
		data = data || {}
		let url = headUrl
		if(url.charAt(url.length - 1) != "/") {
			url += "/"
		}
		url += path 
		return postUrl(url,data,function(t) {
			if(t == null) {
				kcore.tip.push("錯誤","請求失敗",1,function() {
					if(defaultErrorFunc) {
						defaultErrorFunc()
					} else {
						func(null)
					}
				})
				return 
			}
			// if(t.errCode) {
			// 	TipFunc.push("错误",t.errMsg || "未知的网络错误")
			// 	t = null
			// }
			func(t)
		},ignoreBlock)
	}

	export async function postAsync(path:string,data:any) {
		return new Promise<any>(function(resolve,reject) {
			post(path,data,function(data) {
				resolve(data)
			})
		})
	}

	export function postUrl(url:string,data:any,func:CallbackFunc,ignoreBlock?:boolean) {
		let blocker = kcore.block.create("正在请求")
		if(!ignoreBlock) {
			blocker.start()
		}
		kcore.log.info("[Web] post url = " + url)
		let info:CacheHttpInfo = {
			path:"noname",
			func:func,
		}
		cacheInfos.push(info)
		let http = cc.loader.getXMLHttpRequest()
		http.onload = function() {
			blocker.stop()
			if(stop(info) == false) {
				return 
			}
			//stop(info)
			if(http.status == 200) {
				let data = http.responseText
				kcore.log.info("[Web] received text = " + data + " | url = " + url)
				let t = JSON.parse(data)
				func(t)
			} else {
				kcore.log.info("[Web] received text = undefined error | url = " + url)
				func(null)
			}
		}
		http.onerror = function(evt) {
			//rcLog(evt)
			kcore.log.info("[Web] post failed url = " + url)
			blocker.stop()
			if(stop(info)) {
				func(null)
			}
		}
		http.onreadystatechange = function(evt) {
			if(http.readyState == 4) {
				blocker.stop()
			}
		}
		http.ontimeout = function(evt) {
			kcore.log.info("[Web] post timeout url = " + url)
			blocker.stop()
			if(stop(info)) {
				func(null)
			}
		}
		http.open("POST",url,true)
		http.timeout = 10000
		if(data == null) {
			http.send()
		} else {
			http.setRequestHeader("Content-Type","application/json")
			let str = JSON.stringify(data)
			http.send(str)
			kcore.log.info("[Web] log data = " + str)
		}
	}
	export async function postUrlAsync(url:string,data:any,ignoreBlock?:boolean) {
		return new Promise<any>(function(resolve,reject) {
			postUrl(url,data,function(data) {
				resolve(data)
			},ignoreBlock)
		})
	}

	export function getUrl(url:string,func:CallbackFunc,path?:string) {
		let blocker = kcore.block.create("正在獲取")
		blocker.start()
		kcore.log.info("[Web] get url = " + url)
		let info:CacheHttpInfo = {
			path:path || "noname",
			func:func,
		}
		cacheInfos.push(info)
		let http = new XMLHttpRequest()
		http.onreadystatechange = function() {
			if(http.readyState == 4) {
				blocker.stop()
				if(stop(info) == false) {
					return 
				}
				if(http.status == 200) {
					let data = http.responseText
					kcore.log.info("[Web] received text = " + data + " | url = " + url)
					func(data)
				} else {
					kcore.log.info("[Web] response error url = " + url)
					func(null)
				}
			}
		}
		http.onerror = function(evt) {
			//rcLog(evt)
			kcore.log.info("[Web] get failed url = " + url)
			blocker.stop()
			if(stop(info)) {
				func(null)
			}
		}
		http.ontimeout = function(evt) {
			kcore.log.info("[Web] get timeout url = " + url)
			blocker.stop()
			if(stop(info)) {
				func(null)
			}
		}
		http.open("GET",url,true)
		http.timeout = 10000
		http.send()
	}

	export async function getUrlAsync(url:string,path?:string) {
		return new Promise<any>(function(resolve,reject) {
			getUrl(url,function(data) {
				resolve(data)
			},path)
		})
	}

	async function timeout(ms) {
		await new Promise<void>(function(resolve,reject) {
			setTimeout(function() {
				resolve()
			},ms)
		})	
	}
	
	export async function getUrlOptionAsync(url:string,opt?:{
		maxCount:number,
		interval:number,
		json?:boolean
	}) {
		opt = opt || {
			maxCount:1,
			interval:1000,
			json:false,
		}
		let count = 0
		let data = null
		while(true) {
			data = await getUrlAsync(url)
			if(data) {
				break 
			} else {
				count ++
				if(count >= opt.maxCount) {
					break 
				}
			}
			await timeout(opt.interval)
			continue
		}
		if(data) {
			if(opt.json) {
				let t = null
				try {
					t = JSON.parse(data)
				} catch (error) {
					kcore.log.info("[web] parse json failed url = " + url)
				}
				return t 
			}
			return data 
		}
		return null 
	}
}