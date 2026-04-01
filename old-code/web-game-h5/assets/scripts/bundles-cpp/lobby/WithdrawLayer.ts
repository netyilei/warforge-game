import Decimal from "decimaljs";
import Foldout from "../../core/ui/Foldout";
import { UIBase } from "../../core/ui/UIBase";
import { ChargeDefine } from "../../ServerDefines/ChargeDefine";
import { ItemDefine, ItemID } from "../../ServerDefines/ItemDefine";
import { ButtonCheckBox } from "../../widget/ButtonCheckBox";
import WithdrawWidget_Bank from "./widgets/WithdrawWidget_Bank";
import WithdrawWidget_Chain from "./widgets/WithdrawWidget_Chain";
import WithdrawWidget_Paypal from "./widgets/WithdrawWidget_Paypal";


const { ccclass, property, menu } = cc._decorator

let payTypes = [
	ChargeDefine.PayType.Blockchain,
	ChargeDefine.PayType.Paypal,
	ChargeDefine.PayType.Bank,
]

let payNames = [
	"区块链",
	"Paypal",
	"银行转账",
]
@ccclass
@menu('cpp/lobby/WithdrawLayer')
export default class WithdrawLayer extends UIBase {
	@property(cc.Label)
	lblSelfItemCount:cc.Label = null
	@property(ButtonCheckBox)
	checkChain:ButtonCheckBox = null
	@property(ButtonCheckBox)
	checkPaypal:ButtonCheckBox = null
	@property(ButtonCheckBox)
	checkBank:ButtonCheckBox = null

	@property(WithdrawWidget_Bank)
	bank:WithdrawWidget_Bank = null
	@property(WithdrawWidget_Chain)
	chain:WithdrawWidget_Chain = null
	@property(WithdrawWidget_Paypal)
	paypal:WithdrawWidget_Paypal = null

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
		this.checkChain.isChecked = false 
		this.checkPaypal.isChecked = false 
		this.checkBank.isChecked = false 
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
		}
	}

	onClickCustomer() {
		kcore.click.playAudio()
		kcore.ui.push("CustomerLayer")
	}
}