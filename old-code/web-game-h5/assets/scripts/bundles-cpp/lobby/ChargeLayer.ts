import Decimal from "decimaljs";
import Foldout from "../../core/ui/Foldout";
import { UIBase } from "../../core/ui/UIBase";
import { ChargeDefine } from "../../ServerDefines/ChargeDefine";
import { ItemDefine, ItemID } from "../../ServerDefines/ItemDefine";
import ChargeWidget_Bank from "./widgets/ChargeWidget_Bank";
import ChargeWidget_Chain from "./widgets/ChargeWidget_Chain";
import ChargeWidget_Paypal from "./widgets/ChargeWidget_Paypal";
import { ButtonCheckBox } from "../../widget/ButtonCheckBox";
import ChargeWidget_AppleCard from "./widgets/ChargeWidget_AppleCard";


const { ccclass, property, menu } = cc._decorator

let payTypes = [
	ChargeDefine.PayType.Blockchain,
	ChargeDefine.PayType.Paypal,
	ChargeDefine.PayType.Bank,
	ChargeDefine.PayType.AppleCard,
]

let payNames = [
	"区块链",
	"Paypal",
	"银行转账",
	"苹果卡",
]
@ccclass
@menu('cpp/lobby/ChargeLayer')
export default class ChargeLayer extends UIBase {
	@property(cc.Label)
	lblSelfItemCount:cc.Label = null
	@property(ButtonCheckBox)
	checkChain:ButtonCheckBox = null
	@property(ButtonCheckBox)
	checkPaypal:ButtonCheckBox = null
	@property(ButtonCheckBox)
	checkBank:ButtonCheckBox = null
	@property(ButtonCheckBox)
	checkAppleCard:ButtonCheckBox = null

	@property(ChargeWidget_Bank)
	bank:ChargeWidget_Bank = null
	@property(ChargeWidget_Chain)
	chain:ChargeWidget_Chain = null
	@property(ChargeWidget_Paypal)
	paypal:ChargeWidget_Paypal = null
	@property(ChargeWidget_AppleCard)
	appleCard:ChargeWidget_AppleCard = null

	onPush(...params: any[]): void {
		this.maskPopEnabled = false
		this.checkChain.setFunc(()=>{
			this.onPayTypeChanged(0)
		})
		this.checkPaypal.setFunc(()=>{
			this.onPayTypeChanged(1)
		})
		this.checkBank.setFunc(()=>{
			this.onPayTypeChanged(2)
		})
		this.checkAppleCard.setFunc(()=>{
			this.onPayTypeChanged(3)
		})

		kcore.data.listenget("user/items",null,this.node,(items:ItemDefine.tItem[])=>{
			let goldItem = items?.find(v=>v.id == ItemID.Gold)
			let goldCount = goldItem ? goldItem.count : 0
			this.lblSelfItemCount.string = new Decimal(goldCount).toFixed(2)
		})
		this.onPayTypeChanged(0)
	}

	onPayTypeChanged(idx:number) {
		let payType = payTypes[idx]
		this.bank.node.active = false 
		this.chain.node.active = false 
		this.paypal.node.active = false
		this.appleCard.node.active = false

		this.checkChain.isChecked = false 
		this.checkPaypal.isChecked = false 
		this.checkBank.isChecked = false 
		this.checkAppleCard.isChecked = false
		switch(payType) {
			case ChargeDefine.PayType.Blockchain:
				this.checkChain.isChecked = true 
				this.chain.node.active = true
				this.chain.onFocus()
				break
			case ChargeDefine.PayType.Paypal:
				this.checkPaypal.isChecked = true 
				this.paypal.node.active = true
				this.paypal.onFocus()
				break
			case ChargeDefine.PayType.Bank:
				this.checkBank.isChecked = true 
				this.bank.node.active = true
				this.bank.onFocus()
				break
			case ChargeDefine.PayType.AppleCard:
				this.checkAppleCard.isChecked = true
				this.appleCard.node.active = true
				this.appleCard.onFocus()
				break
		}
	}

	onClickCustomer() {
		kcore.click.playAudio()
		kcore.ui.push("CustomerLayer")
	}
}