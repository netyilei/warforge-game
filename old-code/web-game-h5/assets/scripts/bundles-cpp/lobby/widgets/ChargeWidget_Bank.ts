import _ = require("underscore")
import Foldout from "../../../core/ui/Foldout"
import { FileUtils } from "../../../core/utils/FileUtils"
import { ReqCharge } from "../../../requests/ReqCharge"
import { ReqLogin } from "../../../requests/ReqLogin"
import { ChargeDefine } from "../../../ServerDefines/ChargeDefine"
import { ItemDefine, ItemID } from "../../../ServerDefines/ItemDefine"
import Decimal from "decimaljs"


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/widgets/ChargeWidget_Bank')
export default class ChargeWidget_Bank extends cc.Component {
	@property(Foldout)
	foldoutConfig:Foldout = null
	@property(cc.EditBox)
	editBankAmount:cc.EditBox = null
    @property(cc.Sprite)
    sprUpload:cc.Sprite = null
	@property(cc.Button)
	btnUpload:cc.Button = null
	@property(cc.Label)
	lblBankName:cc.Label = null
	@property(cc.Label)
	lblBankBranchName:cc.Label = null
	@property(cc.Label)
	lblAccountNumber:cc.Label = null
	@property(cc.Label)
	lblAccountName:cc.Label = null

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

	protected onLoad(): void {

	}

	private bankInfos_:ChargeDefine.tBankInfo[]
	private branchInfos_:ChargeDefine.tBankBranchInfo[]
	private configs_:ChargeDefine.tChargeBankConfig[]
	onFocus() {
		this.foldoutConfig.showFoldout = false 
		this.sprUpload.node.active = false 
		this.initData() 
	}
	private selBankIDs_:number[]
	private selBranchIDs_:number[]
	async initData() {
		if(this.bankInfos_) {
			return 
		}
		let res = await ReqCharge.getEnabledChargeConfigs({
			payType:ChargeDefine.PayType.Bank
		})
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			return
		}
		if(!this.isValid) {
			return 
		}
		this.bankInfos_ = res.bankInfos
		this.branchInfos_ = res.bankBranchInfos
		this.configs_ = res.banks
		this.foldoutConfig.setupCustom(this.configs_,(data,node,com,idx)=>{
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
		},0,(idx,content)=>{
			this.onSelectConfig(idx)
		})
		this.onSelectConfig(0)
	}

	private curConfig_:ChargeDefine.tChargeBankConfig
	onSelectConfig(idx:number) {
		this.curConfig_ = this.configs_[idx]
		let config = this.curConfig_
		let bankID = this.curConfig_.bankID
		let branchID = this.curConfig_.branchID
		
		let branchInfo = this.branchInfos_.find(v=>v.bankID === bankID && v.branchID === branchID)
		let bankInfo = this.bankInfos_.find(v=>v.bankID === bankID)
		if(!branchInfo || !bankInfo) {
			return 
		}

		this.curConfig_ = config
		this.lblBankName.string = bankInfo.displayName
		this.lblBankBranchName.string = branchInfo.displayName
		this.lblAccountName.string = config.accountName
		this.lblAccountNumber.string = config.accountNumber
		this.lblChargeItemCount.string = "0"
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
		this.onEditBankAmountChanged()
	}

	onEditBankAmountChanged() {
		if(!this.curConfig_) {
			this.lblChargeItemCount.string = "0"
			return 
		}
		let amount = new Decimal(this.editBankAmount.string || "0")
		if(amount.lessThan(0)) {
			amount = new Decimal(0)
		}
		let itemCount = Decimal.mul(amount,this.curConfig_.rate).toDecimalPlaces(2, Decimal.ROUND_DOWN)
		this.lblChargeItemCount.string = itemCount.toFixed(2)
	}

	onClickCopy() {
		kcore.click.playAudio()
		kcore.utils.copyToClipboard(this.curConfig_.accountName+"\n"+this.curConfig_.accountNumber)
		kcore.toast.push("已复制到剪贴板")
	}
	
	private uploadToken_:string = null
	async onClickUpload() {
		kcore.click.playAudio()
		this.btnUpload.interactable = false
		try {
			let file = await FileUtils.selectLocalFileWithFile(this.node,"image/*")
			if(!file) {
				return 
			}
			this.sprUpload.node.active = false 
			let frame = await FileUtils.fileToSpriteFrame(file)
			if(frame) {
				this.sprUpload.spriteFrame = frame
			} else {
				return 
			}
			this.sprUpload.node.active = true
			let res:ReqCharge.tChargeUploadRes = await kcore.httpAK.upload({
				path: ReqCharge.chargeUploadPath,
				pathType: "lobby",
				file: file,
				tag: ReqCharge.chargeUploadTag,
			})

			if(res == null || res.errCode) {
				kcore.tip.push("提示",res ? res.errMsg : "上传失败")
				return
			}
			kcore.toast.push("上传成功")
			this.uploadToken_ = res.tag

		} catch (error) {
			kcore.log.error("",error)
		} finally {
			this.btnUpload.interactable = true 
		}
	}

	onClickConfirm() {
		kcore.click.playAudio()
		if(!this.uploadToken_) {
			kcore.tip.push("提示","请上传转账凭证图片")
			return
		}
		if(!this.curConfig_) {
			kcore.tip.push("提示","请选择银行和支行")
			return
		}
		let amount = new Decimal(this.editBankAmount.string || "0")
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
		kcore.tip.push("提示","是否确认提交",2,async (b)=>{
			if(!b) {
				this.btnConfirm.interactable = true
				return 
			}
			let res = await ReqCharge.charge({
				payType:ChargeDefine.PayType.Bank,
				typeID:this.curConfig_.typeID,
				amount:this.editBankAmount.string,
				tag:this.uploadToken_,
			})

			if(res == null || res.errMsg) {
				kcore.tip.push("提示",res ? res.errMsg : "请求失败")
				this.btnConfirm.interactable = true
				return
			}
			kcore.toast.push("提交成功，等待审核")
			if(!this.isValid) {
				return 
			}
			this.uploadToken_ = null
			this.sprUpload.node.active = false 
			this.editBankAmount.string = "0"
			this.onEditBankAmountChanged()
			this.btnConfirm.interactable = true
		})
	}
}