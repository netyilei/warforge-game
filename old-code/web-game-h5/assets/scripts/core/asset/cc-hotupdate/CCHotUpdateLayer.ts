
import { Config } from "../../Config";
import { UIBoardBase } from "../../ui/UIBoardBase";
import { Web } from "../../web/http_web";
import { BundleMapInfo } from "../BundleDefines";
import { HotUpdate } from "../hotupdate/HotUpdateDefine";


const {ccclass, property, menu} = cc._decorator;

// 平台检测
function isNativeAndroid(): boolean {
	return cc.sys.isNative && cc.sys.os === cc.sys.OS_ANDROID;
}

function isNativeIOS(): boolean {
	return cc.sys.isNative && cc.sys.os === cc.sys.OS_IOS;
}

function isWeb(): boolean {
	return !cc.sys.isNative;
}
// Android原生日志
function androidLog(tag: string, message: string, level: 'D' | 'I' | 'W' | 'E' = 'D') {
	if (!isNativeAndroid()) {
		return;
	}
	
	try {
		let methodName = '';
		switch (level) {
			case 'D': methodName = 'd'; break;
			case 'I': methodName = 'i'; break;
			case 'W': methodName = 'w'; break;
			case 'E': methodName = 'e'; break;
		}
		
		jsb.reflection.callStaticMethod(
			"android/util/Log",
			methodName,
			"(Ljava/lang/String;Ljava/lang/String;)I",
			tag,
			message
		);
	} catch (error) {
		// 如果调用失败，回退到cc.warn
		cc.warn('[androidLog] Failed to call native log: ' + error);
	}
}
function iosLog(tag: string, message: string) {
    if (!isNativeIOS()) return;
    try {
        jsb.reflection.callStaticMethod(
            "xdPlatform",
            "DoLog:",
            JSON.stringify({ tag, message })
        );
    } catch (e) {
        cc.log(message);
    }
}
// 统一的日志函数
function log(message: string,...params: any[]) {
    params = params || []
    if (isNativeAndroid()) { androidLog('FileUtils', message + "\n" + JSON.stringify(params), 'D'); }
    else if (isNativeIOS()) { iosLog('FileUtils', message + "\n" + JSON.stringify(params)); }
    else { cc.log(message, ...params); }
}

function logWarn(message: string,...params: any[]) {
    params = params || []
    if (isNativeAndroid()) { androidLog('FileUtils', message + "\n" + JSON.stringify(params), 'W'); }
    else if (isNativeIOS()) { iosLog('FileUtils', message + "\n" + JSON.stringify(params)); }
    else { cc.warn(message, ...params); }
}

function logError(message: string,...params: any[]) {
    params = params || []
    if (isNativeAndroid()) { androidLog('FileUtils', message + "\n" + JSON.stringify(params), 'E'); }
    else if (isNativeIOS()) { iosLog('FileUtils', message + "\n" + JSON.stringify(params)); }
    else { cc.error(message, ...params); }
}

@ccclass  
@menu("kcore/CCHotUpdateLayer")
export default class CCHotUpdateLayer extends UIBoardBase {
	@property(cc.Asset)
	manifestUrl:cc.Asset = null
	@property(cc.Label)
	lblContent:cc.Label = null
	@property(cc.ProgressBar)
	bar:cc.ProgressBar = null

	private _am:jsb.AssetsManager
	private _updating:boolean 
	private _canRetry:boolean 
	private _failCount:number
	private _storagePath:string
    private _cbCount = 0
    checkCb(event) {
        cc.log('Code: ' + event.getEventCode());
        let doUpdate = false 
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.lblContent.string = "Load config error";
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.lblContent.string = "Load remote failed";
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.lblContent.string = "Up-to-date";
                setTimeout(()=>{
                    kcore.layer.login()
                },100)
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                doUpdate = true 
                this.lblContent.string = "Waiting for update start " + doUpdate + " count = " + (++this._cbCount);
                break;
            default:
                return;
        }
        
        this._am.setEventCallback(null);
        this._updating = false;
        this.lblContent.string = "Waiting for update2 start " + doUpdate;
        if(doUpdate) {
            this.lblContent.string = "Waiting for update3 start " + doUpdate;
            this.readyToUpdate()
        }
    }

    updateCb(event:jsb.EventAssetsManager) {
        var needRestart = false;
        var failed = false;
        switch (event.getEventCode())
        {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.lblContent.string = 'No local manifest file found, hot update skipped.';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
				this.bar.progress = cc.misc.clamp01(event.getPercent());

				this.lblContent.string = "Updating...(" + event.getDownloadedBytes() + ' / ' + event.getTotalBytes() + ")";
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.lblContent.string = 'Fail to download manifest file, hot update skipped.';
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.lblContent.string = 'Already up to date with the latest remote version.';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                this.lblContent.string = 'Update finished. ' + event.getMessage();
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this.lblContent.string = 'Update failed. ' + event.getMessage();
                // this.panel.retryBtn.active = true;
                this._updating = false;
                this._canRetry = true;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                this.lblContent.string = 'Asset update error: ' + event.getAssetId() + ', ' + event.getMessage();
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                this.lblContent.string = event.getMessage();
                break;
            default:
                break;
        }

        if (failed) {
            this._am.setEventCallback(null);
            this._updating = false;
        }

        if (needRestart) {
            this._am.setEventCallback(null);
            // Prepend the manifest's search path
            var searchPaths = jsb.fileUtils.getSearchPaths();
            log("Search paths before update:", searchPaths);
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            log("New search paths from manifest:", newPaths);
            log(JSON.stringify(newPaths));
            for (var i = 0; i < newPaths.length; i++) {
                if (searchPaths.indexOf(newPaths[i]) == -1) {
                    Array.prototype.unshift.apply(searchPaths, [newPaths[i]]);
                }
            }
            log("Search paths after update:", searchPaths);
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            cc.audioEngine.stopAll();
            cc.game.restart();
        }
    }

    
    retry() {
        if (!this._updating && this._canRetry) {
            // this.panel.retryBtn.active = false;
            this._canRetry = false;
            
            this.lblContent.string = 'Retry failed Assets...';
            this._am.downloadFailedAssets();
        }
    }
    
    checkUpdate() {
        if (this._updating) {
            this.lblContent.string = 'Checking or updating ...';
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            // Resolve md5 url
            var url = this.manifestUrl.nativeUrl;
            if (cc.loader.md5Pipe) {
                url = cc.loader.md5Pipe.transformURL(url);
            }
            this._am.loadLocalManifest(url);
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            this.lblContent.string = 'Failed to load local manifest ...';
            return;
        }
        this._am.setEventCallback(this.checkCb.bind(this));

        this._am.checkUpdate();
        this._updating = true;
    }

    hotUpdate() {
        this.lblContent.string = "Starting hot update..." + this._updating
        if (this._am && !this._updating) {
            this._am.setEventCallback(this.updateCb.bind(this));

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                // Resolve md5 url
                var url = this.manifestUrl.nativeUrl;
                if (cc.loader.md5Pipe) {
                    url = cc.loader.md5Pipe.transformURL(url);
                }
                this._am.loadLocalManifest(url);
            }

            this._failCount = 0;
            this._am.update();
            // this.panel.updateBtn.active = false;
            this._updating = true;
        }
    } 
    
    show() {
        // if (this.updateUI.active === false) {
        //     this.updateUI.active = true;
        // }
    }

    private versionCompareHandle:(versionA:string,versionB:string)=>number
    // use this for initialization
    onPush() {
        this.bar.progress = 1
        this.lblContent.string = "Initializing hot update..."
        
        // Prepend the manifest's search path
        var searchPaths = jsb.fileUtils.getSearchPaths();
        log("Search paths onPush:", searchPaths);
        this.startCheck()
    }

    private prevLinkInfo_:HotUpdate.HCGatePT
    async startCheck() {
        // Hot update is only available in Native build
        if (!cc.sys.isNative) {
            return;
        }
        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'blackjack-remote-asset');
        cc.log('Storage path for remote asset : ' + this._storagePath);

        let prevLink = localStorage.getItem("___pt___")
        if(!prevLink) {
            prevLink = window["_pt_"]
            localStorage.setItem("___pt___",prevLink)
        }
        if(prevLink) {
            let link = prevLink
            let leadInfo = null 
            for(let i = 0 ; i < 3 ; i++) {
                let res = await kcore.http.getJson({
                    url:link,timeout:10000,
                    block:"Start loading...",
                    blockForceShow:true,
                })
                if(!res || !res.data) {
                    this.lblContent.string = "load lead config failed " + link + ", retry " + (i+1)
                    logError("[hotupdate-layer] load lead config failed:",res)
                    await kcore.async.timeout(1000)
                    continue
                }
                leadInfo = res.data
                break
            }
            if(!leadInfo) {
                this.lblContent.string = "load lead config failed"
                logError("[hotupdate-layer] load lead config failed, no valid config " + link)
                return 
            }
            this.prevLinkInfo_ = leadInfo
            if(this.prevLinkInfo_.next && this.prevLinkInfo_.next != link) {
                log("[hotupdate-layer] lead url changed: " + this.prevLinkInfo_.next)
                localStorage.setItem("___pt___",this.prevLinkInfo_.next)
                setTimeout(()=>{
                    cc.game.restart()
                },100)
                return 
            }
            let loginUrl:string 
            let update:string 
            if(this.prevLinkInfo_.infos && this.prevLinkInfo_.infos.length > 0) {
                this.lblContent.string = "Pinging servers..."
                for(let info of this.prevLinkInfo_.infos) {
                    let pingUrl = info.ping
                    this.lblContent.string = "Pinging " + pingUrl + " ..."
                    let res = await kcore.http.getJson({
                        url:pingUrl,timeout:5000,
                    })
                    if(res && res.data) {
                        loginUrl = info.login
                        update = info.update
                        log("[hotupdate-layer] ping success:",pingUrl)
                        break 
                    }
                }
                loginUrl = loginUrl || this.prevLinkInfo_.login
                update = update || this.prevLinkInfo_.update
                log("[hotupdate-layer] ping failed, use default")
            } else {
                loginUrl = this.prevLinkInfo_.login
                update = this.prevLinkInfo_.update  
                log("[hotupdate-layer] no ping info, use default")
            }
            Config.changeLoginUrl(loginUrl)
            log("[hotupdate-layer] use login url:",loginUrl)
            
            let manifestPath = this._storagePath + "project.manifest"
            if(jsb.fileUtils.isFileExist(manifestPath)) {
                let manifestStr = jsb.fileUtils.getStringFromFile(manifestPath)
                if(manifestStr) {
                    let manifestObj = JSON.parse(manifestStr)
                    manifestObj.packageUrl = update 
                    manifestObj.remoteManifestUrl = update + "/project.manifest"
                    manifestObj.remoteVersionUrl = update + "/version.manifest"
                    let newManifestStr = JSON.stringify(manifestObj,null,2)
                    jsb.fileUtils.writeStringToFile(newManifestStr,manifestPath)
                    log("[hotupdate-layer] update manifest urls:",{
                        packageUrl:manifestObj.packageUrl,
                        remoteManifestUrl:manifestObj.remoteManifestUrl,
                        remoteVersionUrl:manifestObj.remoteVersionUrl,
                    })
                }
            } else {
                let nativeUrl = this.manifestUrl.nativeUrl
                if (cc.loader.md5Pipe) {
                    nativeUrl = cc.loader.md5Pipe.transformURL(nativeUrl);
                }
                let manifestStr = jsb.fileUtils.getStringFromFile(nativeUrl)
                if(manifestStr) {
                    let manifestObj = JSON.parse(manifestStr)
                    manifestObj.packageUrl = update 
                    manifestObj.remoteManifestUrl = update + "/project.manifest"
                    manifestObj.remoteVersionUrl = update + "/version.manifest"
                    let newManifestStr = JSON.stringify(manifestObj,null,2)
                    jsb.fileUtils.writeStringToFile(newManifestStr,manifestPath)
                    log("[hotupdate-layer] create manifest with updated urls:",{
                        packageUrl:manifestObj.packageUrl,
                        remoteManifestUrl:manifestObj.remoteManifestUrl,
                        remoteVersionUrl:manifestObj.remoteVersionUrl,
                    })
                }
            }
        }

        // Setup your own version compare handler, versionA and B is versions in string
        // if the return value greater than 0, versionA is greater than B,
        // if the return value equals 0, versionA equals to B,
        // if the return value smaller than 0, versionA is smaller than B.
        this.versionCompareHandle = function (versionA, versionB) {
            cc.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
            var vA = versionA.split('.');
            var vB = versionB.split('.');
            for (var i = 0; i < vA.length; ++i) {
                var a = parseInt(vA[i]);
                var b = parseInt(vB[i] || "0");
                if (a === b) {
                    continue;
                }
                else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            }
            else {
                return 0;
            }
        };

        // Init with empty manifest url for testing custom manifest
        this._am = new jsb.AssetsManager('', this._storagePath, this.versionCompareHandle);

        // Setup the verification callback, but we don't have md5 check function yet, so only print some message
        // Return true if the verification passed, otherwise return false
        this._am.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            var compressed = asset.compressed;
            // Retrieve the correct md5 value.
            var expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            var relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            var size = asset.size;
            if (compressed) {
                // panel.info.string = "Verification passed : " + relativePath;
                return true;
            }
            else {
                // panel.info.string = "Verification passed : " + relativePath + ' (' + expectedMD5 + ')';
                return true;
            }
        });

        this.lblContent.string = 'Hot update is ready, please check or directly update.';

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            // this._am.setMaxConcurrentTask(2);
            this.lblContent.string = "Max concurrent tasks count have been limited to 2";
        }
        
        // this.panel.fileProgress.progress = 0;
        // this.panel.byteProgress.progress = 0;

        this.checkUpdate();
    }

    async readyToUpdate() {
        this.lblContent.string = "Ready to update..."
        await kcore.async.timeout(1)
        let local = this._am.getLocalManifest()
        let remote = this._am.getRemoteManifest()
        let ver1 = local.getVersion().split(".")[0]
        let ver2 = remote.getVersion().split(".")[0]
        if(ver1 !== ver2) {
            this.lblContent.string = "Major version changed"
            let appJsonUrl = remote.getPackageUrl() + "/app.json"
            let res = await kcore.http.getJson({
                url:appJsonUrl,timeout:10000,
                block:"Loading update info...",
                blockForceShow:true,
            })
            if(!res || !res.data) {
                this.lblContent.string = "load major update info failed"
                logError("[hotupdate-layer] load update info failed:",res)
                return 
            }
            let info = res.data as HotUpdate.HAppJson
            if(cc.sys.os == cc.sys.OS_IOS) {
                cc.sys.openURL(info.ios_app_url)
            } else {
                cc.sys.openURL(info.android_app_url)
            }
            return 
        }
        await kcore.async.timeout(1)
        this.hotUpdate()
    }
    onDestroy() {
        this._am && this._am.setEventCallback(null);
    }
}
