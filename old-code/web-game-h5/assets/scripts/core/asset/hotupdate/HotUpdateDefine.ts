
/**
 * 服务器上需要三个文件：
 * 1. hc_simple.json	用于 main internal 的更新
 * 2. hc.json			用于其他bundle的更新
 * 3. bundle_map.json	用于bundle依赖以及资源查询
 */

export namespace HotUpdate {
	
	// mode 同 PofileMode
	export enum Mode {
		Dev,
		Test,
		Company,
		Live,
	}
	export type HCType = {
		// 远程服务器url
		hcUrl:string,
		// bundle信息表url
		bundleMapUrl:string,
		// bundle基础url
		bundleUrl:string,
		// 简易hc配置url，用于main.js
		simpleHcUrl:string,
		// 登录url
		loginUrl:string,
		// mode 同 PofileMode
		profileMode:Mode,

		// 热更新序列号
		serialVer:number,
		// 大版本
		bigVer:number,
		// 
		appUrl_android:string,
		appUrl_ios:string,
		// bundle信息
		bundles: {
			name:string,
			ver:string,
		}[]
	}

	export type HCSimpleType = {
		simpleHcUrl:string,
		bundleUrl:string,
		serialVer:number,
		bigVer:number,
		// 核心bundle信息
		bundles: {
			name:string,
			ver:string,
		}[]
	}

	export type HCGatePT = {
		infos:{
			login?:string,
			update?:string,
			ping?:string,
		}[]
		login?:string,
		update?:string,
		next?:string,
	}

	export type HAppJson = {
		android_app_url:string,
		ios_app_url:string,
	}
	export let hc:HCType = null 

	export let enabled = false 

	export let isNative = (CC_JSB || cc.sys.platform == cc.sys.WECHAT_GAME)

	/**
	 * 本地加载 or 远程加载 基本上没用到
	 */
	export let useLocalBundle = true 

	export let keyHC = "cache_hc_full"
	export let keyHCRemote = "cache_hc_remote_full"

	export let keyBuildHCSFull = "cache_core_hcs_full_bundles"

	export let keyBundleMap = "cache_bundle_map"

	export let keySerial = "cache_serial"

	export enum LayerStatus {
		None,
		UpdateSuccess,
		UpdateFailed,
	}
	export type LayerOptions = {
		func:(status:LayerStatus)=>any
	}
}