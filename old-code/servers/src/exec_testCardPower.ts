import Decimal from "decimal.js";
import { RpcAccountItem } from "../pp-account/rpc/account";
import { DBDefine } from "../pp-base-define/DBDefine";
import { ItemID } from "../pp-base-define/ItemDefine";
import { UserDefine } from "../pp-base-define/UserDefine";
import { DB } from "./db";
import { RobotEnvTools } from "./RobotEnvTools";
import { CardArray, tCard } from "../pp-base-define/CardDefine";
import { Poker } from "../pp-base-define/PokerDefine";
import { GameSet } from "../pp-base-define/GameSet";
import { TexasDefine, TexasRule } from "../pp-game-texas/TexasDefine";
import { TexasPower } from "../pp-game-texas/TexasPower";
import { BinaryFlag } from "./BinaryFlag";


let db = DB.get()
async function main() {
	let cards = new CardArray([
		tCard.create(Poker.Suit.HeiTao,Poker.Value.V3),
		tCard.create(Poker.Suit.HongTao,Poker.Value.V4),
		tCard.create(Poker.Suit.FangPian,Poker.Value.V5),
		tCard.create(Poker.Suit.HeiTao,Poker.Value.V6),
		tCard.create(Poker.Suit.HeiTao,Poker.Value.V7),
	])

	let diCards = new CardArray([
		tCard.create(Poker.Suit.HeiTao,Poker.Value.V3),
		tCard.create(Poker.Suit.HongTao,Poker.Value.J),
		tCard.create(Poker.Suit.FangPian,Poker.Value.K),
		tCard.create(Poker.Suit.HeiTao,Poker.Value.V5),
		tCard.create(Poker.Suit.HeiTao,Poker.Value.V7),
	])

	let handCards = new CardArray([
		// tCard.create(Poker.Suit.HeiTao,Poker.Value.V3),
		tCard.create(Poker.Suit.HongTao,Poker.Value.V4),
		tCard.create(Poker.Suit.FangPian,Poker.Value.V6),
		// tCard.create(Poker.Suit.HeiTao,Poker.Value.V6),
		// tCard.create(Poker.Suit.HeiTao,Poker.Value.V7),
	])

	let gameSet = new GameSet()
	gameSet.addRule(TexasRule.Group1,TexasRule.Group1_Short)
	let power = new TexasPower(gameSet)

	let cardPowerFlags = [
		0xF,
		0xF0,
		0xF00,
		0xF000,
		0xF0000,
	]
	let funcShowCardType = (type:number,cards?:CardArray)=>{
		let typePower = TexasDefine.getCardTypePower(type)
		let typeCard = TexasDefine.getCardType(type)
		let cardPower = TexasDefine.getCardPower(type)


		console.log("> show cardType:" + type)
		console.log("    typePower = " + typePower)
		console.log("    typeCard  = " + TexasDefine.CardType[typeCard])
		console.log("    cardPower = " + cardPower)
		for(let i = 0 ; i <  cardPowerFlags.length; i++) {
			let cardPowerFlag = cardPowerFlags[i]
			let p = (type & cardPowerFlag) >> (i * 4)
			console.log("        has card power idx = " + i + " power = " + p)
		}
		if(cards) {
			let objCards = cards.obj
			let strCards = objCards.map(v=>Poker.Suit[v.suit] + "-" + Poker.Value[v.value]).join(",")
			console.log("    cards = " + strCards)
		}
	}
	{
		let type = power.analyse(cards)
		funcShowCardType(type)
	}

	{
		let info = power.analyseWithDiCards(handCards,diCards)
		funcShowCardType(info.cardType,info.cards)
	}
}

main()