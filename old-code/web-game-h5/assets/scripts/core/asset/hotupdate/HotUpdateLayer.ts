
import { Config } from "../../Config";
import { UIBoardBase } from "../../ui/UIBoardBase";
import { Web } from "../../web/http_web";
import { BundleMapInfo } from "../BundleDefines";
import { HotUpdate } from "./HotUpdateDefine";


const {ccclass, property} = cc._decorator;

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
export class HotUpdateLayer extends UIBoardBase {
	@property(cc.ProgressBar)
	bar:cc.ProgressBar = null
	@property(cc.Label)
	lblContent:cc.Label = null

	get boardCacheEnabled() {
		return false 
	}
	
	private opt_:HotUpdate.LayerOptions
	onPush(opt:HotUpdate.LayerOptions) {
		this.opt_ = opt 
		this.setContent(" ")
		this.setProgress(0,0)
		this.startHotUpdate()
	}

	async startHotUpdate() {
		if(!HotUpdate.enabled) {
			this.updateFinished(HotUpdate.LayerStatus.None)
			return 
		}
		
		this.setContent("请稍后...")
		let localHC:HotUpdate.HCType = kcore.storage.getValue(HotUpdate.keyHC)		
		if(localHC == null) {
			kcore.log.info("[update-layer] cannot get hc in storage")
			this.updateFinished(HotUpdate.LayerStatus.None)
			return 
		}
		kcore.log.info("[update-layer] get local hc: ",JSON.stringify(localHC))
		let remoteHC:HotUpdate.HCType = await Web.getUrlOptionAsync(convertUpdateUrl(localHC.hcUrl),{
			maxCount:3,
			interval:300,
			json:true
		})
		if(remoteHC == null) {
			kcore.log.info("[udpate-layer] load hc failed: download failed")
			// this.updateFinished(HotUpdate.LayerStatus.UpdateFailed)
			this.updateFinished(HotUpdate.LayerStatus.UpdateFailed)
			return 
		}
		if(remoteHC.bigVer > localHC.bigVer) {
			kcore.tip.push("提示","新版本来袭！\n点击确定下载新版本",1,function() {
				if(cc.sys.os == cc.sys.OS_IOS) {
					cc.sys.openURL(remoteHC.appUrl_ios)
				} else {
					cc.sys.openURL(remoteHC.appUrl_android)
				}
			}).setIgnoreOutBound()
			return 
		}
		localHC.hcUrl = remoteHC.hcUrl
		localHC.bundleMapUrl = remoteHC.bundleMapUrl
		localHC.loginUrl = remoteHC.loginUrl
		localHC.profileMode = remoteHC.profileMode
		
		if(remoteHC && remoteHC.profileMode != null && remoteHC.loginUrl != null) {
			kcore.log.info("[update-layer]init with remote hc config mode = " + HotUpdate.Mode[remoteHC.profileMode] + " | login url = " + remoteHC.loginUrl)
			let urls = new Map<HotUpdate.Mode,string>()
			urls.set(remoteHC.profileMode,convertLoginUrl(remoteHC.loginUrl))
			Config.setupProfileMode(<any>urls,<any>remoteHC.profileMode)
			
		}
		kcore.log.info("[update-layer] get remote hc: ",JSON.stringify(remoteHC))
		kcore.storage.setValue(HotUpdate.keyHC,localHC)
		if(remoteHC.serialVer <= localHC.serialVer) {
			kcore.log.info("[update-layer] serial ver equal(or lower),ignore update")
			this.updateFinished(HotUpdate.LayerStatus.None)
			return 
		}
		if(remoteHC.bundles.length == 0) {
			kcore.log.info("[update-layer] remote bundle length is empty,use local bundle")
			HotUpdate.useLocalBundle = true  
			this.updateFinished(HotUpdate.LayerStatus.None)
			return 
		}
		HotUpdate.useLocalBundle = false 
		kcore.log.info("[update-layer] start to load remote bundle map")
		let bundleMap:BundleMapInfo[] = await Web.getUrlOptionAsync(convertUpdateUrl(localHC.bundleMapUrl),{
			maxCount:5,
			interval:500,
			json:true,
		})
		if(bundleMap == null) {
			kcore.log.info("[update-layer] load bundle map failed")
			this.updateFinished(HotUpdate.LayerStatus.UpdateFailed)
			return 
		}
		let totalCount = remoteHC.bundles.length
		let successCount = 0
		let hcf:HotUpdate.HCType = kcore.storage.getValue(HotUpdate.keyBuildHCSFull)
		
		let updateNames:string[] = []
		for(let info of remoteHC.bundles) {
			let mapInfo = bundleMap.find(v=>v.name == info.name)
			if(mapInfo) {
				if(mapInfo.remote) {
					kcore.log.info("[update-layer] ignore update remote is true bundle name = " + info.name)
					continue
				}
			}
			updateNames.push(info.name)
		}
		totalCount = updateNames.length
		this.setContent("正在更新...")
		for(let i = 0 ; i < totalCount ; i ++) {
			this.setProgress(i+1,totalCount)
			let name = updateNames[i]
			let info = remoteHC.bundles.find(v=>v.name == name)
			if(hcf) {
				let def = hcf.bundles.find(v=>v.name == info.name)
				if(def && def.ver == info.ver) {
					kcore.log.info("[update-layer] ignore update by same verison name = " + def.name)
					successCount ++
					continue
				}
			}
			let url = remoteHC.bundleUrl + info.name
			url = convertUpdateUrl(url)
			let bundle = await this.loadBundle(url,info.ver)
			if(bundle) {
				let mapInfo = bundleMap.find(v=>v.name == info.name)
				if(mapInfo == null) {
					kcore.log.info("[update-layer] bundle is empty name = " + info.name)
				} else {
					let allSuccess = true 
					for(let assetName of mapInfo.assetNames) {
						let b = await this.loadAsset(bundle,assetName)
						if(!b) {
							kcore.log.info("[update-layer] asset load failed bundle = " + info.name)
							//allSuccess = false 
							//break 
						}
					}
					if(!allSuccess) {
						kcore.log.info("[update-layer] asset load failed, force end ")
						bundle.releaseAll()
						cc.assetManager.removeBundle(bundle)
						this.updateFinished(HotUpdate.LayerStatus.UpdateFailed)
						return 
					}
				}
				bundle.releaseAll()
				cc.assetManager.removeBundle(bundle)
				successCount ++
			}
		}
		kcore.log.info("[update-layer] load end, " + successCount + "/" + totalCount)
		if(successCount < totalCount) {
			this.updateFinished(HotUpdate.LayerStatus.UpdateFailed)
			return 
		}

		kcore.storage.setValue(HotUpdate.keyHC,remoteHC)
		kcore.storage.setValue(HotUpdate.keyBundleMap,bundleMap)
		this.updateFinished(HotUpdate.LayerStatus.UpdateSuccess)
		return 
	}

	async loadBundle(url:string,version:string) {
		kcore.log.info("[update-layer] start to load bundle url = " + url + " | ver = " + version)
		return new Promise<cc.AssetManager.Bundle>(function(resolve,reject) {
			cc.assetManager.loadBundle(url,{version:version},function(err,bundle) {
				if(err || bundle == null) {
					kcore.log.info("[update-layer] asset manager load bundle failed url = " + url)
					kcore.log.info(err.message,err)
					resolve(null)
					return 
				}
				kcore.log.info("[update-layer] asset manager load bundle success")
				resolve(bundle)
			})
		})
	}

	async loadAsset(bundle:cc.AssetManager.Bundle,name:string) {
		return new Promise<boolean>(function(resolve,reject) {
			bundle.preload(name,function(err) {
				if(err) {
					kcore.log.info("[update-layer] download asset failed name = " + name)
					kcore.log.info(err.message,err)
					resolve(false)
					return 
				}
				kcore.log.info("[update-layer] download asset success name = " + name)
				resolve(true)
			})
		})

	}

	updateFinished(s:HotUpdate.LayerStatus) {
		kcore.log.info("[update-layer] update finished s = " + HotUpdate.LayerStatus[s])
		this.opt_.func(s)
	}

	setContent(content:string) {
		this.lblContent.string = content
	}

	// 
	private cur_ = 0
	private total_ = 0
	private per_ = -1
	private sub_ = 0
	setProgress(curIndex:number,totalCount:number) {
		if(totalCount == 0) {
			this.bar.progress = 1
			this.per_ = -1
			return 
		}
		this.cur_ = curIndex
		this.total_ = totalCount
		if(this.per_ < 0) {
			this.per_ = 0
		}
		this.sub_ = (this.cur_ / this.total_) - this.per_
	}

	update(dt) {
		let interval = 1
		if(this.per_ < 0) {
			return 
		}
		let target = this.cur_ / this.total_
		if(this.per_ < target && this.sub_ != 0) {
			let step = (dt / interval) * this.sub_
			this.per_ += step 
		}
		if(this.per_ >= target || this.sub_ == 0) {
			this.per_ = target 
			this.sub_ = 0
		}
		this.bar.progress = cc.misc.clamp01(this.per_)
	}
}

export namespace HotUpdateLayer {
	export let test = 0
}