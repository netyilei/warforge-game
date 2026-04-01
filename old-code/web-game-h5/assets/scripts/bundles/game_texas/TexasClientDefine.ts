import { PlayerPotPos as BasePlayerPotPos } from "../room/BasePlayer";
import { TexasDefine, TexasGamePhase } from "./TexasDefine";


export namespace TexasClientDefine {
	export enum PlayerPotPos {
		BetPool = BasePlayerPotPos.Pool,
		HandCards = BasePlayerPotPos.Card,
	}
	export enum PlayingStatus {
		None,
		Play,
		Allin,
		Giveup,
	}

	// export const Event_NewPhase = "TexasEvent_NewPhase" // TexasGameLayerExt_BoardPools
	/**
	 * fromNode, toNode, parentNode, count, callback?:Function
	 */
	export const Event_FlyChip = "TexasEvent_FlyChip"

	export const Skin_TimerUser = "timer_user"
	export const Skin_TimerBet = "timer_bet"


	// 在切换到此状态前必须收chip
	export const flyChipPhases = [
		TexasGamePhase.BB,
		// TexasGamePhase.Pre,
		TexasGamePhase.Flop,
		TexasGamePhase.Turn,
		TexasGamePhase.River,
		TexasGamePhase.Show,
	]

	export enum CardTypeTag {


		高牌 = TexasDefine.CardType.High,  // High 可以直译为“高牌”，在德州扑克语境中表示手中没有其他组合，仅靠最大单张牌比大小
		一对 = TexasDefine.CardType.Pair,  // Pair 是“一对”的意思，指手牌中有两张相同点数的牌
		两对 = TexasDefine.CardType.DoublePair,  // DoublePair 就是“两对”，即手牌中有两组两张相同点数的牌
		三张 = TexasDefine.CardType.Three,  // Three 表示“三张”，手牌中有三张相同点数的牌
		顺子 = TexasDefine.CardType.Straight,  // Straight 是“顺子”，五张连续点数的牌
		同花 = TexasDefine.CardType.Flush,  // Flush 为“同花”，五张相同花色的牌
		葫芦 = TexasDefine.CardType.FullHouse,  // FullHouse 是“葫芦”，也叫“满堂红”，手牌中有一个三张相同点数和一个两张相同点数的组合
		四条 = TexasDefine.CardType.Four,  // Four 即“四条”，手牌中有四张相同点数的牌
		同花顺 = TexasDefine.CardType.StraightFlush,  // StraightFlush 是“同花顺”，五张连续点数且相同花色的牌
		
		牌型权力标志 = TexasDefine.CardType.Flag_TypePower,  // Flag_TypePower 推测为用于标记牌型权力相关的标志，这里直译为“牌型权力标志”
		牌型标志 = TexasDefine.CardType.Flag_Type,  // Flag_Type 可能是标记牌型的标志，译为“牌型标志”
		权力标志 = TexasDefine.CardType.Flag_Power  // Flag_Power 或许是标记权力的标志，译为“权力标志”
	};

	export const AUDIO_BET = "chip_bet"
	export const AUDIO_FOLD = "chip_fold"
	export const AUDIO_PHASE = "chip_phase_pool"
	export const AUDIO_RESULT = "chip_result"
	export const AUDIO_DEAL = "deal"
	export const AUDIO_ALLIN = "chip_allin"
	export const AUDIO_SHOWCARD = "show_card"
	export const AUDIO_GAMESTART = "game_start"
	export const AUDIO_BUYIN = "buyin"
	export const AUDIO_CHECK = "check"
	export const AUDIO_CHAT = "chat"
	export const AUDIO_ALLIN_STATUS = "allin"
	export const AUDIO_RAISE = "raise"
}