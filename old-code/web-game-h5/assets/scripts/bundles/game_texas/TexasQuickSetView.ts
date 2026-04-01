import { rcData } from '../../core/utils/rcData'
import { TexasLocal } from './TexasLocal'
import TQSBBItem from './TQSBBItem';
import TQSBCItem from './TQSBCItem';

const { ccclass, property } = cc._decorator

@ccclass
export default class TexasQuickSetView extends cc.Component {
	@property({ type: [TQSBCItem] })
	buttonCounts: TQSBCItem[] = [];
	@property({ type: [TQSBBItem] })
	betButtons: TQSBBItem[] = [];

	@property({ type: [cc.Label] })
	valueRestric: cc.Label[] = []

	@property({ type: cc.Node })
	polygon: cc.Node = null

	@property({ type: cc.Slider })
	slider: cc.Slider = null

	@property({ type: cc.Label })
	sliderLbl: cc.Label = null


	protected quickBetSettingsRef: {
		buttonCount: number;
		betValues: number[];
	}[] = null
	protected quickBetSelect: number = null;


	protected onLoad(): void {

		TexasLocal.init()

		this.quickBetSettingsRef = TexasLocal.getItem('quickBetSettings')
		this.quickBetSelect = TexasLocal.getItem('quickBetSelect')

		this.onClickCount(null, this.quickBetSelect.toString());
		this.buttonCounts.find((v) => v.node.toggle.checkEvents[0].customEventData == `${this.quickBetSelect}`).node.toggle.isChecked = true
	}

	/**
	 * 范围
	 */
	private configs = [
		{ buttonCount: 3, betValues: [10, 66, 67, 99, 100, 400] },
		{ buttonCount: 4, betValues: [10, 49, 50, 66, 67, 99, 100, 400] },
		{ buttonCount: 5, betValues: [10, 49, 50, 66, 67, 99, 100, 119, 120, 400] },
	];






	/**
	 * 点击n个按钮
	 */
	protected onClickCount(_, data: string) {
		let buttonCount: number = parseInt(data);
		this.quickBetSelect = buttonCount;
		//切换按钮数量的时候重置投注index = 0
		this.selectBetIndex = 0

		let setting = this.getSetting();

		//刷新betButtons状态
		this.betButtons.forEach((v, i) => {
			v.node.active = i < buttonCount
			v.getComponent(TQSBBItem).set(setting.betValues[i])
		})


		// //切换箭头位置
		// this.scheduleOnce(() => {
		// 	this.setSlider()
		// })
		this.onClickBet(null, "0")


		this.save()

	}


	protected selectBetIndex: number = 0;

	/**
	 * 点击第n个投注
	 */
	protected onClickBet(_, data: string) {
		kcore.click.playAudio()
		console.log("onClickBet", data)
		let index: number = parseInt(data);
		this.selectBetIndex = index;
		//切换箭头位置
		this.scheduleOnce(() => {
			this.setSlider()
		})
	}

	getSetting() {
		let setting = this.quickBetSettingsRef.find((v) => v.buttonCount == this.quickBetSelect)
		return setting;
	}
	getConfig() {
		let config = this.configs.find((v) => v.buttonCount == this.quickBetSelect)
		return config
	}

	setSlider() {
		this.setPolygon(this.betButtons[this.selectBetIndex].node)
		let config = this.getConfig()
		let min: number = config.betValues[this.selectBetIndex * 2]
		let max: number = config.betValues[this.selectBetIndex * 2 + 1]
		this.valueRestric[0].string = `${min}%`
		this.valueRestric[1].string = `${max}%`
		let setting = this.getSetting()
		let value = setting.betValues[this.selectBetIndex];//获取现在的值
		let progress = (value - min) / (max - min)
		this.slider.progress = progress

		let com = this.betButtons[this.selectBetIndex]
		com.set(value, this.sliderLbl)
	}
	onSlider() {
		//更新滑动条上的数值限制提示
		let config = this.getConfig()
		let min: number = config.betValues[this.selectBetIndex * 2]
		let max: number = config.betValues[this.selectBetIndex * 2 + 1]

		let value = min + (max - min) * this.slider.progress

		this.betButtons[this.selectBetIndex].getComponent(TQSBBItem).set(value, this.sliderLbl)

		let setting = this.getSetting()
		setting.betValues[this.selectBetIndex] = Math.floor(value)
		this.save()
	}

	protected save() {
		console.log(this.quickBetSelect)
		console.log(this.quickBetSettingsRef)
		TexasLocal.setItem("quickBetSettings", this.quickBetSettingsRef)
		TexasLocal.setItem("quickBetSelect", this.quickBetSelect)
	}

	protected setPolygon(item: cc.Node) {
		this.polygon.active = false
		this.polygon.x = item.x
		this.polygon.y = 40
		this.polygon.scaleY = 0
		this.polygon.active = true
		cc.tween(this.polygon).to(0.1, { y: 120, scaleY: 1 }).start()
	}


	// private quicks: Quick[] = [

	// ]

	// protected quick = {
	// 	count: 5,
	// 	values: [],
	// }

	// protected quickCache = {
	// 	count: 5,
	// 	values: [],
	// }

	// protected onLoad(): void {
	// 	TexasLocal.init()

	// 	this.quick = TexasLocal.getItem('quick')
	// 	this.quickCache = this.quick
	// 	this.init()
	// }

	// protected async updateBetView(total: number) {
	// 	let find = this.quicks.find((v) => v.totla == total)
	// 	if (!find) return
	// 	this.betView.destroyAllChildren()
	// 	find.values.forEach((value, index) => {
	// 		if (index % 2 == 0) {
	// 			let node: cc.Node = cc.instantiate(this.betItem)
	// 			node.parent = this.betView
	// 			node.active = true
	// 			node.button.clickEvents[0].customEventData = `${index}`
	// 			/**
	// 			 * 设置初始值
	// 			 */
	// 			node.childComponent(cc.Label, 'label').string = `${this.quick.values[Math.floor(index / 2)]
	// 				}`
	// 		}
	// 	})
	// 	await new Promise((resolve) => {
	// 		this.scheduleOnce(() => {
	// 			resolve(true)
	// 		})
	// 	})
	// 	this.setPolygon(this.betView.children[0])
	// 	this.setValues()
	// }

	// protected setValues() { }
	// numberToChineseMap: { [key: number]: string } = {
	// 	0: '零',
	// 	1: '一',
	// 	2: '二',
	// 	3: '三',
	// 	4: '四',
	// 	5: '五',
	// 	6: '六',
	// 	7: '七',
	// 	8: '八',
	// 	9: '九',
	// }
	// protected async init() {
	// 	this.quicks.forEach((data) => {
	// 		let node: cc.Node = cc.instantiate(this.countItem)
	// 		node.parent = this.countView
	// 		node.active = true

	// 		node.childComponent(cc.Label, 'label').string = `${this.numberToChineseMap[data.totla]
	// 			}个按钮`
	// 		node.toggle.checkEvents[0].customEventData = `${data.totla}`
	// 		console.log(data.totla, this.quick.count)
	// 		if (data.totla == this.quick.count) {
	// 			this.scheduleOnce(() => {
	// 				node.toggle.isChecked = true
	// 			})
	// 		}
	// 	})

	// 	this.updateBetView(this.quick.count)
	// }

	// protected onClickCount(_, data: string) {
	// 	let total: number = parseInt(data)

	// 	this.quick.count = total
	// 	this.quick.values = []
	// 	this.quicks
	// 		.find((v) => v.totla == total)
	// 		.values.forEach((value, index) => {
	// 			if (index % 2 == 0) {
	// 				this.quick.values.push(value)
	// 			}
	// 		})
	// 	console.log(this.quick)
	// 	this.updateBetView(total)
	// }

	// protected setPolygon(item: cc.Node) {
	// 	this.polygon.active = false
	// 	this.polygon.x = item.x
	// 	this.polygon.y = 40
	// 	this.polygon.scaleY = 0
	// 	this.polygon.active = true
	// 	cc.tween(this.polygon).to(0.1, { y: 120, scaleY: 1 }).start()
	// }

	// onClickQuickItem(event: cc.Event.EventTouch, data: string) {
	// 	let index: number = parseInt(data)
	// 	console.log(index)

	// 	let config = this.quicks.find((v) => v.totla == this.quick.count)
	// 	this.minLbl.string = `${config.values[index]}%`
	// 	this.maxLbl.string = `${config.values[index + 1]}%`

	// 	this.setPolygon(event.target)
	// }

	// onSlider() { }
}

type Quick = {
	totla: number //按钮数量
	values: number[]
}

export namespace TexasQuickBet {
	export function convert(value: number) {
		let str: string;
		if (value / 25 == 1) {
			str = "1/4"
		} else if (value / 33 == 1) {
			str = "1/3"
		} else if (value / 34 == 1) {
			str = "1/3"
		} else if (value / 49 == 1) {
			str = "1/2"
		} else if (value / 50 == 1) {
			str = "1/2"
		} else if (value / 66 == 1) {
			str = "2/3"
		} else if (value / 67 == 1) {
			str = "2/3"
		} else if (value / 75 == 1) {
			str = "3/4"
		} else {
			let float = parseFloat((value / 100).toFixed(2));
			if (Number.isInteger(float)) {
				str = float.toString();
			} else if (float.toString().includes('.') && float.toString().split('.')[1].endsWith('0')) {
				str = float.toFixed(1);
			} else {
				str = float.toString();
			}
		}
		return str;
	}
}
