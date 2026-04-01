// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { ListView } from "../../core/ui/ListView";
import UIRightAction from "../../core/ui/UIRightAction";
import { ReqGame } from "../../requests/ReqGame";
import { TexasDefine } from "./TexasDefine";
import TexasGameLayer from "./TexasGameLayer";
import TexasGameRecordItem from "./TexasGameRecordItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TexasGameRecordListLayer extends UIRightAction {

	@property({ type: cc.ScrollView })
	scrollView: cc.ScrollView = null
	@property({ type: cc.Node })
	item: cc.Node = null

	@property({ type: cc.Label })
	roomLbl: cc.Label = null
	@property({ type: cc.Label })
	dateLbl: cc.Label = null
	@property({ type: cc.Slider })
	slider: cc.Slider

	@property({ type: cc.Label })
	pageLabel: cc.Label = null

	private gameLayer_: TexasGameLayer
	onPush(gameLayer: TexasGameLayer): void {
		this.gameLayer_ = gameLayer
		this.item.active = false 
		this.listEx_ = kcore.ListViewEx.create(this.scrollView, ()=>{
			let node = kcore.display.instantiate(this.item)
			node.active = true
			return node
		},(idx,node,forClean)=>{
			if(forClean) {
				return false 
			}
			let user = this.data?.users[idx]
			if(!user) {
				return false 
			}
			let com = node.getComponent(TexasGameRecordItem)
			com.set(this.gameLayer_, user, this.data)
			return true
		})
		this.getData()
	}


	private listEx_:kcore.ListViewEx
	protected _page: number = 0
	get page(): number {
		return this._page;
	}
	set page(value: number) {
		this._page = value;
	}
	protected limit: number = 1

	protected data: TexasDefine.tGameStepRecordData = null
	protected _count: number = 0
	get count(): number {
		return this._count;
	}
	set count(value: number) {
		this._count = value;
	}

	setupPageLabel() {
		this.pageLabel.string = `${this.count - (this.page)}/${this.count}`
	}
	// 数据请求示例，可以传page limit
	async getData() {
		this.slider.progress = this.page / this.count
		let res: ReqGame.tGetGameStepRecordRes = await ReqGame.getGameStepRecord({ roomID: this.gameLayer_.roomID, page: this.page, limit: this.limit })
		if (res == null || res.errMsg) {
			kcore.tip.push("提示", res ? res.errMsg : "请求失败")
			return
		}
		console.log(res)
		this.count = res.count
		this.data = res.datas.map(v => v.data)[0]
		if (!this.data) {
			kcore.toast.push("暂无数据")
			this.popSelf()
			return;
		}
		this.roomLbl.string = `房间ID:${res.datas[0].roomID}`
		this.dateLbl.string = `时间:${res.datas[0].date}`

		this.listEx_.itemCount = this.data.users.length

		// let stepDatas: TexasDefine.tGameStepRecordData[] = res.datas.map(v => v.data)
	}


	//下一页
	async onClickNext() {
		kcore.click.playAudio()
		if (this.page + 1 < this.count) {
			this.page = this.page + 1
			await this.getData()
		}

	}
	//上一页
	async onClickPrev() {
		kcore.click.playAudio()
		if (this.page > 0) {
			this.page = this.page - 1
			await this.getData()
		}
	}
	//最后一页
	async onClickEnd() {
		kcore.click.playAudio()
		if (this.page < this.count) {
			this.page = this.count - 1
			await this.getData()
		}
	}
	//第一页
	async onClickStart() {
		kcore.click.playAudio()
		if (this.page > 0) {
			this.page = 0
			await this.getData()
		}
	}

	async onSlider(slider: cc.Slider) {
		let value = Math.round(slider.progress * this.count)
		if (value < 0) {
			value = 0
		}
		if (value > this.count) {
			value = this.count
		}
		if (this.page == value) {
			return
		}
		this.page = value
		await this.getData()
	}

}
