import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { Log } from "../pp-rpc-center/log";

export namespace MutexFunctional {
	export function getMutexFunc<TRet>(mutexName:string,opt:{
		rpc:{center:knRpcManagerInterface.rpc}
		timeout?:number,
		continue?:boolean,
		mutexID?:number,
	}) {
		return async function(func:()=>Promise<TRet>):Promise<TRet> {
			if(opt.rpc == null) {
				return null 
			}
			let b:boolean = await opt.rpc.center.callException(
				opt.mutexID ? "kds.sys.mutex-" + opt.mutexID + ".get" : "kds.sys.mutex.get",
				mutexName,opt.timeout || 10000)
			if(!b) {
				Log.oth.error("[MutexFunctional] getMutexFunc: get mutex failed mutexName = " + mutexName)
				if(!opt.continue) {
					return null 
				}
			}
			let ret:TRet = null
			try {
				ret = await func()
			} catch (error) {
				Log.oth.error("[MutexFunctional] getMutexFunc: exception mutexName = " + mutexName + " error = ",error)
			}
			if(b) {
				opt.rpc.center.callException(
					opt.mutexID ? "kds.sys.mutex-" + opt.mutexID + ".release" : "kds.sys.mutex.release",mutexName
				)
			}
			return ret 
		}
	}

	export async function callInMutex<TRet>(mutexName:string,opt:{
		rpc?:{center:knRpcManagerInterface.rpc}
		rpcEntity?:knRpcManagerInterface.rpc
		timeout?:number,
		continue?:boolean,
		mutexID?:number,
		func:(...params)=>Promise<TRet>
	}) {
		if(opt.rpc == null && opt.rpcEntity == null) {
			return null 
		}
		let rpc = opt.rpc ? opt.rpc.center : opt.rpcEntity
		let b:boolean = await rpc.callException(
			opt.mutexID ? "kds.sys.mutex-" + opt.mutexID + ".get" : "kds.sys.mutex.get",
			mutexName,opt.timeout || 10000)
		if(!b) {
			Log.oth.error("[MutexFunctional] getMutexFunc: get mutex failed mutexName = " + mutexName)
			if(!opt.continue) {
				return null 
			}
		}
		let ret:TRet = null
		try {
			ret = await opt.func()
		} catch (error) {
			Log.oth.error("[MutexFunctional] getMutexFunc: exception mutexName = " + mutexName + " error = ",error)
		}
		if(b) {
			rpc.callException(
				opt.mutexID ? "kds.sys.mutex-" + opt.mutexID + ".release" : "kds.sys.mutex.release",mutexName
			)
		}
		return ret 
	}
}