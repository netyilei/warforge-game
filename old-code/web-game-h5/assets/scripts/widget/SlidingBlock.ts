const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("widget/SlidingBlock")
export default class SlidingBlock extends cc.Component {

    @property({ type: cc.Node, readonly: true })
    private active: cc.Node = null;
    @property({ type: cc.Node, readonly: true })
    private circle: cc.Node = null;
    @property({ tooltip: "是否默认开启" })
    private on: boolean = true;
    @property({ type: [cc.Component.EventHandler] })
    public clickEvents: cc.Component.EventHandler[] = [];
    public setStatus(status: boolean, right?: boolean) {
        this.status = status;
        this.status ? this.open(right) : this.close(right);
    }

    private status: boolean;

    protected onLoad(): void {
        this.status = this.on;//默认值
        this.status ? this.open(true) : this.close(true);
    }

    private onClick() {
        this.status = !this.status;
        this.status ? this.open() : this.close();
        this.clickEvents.forEach((event: cc.Component.EventHandler) => {
            event.emit([this.status]);
        });
    }


    /**
     * 切换到开启状态
     * @param right 跳过动画马上执行
     */
    private open(right: boolean = false) {
        this.circle.stopAllActions();
        let target: number = 20;
        if (right) {
            this.circle.x = target;
            this.active.active = true;
        } else {
            this.close(true);
            cc.tween(this.circle)
                .to(0.1, { x: target }, { easing: "smooth" })
                .call(() => {
                    this.active.active = true;
                })
                .start();
        }

    }



    /**
     * 切换到关闭状态
     * @param right 跳过动画马上执行
     */
    private close(right: boolean = false) {
        this.circle.stopAllActions();
        let target: number = -20;
        if (right) {
            this.circle.x = target;
            this.active.active = false;
        } else {
            this.open(true);
            cc.tween(this.circle)
                .to(0.1, { x: target }, { easing: "smooth" })
                .call(() => {
                    this.active.active = false;
                })
                .start();
        }
    }


}       
