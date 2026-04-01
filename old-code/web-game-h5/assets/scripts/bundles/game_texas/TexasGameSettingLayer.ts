import { UIBase } from "../../core/ui/UIBase";
import UILeftAction from "../../core/ui/UILeftAction";
import { Card, tCardArray } from "../../ServerDefines/CardDefine";
import { Poker } from "../../ServerDefines/PokerDefine";
import { ButtonCheckBox } from "../../widget/ButtonCheckBox";
import { TexasLocal } from "./TexasLocal";

const { ccclass, property, menu } = cc._decorator


@ccclass
export default class TexasGameSettingLayer extends UIBase {
	@property(ButtonCheckBox)
	checkEffect:ButtonCheckBox = null
	@property(ButtonCheckBox)
	checkBG:ButtonCheckBox = null

	@property(cc.Node)
	nodeLayoutCard:cc.Node = null
	@property(cc.Node)
	nodeTemplateCard:cc.Node = null
	@property(cc.Node)
	nodeLayoutBack:cc.Node = null
	@property(cc.Node)
	nodeTemplateBack:cc.Node = null
	@property(cc.Node)
	nodeLayoutBG:cc.Node = null
	@property(cc.Node)
	nodeTemplateBG:cc.Node = null

	private skins_:{
		layout:cc.Node,
		template:cc.Node,
		type:krenderer.RType,
		skins:{
			name:string,
			skin:krenderer.ISkin,
			nodeSel:cc.Node,
		}[]
	}[] = []
	onPush(...params: any[]): void {
		this.maskPopEnabled = false 

		this.checkEffect.isChecked = kcore.audio.effectEnabled
		this.checkEffect.setFunc((isChecked)=>{
			kcore.audio.effectEnabled = isChecked
		})

		this.checkBG.isChecked = kcore.audio.musicEnabled
		this.checkBG.setFunc((isChecked)=>{
			kcore.audio.musicEnabled = isChecked
		})
		
		this.skins_ = [
			{
				layout:this.nodeLayoutCard,
				template:this.nodeTemplateCard,
				type:krenderer.RType.Card,
				skins:[],
			},
			{
				layout:this.nodeLayoutBack,
				template:this.nodeTemplateBack,
				type:krenderer.RType.CardBack,
				skins:[],
			},
			{
				layout:this.nodeLayoutBG,
				template:this.nodeTemplateBG,
				type:krenderer.RType.Background,
				skins:[],
			},
		]
		let suits = [
			Poker.Suit.CaoHua,
			Poker.Suit.HongTao,
			Poker.Suit.HeiTao,
			Poker.Suit.FangPian,
		]
		let cards:tCardArray =[
			{suit:suits[0],value:Poker.Value.V1},
			{suit:suits[1],value:Poker.Value.V1},
			{suit:suits[2],value:Poker.Value.V1},
			{suit:suits[3],value:Poker.Value.V1},
		]

		for(let skinInfo of this.skins_) {
			skinInfo.template.active = false
			let skins = krenderer.atlas.getSkins<krenderer.ISkin>(skinInfo.type)
			for(let i = 0 ; i < skins.length ; i ++) {
				let info = skins[i]
				let item = kcore.display.instantiate(skinInfo.template)
				item.active = true
				skinInfo.layout.addChild(item)
				let nodeSel = item.child("sel")
				nodeSel.active = false
				let spr = item.childCom("spr",cc.Sprite)
				if(skinInfo.type == krenderer.RType.Card) {	
					// let card = krenderer.atlas.createRendererBySkin<krenderer.ICard>(info.skin,new Card(suits[i % 4],Poker.Value.V1))
					// spr.enabled = false 
					// spr.node.addChild(card.node)

					let handCards = krenderer.atlas.createRenderer<krenderer.IHandCards>(krenderer.RType.HandCards,cards,skins[i].skin)
					spr.enabled = false
					spr.node.addChild(handCards.node)
					handCards.node.on(cc.Node.EventType.SIZE_CHANGED,()=>{
						let size = handCards.node.getContentSize()
						// let scale = spr.node.scale
						// size.width *= scale
						item.setContentSize(size)
						spr.node.setContentSize(handCards.node.getContentSize())
					})
					item.setContentSize(handCards.node.getContentSize())
					spr.node.setContentSize(handCards.node.getContentSize())
					// card.node.on(cc.Node.EventType.SIZE_CHANGED,()=>{
					// 	spr.node.setContentSize(card.node.getContentSize())
					// })
					// spr.node.setContentSize(card.node.getContentSize())
				} else {
					spr.spriteFrame = info.skin.defaultFrame
				}

				skinInfo.skins.push({
					name:info.name,
					skin:info.skin,
					nodeSel,
				})
				kcore.click.click(spr.node,()=>{
					for(let v of skinInfo.skins) {
						v.nodeSel.active = false
					}
					nodeSel.active = true
					krenderer.atlas.setDefaultSkin(skinInfo.type,info.name,true)
					switch(skinInfo.type) {
						case krenderer.RType.Card: {
							TexasLocal.setItem("cardSkinName",info.name)
						} break 
						case krenderer.RType.CardBack: {
							TexasLocal.setItem("cardBackSkinName",info.name)
						} break
						case krenderer.RType.Background: {
							TexasLocal.setItem("bgSkinName",info.name)
						} break
					}
				})
				switch(skinInfo.type) {
					case krenderer.RType.Card: {
						let defName = TexasLocal.getItem("cardSkinName")
						if(defName == info.name) {
							nodeSel.active = true
						}
					} break
					case krenderer.RType.CardBack: {
						let defName = TexasLocal.getItem("cardBackSkinName")
						if(defName == info.name) {
							nodeSel.active = true
						}
					} break
					case krenderer.RType.Background: {
						let defName = TexasLocal.getItem("bgSkinName")
						if(defName == info.name) {
							nodeSel.active = true
						}
					} break
				}
			}
		}
	}
}