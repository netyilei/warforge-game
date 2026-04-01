import { GSCommonMsg } from "../../../ServerDefines/GSCommonMsg";
import { GSUserMsg } from "../../../ServerDefines/GSUserMsg";
import GameLayerExt_OnClickMenu from "../../room/GameLayerExtensions/GameLayerExt_OnClickMenu";
import TexasGameLayer from "../TexasGameLayer";

const { ccclass, property, menu } = cc._decorator
const ccTexasGameLayerExt_BuyinHeadDefines = cc.Class({
	name:"ccTexasGameLayerExt_BuyinHeadDefines",
	properties:{
		chairNo:{
			default:-1,
		},
		node:{
			type:cc.Node,
			default:null,
		},
	}
})
type TexasGameLayerExt_BuyinHeadDefines = {
	chairNo:number,
	node:cc.Node,

	// runtime
	exist?:boolean,
}
@ccclass
@menu("game/texas/TexasGameLayerExt_Buyin")
export default class TexasGameLayerExt_Buyin extends GameLayerExt_OnClickMenu<TexasGameLayer> {
	@property([ccTexasGameLayerExt_BuyinHeadDefines])
	defines:TexasGameLayerExt_BuyinHeadDefines[] = []

	private selfWatch_:boolean 
	onInitLayerExtension(): void {
		this.gameLayer.dispMsg.addNode(this.node,null,this)	
			.listen(GSUserMsg.GameStart,(msg:GSUserMsg.tGameStartNT)=>{
				this.refreshWatchStatus()
			})
			.listen(GSUserMsg.UserEnter,(msg:GSUserMsg.tUserEnterNT)=>{
				this.refreshWatchStatus()
			})
			.listen(GSUserMsg.UserSitdown,(msg:GSUserMsg.tUserSitdownNT)=>{
				this.refreshWatchStatus()
				krenderer.asset.audio && krenderer.asset.audio.play("audio_sitdown")
			})
			.listen(GSUserMsg.UserStandUp,(msg:GSUserMsg.tUserStandUpNT)=>{
				this.refreshWatchStatus()
			})
			.listen(GSUserMsg.UserExit,(msg:GSUserMsg.tUserExitNT)=>{
				this.refreshWatchStatus()
			})
			.listen(GSUserMsg.GameSync,(msg:GSUserMsg.tGameSyncNT)=>{
				this.refreshWatchStatus()
			})
			.listen(GSCommonMsg.BuyinOrStand,(msg:GSCommonMsg.tBuyinOrStandNT)=>{

				if(this.gameLayer.selfChairNo == msg.chairNo){
					kcore.ui.push("TexasBuyinLayer",{
						gameLayer:this.gameLayer,
						chairNo:this.gameLayer.selfChairNo,
						timeoutSec:msg.timeoutSec,
						func:(b:boolean)=>{
							if(!b) {
								this.gameLayer?.onClickStandUp()
							}
						}
					})
				}

				
			})
			// .listen(GSCommonMsg.Buyin,(msg:GSCommonMsg.tBuyinRes)=>{
			// 	if(!msg.b){
			// 		kcore.tip.push("提示","买入失败")
			// 	}
			// });
		for(let def of this.defines) {
			kcore.click.click(def.node,()=>{
				this.onClickChairNo(def.chairNo)
			})
		}
	}

	refreshWatchStatus() {
		this.selfWatch_ = this.gameLayer.isSelfWatch
		if(!this.selfWatch_) {
			for(let def of this.defines) {
				def.node.active = false 
			}
			return 
		}
		for(let def of this.defines) {
			let player = this.gameLayer.players.find(v=>v.chairNo == def.chairNo)
			def.node.active = player == null 
		}
	}

	onClickChairNo(chairNo:number) {
		//比赛不可以buyin
		if(this.gameLayer?.roomInfo?.matchID){
			return;
		}
		let player = this.gameLayer.players.find(v=>v.chairNo == chairNo)
		if(player) {
			return 
		}
		if(!this.gameLayer.isSelfWatch) {
			return 
		}
		kcore.ui.push("TexasBuyinLayer",{
			gameLayer:this.gameLayer,
			chairNo
		})
	}
}