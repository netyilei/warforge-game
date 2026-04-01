
import { UIBase } from '../../core/ui/UIBase'
import UIManager from '../../core/ui/UIManager'
import { Local } from '../../core/utils/Local'
import { ReqLogin } from '../../requests/ReqLogin'
import { UserDefine } from '../../ServerDefines/UserDefine'
import { ReqLobby } from '../../requests/ReqLobby'
import BagUtils from '../../core/utils/BagUtils'
import { Datar } from '../../core/utils/Datar'
import { UIBoardBase } from '../../core/ui/UIBoardBase'
import { SrsDCN } from '../../ServerDefines/SrsUserMsg'
import { Config } from '../../core/Config'
import { npmr } from '../../core/utils/npmr'
import md5 = require("md5")
import { ButtonCheckBox } from '../../widget/ButtonCheckBox'
import ItemUtils from '../../core/utils/ItemUtils'
import MatchUtils from '../../core/utils/MatchUtils'

const { ccclass, property, menu } = cc._decorator


let tableName = "t_k_login"
@ccclass
@menu('cpp/LoginLayer')
export default class LoginLayer extends UIBoardBase {
	@property(cc.Node)
	nodeRootGuest:cc.Node = null
	@property(cc.Node)
	nodeRootLoading:cc.Node = null
	@property(cc.Node)
	nodeRootAccount:cc.Node = null
	@property(cc.Node)
	nodePartLoadingBar:cc.Node = null
	@property(cc.ProgressBar)
	barLoading:cc.ProgressBar = null
	@property(cc.Label)
	lblLoading:cc.Label = null
	@property(cc.EditBox)
	editAccount:cc.EditBox = null
	@property(cc.EditBox)
	editPassword:cc.EditBox = null
	@property(cc.EditBox)
	editGuest:cc.EditBox = null

	@property(ButtonCheckBox)
	checkRemember:ButtonCheckBox = null
	@property(ButtonCheckBox)
	checkSeePassword:ButtonCheckBox = null

	@property(cc.Node)
	nodeLoadingTitle:cc.Node = null
	@property(cc.Node)
	nodeLoginTitle:cc.Node = null

	private useCache_ = false 
	private cachePasswordMD5_:string = null 
	onPush(...params: any[]): void {
		this.checkSeePassword.setFunc(()=>{
			this.onToggleChanged()
		})
		this.checkRemember.isChecked = true 
		this.checkSeePassword.isChecked = false
		this.checkSeePassword.setFunc(()=>{
			this.onToggleChanged()
		})
		this.onToggleChanged()
		this.startLoading()

		let cache:{account:string,password:string} = kcore.storage.getValue(tableName)
		if(cache) {
			this.editAccount.string = cache.account
			this.editPassword.string = "******"

			this.cachePasswordMD5_ = cache.password
			this.useCache_ = true 
		}
	}

	private loading_ = false 
	async startLoading() {
		this.loading_ = true 
		this.nodeRootLoading.active = true 
		// this.nodeRootAccount.active = false 
		this.nodeRootAccount.opacity = 0
		this.nodeRootGuest.active = false 

		this.lblLoading.string = "加载中... 0%"
		if(false && CC_BUILD) {

		} else {
			if(CC_BUILD) {
				for(let i = 0 ; i < 100 ; i ++) {
					this.barLoading.progress = cc.misc.clamp01((i+1) / 100)
					this.lblLoading.string = `加载中... ${i+1}%`
					await kcore.async.timeout(1)
				}
			} else {
				await kcore.async.timeout(1)
			}
		}
		this.lblLoading.string = "加载完成"
		if(!CC_BUILD) {
			this.loading_ = false 

			await kcore.async.timeout(500)
			this.nodeRootLoading.active = false 
			this.nodeRootAccount.opacity = 255
			if(Config.isDev()) {
				this.nodeRootGuest.active = true 
				this.editGuest.string = (kcore.utils.getQueryString("guest") || "").trim()
				if(kcore.utils.getQueryString("auto") == "1") {
					this.onClickGuestLogin()
				}
			}
			return 
		}
		await kcore.async.timeout(1000)
		let tpos = kcore.utils.convertPosition(this.nodeLoginTitle,this.nodeLoadingTitle)
		let t = 1
		this.nodePartLoadingBar.runAction(cc.fadeOut(t))
		this.nodeLoadingTitle.runAction(cc.moveTo(t,tpos).easing(cc.easeInOut(2)))
		this.nodeLoadingTitle.runAction(cc.sequence([
			// cc.delayTime(t/2),
			// cc.fadeOut(t/2),
			cc.delayTime(t),
			cc.callFunc(()=>{
				this.loading_ = false 
				this.nodeRootAccount.active = true 
				this.nodePartLoadingBar.active = false 
				this.nodeRootAccount.opacity = 0
				this.nodeRootAccount.runAction(cc.sequence([
					cc.fadeIn(t),
					cc.callFunc(()=>{
						this.nodeLoadingTitle.runAction(cc.repeatForever(cc.sequence([
							cc.fadeOut(t/2),
							cc.delayTime(t/2),
							cc.fadeIn(t/2),
						])))
					})
				]))
				if(Config.isDev()) {
					this.nodeRootGuest.active = true 
					this.editGuest.string = (kcore.utils.getQueryString("guest") || "").trim()

					if(kcore.utils.getQueryString("auto") == "1") {
						this.onClickGuestLogin()
					}
				}
			})
		]))
	}
	onToggleChanged() {
		if(this.loading_) {
			return 
		}
		this.editPassword.inputFlag = this.checkSeePassword.isChecked ? cc.EditBox.InputFlag.DEFAULT : cc.EditBox.InputFlag.PASSWORD
	}

	onEditAccountChanged() {
		this.cachePasswordMD5_ = null
		if(this.useCache_) {
			this.editPassword.string = ""
		}
	}

	onEditPasswordBegin() {
		if(this.useCache_) {
			this.editPassword.string = ""
		}
	}
	onEditPasswordChanged() {
		this.cachePasswordMD5_ = null
		this.useCache_ = false 
	}

	onEditPasswordEnd() { 
		if(this.useCache_) {
			this.editPassword.string = "******"
		}
	}

	/**
	 * 点击去注册
	 */
	onClickRegister() {
		kcore.click.playAudio()
		if(this.loading_) {
			return 
		}
		UIManager.instance.push('LoginRegisterLayer',(account:string)=>{
			if(account) {
				this.editAccount.string = account
				this.editPassword.string = ""
			}
		})
	}

	onClickForget() {
		kcore.click.playAudio()
		if(this.loading_) {
			return 
		}
		UIManager.instance.push('LoginForgetLayer')
	}


	/**
	 * 游客登录
	 */
	async onClickGuestLogin() {
		kcore.click.playAudio()
		if(this.loading_) {
			return 
		}
		// UIManager.instance.push("LobbyMainLayer");
		// return;
		if(!this.nodeRootGuest.active) {
			return false 
		}
		let guest = this.editGuest.string.trim()
		if(!guest) {
			return false 
		}
		let leaderTag = kcore.utils.getQueryString('leader_tag')
		let req: ReqLogin.tLoginAppReq = {
			channel:UserDefine.LoginChannel.Guest,
			channelContent:guest,
			nickName: `游客_${guest}`,

			leaderTag,
		}
		let res = await ReqLogin.loginApp(req)
		this.onLogin(res)
	}


	/**
	 * 用户名密码登录
	 */
	async onClickPasswordLogin() {
		kcore.click.playAudio()
		if(this.loading_) {
			return 
		}
		let account = this.editAccount.string

		if (!account) {
			kcore.toast.push('账号不能为空')
			return
		}

		let pwdMD5:string
		if(this.useCache_ && this.cachePasswordMD5_) {
			pwdMD5 = this.cachePasswordMD5_
		} else {
			let password = this.editPassword.string
			if (!password) {
				kcore.toast.push('密码不能为空')
				return
			}
			pwdMD5 = md5(password)
		}

		let res = await ReqLogin.loginApp({
			channel:UserDefine.LoginChannel.Account,
			account,
			pwdMD5: pwdMD5,
		})
		if (res.errCode) {
			kcore.toast.push(res.errMsg)
			return
		}
		console.log('login', res)

		this.onLogin(res)
	}




	async onLogin(res:ReqLogin.tLoginAppRes) {
		if(res == null || res.errMsg) {
			kcore.tip.push("提示",res ? res.errMsg : "请求失败")
			return
		}
		
		if(this.checkRemember.isChecked && res.loginChannel?.type == UserDefine.LoginChannel.Account) {
			kcore.storage.setValue(tableName,{
				account:this.editAccount.string,
				password:this.cachePasswordMD5_ ? this.cachePasswordMD5_ : md5(this.editPassword.string),
			})
		}
		kcore.data.set('login/ak',res.ak)
		kcore.data.set('login/data', res.loginData)
		kcore.data.set('login/config', res.config)
		kcore.data.set('login/leaderTag', res.leaderTag)
		kcore.data.set('login/customer/wsHost', res.customerWSHost)

		kcore.httpAK.lobbyUrl = res.lobbyHost
		kcore.httpAK.customerUrl = res.customerHost
		kcore.httpAK.ak = res.ak
		kcore.gnet.wsHost = res.srsHost

		
		let enter = await ReqLobby.lobbyEnter({})
		ItemUtils.setItemConfigs(enter.items);
		kcore.data.set("mail/reddot",enter.data.reddot)

		kcore.data.set("lobby/banners", enter.banners);
		kcore.data.set("lobby/userCounts", enter.userCounts);
		kcore.data.set("match/event",enter.matchEvents ? enter.matchEvents[0] : null);

		await BagUtils.instance.onLogined()
		await MatchUtils.instance.onLogined(enter.matchEvents)
		// UIManager.instance.push('LobbyMainLayer')
		kcore.layer.lobby(true)
	}
}
