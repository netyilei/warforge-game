import Decimal from "decimaljs";
import { UIBase } from "../../core/ui/UIBase";
import { PageLimitCaller } from "../../core/utils/PageLimitCaller";
import { ReqLobby } from "../../requests/ReqLobby";
import { NewsDefine } from "../../ServerDefines/NewsDefine";
import { ButtonCheckBox } from "../../widget/ButtonCheckBox";
import ActiveItemWidget from "./widgets/ActiveItemWidget";

const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/AboutLayer')
export default class AboutLayer extends UIBase {
	
}