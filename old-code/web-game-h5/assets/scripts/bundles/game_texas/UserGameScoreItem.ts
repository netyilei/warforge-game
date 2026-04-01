// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { ColorDefine } from "../../defines/ColorDefine";
import { RoomDefine } from "../../ServerDefines/RoomDefine";
import UserLoader from "../lobby/UserLoader";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UserGameScoreItem extends cc.Component {
    @property({ type: UserLoader })
    userLoader: UserLoader = null
    @property({ type: cc.Label })
    chargeLbl: cc.Label = null
    @property({ type: cc.Label })
    scoreLbl: cc.Label = null

    public setItem(data: RoomDefine.UserScore) {
        this.userLoader.load(data.userID)
        this.chargeLbl.string = `总买入:${data.charge}`
        this.scoreLbl.string = `输赢:${data.scoreChanged}`
    }

}
