import { LogicBase } from "./LogicBase";
import LogicCenter from "./LogicCenter";

export namespace rcLogic {
	export function start<T extends LogicBase>(clazz: {new():T},...params): T {
		return LogicCenter.instance.startLogic(clazz,...params)
	}

	export function startMutex<T extends LogicBase>(clazz: {new():T},...params): T {
		let instance = LogicCenter.instance
		let ret = instance.getLogic(clazz)
		if(ret != null) {
			return ret 
		}
		return instance.startLogic(clazz,...params)
	}
	
	export function restart<T extends LogicBase>(clazz: {new():T},...params): T {
		let instance = LogicCenter.instance
		instance.stopAll(clazz)
		return instance.startLogic(clazz,...params)
	}

	export function stop(logic:LogicBase) {
		return LogicCenter.instance.stopLogic(logic)
	}

	export function stopAll<T extends LogicBase>(clazz?: {new():T}) {
		return LogicCenter.instance.stopAll(clazz)
	}

	export function stopBut<T extends LogicBase>(clazz: {new():T}) {
		return LogicCenter.instance.stopBut(clazz)
	}

	export function isRunning(logic:LogicBase) {
		return LogicCenter.instance.isLogicRunning(logic)
	}

	export function getLogic<T extends LogicBase>(clazz?: {new():T}):T {
		return LogicCenter.instance.getLogic(clazz)
	}

	export function getCount(clazz: {prototype: LogicBase},...params): number {
		return LogicCenter.instance.getCount(clazz,...params)
	}

	export function getInstance() {
		return LogicCenter.instance
	}
}