import { UIBase } from "../../core/ui/UIBase"
import { ReqLogin } from "../../requests/ReqLogin";
import { ButtonCheckBox } from "../../widget/ButtonCheckBox"
import md5 = require("md5");
import PasswordStyleWidget from "../login/widget/PasswordStyleWidget";

const { ccclass, property, menu } = cc._decorator

function isMail(str:string) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(str);
}

@ccclass
@menu('cpp/lobby/ChangeTradeCodeLayer')
export default class ChangeTradeCodeLayer extends UIBase {
	@property(cc.EditBox)
	editAccount:cc.EditBox = null	
	@property(cc.EditBox)
	editCode:cc.EditBox = null
	@property(cc.EditBox)
	editNewPassword:cc.EditBox = null	
	@property(cc.Label)
	lblCodeStatus:cc.Label = null
	@property(ButtonCheckBox)
	checkSeePassword:ButtonCheckBox = null
	@property(cc.Button)
	btnSendCode:cc.Button = null
	@property(PasswordStyleWidget)
	passwordWidget:PasswordStyleWidget = null
    private func_:Function  
    private codeTime_:number = 0
    onPush(func) {
		this.maskPopEnabled = false 
		
        this.func_ = func
        this.checkSeePassword.isChecked = false 
        this.btnSendCode.interactable = true 
        this.passwordWidget.link(this.editNewPassword)
        this.onToggleChanged()
    }
	onToggleChanged() {
		this.editNewPassword.inputFlag = this.checkSeePassword.isChecked ? cc.EditBox.InputFlag.DEFAULT : cc.EditBox.InputFlag.PASSWORD
	}

	private sendingCode_:boolean = false
	async onClickSendCode() {
		kcore.click.playAudio()
		if(this.sendingCode_) {
			return 
		}
		this.sendingCode_ = true
		try {
			if(this.codeTime_ > 0) {
				return 
			}
			// 发送验证码
			let account = this.editAccount.string.trim()
			if(!isMail(account)) {
				kcore.toast.push("账号格式不正确,请使用邮箱")
				return;
			}
			// 发送验证码
			let res = await ReqLogin.sendCode({
				account: this.editAccount.string.trim(),
				type:2,
			})
			if(res == null || res.errMsg) {
				kcore.tip.push("提示",res ? res.errMsg : "请求失败")
				return
			}
			if(res.code) {
				this.editCode.string = res.code
			}
			this.codeTime_ = 60
			this.btnSendCode.interactable = false 

		} catch (error) {
			kcore.log.error("",error)
		} finally {
			this.sendingCode_ = false
		}
	}
    protected update(dt: number): void {
        if(this.codeTime_ > 0) {
            this.codeTime_ -= dt 
            if(this.codeTime_ <= 0) {
                this.codeTime_ = 0
                this.btnSendCode.interactable = true 
            }
        }
		this.lblCodeStatus.string = this.codeTime_ > 0 ? `重新发送(${Math.ceil(this.codeTime_)}s)` : "发送验证码"
    }

	private sendingConfirm_:boolean = false
	async onClickConfirm() {
		kcore.click.playAudio()
		if(this.sendingConfirm_) {
			return 
		}
		this.sendingConfirm_ = true
		try {
			let account = this.editAccount.string.trim();
			if (account.length < 6) {
				kcore.toast.push("账号长度不能小于6位");
				return;
			}
			if(!isMail(account)) {
				kcore.toast.push("账号格式不正确,请使用邮箱注册");
				return;
			}

			let password = this.editNewPassword.string;
			if (password.length < 6) {
				kcore.toast.push("密码长度不能小于6位");
				return;
			}
			let code = this.editCode.string.trim();
			if (code.length == 0) {
				kcore.toast.push("验证码不能为空");
				return;
			}
			let req: ReqLogin.tChangeTradePasswordReq = {
				account: account,
				newPwdMD5: md5(password),
				verifyCode:this.editCode.string.trim(),
			}
			let res = await ReqLogin.changeTradePassword(req);
			if (res.errCode) {
				kcore.toast.push(res.errMsg);
				return;
			}
			kcore.toast.push("修改成功");

			let func = this.func_
			this.popSelf();

			func && func(account);
		} catch (error) {
			kcore.log.error("",error)
		} finally {
			this.sendingConfirm_ = false
		}
	}
}