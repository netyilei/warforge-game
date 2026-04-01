import _ = require("underscore")
import Foldout from "../../../core/ui/Foldout"
import { ReqCharge } from "../../../requests/ReqCharge"
import { ChargeDefine } from "../../../ServerDefines/ChargeDefine"
import Decimal from "decimaljs"
import { ItemDefine, ItemID } from "../../../ServerDefines/ItemDefine"
import md5 = require("md5")
import { ButtonCheckBox } from "../../../widget/ButtonCheckBox"


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/widgets/WithdrawWidget_Chain')
export default class WithdrawWidget_Chain extends cc.Component {
	@property(Foldout)
	foldoutChain:Foldout = null
	@property(Foldout)
	foldoutChainCoin:Foldout = null
	@property(cc.Label)
	lblSelfItemCount:cc.Label = null

	@property(cc.EditBox)
	editItemCount:cc.EditBox = null
	@property(cc.Label)
	lblMinMax:cc.Label = null
	@property(cc.Label)
	lblRate:cc.Label = null
	@property(cc.Label)
	lblAmount:cc.Label = null
	@property(cc.Label)
	lblUnit:cc.Label = null
	@property(cc.Label)
	lblFee:cc.Label = null
	@property(cc.EditBox)
	editAddress:cc.EditBox = null

	@property(cc.EditBox)
	editTradePwd:cc.EditBox = null
	@property(ButtonCheckBox)
	checkTradePwd:ButtonCheckBox = null
	// @property(cc.Node)
	// nodeRecordLayout:cc.Node = null
	// @property(cc.Node)
	// nodeRecordTemplate:cc.Node = null

	@property(cc.Button)
	btnConfirm:cc.Button = null

	protected onLoad(): void {
		kcore.data.listenget("user/items",null,this.node,(items:ItemDefine.tItem[])=>{
			let goldItem = items?.find(v=>v.id == ItemID.Gold)
			let goldCount = goldItem ? goldItem.count : 0
			this.lblSelfItemCount.string = new Decimal(goldCount).toFixed(2)
		})
		this.checkTradePwd.isChecked = false 
		this.checkTradePwd.setFunc(()=>{
			this.onToggleTradePwd()
		})
		this.onToggleTradePwd()
	}
	onToggleTradePwd() {
		this.editTradePwd.inputFlag = this.checkTradePwd.isChecked ? cc.EditBox.InputFlag.DEFAULT : cc.EditBox.InputFlag.PASSWORD
	}
	private records_:{
		chainID:number,
		address:string,
	}[] = []
	private recordChainSets_ = new Set<number>()
	private chainInfos_:ChargeDefine.tChainInfo[]
	private configs_:ChargeDefine.tWithdrawBlockchainConfig[]
	onFocus() {
		this.foldoutChain.showFoldout = false
		this.foldoutChainCoin.showFoldout = false
		// this.nodeRecordTemplate.active = false 
		this.initData()
	}
	async initData() {
		if(this.chainInfos_) {
			return 
		}
		let res = await ReqCharge.getEnabledWithdrawConfigs({
			payType:ChargeDefine.PayType.Blockchain
		})
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			return
		}
		if(!this.isValid) {
			return 
		}
		this.configs_ = res.chains
		this.chainInfos_ = res.chainInfos as ChargeDefine.tChainInfo[]
		let chainIDs = _.unique(this.configs_.map(v=>v.chainID))
		this.selChainIDs_ = chainIDs
		this.foldoutChain.setupCustom(chainIDs.map(chainID=>{
			return this.chainInfos_.find(v=>v.chainID === chainID)
		}),(data,node,com)=>{
			let spr = node.childCom("spr",cc.Sprite)
			spr && (spr.node.active = false )
			if(!data) {
				com.lblContent.string = `链${data.chainID}`
				return 
			}

			if(spr) {
				spr.node.active = true
				kcore.display.setWebTextureStyle(spr,data.iconUrl,{
					style:"opacity"
				})
			}
			com.lblContent.string = data.displayName
		},0,(idx,data)=>{
			this.onSelectChain(idx)
		})
		this.onSelectChain(0)

		// {
		// 	let res = await ReqCharge.getWithdrawOrders({
		// 		payType:ChargeDefine.PayType.Blockchain,
		// 		history:true,
		// 		page:0,limit:20,
		// 	})
		// 	let records = res?.datas
		// 	this.nodeRecordLayout.destroyAllChildren()
		// 	for(let record of records) {
		// 		let node = kcore.display.instantiate(this.nodeRecordTemplate)
		// 		let lbl = node.childCom("lbl",cc.Label)
		// 		let spr = node.childCom("spr",cc.Sprite)
		// 		let btn = node.childCom("btn",cc.Button)
		// 		let chainInfo = this.chainInfos_.find(v=>v.chainID === record.blockchain.chainID)
		// 		if(chainInfo && spr) {
		// 			spr.node.active = true
		// 			kcore.display.setWebTextureStyle(spr,chainInfo.iconUrl,{
		// 				style:"opacity"
		// 			})
		// 		} else {
		// 			spr.node.active = false 
		// 		}
		// 		lbl.string = record.blockchain.address.slice(0,6) + "****" + record.blockchain.address.slice(-6)
		// 		this.nodeRecordLayout.addChild(node)
		// 		kcore.click.click(btn,()=>{
		// 			let chainIdx = chainIDs.findIndex(v=>v == record.blockchain.chainID)
		// 			this.onSelectChain(chainIdx)
		// 			let configIdx = this.selConfigs_.findIndex(v=>v.typeID == record.typeID)
		// 			if(configIdx >= 0) {
		// 				this.onSelectCoin(configIdx)
		// 			}
		// 			this.editAddress.string = record.blockchain.address
		// 		})
		// 	}
		// }
	}
	private selChainIDs_:number[]
	private selConfigs_:ChargeDefine.tWithdrawBlockchainConfig[]
	private onSelectChain(idx:number) {
		let chainID = this.selChainIDs_ ? this.selChainIDs_[idx] : null
		let configs = this.configs_.filter(v=>v.chainID === chainID)
		this.selConfigs_ = configs
		let coinNames = configs.map(v=>v.displayName)
		this.foldoutChainCoin.setup(coinNames,0,(idx,content)=>{
			this.onSelectCoin(idx)
		})
		this.onSelectCoin(0)
	}
	private curConfig_:ChargeDefine.tWithdrawBlockchainConfig
	private onSelectCoin(idx:number) {
		let config = this.selConfigs_ ? this.selConfigs_[idx] : null
		this.curConfig_ = config
		this.editItemCount.string = "0"
		this.editAddress.string = ""
		this.lblUnit.string = this.curConfig_.symbol
		let minAmount = new Decimal(this.curConfig_.minAmount || "0")
		let maxAmount = new Decimal(this.curConfig_.maxAmount || "0")
		if(minAmount.lessThanOrEqualTo(0)) {
			if(maxAmount.lessThanOrEqualTo(0)) {
				this.lblMinMax.string = `单笔限额：不限额 ${this.curConfig_.symbol}`
			} else {
				this.lblMinMax.string = `单笔限额：≤${maxAmount} ${this.curConfig_.symbol}`
			}
		} else {
			if(maxAmount.lessThanOrEqualTo(0)) {
				this.lblMinMax.string = `单笔限额：≥${minAmount} ${this.curConfig_.symbol}`
			} else {
				this.lblMinMax.string = `单笔限额：${minAmount}-${maxAmount} ${this.curConfig_.symbol}`
			}
		}
		this.lblRate.string = "1:" + config.rate
		this.onEditItemCountChanged()
	}

	onEditItemCountChanged() {
		if(!this.curConfig_) {
			return 
		}
		let value = new Decimal(this.editItemCount.string || 0)
		value.toDecimalPlaces(2,Decimal.ROUND_DOWN)
		this.editItemCount.string = value.toString()
		let amount = Decimal.mul(value,this.curConfig_.rate).toDecimalPlaces(this.curConfig_.decimals, Decimal.ROUND_DOWN)
		let fee:Decimal
		if(this.curConfig_.fixedFee) {
			fee = new Decimal(this.curConfig_.feeAmount || "0")
		} else {
			fee = Decimal.mul(amount,this.curConfig_.feePercent || "0").div(100).toDecimalPlaces(this.curConfig_.decimals, Decimal.ROUND_UP)
		}
		let realAmount = amount.sub(fee)
		if(realAmount.lessThan(0)) {
			realAmount = new Decimal(0)
		}
		this.lblAmount.string = realAmount.toDecimalPlaces(this.curConfig_.decimals, Decimal.ROUND_DOWN).toString()
		this.lblFee.string = fee.toString()
	}

	onClickConfirm() {
		kcore.click.playAudio()
		this.onEditItemCountChanged()
		if(!this.curConfig_) {
			kcore.tip.push("提示","请选择区块链和币种")
			return
		}
		let itemCount = new Decimal(this.editItemCount.string || "0")
		let minAmount = new Decimal(this.curConfig_.minAmount || "0")
		let maxAmount = new Decimal(this.curConfig_.maxAmount || "0")
		let realAmount = new Decimal(this.lblAmount.string)
		let feeAmount = new Decimal(this.lblFee.string)
		if(itemCount.lessThanOrEqualTo(0) || realAmount.lessThanOrEqualTo(0)) {
			kcore.tip.push("提示","请输入正确的提现金额")
			return
		}
		if(minAmount.greaterThan(0)) {
			if(itemCount.lessThan(minAmount)) {
				kcore.tip.push("提示",`提现金额不能小于${minAmount} ${this.curConfig_.symbol}`)
				return
			}
		}
		if(maxAmount.greaterThan(0)) {
			if(itemCount.greaterThan(maxAmount)) {
				kcore.tip.push("提示",`提现金额不能大于${maxAmount} ${this.curConfig_.symbol}`)
				return
			}
		}

		let tradePwd = this.editTradePwd.string.trim()
		if(tradePwd.length < 6) {
			kcore.tip.push("提示","交易密码长度不能小于6位")
			return
		}
		this.btnConfirm.interactable = false
		kcore.tip.push("提示","即将提交提现申请",2,async (b)=>{
			if(!b) {
				this.btnConfirm.interactable = true
				return 
			}
			let res = await ReqCharge.withdraw({
				tradePwdMD5:md5(tradePwd),
				payType:ChargeDefine.PayType.Blockchain,
				typeID:this.curConfig_.typeID,
				itemID:this.curConfig_.itemID,
				itemCount:itemCount.toString(),
				blockchain:{
					address:this.editAddress.string,
				}
			})
			if(res == null || res.errMsg) {
				kcore.tip.push("提示",res ? res.errMsg : "请求失败")
				this.btnConfirm.interactable = true
				return
			}
			if(!this.isValid) {
				return 
			}
			kcore.toast.push("提现申请提交成功，等待审核")
			this.btnConfirm.interactable = true
			this.editItemCount.string = "0"	
			this.onEditItemCountChanged()
		})
	}
}