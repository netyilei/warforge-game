const { ccclass, property } = cc._decorator;

@ccclass
export default class ExitButton extends cc.Component {
    @property({ type: cc.Node })
    view: cc.Node = null
    protected onLoad(): void {

    }

    protected onClick() {
		kcore.click.playAudio()
        if (this.status) {
            this.close()
        } else {
            this.open()
        }
    }

    protected status: boolean = false

    protected open() {
        this.status = true
        cc.tween(this.view)
            .to(0.1, { x: 130 })
            .call(() => {

            })
            .start()
    }

    protected close() {
        this.status = false
        cc.tween(this.view)
            .to(0.1, { x: -130 })
            .call(() => {

            })
            .start()
    }
}
