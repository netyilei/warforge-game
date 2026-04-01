const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("texas/TexasUserItem")
export default class TexasUserItem extends cc.Component {

    @property({ type: cc.Sprite })
    userHeadSpr: cc.Sprite = null;

    @property({ type: cc.Node })
    border: cc.Node = null;
    @property({ type: cc.Node })
    borderNull: cc.Node = null;

    @property({ type: cc.Label })
    nicknameLbl: cc.Label = null;

    @property({ type: cc.Label })
    countLbl: cc.Label = null;
    @property({ type: cc.Node })
    cards: cc.Node = null;

    @property({ type: cc.Node })
    tags: cc.Node = null;
    @property({ type: cc.Label })
    chipLbl: cc.Label = null;

    public setItem() {

    }


    protected setUserIcon() {
        if (!this.userHeadSpr) return false;
    }

    protected setNickname() {
        if (!this.nicknameLbl) return false;
    }


    protected setCount() {
        if (!this.countLbl) return false;
    }

    protected setCards() {
        if (!this.cards) return false;
    }

    protected setTag() {
        if (!this.tags) return false;
    }

    protected setChip() {
        if (!this.chipLbl) return false;
    }

}
