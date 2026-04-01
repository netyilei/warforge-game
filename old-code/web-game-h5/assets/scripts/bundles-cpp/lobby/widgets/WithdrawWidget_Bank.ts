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
@menu('cpp/lobby/widgets/WithdrawWidget_Bank')
export default class WithdrawWidget_Bank extends cc.Component {
	@property(Foldout)
	foldoutConfig:Foldout = null
	@property(cc.Label)
	lblSelfItemCount:cc.Label = null
	@property(cc.EditBox)
	editItemCount:cc.EditBox = null
	@property(cc.EditBox)
	editAccountNumber:cc.EditBox = null
	@property(cc.EditBox)
	editAccountName:cc.EditBox = null
	@property(cc.EditBox)
	editTradePwd:cc.EditBox = null
	@property(ButtonCheckBox)
	checkTradePwd:ButtonCheckBox = null
	
	@property(cc.Label)
	lblAmount:cc.Label = null
	@property(cc.Label)
	lblMinMax:cc.Label = null
	@property(cc.Label)
	lblRate:cc.Label = null
	@property(cc.Label)
	lblUnit:cc.Label = null
	@property(cc.Label)
	lblFee:cc.Label = null

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
	private bankInfos_:ChargeDefine.tBankInfo[]
	private branchInfos_:ChargeDefine.tBankBranchInfo[]
	private configs_:ChargeDefine.tWithdrawBankConfig[]
	onFocus() {
		this.foldoutConfig.showFoldout = false
		this.editItemCount.string = "0"
		this.initData()
	}

	async initData() {
		if(this.bankInfos_) {
			return 
		}
		let res = await ReqCharge.getEnabledWithdrawConfigs({
			payType:ChargeDefine.PayType.Bank
		})
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			return
		}
		if(!this.isValid) {
			return 
		}
		this.configs_ = res.banks
		this.bankInfos_ = res.bankInfos as ChargeDefine.tBankInfo[]
		this.branchInfos_ = res.bankBranchInfos as ChargeDefine.tBankBranchInfo[]
		this.foldoutConfig.setupCustom(this.configs_,(data,node,com)=>{
			let bankInfo = this.bankInfos_.find(b=>b.bankID === data.bankID)
			com.lblContent.string = (bankInfo ? bankInfo.displayName : `银行${data.bankID}`) + ":" + data.typeID
			let spr = node.childCom("spr",cc.Sprite)
			spr && (spr.node.active = false )
			if(spr && bankInfo.iconUrl) {
				spr.node.active = true
				kcore.display.setWebTextureStyle(spr,bankInfo.iconUrl,{
					style:"opacity"
				})
			}
		},0,(idx,data)=>{
			this.onSelectConfig(idx)
		})
		this.onSelectConfig(0)
	}
	private curConfig_:ChargeDefine.tWithdrawBankConfig
	onSelectConfig(idx:number) {
		this.curConfig_ = this.configs_[idx]
		let config = this.curConfig_
		
		this.lblUnit.string = config.unit
		this.lblRate.string = "1:" + config.rate
		let minAmount = new Decimal(config.minAmount || 0)
		let maxAmount = new Decimal(config.maxAmount || 0)
		if(minAmount.lessThanOrEqualTo(0)) {
			if(maxAmount.lessThanOrEqualTo(0)) {
				this.lblMinMax.string = `单笔限额：不限额 ${config.unit}`
			} else {
				this.lblMinMax.string = `单笔限额：≤${maxAmount.toFixed(2)} ${config.unit}`
			}
		} else {
			if(maxAmount.lessThanOrEqualTo(0)) {
				this.lblMinMax.string = `单笔限额：≥${minAmount.toFixed(2)} ${config.unit}`
			} else {
				this.lblMinMax.string = `单笔限额：${minAmount.toFixed(2)}-${maxAmount.toFixed(2)} ${config.unit}`
			}
		}
		this.onEditItemCountChanged()
	}

	onEditItemCountChanged() {
		if(!this.curConfig_) {
			this.lblAmount.string = "0"
			return 
		}
		let value = new Decimal(this.editItemCount.string || 0)
		value.toDecimalPlaces(2,Decimal.ROUND_DOWN)
		this.editItemCount.string = value.toString()
		let amount = Decimal.mul(value,this.curConfig_.rate).toDecimalPlaces(2, Decimal.ROUND_DOWN)
		let fee:Decimal
		if(this.curConfig_.fixedFee) {
			fee = new Decimal(this.curConfig_.feeAmount || "0")
		} else {
			fee = Decimal.mul(amount,this.curConfig_.feePercent || "0").div(100).toDecimalPlaces(2, Decimal.ROUND_UP)
		}
		let realAmount = amount.sub(fee)
		if(realAmount.lessThan(0)) {
			realAmount = new Decimal(0)
		}
		this.lblAmount.string = realAmount.toDecimalPlaces(2, Decimal.ROUND_DOWN).toString()
		this.lblFee.string = fee.toString()
	}

	onClickConfirm() {
		kcore.click.playAudio()
		this.onEditItemCountChanged()
		if(!this.curConfig_) {
			kcore.tip.push("提示","请选择银行信息")
			return
		}
		this.onEditItemCountChanged()
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
				kcore.tip.push("提示",`提现金额不能小于${minAmount.toFixed(8)} ${this.curConfig_.unit}`)
				return
			}
		}
		if(maxAmount.greaterThan(0)) {
			if(itemCount.greaterThan(maxAmount)) {
				kcore.tip.push("提示",`提现金额不能大于${maxAmount.toFixed(8)} ${this.curConfig_.unit}`)
				return
			}
		}
		let accountName = this.editAccountName.string.trim()
		if(accountName.length <= 0) {
			kcore.tip.push("提示","请输入账户名")
			return
		}
		let accountNumber = this.editAccountNumber.string.trim()
		if(accountNumber.length <= 0) {
			kcore.tip.push("提示","请输入账号")
			return
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
				payType:ChargeDefine.PayType.Bank,
				typeID:this.curConfig_.typeID,
				itemID:this.curConfig_.itemID,
				itemCount:itemCount.toString(),
				bank:{
					accountName,
					accountNumber,
					bankName:this.bankInfos_.find(v=>v.bankID === this.curConfig_.bankID)?.displayName || "",
					branchName:this.branchInfos_.find(v=>v.branchID === this.curConfig_.branchID)?.displayName || "",
					swiftCode:null,
					country:null,
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