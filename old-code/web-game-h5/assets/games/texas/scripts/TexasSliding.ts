const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("texas/TexasSliding")
export default class TexasSliding extends cc.Component {


    @property({ type: cc.Node })
    button: cc.Node = null;
    @property({ type: cc.Label })
    valueLbl: cc.Label = null;
    @property()
    maxY: number = 0;
    @property()
    minY: number = 0;

    protected onLoad(): void {
        this.button.on(cc.Node.EventType.TOUCH_MOVE, (event) => {
            let y: number = event.getDeltaY();
            this.button.y += y;
            if (this.button.y > this.maxY) {
                this.button.y = this.maxY;
            } else if (this.button.y < this.minY) {
                this.button.y = this.minY;
            }
            let x = this.maxY - this.minY;
            this.onChange(this.button.y / x);
        });
    }

    protected onChange(value: number) {
        console.log(value);
    }

    protected max: number = null;
    protected min: number = null;

    public setItem(max: number, min: number = 0) {
        this.max = max;
        this.min = min;
    }

    
}
