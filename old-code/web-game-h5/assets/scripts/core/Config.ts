

export enum ProfileMode {
	Dev,
	Test,
	Company,
	Live,
}

let loginUrls = new Map<ProfileMode, string>()
loginUrls.set(ProfileMode.Dev, "http://localhost:11111")
loginUrls.set(ProfileMode.Test, "http://localhost:11111")
loginUrls.set(ProfileMode.Company, "http://localhost:11111")
loginUrls.set(ProfileMode.Live, "https://api.wforge.net")

export namespace Config {
	// -----
	export let mode = ProfileMode.Dev
	// -----
	export let gameName = "GAME"

	export let lobbyName = "LobbyMainLayer"

	export let areaID = "1"

	export let apiID = "aaa_"

	export let deviceType = 0

	export let loginUrl = loginUrls.get(mode)


	export function isDev() {
		return mode == ProfileMode.Dev
	}
	export function isTest() {
		return mode <= ProfileMode.Test
	}
	export function isCompany() {
		return mode == ProfileMode.Company
	}
	export function isLive() {
		return mode == ProfileMode.Live
	}

	export let versionStr: string = "1.0.18"

	export let company: boolean = false

	export let gonggaoSeqConfigUrl: string = ""

	export let gonggaoContentConfigUrl: string = ""

	export let activeSeqConfigUrl: string = ""

	export let activeContentConfigUrl: string = ""

	export let wssCertNativeUrl: string = null
	// render config
	export let defaultIconSpriteFrame: cc.SpriteFrame = null

	export let clipboardLeaderTagPrefix = "kctag://"

	export function setupProfileMode(inputLoginUrls: Map<ProfileMode, string>, mode: ProfileMode) {
		loginUrls = inputLoginUrls
		inputLoginUrls.forEach(function (value, key) {
			kcore.log.info("[config] setup profile mode = " + ProfileMode[key] + " url = " + value)
		})
		loginUrl = loginUrls.get(mode)
		kcore.log.info("[config] use login url mode = " + ProfileMode[mode] + " url = " + loginUrl)
		Config.mode = mode

		kcore.httpAK.loginUrl = loginUrl
	}
	export let shareUrl: string = ""

	export function setShareUrl(url: string) {
		shareUrl = url
	}

	export function changeProfileMode(mode: ProfileMode) {
		loginUrl = loginUrls.get(mode)

		Config.mode = mode

		kcore.httpAK.loginUrl = loginUrl
	}


	export function changeLoginProfile(mode: ProfileMode) {
		loginUrl = loginUrls.get(mode)

		kcore.httpAK.loginUrl = loginUrl
	}

	export function changeLoginUrl(url: string) {
		loginUrls.set(mode, loginUrl)
		loginUrl = loginUrls.get(mode)

		kcore.httpAK.loginUrl = loginUrl
	}
}

// Config.setupProfileMode(loginUrls,ProfileMode.Dev)

// if(cc.sys.platform == cc.sys.WECHAT_GAME) {
// 	Config.deviceType = UserDefine.LoginDeviceType.WechatMiniGame
// } else if(CC_JSB) {
// 	switch(cc.sys.platform) {
// 		case cc.sys.ANDROID: {
// 			Config.deviceType = UserDefine.LoginDeviceType.Android
// 		} break
// 		case cc.sys.IPAD:
// 		case cc.sys.IPHONE: {
// 			Config.deviceType = UserDefine.LoginDeviceType.iOS
// 		} break
// 		default: {
// 			Config.deviceType = UserDefine.LoginDeviceType.Win32
// 		} break
// 	}
// }