import { TexasRule } from "../bundles/game_texas/TexasDefine";
import { GameSet } from "../ServerDefines/GameSet";
import { RoomDefine } from "../ServerDefines/RoomDefine";
import { GameConfigSerialize } from "./GameConfigSerialize";


export class GameConfigSerialize_Texas extends GameConfigSerialize {
	getRuleInList() {
		let names = this.getExtensioNames()
		let str = names.join(" ")
		let sb = this.gameSet.iSets[TexasRule.Group6_SBlind]
		let bb = sb * 2
		if(this.gameSet.checkRule(TexasRule.Group0,TexasRule.Group0_DoubleBB)) {
			sb = bb 
		}
		if(this.gameSet.checkRule(TexasRule.Group0,TexasRule.Group0_ANTE)) {
			let ante = this.gameSet.iSets[TexasRule.Group5_ANTE]
			// str = ante + "/" + sb + "/" + bb + `(${this.gameSet.getScore()})` + str
			str = ante + "/" + sb + "/" + bb + str
		} else {
			str = sb + "/" + bb + str
		}
		return str 
	}
}