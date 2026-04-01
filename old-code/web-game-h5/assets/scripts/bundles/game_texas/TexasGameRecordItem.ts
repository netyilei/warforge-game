import Decimal from 'decimaljs'
import UserUtils from "../../core/utils/UserUtils";
import { ColorDefine } from "../../defines/ColorDefine";
import { CardArray, tCardArray } from "../../ServerDefines/CardDefine";
import UserLoader from "../lobby/UserLoader";
import TexasPlayerExt_CardPowerStatus from "./extensions/TexasPlayerExt_CardPowerStatus";
import TexasPlayerExt_HandCards from "./extensions/TexasPlayerExt_HandCards";
import { TexasDefine, TexasGamePhase } from "./TexasDefine";
import TexasGameLayer from "./TexasGameLayer";
import { TexasClientDefine } from "./TexasClientDefine";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TexasGameRecordItem extends cc.Component {
    @property({ type: UserLoader })
    userLoader: UserLoader = null
    @property(cc.Label)
    winScoreLbl:cc.Label = null
    @property(cc.Label)
    loseScoreLbl:cc.Label = null
    @property({ type: cc.Label })
    paiType: cc.Label = null

    @property({ type: cc.Node })
    cardView: cc.Node = null
    @property({ type: cc.Node })
    cardItem: cc.Node = null

    @property({ type: cc.Node })
    actionView: cc.Node = null

    @property({ type: cc.Label })
    posiLbl: cc.Label = null

    protected _user = null
    protected _data = null
    protected _gameLayer: TexasGameLayer = null
    public async set(
        gameLayer: TexasGameLayer,
        user: {
            userID: number,
            chairNo: number,
            positions: TexasDefine.PositionType[]
        },
        data: TexasDefine.tGameStepRecordData


    ) {
        this._gameLayer = gameLayer
        this._user = user
        this._data = data

        this.clean() // 清理一次

        this.setUser() // 设置用户

        this.setCard() // 设置牌

        this.setActionTag() // 设置动作标签

        this.setResult() // 设置结果
    }

    protected setResult() {
        if (!this._data) return
        if (!this._user) return
        let result = this._data.results.find(v => v.chairNo == this._user.chairNo)
        this.winScoreLbl.node.active = false 
        this.loseScoreLbl.node.active = false
        if (result) {
            let scoreChanged = new Decimal(result.scoreChanged)
            if (scoreChanged.greaterThan(0)) {
                this.winScoreLbl.node.active = true
                this.winScoreLbl.string = `+${scoreChanged.toString()}`
            } else if (scoreChanged.lessThan(0)) {
                this.loseScoreLbl.node.active = true
                this.loseScoreLbl.string = `${scoreChanged.toString()}`
            }
        }
        this.paiType.node.active = !!result
        let ucard = this._data.cards.find((v) => v.chairNo == this._user.chairNo)
        if (!ucard) return
        let pub = this._data.cards.find((v) => v.chairNo == -1)
        if (!pub) return
        let ret = this._gameLayer.power.analyseWithDiCards(CardArray.empty.pushArray(ucard.cards), CardArray.empty.pushArray(pub.cards))
        if (!ret) return
        let cardType = TexasDefine.getCardType(ret.cardType)
        let cardTypeTag: string = TexasClientDefine.CardTypeTag[cardType]
        this.paiType.string = cardTypeTag
    }

    protected setActionTag() {
        if (!this._data) return
        if (!this._user) return

        let list: {
            phase: TexasGamePhase,
            status: TexasDefine.TexasUserPlayingStatus,
            value: number
        }[] = [];

        let getListItem = (phase: TexasGamePhase) => {
            let find = list.find(v => v.phase == phase)
            if (!find) {
                find = { phase, status: TexasDefine.TexasUserPlayingStatus.Giveup, value: 0 }
                list.push(find)
            }
            return find
        }

        this._data.phases.forEach((phase) => {
            if (phase.phase == TexasGamePhase.Ante || phase.phase == TexasGamePhase.Show) {
                return
            }
            let item = getListItem(phase.phase == TexasGamePhase.Pre ? TexasGamePhase.BB : phase.phase);
            let turn = phase.users.find((v) => v.chairNo == this._user.chairNo)
            if (!turn) return
            item.status = turn.status;
            let value = new Decimal(turn.value)
            item.value = value.add(item.value).toNumber()
        })


        let getTexasUserPlayingStatus = (status: TexasDefine.TexasUserPlayingStatus) => {
            let content: string = ``
            switch (status) {
                case TexasDefine.TexasUserPlayingStatus.Play:
                    content = `下注`;
                    break;
                case TexasDefine.TexasUserPlayingStatus.Allin:
                    content = `all-in`;
                    break;
                case TexasDefine.TexasUserPlayingStatus.Giveup:
                    content = `弃牌`;
                    break;
                default:
                content = `${status}`
                break;
            }
            return content
        }
        console.log(list)

        this.actionView.children.forEach((node, i) => {
            if (i < list.length) {
                let item = list[i]
                let statusStr: string = getTexasUserPlayingStatus(item.status)
                node.label.string = `${statusStr} ${item.value}`
            }
        })


    }

    protected setCard() {
        if (!this._data) return
        if (!this._user) return
        let ucard = this._data.cards.find((v) => v.chairNo == this._user.chairNo)
        if (!ucard) return
        this.setHandCards(ucard.cards)
        let pub = this._data.cards.find((v) => v.chairNo == -1)
        if (!pub) return
        let cards = [];
        if (pub.cards.length < 5) {
            for (let i = pub.cards.length; i < 5; i++) {
                pub.cards.push(
                    { suit: 0, value: 0 }
                )
            }
        }
        pub.cards.forEach((d, i) => {
            if (i < 2) {
                cards.push(d)
            } else if (i == 2) {
                cards.push(d)
                this.setHandCards(cards);
                cards = [];
            } else {
                cards.push(d)
                this.setHandCards(cards);
                cards = [];
            }
        })
    }

    protected setUser() {
        if (!this._user) return
        if (!this._user.userID) return
        this.userLoader.load(this._user.userID)
        let post: string[] = [];
        this._user.positions.forEach((v) => {
            post.push(TexasDefine.PositionType[v])
        });
        let str = post.join(`/`)

        this.posiLbl.string = str
    }


    protected clean() {
        this.userLoader.clean()
        this.winScoreLbl.node.active = false
        this.loseScoreLbl.node.active = false
        this.paiType.string = ``
        this.cardView.destroyAllChildren()
        this.actionView.children.forEach((node, i) => {
            node.label.string = ``
        })
    }

    protected setHandCards(cards: krenderer.tCard[]) {
        let handCards: krenderer.IHandCards = krenderer.atlas.createRenderer(krenderer.RType.HandCards)
        handCards.autoShowBack = true
        handCards.autoFlipToShow = true
        let node = cc.instantiate(this.cardItem)
        node.active = true
        node.addChild(handCards.node)
        this.cardView.addChild(node)
        cards.forEach((d, i) => {
            handCards.setCard(i, d)
        })
    }



}
