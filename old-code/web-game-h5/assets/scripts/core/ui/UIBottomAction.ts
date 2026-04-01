// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UIBase } from "./UIBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UIBottomAction extends UIBase {



    protected onLoad(): void {
        // this.maskPopEnabled = false
        if(this.node.child("mask")) {
            this.node.child("mask").active = false;
        }
        if(this.node.child("content")) {
            this.node.child("content").active = false;
        }
    }


    private bottomYTarget: number = null;
    /**
     * 返回true表示要自己对cc.Node.active进行赋值
     */
    onFocus(b: boolean): boolean {
        this.scheduleOnce(() => {
            if(this.node.child("mask")) {
                this.node.child("mask").active = true;
            }
            if(this.node.child("content")) {
                this.node.child("content").active = true;
            }

            let bottom: cc.Node = cc.find("content/bottom", this.node);
            if (!bottom) return
            let widget = bottom.widget;
            widget.updateAlignment();
            let y = bottom.y;
            widget.bottom = -bottom.height;
            widget.updateAlignment();
            this.bottomYTarget = bottom.y;
            widget.destroy()

            cc.tween(bottom)
                .to(0.2, { y }, { easing: "cubicOut" })
                .call(() => {
                })
                .start();
        });
        return true;
    }

    /**
     * 返回true表示要自己调用destroy
     */
    onDead() {
        this.scheduleOnce(() => {
            let bottom: cc.Node = cc.find("content/bottom", this.node);
            if (!bottom) return
            cc.tween(bottom)
                .to(0.1, { y: this.bottomYTarget }, { easing: "cubicIn" })
                .call(() => {
                    this.node.destroy();
                })
                .start();
        });
        return true;
    }


}
