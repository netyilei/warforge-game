// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { ListView } from "../../core/ui/ListView";
import UILeftAction from "../../core/ui/UILeftAction";
import UIRightAction from "../../core/ui/UIRightAction";
import UserUtils from "../../core/utils/UserUtils";
import { ReqGame } from "../../requests/ReqGame";
import { GameSet } from "../../ServerDefines/GameSet";
import { RoomDefine } from "../../ServerDefines/RoomDefine";
import { ButtonCheckBox } from "../../widget/ButtonCheckBox";
import { TexasRule } from "./TexasDefine";
import UserGameScoreItem from "./UserGameScoreItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TexasGameScoreLayer extends UILeftAction {
    @property()
    colorPlaying = cc.Color.WHITE
    @property()
    colorNotPlaying = cc.Color.GRAY
    @property(cc.Label)
    lblRule:cc.Label = null
    @property(cc.Label)
    lblWatch:cc.Label = null
    @property(cc.ScrollView)
    listRank:cc.ScrollView = null
    @property(cc.Node)
    nodeTemplateRank:cc.Node = null
    @property(cc.Node)
    nodeLayoutWatch:cc.Node = null
    @property(cc.Node)
    nodeTemplateWatch:cc.Node = null
    @property(ButtonCheckBox)
    checkPlaying:ButtonCheckBox = null

    private gameLayer_:kroom.IBaseGameLayer
    private userScores_:RoomDefine.UserScore[]
    private filterUserScores_:(RoomDefine.UserScore & {out:boolean})[]
    onPush(gameLayer:kroom.IBaseGameLayer): void {
        this.gameLayer_ = gameLayer
        this.nodeTemplateRank.active = false
        this.nodeTemplateWatch.active = false
        this.checkPlaying.isChecked = false 
        this.checkPlaying.setFunc(()=>{
            this.onToggleChanged()
        })
        this.onToggleChanged()
        let watchPlayers = this.gameLayer_.players.filter(v=>this.gameLayer_.isChairNoWatcher(v.chairNo))
        this.lblWatch.string = `旁观(${watchPlayers.length})`
        this.nodeLayoutWatch.destroyAllChildren()
        for(let i = 0 ; i < 20 ; i ++) {
            let player = watchPlayers[i]
            if(!player) {
                break
            }
            let node = kcore.display.instantiate(this.nodeTemplateWatch)
            node.active = true
            this.nodeLayoutWatch.addChild(node)
            node.childCom("name",cc.Label).string = kcore.api.fixedBytesLen(player.userData.nickName,10,"..")
            let spr = node.childCom("head",cc.Sprite)
            kcore.display.setWebTextureStyle(spr,player.userData.iconUrl,{
                style:"opacity",
            })
        }
        let rule = "盲注:"
        let gameSet:GameSet = this.gameLayer_.gameSet
        let sb = gameSet.iSets[TexasRule.Group6_SBlind]
        let bb = sb * 2
        let ante = gameSet.iSets[TexasRule.Group5_ANTE]
        let baseScore = gameSet.getScore()
        if(gameSet.checkRule(TexasRule.Group0,TexasRule.Group0_ANTE)) { 
            rule += `${ante}/${sb}/${bb}`
        } else {
            rule += `${sb}/${bb}`
        }
        this.lblRule.string = rule
    }

    private listEx_:kcore.ListViewEx
    async onToggleChanged() {
        let outEnabled = !this.checkPlaying.isChecked
        if(!this.userScores_) {
            let res = await ReqGame.getGameUserScores({roomID: this.gameLayer_.roomID})
            if(!this.isValid) {
                return
            }
            this.userScores_ = res?.datas || []
        }

        if(!this.listEx_) {
            this.listEx_ = kcore.ListViewEx.create(this.listRank,()=>{
                let node = kcore.display.instantiate(this.nodeTemplateRank)
                node.active = true
                return node
            },(idx,node,forClean)=>{
                if(forClean) {
                    return false
                }
                let data = this.filterUserScores_[idx]
                if(!data) {
                    return false
                }
                node["_userID_"] = data.userID
                let player = this.gameLayer_.players.find(v=>v.userID == data.userID)
                if(player) {
                    node.childCom("name",cc.Label).string = kcore.api.fixedBytesLen(player.userData.nickName,10,"..")
                } else {
                    UserUtils.instance.load(data.userID).then((userData)=>{
                        if(node["_userID_"] == data.userID) {
                            node.childCom("name",cc.Label).string = kcore.api.fixedBytesLen(userData.nickName,10,"..")
                        }
                    })
                }
                node.childCom("charge",cc.Label).string = data.charge
                if(parseFloat(data.scoreChanged) >= 0) {
                    node.childCom("change",cc.Label).string = `+${data.scoreChanged}`
                } else {
                    node.childCom("change",cc.Label).string = `${data.scoreChanged}`
                }
                node.childCom("cur",cc.Label).string = data.score

                if(player) {
                    node.childCom("name",cc.Label).node.color = this.colorPlaying
                    node.childCom("charge",cc.Label).node.color = this.colorPlaying
                    node.childCom("change",cc.Label).node.color = this.colorPlaying
                    node.childCom("cur",cc.Label).node.color = this.colorPlaying
                } else {
                    node.childCom("name",cc.Label).node.color = this.colorNotPlaying
                    node.childCom("charge",cc.Label).node.color = this.colorNotPlaying
                    node.childCom("change",cc.Label).node.color = this.colorNotPlaying
                    node.childCom("cur",cc.Label).node.color = this.colorNotPlaying
                }
                return true 
            })
        }
        this.filterUserScores_ = this.userScores_.map(v=>({
            ...v,
            out: !this.gameLayer_.players.find(p=>p.userID == v.userID)
        })).filter(v=>outEnabled || !v.out)
        this.filterUserScores_.sort((a,b)=>{
            if(a.out != b.out) {
                return a.out ? 1 : -1
            }
            return parseFloat(b.score) - parseFloat(a.score)
        })
        this.listEx_.itemCount = this.filterUserScores_.length
    }
}
