// import ChatManager from "../../../bundles/chat/scripts/ChatManager";
import { UIBoardBase } from "../../../scripts/core/ui/UIBoardBase";

const { ccclass, property, menu } = cc._decorator;

@ccclass
@menu("texas/TexasLobbyLayer")
export default class TexasLobbyLayer extends UIBoardBase {


    @property({ type: cc.Node })
    chatTarget: cc.Node = null;


    onPush(...params: any[]): void {

    }



    protected openChat() {
        // ChatManager.instance.open(this.chatTarget);
    }
    
    

}
