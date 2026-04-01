/**
 * 通用的聊天互动界面
 */

import { BundleManager } from "../../core/asset/BundleManager";

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("chat/Chat")
export default class Chat extends cc.Component {

    @property({ type: cc.Node })
    messageView: cc.Node = null;
    @property({ type: cc.Node })
    emojiView: cc.Node = null;


    @property({ type: cc.PageView })
    emojiPageview: cc.PageView = null;
    @property({ type: cc.Node })
    emojiPage: cc.Node = null;
    @property({ type: cc.Node })
    emojiItem: cc.Node = null;

    @property({ type: cc.Node })
    userSelectNode: cc.Node = null;
    @property({ type: cc.Node })
    selectTipLineNode: cc.Node = null;




    protected onLoad(): void {
        this.initEmojiView();
        this.setMessageViewStatus(true);
    }

    protected onError() {

    }


    /**
     * 加载表情界面
     */
    protected async initEmojiView() {
        let limit: number = 28;
        let pageCache: cc.Node = null;
        let getPage = (index: number) => {
            if (index % limit == 0) {
                //新建一个page
                pageCache = cc.instantiate(this.emojiPage);
                pageCache.active = true;
                this.emojiPageview.addPage(pageCache);
            }
            return pageCache;
        };
        cc.assetManager.loadBundle("chat", (err: Error, bundle: cc.AssetManager.Bundle) => {
            if (err) return this.onError();
            bundle.loadDir("", cc.Texture2D, (err: Error, assets: cc.Texture2D[]) => {
                if (err) return this.onError();
                assets.forEach((t2d: cc.Texture2D, index: number) => {
                    let page = getPage(index);
                    let node: cc.Node = cc.instantiate(this.emojiItem);
                    node.childComponent(cc.Sprite, "image").spriteFrame = new cc.SpriteFrame(t2d);
                    node.parent = page;
                    node.active = true;
                });
            });
        });
    }



    protected onClickShowMessageView() {
		kcore.click.playAudio()
        this.setMessageViewStatus(true);
    }

    protected onClickShowEmojiView() {
		kcore.click.playAudio()
        this.setMessageViewStatus(false);
    }


    protected setMessageViewStatus(status: boolean) {
        if (!status) {
            this.selectUserStatus = false;
            this.closeUserSelect();
        }
        this.messageView.active = status;
        this.emojiView.active = !status;
    }

    /**
     * 关闭界面
     */
    protected async close() {
        await this.runCloseAction();
        this.node.destroy();
    }

    /**
     * 关闭界面的动画
     * @returns 
     */
    protected async runCloseAction() {
        let widget: cc.Widget = this.node.getComponent(cc.Widget);
        widget.isAbsoluteBottom = false;
        return await new Promise<void>((resolve, reject) => {
            cc.tween(this.node)
                .to(0.15, { y: this.node.y - this.node.height })
                .call(() => {
                    resolve();
                })
                .start();
        })
    }



    /**
     * 打开用户选择界面
     */
    protected openUserSelect() {
        cc.tween(this.userSelectNode)
            .to(0.15, { width: 550 })
            .call(() => {
                this.selectTipLineNode.active = true;
            })
            .start();
    }

    /**
     * 关闭用户选择界面
     */
    protected closeUserSelect() {
        cc.tween(this.userSelectNode)
            .to(0.15, { width: 0 })
            .call(() => {
                this.selectTipLineNode.active = false;
            })
            .start();
    }

    protected selectUserStatus: boolean = null;
    protected onClickSelectUser() {
		kcore.click.playAudio()
        this.selectUserStatus = !this.selectUserStatus;
        if (this.selectUserStatus) {
            this.openUserSelect();
        } else {
            this.closeUserSelect();
        }
    }

}
