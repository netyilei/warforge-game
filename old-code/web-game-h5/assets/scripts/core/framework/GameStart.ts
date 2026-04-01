// import MultiLanguage, { Language } from "../../multi-language/MultiLanguage"
import { Config, ProfileMode } from "../Config"
import { CoreFramework } from "../CoreFramework"
import UIManager from "../ui/UIManager"
import { Local } from "../utils/Local"
import { rcUtils } from "../utils/Utils"
import { gnet } from "../web/gnet"


const { ccclass, property } = cc._decorator

const ccProfileDefine = cc.Class({
	name: "ccProfileDefine",
	properties: {
		mode: {
			default: ProfileMode.Dev,
			type: cc.Enum(ProfileMode)
		},
		loginUrl: {
			default: ""
		},
		shareUrl: {
			default: ""
		}
	}
})
type ProfileDefine = {
	mode: ProfileMode,
	loginUrl: string,
	shareUrl: string,
}
@ccclass
export default class GameStart extends cc.Component {

	@property()
	gameName: string = "PP"
	@property()
	areaID: string = "1"

	@property(cc.SpriteFrame)
	defaultIconSpriteFrame: cc.SpriteFrame = null

	@property()
	firstBundleName: string = ""

	@property()
	firstLayer: string = "LoginLayer"

	@property()
	firstNativeLayer: string = "LoginLayer"

	@property()
	lobbyLayer: string = "LobbyMainLayer"

	@property()
	versionStr: string = "1.0.0"

	@property()
	isCompany: boolean = false

	@property()
	webConfigUrl: string = ""

	@property()
	gonggaoSeqConfigUrl: string = ""

	@property()
	gonggaoContentConfigUrl: string = ""

	@property()
	activeSeqConfigUrl: string = ""

	@property()
	activeContentConfigUrl: string = ""

	@property()
	clipboardLeaderTagPrefix: string = ""

	@property({ type: cc.Enum(ProfileMode) })
	profileMode = ProfileMode.Dev

	@property([ccProfileDefine])
	profiles: ProfileDefine[] = []

	@property(cc.Asset)
	wssCertAsset: cc.Asset = null

	@property(cc.Node)
	nodeCacheMgr: cc.Node = null

	// @property({ type: MultiLanguage })
	// multiLanguage: MultiLanguage = null;


	protected onLoad(): void {
		if (cc.sys.isNative) {
			cc.debug.setDisplayStats(true);  // 显示FPS等信息（可选）
		}


		Config.gameName = this.gameName
		Config.areaID = this.areaID
		Config.defaultIconSpriteFrame = this.defaultIconSpriteFrame
		Config.versionStr = this.versionStr
		Config.company = this.isCompany
		Config.gonggaoSeqConfigUrl = this.gonggaoSeqConfigUrl
		Config.gonggaoContentConfigUrl = this.gonggaoContentConfigUrl
		Config.activeSeqConfigUrl = this.activeSeqConfigUrl
		Config.activeContentConfigUrl = this.activeContentConfigUrl
		Config.clipboardLeaderTagPrefix = this.clipboardLeaderTagPrefix
		Config.wssCertNativeUrl = this.wssCertAsset ? this.wssCertAsset.nativeUrl : null

		CoreFramework.initEnv(this.nodeCacheMgr)
		Local.init();

		Config.lobbyName = this.lobbyLayer
		kcore.data.set("lobbyName", this.lobbyLayer)

		let urls = new Map<ProfileMode, string>()
		for (let info of this.profiles) {
			urls.set(info.mode, info.loginUrl)
			Config.setShareUrl(info.shareUrl)
		}
		Config.setupProfileMode(urls, this.profileMode)
		Config.setupProfileMode(urls, this.profileMode)

		gnet.init()
		
		// let languageCode = rcUtils.getQueryString("language") || "cn"
		// let language = Language.简体中文;
		// switch (languageCode) {
		// 	case "tw":
		// 		language = Language.繁体中文;
		// 		break;
		// 	case "en":
		// 		language = Language.英文;
		// 		break;
		// 	case "cn":
		// 		language = Language.简体中文;
		// 		break;

		// 	default:
		// 		break;
		// }
		// this.multiLanguage.init();
		// this.multiLanguage.setLanguage(language)

	}

	protected async start() {
		await kcore.async.timeout(1)
		
		let langKey = kcore.storage.getValue("langKey")
		if(!langKey) {
			kcore.storage.setValue("lang",1)
			langKey = "en_US"
		}
		if (langKey) {
			kcore.lang && (kcore.lang.langKey = langKey)
		}

		// await BlockChainWallet.init()
		kcore.ui.popStaticAll()
		
		let self = this
		kcore.ui.exceptionFunc = function () {
			kcore.tip.push("提示", "资源加载失败，点击重试", 1, function () {
				kcore.bundle.unloadAllBundles()
				self.start()
			})
		}
		kcore.ui.restartFunc = function () {
			kcore.bundle.unloadAllBundles()
			self.start()
		}

		kcore.logic.stopAll()
		console.log("designSize = " + JSON.stringify(cc.Canvas.instance.designResolution))
		console.log("contentSize = " + JSON.stringify(cc.Canvas.instance.node.getContentSize()))
		console.log("winSize = " + JSON.stringify(cc.winSize))
		console.log("visibleRect = " + JSON.stringify(cc.visibleRect))

		// if(HotUpdateLeader.instance) {
		// 	if(HotUpdateLeader.instance.startUpdate(this.firstLayer)) {
		// 		return 
		// 	}
		// }

		if (this.firstBundleName) {
			let loadCount = 0
			while (true) {
				loadCount++
				if (loadCount > 5) {
					let self = this
					kcore.tip.push("错误", "资源加载失败", 1, function () {
						self.start()
					})
					return
				}
				let bundle = await kcore.bundle.loadBundle(this.firstBundleName)
				if (bundle == null) {
					continue
				}
				break
			}
		}
		if(cc.sys.isNative) {
			kcore.ui.push(this.firstNativeLayer)
		} else {
			kcore.ui.push(this.firstLayer)
		}
	}
}