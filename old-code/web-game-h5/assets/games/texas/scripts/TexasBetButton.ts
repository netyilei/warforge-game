const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("texas/TexasBetButton")
export default class TexasBetButton extends cc.Component {

    @property({ type: cc.Node })
    Sliding :cc.Node = null;

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }

    // update (dt) {}
}
