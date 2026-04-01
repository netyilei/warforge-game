import { UserDefine } from "../../pp-base-define/UserDefine";
import { Rpc } from "../rpc";
import { kdRpcMsg } from "kdweb-core/lib/rpc/protocols";
import { kdutils } from "kdweb-core/lib/utils";
import { ServerConfig } from "../../pp-base-define/ServerConfig";
import { Config } from "../config";
import request = require("request")
import { Log } from "../log";
import { IDUtils } from "../../src/IDUtils";
export namespace LoginHeler {
	export async function getNewUserID() {
		return await IDUtils.getUserID()
	}
	export async function getNewGuestID() {
		return await IDUtils.getGuestID()
	}
	export function isPhoneNum(phoneNum:string) {
		if(/^[1][3,4,5,7,8,9][0-9]{9}$/.test(phoneNum)){ 
			return true
		} 
		return false 
	}
	export function isAddress(address:string) {
		return /^0x[a-fA-F0-9]{40}$/.test(address)
	}

	export function getUserLoginData(loginData:UserDefine.tLoginData) {
		loginData = UserDefine.getUserSideLoginData(loginData)
		if(loginData.nickName) {
			if(loginData.nickName.length > UserDefine.nickNameMaxLen) {
				loginData.nickName.slice(0,UserDefine.nickNameMaxLen) + "..."
			}
		}
		return loginData
	}

	export function getApiIDWithPhone(areaID:string,phoneNum:string) {
		return "AREA:" + areaID + "_" + phoneNum
	}

	export function selectLobbyService(areaID?:string) {
		let lobbys = Rpc.delegate.getLobbyInfos(areaID)
		if(lobbys.length == 0) {
			return null
		}
		let lobby = lobbys[kdutils.intRandom(0,lobbys.length)]
		return lobby.host
	}

	let lobbyUrls = new Map<string,string>()
	export function getLobbyUrl(name:string) {
		return lobbyUrls.get(name)
	}

	export function setLobbyUrl(name:string,url:string) {
		lobbyUrls.set(name,url)
	}

	let billUrls = new Map<string,string>()
	export function getBillUrl(name:string) {
		return billUrls.get(name)
	}

	export function setBillUrl(name:string,url:string) {
		billUrls.set(name,url)
	}

	
	let wechatIconPrefixs = ["https://thirdwx.qlogo.cn"]
	let iconUploadOriginTablename = "t_icon_upload_mutex"
	let iconUploadCacheTablename = "t_icon_upload_mutex"
	async function downloadIcon(url:string) {
		Log.oth.info("start donwload icon url = " + url)
		return new Promise<string>(function(resolve,reject) {
			request(url,function(error,response,body) {
				if(error) {
					Log.oth.error("download url failed url = " + url,error)
					resolve(null)
					return 
				}
				if(response.statusCode == 200) {
					if(body instanceof Buffer) {
						resolve(body.toString("base64"))
						return 
					}
					Log.oth.error("download url failed type error url = " + url,body)
				} else {
					Log.oth.error("download url failed code = " + response.statusCode + " | url = " + url)
				}
				resolve(null)
				return;
			})
		})
	}

	function getIconOSSPath(userID:number) {
		return "wicon-fk/u" + userID + ".jpg"
	}

	export async function operWechatIcon(userID:number,url:string) {
		// if(url == null || url == "NULL") {
		// 	return "NULL"
		// }
		// url += "?a=a.jpg"
		// let originUrl:string = await Rpc.center.callException("kds.dbp.kv.gett",iconUploadOriginTablename,userID.toString())
		// let cacheUrl:string 
		// if(originUrl != url) {
		// 	let data = await downloadIcon(url)
		// 	if(data) {
		// 		let ossPath = getIconOSSPath(userID)
		// 		cacheUrl = <string>await Rpc.center.callException("kds.oss.upload",null,ossPath,data)
		// 		if(cacheUrl == null) {
		// 			Log.oth.error("oss upload failed path = " + ossPath + " | icon = " + url)
		// 		} else {
		// 			Rpc.center.callException("kds.dbp.kv.sett",iconUploadOriginTablename,userID.toString(),url)
		// 			Rpc.center.callException("kds.dbp.kv.sett",iconUploadCacheTablename,userID.toString(),cacheUrl)
		// 		}
		// 	}
		// }
		// if(cacheUrl == null) {
		// 	cacheUrl = await Rpc.center.callException("kds.dbp.kv.gett",iconUploadCacheTablename,userID.toString()) 
		// }
		// return cacheUrl || "NULL"
		return "NULL"
	}
}