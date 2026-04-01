import { kdasync } from "kdweb-core/lib/tools/async"
import { kdutils } from "kdweb-core/lib/utils"
import { Log } from "../log"


let useTimeout = 30000


let queues = new Map<string,kdasync.queue>()
function getQueue(name:string) {
	if(queues.has(name)) {
		return queues.get(name)
	}
	let q = new kdasync.queue()
	queues.set(name,q)
	return q
}

let waitQueues = new Map<string,kdasync.queue>()
function getWaitQueue(name:string) {
	if(waitQueues.has(name)) {
		return waitQueues.get(name)
	}
	let q = new kdasync.queue()
	waitQueues.set(name,q)
	return q
}

let waits = new Map<string,kdasync.wait>()
function createWait(name:string) {
	let prevWait = waits.get(name)
	if(prevWait) {
		prevWait.resolve(false)
	}
	let wait = new kdasync.wait()
	waits.set(name,wait)
	return wait
}

// 排队等待入队
async function waitMutex(h:string,name:string,waitTimeout:number,tag?:string) {
	let lockName = "|name=" + name + "|tag=" + tag
	return new Promise<boolean>(function(resolve,reject) {
		let q = getWaitQueue(name)
		let rt:{
			valid:boolean,
			arrive:boolean,
			wait:kdasync.wait,
		} = {
			valid:true,

			arrive:false,
			// 正在占用队列资源
			wait:null,
		}
		// Log.oth.info("[wait] start to q name = " + lockName)
		let giveup = q.call(async function() {
			// Log.oth.info("[q] begin " + lockName)
			rt.arrive = true 
			if(rt.valid) {
				// Log.oth.info("[wait] start to mutex name = " + lockName)
				// 开始占用queue
				let wait = createWait(name)
				rt.wait = wait 
				wait["__h"] = h 
				wait["__name"] = name 
				wait["__tag"] = tag
				resolve(true)
				// 等待release
				let b = await wait.promise
				// release或者timeout
				rt.wait = null 
				if(waits.get(name) == wait) {
					waits.delete(name)
				}
				// Log.oth.info("[wait] end mutex name = " + lockName + " | b = " + b)
			} else {
				// Log.oth.info("[wait] abandon mutex name = " + lockName)
			}
			// Log.oth.info("[q] end " + lockName)
		})
		setTimeout(function() {
			if(rt.arrive) {
				// Log.oth.info("[wait] timeout name = " + lockName)
				// 占用quene资源超时
				if(rt.wait) {
					// Log.oth.info("[wait] release wait name = " + lockName)
					rt.wait.resolve(false)
				}
				return 
			}
			// Log.oth.info("[wait] queue timeout name = " + lockName)
			// queue排队超时
			rt.valid = false 
			giveup()
			resolve(false)
		},waitTimeout)
	})
}
/**
 * 
 * @param h 
 * @param name 资源名字
 * @param waitTimeout 超时，默认10秒
 */
async function getMutex(h:string,name:string,waitTimeout:number,tag?:string) {
	Log.oth.info("getMutex tag = " + tag)
	if(waitTimeout == null) {
		waitTimeout = -1
	}
	if(!kdutils.isValid(name,"string") || !kdutils.isValid(waitTimeout,"number")) {
		Log.oth.info("params invalid h = " + h + " | name = " + name + " | timeout = " + waitTimeout)
		return false 
	}
	if(waitTimeout < 0) {
		waitTimeout = 8000
	}
	let b = await waitMutex(h,name,waitTimeout,tag)
	if(!b) {
		Log.oth.info("wait mutex failed h = " + h + " | name = " + name)
		// let idx = mutexEntities.findIndex((v)=>v == entity)
		// mutexEntities.splice(idx,1)
		return false 
	}
	Log.oth.info("get mutex success h = " + h + " | name = " + name)
	return true 
}

async function releaseMutex(h:string,name:string,tag?:string) {
	Log.oth.info("releaseMutex tag = " + tag)
	let wait = waits.get(name)
	if(!wait) {
		Log.oth.info("cur mutex is released h = " + h + " | name = " + name + " | tag = " + tag)
		return false 
	}
	if(wait["__h"] != h || wait["__name"] != name || wait["__tag"] != tag) {
		Log.oth.info("cannot get mutex h = " + h + " | name = " + name + " | tag = " + tag)
		return false 
	}
	wait.resolve(true)
	if(waits.get(name) == wait) {
		waits.delete(name)
	}
	return true  
}

export let RpcMutex = {
	get: getMutex,
	release: releaseMutex,
}