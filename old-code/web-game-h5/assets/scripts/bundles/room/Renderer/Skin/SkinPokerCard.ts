import { Poker } from "../../../../ServerDefines/PokerDefine";
import BaseSkin from "./BaseSkin";


const { ccclass, property, menu } = cc._decorator

enum CardLevel {
	None,
	Small,
	Big,
	Special,
}
const ccSkinPokerCardSuitDefine = cc.Class({
	name:"ccSkinPokerCardSuitDefine",
	properties:{
		suit:{
			type:cc.Enum(Poker.Suit),
			default:Poker.Suit.HeiTao
		},
		level:{
			type:cc.Enum(CardLevel),
			default:CardLevel.None,
		},
		frame:{
			type:cc.SpriteFrame,
			default:null,
		}
	}
})
type SkinPokerCardSuitDefine = {
	suit:number,level:number,frame:cc.SpriteFrame
}

const ccSkinPokerCardValueDefine = cc.Class({
	name:"ccSkinPokerCardValueDefine",
	properties:{
		value:{
			type:cc.Enum(Poker.Value),
			default:Poker.Value.V1
		},
		frame:{
			type:cc.SpriteFrame,
			default:null,
		}
	}
})
type SkinPokerCardValueDefine = {
	value:number,frame:cc.SpriteFrame
}

const ccSkinPokerCardSuitGroupDefine = cc.Class({
	name:"ccSkinPokerCardSuitGroupDefine",
	properties:{
		suits:{
			type:[cc.Enum(Poker.Suit)],
			default:[],
		},
		level:{
			type:cc.Enum(CardLevel),
			default:CardLevel.None,
		},
		values:{
			type:[ccSkinPokerCardValueDefine],
			default:[]
		},
	}
})
type SkinPokerCardSuitGroupDefine = {
	suits:Poker.Suit[],level:number,values:SkinPokerCardValueDefine[]
}

const ccSkinPokerCardSpecialCardFace = cc.Class({
	name:"ccSkinPokerCardSpecialCardFace",
	properties:{
		suit:{
			type:cc.Enum(Poker.Suit),
			default:Poker.Suit.HeiTao
		},
		frame:{
			type:cc.SpriteFrame,
			default:null,
		}
	}
})
type SkinPokerCardSpecialCardFace = {
	suit:number,frame:cc.SpriteFrame
}
@ccclass
@menu("game/skin/SkinPokerCard")
export default class SkinPokerCard extends BaseSkin implements krenderer.ISkinCard {
	@property(cc.SpriteFrame)
	face:cc.SpriteFrame = null
	@property(cc.SpriteFrame)
	back:cc.SpriteFrame = null
	@property([ccSkinPokerCardSpecialCardFace])
	specialCardFaces:SkinPokerCardSpecialCardFace[] = []
	@property([ccSkinPokerCardSuitDefine])
	suitFrames:SkinPokerCardSuitDefine[] = []
	@property([ccSkinPokerCardSuitGroupDefine])
	valueFrames:SkinPokerCardSuitGroupDefine[] = []
	get type() {
		return krenderer.RType.Card 
	}
}