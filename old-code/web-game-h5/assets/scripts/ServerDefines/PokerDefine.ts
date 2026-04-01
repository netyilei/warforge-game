

export namespace Poker {
	export enum Suit {
		None 		= 0,
		Begin 		= 1,
		End			= 5,

		HeiTao 		= 1,
		HongTao 	= 2,
		FangPian 	= 3,
		CaoHua 		= 4,

		Joker		= 5,

		AD			= 6,
	}

	export enum Value {
		None 		= 0,
		Begin 		= 1,
		End			= 14,

		V1			= 1,
		V2			= 2,
		V3			= 3,
		V4			= 4,
		V5			= 5,
		V6			= 6,
		V7			= 7,
		V8			= 8,
		V9			= 9,
		V10			= 10,
		J			= 11,
		Q			= 12,
		K			= 13,

		SJoker		= 14,
		BJoker		= 15,
		

		AD			= 20,
	}
	
	export function isJoker(card:{suit:Suit,value:Value}) {
		return card.suit == Suit.Joker && (card.value == Value.BJoker || card.value == Value.SJoker)
	}
	export function validCard(card:{suit:Suit,value:Value}) {
		return card.suit == Suit.Joker ? isJoker(card) :
			card.suit >= Suit.Begin && card.suit < Suit.End &&
			card.value >= Value.Begin && card.value < Value.End
	}
}
