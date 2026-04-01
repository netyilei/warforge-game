import { Config } from "../../Config";
import { HotUpdateBundleManager } from "./HotUpdateBundleManager";
import { HotUpdate } from "./HotUpdateDefine";

const {ccclass, property, requireComponent} = cc._decorator;

const ccHotUpdateModeHCDefine = cc.Class({
	name:"ccHotUpdateModeHCDefine",
	properties:{
		hcJson: {
			type:cc.JsonAsset,
			default:null 
		},
		mode: {
			type:cc.Enum(HotUpdate.Mode),
			default:HotUpdate.Mode.Test
		},
		updateEnabled: {
			default:false,
		}
	}
})
type HotUpdateModeHCDefine = {
	hcJson:cc.JsonAsset,
	mode:HotUpdate.Mode,
	updateEnabled:boolean,
}

function convertUpdateUrl(url:string) {
	if(url.includes("{$link-update}")) {
		if(!window["_pt_"]) {
			return null 
		}
		return url.replace("{$link-update}",window["_pt_"].update)
	}
	return url
}
function convertLoginUrl(url:string) {
	if(url.includes("{$link-login}")) {
		if(!window["_pt_"]) {
			return null 
		}
		return url.replace("{$link-login}",window["_pt_"].login)
	}
	return url
}
@ccclass 
export class HotUpdateLeader extends cc.Component {
	private static instance_:HotUpdateLeader = null 
	static get instance() {
		return HotUpdateLeader.instance_
	}
	@property({type:cc.Enum(HotUpdate.Mode),tooltip:"mode只有在define定义的时候才有用"})
	mode = HotUpdate.Mode.Test
	@property({type:[ccHotUpdateModeHCDefine],tooltip:"热更新使用的HC"})
	defines:HotUpdateModeHCDefine[] = []
	@property()
	updateLayerName:string = ""

	onLoad() {
		HotUpdateLeader.instance_ = this 

		HotUpdate.enabled = false 
		HotUpdate.useLocalBundle = true 
		if(this.updateLayerName.length == 0) {
			kcore.log.info("update: layer name is empty")
		}
		if(!HotUpdate.isNative) {
			kcore.log.info("update: platorm is not native")
			return 
		}
		HotUpdate.useLocalBundle = false 
		let hc:HotUpdate.HCType = kcore.storage.getValue(HotUpdate.keyHC)
		if(hc == null) {
			hc = kcore.storage.getValue(HotUpdate.keyBuildHCSFull)
			if(hc == null) {
				kcore.log.info("update: cache full hc is null use defined")
				let def = this.defines.find(v=>v.mode == this.mode)
				if(def && def.updateEnabled) {
					kcore.log.info("update: get hc value by default mode = " + HotUpdate.Mode[this.mode])
					hc = def.hcJson.json 
					kcore.storage.setValue(HotUpdate.keyHC,hc)
					HotUpdate.enabled = true 
					HotUpdate.useLocalBundle = true  
				} else {
					kcore.log.info("update: def is null or update enabled = false", def)
				}
			} else {
				kcore.log.info("update: use main.js full config")
				kcore.storage.setValue(HotUpdate.keyHC,hc)
				HotUpdate.enabled = true 
				HotUpdate.useLocalBundle = true  
				this.mode = hc.profileMode
			}
 		} else {
			kcore.log.info("update: use exist hc")
			HotUpdate.enabled = true 
			let def = this.defines.find(v=>v.mode == this.mode)
			let hcFull = kcore.storage.getValue(HotUpdate.keyBuildHCSFull)

			if(def == null && hcFull == null) {
				kcore.log.info("update: cannot find hc def mode = " + HotUpdate.Mode[this.mode])
			} else {
				if(def == null && hcFull) {
					this.mode = hcFull.profileMode
				}
				if(def && !def.updateEnabled) {
					kcore.log.info("update: local update disabled") 
					HotUpdate.enabled = false 
				} else {
					let hcDef:HotUpdate.HCType = hcFull ? hcFull : (def ? def.hcJson.json : null)
					// 新包
					if(hcDef.serialVer > hc.serialVer || hcDef.bigVer > hc.bigVer) {
						kcore.log.info("update: use new serial view new = " + hcDef.serialVer + " | old = " + hc.serialVer)
						kcore.storage.setValue(HotUpdate.keyHC,hcDef)
						HotUpdate.useLocalBundle = true  
					} else if(hcDef.serialVer == hc.serialVer) {
						HotUpdate.useLocalBundle = true  
					}
				}
			}
		}
		kcore.log.info("update: hc = ",kcore.storage.getValue(HotUpdate.keyHC))
	}
	
	/**
	 * call is com.start
	 */
	startUpdate(nextLayerName:string) {
		if(!HotUpdate.isNative) {
			return false 
		}
		let hcf:HotUpdate.HCSimpleType = kcore.storage.getValue(HotUpdate.keyBuildHCSFull)
		if(hcf) {
			HotUpdateBundleManager.instance.clearLocalBundleVer()
			for(let info of hcf.bundles) {
				HotUpdateBundleManager.instance.addLocalBundleVer(info.name,info.ver)
			}
		}

		let hc:HotUpdate.HCType = kcore.storage.getValue(HotUpdate.keyHC)
		if(hc && hc.profileMode != null && hc.loginUrl != null) {
			kcore.log.info("init with hc config mode = " + HotUpdate.Mode[hc.profileMode] + " | login url = " + hc.loginUrl)
			let urls = new Map<HotUpdate.Mode,string>()
			urls.set(hc.profileMode,convertLoginUrl(hc.loginUrl))
			Config.setupProfileMode(<any>urls,<any>hc.profileMode)
			
		}
		if(!HotUpdate.enabled) {
			return false 
		}
		kcore.bundle = HotUpdateBundleManager.instance
		HotUpdateBundleManager.instance.unloadAllBundles()
		HotUpdateBundleManager.instance.hotInit()
		let self = this 
		kcore.ui.push(this.updateLayerName,{
			func:function(s:HotUpdate.LayerStatus) {
				// HotUpdateBundleManager.instance.unloadAllBundles()
				switch(s) {
					case HotUpdate.LayerStatus.UpdateSuccess: {
						//UIManager.instance.push(self.updateLayerName)
						// self.startUpdate(nextLayerName)
						cc.audioEngine.stopAll();
            			cc.game.restart();
					} break 
					case HotUpdate.LayerStatus.UpdateFailed: {
						kcore.tip.push("提示","更新失败，稍后点击重试",1,function() {
							self.startUpdate(nextLayerName)
						})
					} break 
					case HotUpdate.LayerStatus.None: {
						kcore.ui.push(nextLayerName)
					} break 
				}
			}
		})
		return true 
	}
}