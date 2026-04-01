import { Local } from '../../core/utils/Local'
import { rcData } from '../../core/utils/rcData'

export class TexasLocal {
	static get localKey(): string {
		return `${Local.localKey}/texas`
	}

	protected static data: TexasLocalData = {
		quickBetSettings: [
			{
				buttonCount: 3,
				betValues: [33, 67, 100]
			},
			{
				buttonCount: 4,
				betValues: [33, 50, 67, 100]
			},
			{
				buttonCount: 5,
				betValues: [33, 49, 66, 100, 120]
			}
		],
		quickBetSelect: 5,

		cardSkinName: "card1",
		cardBackSkinName: "back1",
		bgSkinName: "bg1",
	}

	public static setItem<T extends keyof TexasLocalData>(
		key: T,
		value: TexasLocalData[T]
	): void {
		this.data[key] = value
		let content: string = JSON.stringify(this.data)
		cc.sys.localStorage.setItem(this.localKey, content)
		rcData.set('texas/local/data', this.data)
	}

	public static getItem<T extends keyof TexasLocalData>(
		key: T
	): TexasLocalData[T] {
		return this.data[key]
	}

	public static init() {
		// 从本地存储加载并解密数据
		let local = cc.sys.localStorage.getItem(this.localKey)
		if (local) {
			this.data = JSON.parse(local)
		}
		rcData.set('texas/local/data', this.data)
	}
}
export type TexasLocalData = {
	quickBetSettings: {
		buttonCount: number
		betValues: number[]
	}[],
	quickBetSelect: number,
	cardSkinName: string,
	cardBackSkinName: string,
	bgSkinName: string,
}
