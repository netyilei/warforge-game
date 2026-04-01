import { ReqLogin } from '../../requests/ReqLogin'
import { Datar } from './Datar'
import { rcData } from './rcData'

export class Local {
	static get localKey(): string {
		return `${window.location.hostname}/cpp-game-1`
	}

	protected static data: LocalData = {
		loginReq: undefined,
	}

	public static setItem<T extends keyof LocalData>(
		key: T,
		value: LocalData[T]
	): void {
		this.data[key] = value
		let content: string = JSON.stringify(this.data)
		cc.sys.localStorage.setItem(this.localKey, content)
		rcData.set('local/data', this.data)
	}

	public static getItem<T extends keyof LocalData>(key: T): LocalData[T] {
		return this.data[key]
	}

	public static init() {
		// 从本地存储加载并解密数据
		let local = cc.sys.localStorage.getItem(this.localKey)
		if (local) {
			this.data = JSON.parse(local)
		}
		rcData.set('local/data', this.data)
	}
}
export type LocalData = {
	loginReq: any,
	clubID?:number
}
