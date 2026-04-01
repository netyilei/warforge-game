import _ = require("underscore")
import Foldout from "../../../core/ui/Foldout"
import { ReqCharge } from "../../../requests/ReqCharge"
import { ChargeDefine } from "../../../ServerDefines/ChargeDefine"
import QRCodeComponent from "../../utils/QRCodeComponent"


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/widgets/ChargeWidget_Chain')
export default class ChargeWidget_Chain extends cc.Component {
	@property(Foldout)
	foldoutChain:Foldout = null
	@property(Foldout)
	foldoutChainCoin:Foldout = null
	@property(cc.Label)
	lblRate:cc.Label = null
	@property(cc.Label)
	lblAddress:cc.Label = null
	@property(QRCodeComponent)
	qrcode:QRCodeComponent = null

	@property()
	testAddress = "0x1234567890abcdef1234567890abcdef12345678"


	private chainInfos_:ChargeDefine.tChainInfo[]
	private configs_:ChargeDefine.tChargeBlockchainConfig[]
	onFocus() {
		this.foldoutChain.showFoldout = false 
		this.foldoutChainCoin.showFoldout = false 

		this.initData()
	}

	private selChainIDs_:number[]
	private selConfigs_:ChargeDefine.tChargeBlockchainConfig[]
	async initData() {
		if(this.chainInfos_) {
			return 
		}

		let res = await ReqCharge.getEnabledChargeConfigs({
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
	}
	private onSelectChain(idx:number) {
		let chainID = this.selChainIDs_ ? this.selChainIDs_[idx] : null
		let configs = this.configs_.filter(v=>v.chainID === chainID)
		this.selConfigs_ = configs
		this.foldoutChainCoin.setup(this.selConfigs_.map(v=>v.displayName),0,(idx,content)=>{
			this.onSelectCoin(idx)
		})
		this.onSelectCoin(0)
	}
	private curConfig_:ChargeDefine.tChargeBlockchainConfig
	private async onSelectCoin(idx:number) {
		let config = this.selConfigs_ ? this.selConfigs_[idx] : null
		this.curConfig_ = config

		this.lblAddress.string = "-"
		this.qrcode.node.opacity = 0
		this.lblRate.string = "1:" + config.rate

		let addressInfo = await this.getAddressInfoByCur()
		if(!addressInfo) {
			return 
		}
		if(!this.isValid || config != this.curConfig_) {
			return 
		}
		this.lblAddress.string = addressInfo.address
		this.qrcode.setContent(addressInfo.address)
		this.qrcode.node.opacity = 255
	}


	private addressInfos_:{
		chainID:number,
		symbol:string,
		address:string,
	}[] = []
	async getAddressInfoByCur() {
		let config = this.curConfig_
		if(!config) {
			return null
		}
		let info = this.addressInfos_.find(v=>v.chainID === config.chainID && v.symbol === config.symbol)
		if(info) {
			return info 
		}
		let res = await ReqCharge.getChargeChainAddress({
			typeID:config.typeID,
		})
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求充值地址失败")
			return null
		}
		this.addressInfos_.push({
			chainID:config.chainID,
			symbol:config.symbol,
			address:res.address || this.testAddress,
		})
		return this.addressInfos_[this.addressInfos_.length - 1]
	}

	onClickCopy() {
		kcore.click.playAudio()
		kcore.utils.copyToClipboard(this.lblAddress.string)
		kcore.toast.push("已复制到剪贴板")
	}
}