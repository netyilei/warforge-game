import { TexasQuickBet } from "./TexasQuickSetView";

//TexasQuickSetBetButton
const { ccclass, property } = cc._decorator;

@ccclass
export default class TQSBBItem extends cc.Component {
    @property({ type: cc.Label })
    valueLbl: cc.Label = null



    public set(value: number, label?: cc.Label) {
        value = Math.floor(value)
        if (label) {
            label.string = `${value}%`
        }
        this.valueLbl.string = TexasQuickBet.convert(value)
    }

}
