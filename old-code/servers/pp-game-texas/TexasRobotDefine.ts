import Decimal from "decimal.js"
import { CardArray } from "../pp-base-define/CardDefine"
import { RobotSync } from "../src/RobotSync"
import { TexasGamePhase } from "./TexasDefine"
import { knRoomRealtime } from "../pp-game-base/knRoomRealtime"

export namespace TexasRobotDefine {
	export class Sync extends RobotSync {
		deal(chairNo:number,cards:CardArray) {
			this.pushChar(Flag.Deal)
			this.pushInt(chairNo)
			this.pushInt(cards.length)
			for(let i = 0 ; i < cards.length ; i ++) {
				let card = cards.refCards[i]
				this.pushChar(card.suit)
				this.pushChar(card.value)
			}
		}

		ante(chairNo:number,value:string | Decimal) {
			this.pushChar(Flag.Ante)
			this.pushInt(chairNo)
			this.pushString(value.toString())
		}

		phase(phase:TexasGamePhase) {
			this.pushChar(Flag.Phase)
			this.pushChar(phase)
		}

		gameStart(playingUsers:knRoomRealtime.UserData[]) {
			this.pushChar(Flag.GameStart)
			this.pushInt(playingUsers.length)
			for(let user of playingUsers) {
				this.pushInt(user.chairNo)
				this.pushInt(user.userID)
				this.pushString(user.score.toString())
			}
		}
	}
	export enum Flag {
		GameStart,	// len, chairNo:number, userID:number, score:string...
		Phase,		// phase:number,
		Ante,		// chairNo:number, value:string
		Deal,		// chairNo:number, card len, card1.suit, card1.value, card2.suit ...
		Bet,		// chairNo:number, value:string, betType:number
	}
}


