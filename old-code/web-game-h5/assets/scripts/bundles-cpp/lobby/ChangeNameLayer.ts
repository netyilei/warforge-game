import { UIBase } from "../../core/ui/UIBase";
import UserUtils from "../../core/utils/UserUtils";
import { GameConfig_Texas } from "../../games/GameConfig_Texas";
import { ReqUser } from "../../requests/ReqUser";
import { GlobalConfig } from "../../ServerDefines/GlobalConfig";
import { GSUserMsg } from "../../ServerDefines/GSUserMsg";
import { UserDefine } from "../../ServerDefines/UserDefine";


const { ccclass, property, menu } = cc._decorator


@ccclass
@menu('cpp/lobby/ChangeNameLayer')
export class ChangeNameLayer extends UIBase {
	@property(cc.Sprite)
	sprIcon:cc.Sprite = null
	@property(cc.Label)
	lblUserID:cc.Label = null
	@property(cc.Label)
	changeValue:cc.Label = null
	@property(cc.EditBox)
	editName:cc.EditBox = null
	@property(cc.Sprite)
	sprIconBack:cc.Sprite = null

	onPush(): void {
		let loginData:UserDefine.tLoginData = kcore.data.get("login/data")
		this.editName.string = loginData.nickName
		this.lblUserID.string = "ID:" + loginData.userID
		kcore.display.setWebTextureStyle(this.sprIcon,loginData.iconUrl,{
			style:"opacity",
			func:(frame)=>{
				if(frame) {
					this.sprIconBack.enabled = false 
				}
			}
		})

		let config:GlobalConfig.tMain = kcore.data.get("login/config")
		let itemCount = config?.changeNameItemCount || "0"
		this.changeValue.string = itemCount
	}

	private headChanged_ = false 
	private headUrl_ = ""
	onClickHead() {
		kcore.click.playAudio()
		kcore.ui.push("ChangeHeadLayer",(b,headUrl)=>{
			if(b) {
				this.headChanged_ = true 
				this.headUrl_ = headUrl
				kcore.display.setWebTextureStyle(this.sprIcon,this.headUrl_,{
					style:"opacity"
				})
				this.sprIconBack.enabled = false 
			}
		})
	}
	private working_ = false 
	async onClickModifyUserInfo() {
		kcore.click.playAudio()
		if(this.working_) {
			return 
		}
		

        let nickname = this.editName.string.trim();
        if (nickname.length < 2) {
            kcore.toast.push("昵称长度不能小于2位");
            return;
        }
        if(nickname.length > 15) {
            kcore.toast.push("昵称长度不能大于15位");
            return 
        }
		let loginData:UserDefine.tLoginData = kcore.data.get("login/data")
		if(nickname == loginData.nickName && !this.headChanged_) {
			kcore.toast.push("昵称和头像未修改")
			return 
		}
		this.working_ = true
		try {
			let res = await ReqUser.changeUserInfo({
				name: nickname,
				iconUrl: this.headChanged_ ? this.headUrl_ : undefined,
			})
			if(res == null || res.errMsg) {
				kcore.tip.push("提示",res ? res.errMsg : "请求失败")
				return
			}
			kcore.toast.push("修改成功")
			// 更新本地数据
			if(nickname != loginData.nickName) {
				loginData.nickName = nickname
			}
			if(this.headChanged_) {
				loginData.iconUrl = this.headUrl_
			}
			kcore.data.set("login/data",loginData)
			this.popSelf()
		} catch (error) {
			kcore.log.error("change failed:",error)
		} finally {
			this.working_ = false
		}
	}
}
