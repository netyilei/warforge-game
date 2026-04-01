// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import UIRightAction from "../../core/ui/UIRightAction";
import { ReqLogin } from "../../requests/ReqLogin";
import { UserDefine } from "../../ServerDefines/UserDefine";
import { rcUtils } from "../../core/utils/Utils";
import md5 = require("md5")
import { UIBase } from "../../core/ui/UIBase";
import { ButtonCheckBox } from "../../widget/ButtonCheckBox";
import { ReqUser } from "../../requests/ReqUser";
import PasswordStyleWidget from "./widget/PasswordStyleWidget";
import { FileUtils } from "../../core/utils/FileUtils";
import { Config } from "../../core/Config";

const { ccclass, property, menu } = cc._decorator

function isMail(str:string) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(str);
}
@ccclass
@menu('cpp/LoginRegisterLayer')
export default class LoginRegisterLayer extends UIBase {
    @property({ type: cc.EditBox })
    editAccount: cc.EditBox = null;
    @property({ type: cc.EditBox })
    editPassword: cc.EditBox = null;
    @property({ type: cc.EditBox })
    editTradePassword: cc.EditBox = null;
    @property({ type: cc.EditBox })
    editName: cc.EditBox = null;
    @property({ type: cc.EditBox })
    editPhone:cc.EditBox = null
    @property({ type: cc.EditBox })
    editCode:cc.EditBox = null
    @property({ type: cc.EditBox })
    editLeaderTag:cc.EditBox = null
    @property(cc.Label)
    lblCodeStatus:cc.Label = null
    @property(ButtonCheckBox)
    checkSeePassword:ButtonCheckBox = null
    @property(ButtonCheckBox)
    checkSeeTradePassword:ButtonCheckBox = null
    @property(cc.Button)
    btnSendCode:cc.Button = null
    @property(PasswordStyleWidget)
    passwordWidget:PasswordStyleWidget = null
    @property(cc.Sprite)
    sprUpload:cc.Sprite = null
    @property(cc.Button)
    btnUpload:cc.Button = null

    @property(cc.Sprite)
    sprHead:cc.Sprite = null
    @property()
    defaultIconUrl:string = "kin://user_head/img_tx_1"
    
    @property(cc.Node)
    nodeRoot1:cc.Node = null
    @property(cc.Node)
    nodeRoot2:cc.Node = null

    private codeTime_:number = 0
    private func_:Function  
    private nodeRoots_:cc.Node[] = []
    private verifyToken_:string = null
    private verifyMail_:string = null
    onPush(func) {
		this.maskPopEnabled = false 

        this.func_ = func
        this.checkSeePassword.isChecked = false 
        this.checkSeePassword.setFunc(()=>{
            this.onToggleChanged()
        })
        this.checkSeeTradePassword.isChecked = false 
        this.checkSeeTradePassword.setFunc(()=>{
            this.onToggleChanged()
        })
        this.btnSendCode.interactable = true 
        this.passwordWidget.link(this.editPassword)
        this.onToggleChanged()

        this.sprUpload.node.active = false 

        kcore.utils.getClipboard().then((text)=>{
            if(!this.isValid) {
                return 
            }
            if(text.startsWith(Config.clipboardLeaderTagPrefix)) {
                this.editLeaderTag.string = text.substring(Config.clipboardLeaderTagPrefix.length)
                kcore.utils.clearClipboard()
            }
        })
        this.nodeRoots_ = [this.nodeRoot1,this.nodeRoot2]
        this.showRoot(0)

        this.refreshHead()
    }
    showRoot(idx:number) {
        for(let i = 0 ; i < this.nodeRoots_.length ; i ++) {
            this.nodeRoots_[i].active = i == idx
        }
    }

    private goNextRoot_:boolean = false
    async onClickNextRoot() {
        kcore.click.playAudio()
        let account = this.editAccount.string.trim()
        if(!isMail(account)) {
            kcore.tip.push("提示","账号格式不正确,请使用邮箱")
            return;
        }
        
        if(this.goNextRoot_) {
            return 
        }
        this.goNextRoot_ = true
        try {
            if(this.verifyToken_) {
                if(this.verifyMail_ != account) {
                    this.verifyToken_ = null
                    this.verifyMail_ = null
                    kcore.tip.push("提示","请重新发送验证码")
                    return
                }
            } else {
                let code = this.editCode.string.trim()
                if(!code) {
                    kcore.tip.push("提示","请填写验证码")
                    return 
                }
                let account = this.editAccount.string.trim()
                let res = await ReqLogin.verifyCode({
                    account: this.editAccount.string.trim(),
                    verifyCode: code,
                })
                if(res == null || res.errMsg) {
                    kcore.tip.push("提示",res ? res.errMsg : "请求失败")
                    return
                }
                this.verifyToken_ = res.token
                this.verifyMail_ = account
            }
            this.showRoot(1)
        } catch (error) {
            kcore.log.error("",error)
        } finally {
            this.goNextRoot_ = false
        }
    }
    onClickPrevRoot() {
        kcore.click.playAudio()
        for(let i = 0 ; i < this.nodeRoots_.length ; i ++) {
            if(this.nodeRoots_[i].active) {
                let prevIdx = i - 1
                if(prevIdx < 0) {
                    prevIdx = 0
                }
                this.showRoot(prevIdx)
                break
            }
        }
    }

    refreshHead() {
        let iconUrl = this.defaultIconUrl
        kcore.display.setWebTextureStyle(this.sprHead,iconUrl,{
            style:"opacity"
        })
    }
    onClickSelectHead() {
        kcore.click.playAudio()
        kcore.ui.push("LoginRegisterSelectHeadLayer",this.defaultIconUrl,(headUrl:string)=>{
            if(headUrl) {
                this.defaultIconUrl = headUrl
                this.refreshHead()
            }
        })
    }
    private sendingCode_:boolean = false
    async onClickSendCode() {
		kcore.click.playAudio()
            // 发送验证码
        let account = this.editAccount.string.trim()
        if(!isMail(account)) {
            kcore.toast.push("账号格式不正确,请使用邮箱")
            return;
        }
        if(this.verifyToken_ && this.verifyMail_ == account) {
            return 
        }
        if(this.sendingCode_) {
            return 
        }
        this.sendingCode_ = true
        try {
            // if(this.codeTime_ > 0) {
            //     return 
            // }
            this.verifyMail_ = account
            this.verifyToken_ = null

            // 发送验证码
            let res = await ReqLogin.sendCode({
                account: this.editAccount.string.trim(),
                type:0,
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

    onToggleChanged() {
        this.editPassword.inputFlag = this.checkSeePassword.isChecked ? cc.EditBox.InputFlag.DEFAULT : cc.EditBox.InputFlag.PASSWORD
        this.editTradePassword.inputFlag = this.checkSeeTradePassword.isChecked ? cc.EditBox.InputFlag.DEFAULT : cc.EditBox.InputFlag.PASSWORD
    }


    async onClickRegister() {
		kcore.click.playAudio()
        let account = this.editAccount.string.trim();
        if (account.length < 6) {
            kcore.toast.push("账号长度不能小于6位");
            return;
        }
        if(!isMail(account)) {
            kcore.toast.push("账号格式不正确,请使用邮箱注册");
            return;
        }

        let password = this.editPassword.string;
        if (password.length < 6) {
            kcore.toast.push("密码长度不能小于6位");
            return;
        }

        let tradePassword = this.editTradePassword.string;
        if (tradePassword.length < 6) {
            kcore.toast.push("交易密码长度不能小于6位");
            return;
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
        let phone = this.editPhone.string.trim()
        // if(!phone) {
        //     kcore.toast.push("请输入手机号")
        //     return 
        // }
        if(!this.verifyToken_) {
            kcore.toast.push("请发送并填写验证码")
            return 
        }

        let leaderTag = this.editLeaderTag.string.trim() || rcUtils.getQueryString('leader_tag')
        if(!leaderTag) {
            kcore.toast.push("请输入邀请码")
            return 
        }
        let req: ReqLogin.tRegisterReq = {
            account: account,
            pwdMD5: md5(password),
            nickName: nickname,
            phoneNumber: phone,
            iconUrl: this.defaultIconUrl,
            tradePWDMD5: md5(tradePassword),
            
            countryCode: "",
            channelTag: "H5",
            deviceTag: "",
            verifyCode:this.editCode.string.trim(),
            verifyToken:this.verifyToken_,

            uploadToken:this.uploadToken_,
        }
        if (leaderTag) {
            req.leaderTag = leaderTag.toUpperCase()
        }
        let res = await ReqLogin.register(req);
        if (res.errCode) {
            kcore.toast.push(res.errMsg);
            return;
        }
        kcore.tip.push("提示","注册审核已提交，请耐心等待")

        let func = this.func_
        this.popSelf();

        func && func(account);
    }

    private uploadToken_:string = null
    async onClickUpload() {
		kcore.click.playAudio()
        this.btnUpload.interactable = false
        try {
            let file = await FileUtils.selectLocalFileWithFile(this.node,"image/*")
            if(!file) {
                return 
            }
            this.sprUpload.node.active = false 
            let frame = await FileUtils.fileToSpriteFrame(file)
            if(frame) {
                this.sprUpload.spriteFrame = frame
            } else {
                return 
            }
            this.sprUpload.node.active = true
            let res:ReqLogin.tRegisterUploadRes = await kcore.httpAK.upload({
                path: ReqLogin.registerUploadPath,
                pathType: "login",
                file: file,
                tag: ReqLogin.registerUploadTag,
            })

            if(res == null || res.errCode) {
                kcore.tip.push("提示",res ? res.errMsg : "上传失败")
                return
            }
            kcore.toast.push("上传成功")
            this.uploadToken_ = res.token

        } catch (error) {
            kcore.log.error("",error)
        } finally {
            this.btnUpload.interactable = true 
        }
    }

}
