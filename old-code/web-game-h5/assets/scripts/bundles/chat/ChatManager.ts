const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("chat/ChatManager")
export default class ChatManager extends cc.Component {
    @property({ type: cc.Prefab })
    chat: cc.Prefab = null;

    public static instance: ChatManager = null;

    protected onLoad(): void {
        if (!ChatManager)
            ChatManager.instance = this;
    }

    public open(target: cc.Node) {
        let node: cc.Node = cc.instantiate(this.chat);
        node.parent = target;
    }

}
