// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { UIBase } from "./UIBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UIRightAction extends UIBase {



    protected onLoad(): void {
        this.maskPopEnabled = false
        if(this.node.child("mask")) {
            this.node.child("mask").active = false;
        }
        if(this.node.child("content")) {
            this.node.child("content").active = false;
        }
    }

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
            kcore.uiactions.moveInFromRight(this);
        });
        return true;
    }

    /**
     * 返回true表示要自己调用destroy
     */
    onDead() {
        this.scheduleOnce(() => {
            
            kcore.uiactions.moveOutToRight(this, () => {
                this.node.destroy();
            });
        });
        return true;
    }


}
