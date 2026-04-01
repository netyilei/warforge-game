import { UIBase } from "../../core/ui/UIBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LobbyWebViewLayer extends UIBase {


    onPush(...params: any[]): void {

        cc["webview_call"] = () => {
        }

    }

    onEvent(a, b) {
    }
}

