import Decimal from "decimaljs"
import { Config, ProfileMode } from "../../../core/Config"
import { ReqCharge } from "../../../requests/ReqCharge"
import { ChargeDefine } from "../../../ServerDefines/ChargeDefine"
import Foldout from "../../../core/ui/Foldout"


const { ccclass, property, menu } = cc._decorator

const ccChargeWidgetPaypalDefine = cc.Class({
	name:"ccChargeWidgetPaypalDefine",
	properties:{
		profileMode:{
			type:cc.Enum(ProfileMode),
			default:ProfileMode.Test,
		},
		returnUrl:{
			default:"",
		},
		cancelUrl:{
			default:"",
		},
	}
})
type ChargeWidgetPaypalDefine = {
	profileMode:ProfileMode,
	returnUrl:string,
	cancelUrl:string,
}
@ccclass
@menu('cpp/lobby/widgets/ChargeWidget_Paypal')
export default class ChargeWidget_Paypal extends cc.Component {
	@property(Foldout)
	foldout:Foldout = null
	@property(cc.Label)
	lblTipPaypal:cc.Label = null
	@property(cc.EditBox)
	editPaypalAmount:cc.EditBox = null
	@property(cc.Label)
	lblChargeItemCount:cc.Label = null
	@property(cc.Label)
	lblUnit:cc.Label = null
	@property(cc.Label)
	lblRate:cc.Label = null
	@property(cc.Label)
	lblMinMax:cc.Label = null
	@property(cc.Button)
	btnConfirm:cc.Button = null
	@property([ccChargeWidgetPaypalDefine])
	defines:ChargeWidgetPaypalDefine[] = []

	private def_:ChargeWidgetPaypalDefine
	private paypalInfos_:ChargeDefine.tPaypayInfo[]
	private paypalConfigs_:ChargeDefine.tChargePaypalConfig[]
	private curConfig_:ChargeDefine.tChargePaypalConfig
	onFocus() {
		this.foldout.showFoldout = false
		this.def_ = this.defines.find(v=>v.profileMode === Config.mode)
		if(!this.def_) {
			kcore.tip.push("提示","未配置Paypal充值参数")
			return 
		}
		this.initData()
	}

	async initData() {
		if(this.paypalInfos_) {
			return 
		}
		let res = await ReqCharge.getEnabledChargeConfigs({
			payType:ChargeDefine.PayType.Paypal
		})
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			return
		}
		if(!this.isValid) {
			return 
		}
		this.paypalConfigs_ = res.paypals
		this.paypalInfos_ = res.paypalInfos as ChargeDefine.tPaypayInfo[]

		this.def_ = this.defines.find(v=>v.profileMode === Config.mode)

		this.foldout.setupCustom(this.paypalConfigs_.map(v=>{
			return this.paypalInfos_.find(info=>info.paypalID === v.paypalID)
		}),(data,node,com,idx)=>{
			let config = this.paypalConfigs_[idx]
			com.lblContent.string = (data ? data.displayName : "未知Paypal账户") + `(${config.unit})`
		},0,(idx,content)=>{
			this.onSelectPaypalInfo(idx)
		})
		this.onSelectPaypalInfo(0)
	}

	onSelectPaypalInfo(idx:number) {
		this.curConfig_ = this.paypalConfigs_[idx]
		let paypalInfo = this.paypalInfos_.find(v=>v.paypalID === this.curConfig_.paypalID)
		this.lblUnit.string = this.curConfig_.unit
		this.lblRate.string = "1:" + this.curConfig_.rate
		let minAmount = new Decimal(this.curConfig_.minAmount || 0)
		let maxAmount = new Decimal(this.curConfig_.maxAmount || 0)
		if(minAmount.lessThanOrEqualTo(0)) {
			if(maxAmount.lessThanOrEqualTo(0)) {
				this.lblMinMax.string = `单笔限额：不限额 ${this.curConfig_.unit}`
			} else {
				this.lblMinMax.string = `单笔限额：≤${maxAmount.toFixed(2)} ${this.curConfig_.unit}`
			}
		} else {
			if(maxAmount.lessThanOrEqualTo(0)) {
				this.lblMinMax.string = `单笔限额：≥${minAmount.toFixed(2)} ${this.curConfig_.unit}`
			} else {
				this.lblMinMax.string = `单笔限额：${minAmount.toFixed(2)}-${maxAmount.toFixed(2)} ${this.curConfig_.unit}`
			}
		}
		this.onEditBankAmountChanged()
	}

	onEditBankAmountChanged() {
		let amount = new Decimal(this.editPaypalAmount.string || "0")
		if(amount.lessThan(0)) {
			amount = new Decimal(0)
		}
		let itemCount = Decimal.mul(amount,this.curConfig_.rate).toDecimalPlaces(2, Decimal.ROUND_DOWN)
		this.lblChargeItemCount.string = itemCount.toFixed(2)
	}

	onClickConfirm() {
		kcore.click.playAudio()
		if(!this.curConfig_) {
			kcore.tip.push("提示","请选择银行和支行")
			return
		}
		let amount = new Decimal(this.editPaypalAmount.string || "0")
		let minAmount = new Decimal(this.curConfig_.minAmount || 0)
		let maxAmount = new Decimal(this.curConfig_.maxAmount || 0)
		if(minAmount.greaterThan(0) && amount.lessThan(minAmount)) {
			kcore.tip.push("提示",`充值金额不能小于${minAmount.toFixed(2)} ${this.curConfig_.unit}`)
			return
		}
		if(maxAmount.greaterThan(0) && amount.greaterThan(maxAmount)) {
			kcore.tip.push("提示",`充值金额不能大于${maxAmount.toFixed(2)} ${this.curConfig_.unit}`)
			return
		}
		this.btnConfirm.interactable = false

		kcore.tip.push("提示","即将打开Paypal支付页面",2,async (b)=>{
			if(!b) {
				this.btnConfirm.interactable = true
				return 
			}
			let res = await ReqCharge.charge({
				payType:ChargeDefine.PayType.Paypal,
				typeID:this.curConfig_.typeID,
				amount:this.editPaypalAmount.string,
			})

			if(res == null || res.errMsg) {
				kcore.tip.push("提示",res ? res.errMsg : "请求失败")
				this.btnConfirm.interactable = true
				return
			}
			cc.sys.openURL(res.approveUrl!);
			if(!this.isValid) {
				return 
			}
			this.btnConfirm.interactable = true
			this.editPaypalAmount.string = "0"
			this.onEditBankAmountChanged()
		})
	}
}