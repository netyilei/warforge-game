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
@menu('cpp/lobby/widgets/ChargeWidget_AppleCard')
export default class ChargeWidget_AppleCard extends cc.Component {
	@property(Foldout)
	foldoutConfig:Foldout = null
	@property(cc.EditBox)
	editAppleCardAmount:cc.EditBox = null
    @property(cc.Sprite)
    sprUpload:cc.Sprite = null
	@property(cc.Button)
	btnUpload:cc.Button = null

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

	private configs_:ChargeDefine.tChargeAppleCardConfig[]
	onFocus() {
		this.foldoutConfig.showFoldout = false 
		this.sprUpload.node.active = false 
		this.initData() 
	}
	private selBankIDs_:number[]
	private selBranchIDs_:number[]
	async initData() {
		if(this.configs_) {
			return 
		}
		let res = await ReqCharge.getEnabledChargeConfigs({
			payType:ChargeDefine.PayType.AppleCard
		})
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			return
		}
		if(!this.isValid) {
			return 
		}
		this.configs_ = res.appleCards
		this.foldoutConfig.setupCustom(this.configs_,(data,node,com,idx)=>{
			com.lblContent.string = data.displayName
		},0,(idx,content)=>{
			this.onSelectConfig(idx)
		})
		this.onSelectConfig(0)
	}

	private curConfig_:ChargeDefine.tChargeAppleCardConfig
	onSelectConfig(idx:number) {
		this.curConfig_ = this.configs_[idx]
		
		this.lblChargeItemCount.string = "0"
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
		this.onEditAppleCardAmountChanged()
	}

	onEditAppleCardAmountChanged() {
		if(!this.curConfig_) {
			this.lblChargeItemCount.string = "0"
			return 
		}
		let amount = new Decimal(this.editAppleCardAmount.string || "0")
		if(amount.lessThan(0)) {
			amount = new Decimal(0)
		}
		let itemCount = Decimal.mul(amount,this.curConfig_.rate).toDecimalPlaces(2, Decimal.ROUND_DOWN)
		this.lblChargeItemCount.string = itemCount.toFixed(2)
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
			kcore.tip.push("提示","请选择苹果卡配置")
			return
		}
		let amount = new Decimal(this.editAppleCardAmount.string || "0")
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
				payType:ChargeDefine.PayType.AppleCard,
				typeID:this.curConfig_.typeID,
				amount:this.editAppleCardAmount.string,
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
			this.editAppleCardAmount.string = "0"
			this.onEditAppleCardAmountChanged()
			this.btnConfirm.interactable = true
		})
	}
}