import BagUtils from './BagUtils'
import { Datar } from './Datar'
import ItemUtils from './ItemUtils'

const { ccclass, property } = cc._decorator

@ccclass
export default class ItemLoader extends cc.Component {
	@property({ type: cc.Sprite })
	iconSpr: cc.Sprite = null
	@property({ type: cc.Label })
	nameLbl: cc.Label = null
	@property({ type: cc.Label })
	countLbl: cc.Label = null

	@property()
	itemID: string = ''

	private isCustom: boolean = false
	protected onLoad(): void {
		if (this.itemID && !this.isCustom) {
			this.setItem(this.itemID)
		}
	}

	protected itemIDCache: string = null
	public setItem(itemID: string, count?: number) {
		this.isCustom = true;
		this.itemIDCache = itemID
		this.setIconSpr()
		this.setItemNameLbl()

		if (!this.countLbl) return
		if (!this.itemIDCache) return


		if (count == undefined) {
			Datar.listenget('user/items', null, this.node, () => {
				this.countLbl.string = `${BagUtils.getCount(this.itemIDCache)}`
			})
		} else {
			this.countLbl.string = `${count}`
		}

	}

	protected async setIconSpr() {
		if (!this.iconSpr) return
		if (!this.itemIDCache) return
		let spf = await ItemUtils.getSpriteFrame(this.itemIDCache)
		this.iconSpr.setImage(spf)
	}

	protected async setItemNameLbl() {
		if (!this.nameLbl) return
		if (!this.itemIDCache) return
		let name: string = await ItemUtils.getName(this.itemIDCache);
		this.nameLbl.string = name;
	}

	protected setItemCountLbl() {
		if (!this.countLbl) return
		if (!this.itemIDCache) return
		let count: string = BagUtils.getCount(this.itemIDCache)
		this.countLbl.string = `${count}`
	}
}
