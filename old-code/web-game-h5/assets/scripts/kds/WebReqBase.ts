import { rcCrypto } from "../core/utils/CryptoDefault"
import { Web } from "../core/web/http_web"


export namespace WebReqBase {
	let loginUrl = ""
	let lobbyUrl = ""
	let ak:string = null
	let defaultError = {
		errCode:-1,
		errMsg:"404错误"
	}
	export function req<ReqType = any,ResType = any>(path:string,blockContent?:string) {
		return async function(jsonObj:ReqType) {
			let data:any = jsonObj
			data = data || {}
			cc.log("",data)
			// data = rcCrypto.encodeReq(data)
			let ret = <ResType>(await Web.postUrlAsync(loginUrl + path,data) || defaultError)
			if(ret) {
				// ret = rcCrypto.decodeRes(ret)
				cc.log("",ret)
			}
			return ret 
		}
	}

	export function reqAK<ReqType = any,ResType = any>(path:string,blockContent?:string) {
		return async function(jsonObj:ReqType) {
			let data:any = jsonObj
			data = data || {}
			cc.log("",data)
			data.ak = ak
			// data = rcCrypto.encodeReq(data)
			let ret = <ResType>(await Web.postUrlAsync(lobbyUrl + path,data) || defaultError)
			if(ret) {
				// ret = rcCrypto.decodeRes(ret)
				cc.log("",ret)
			}
			return ret 
		}
	}

	function normalizeUrl(url:string) {
		let c = url[url.length - 1]
		if(c != "/") {
			url += "/"
		}
		return url 
	}
	
	export function setLoginUrl(url:string) {
		loginUrl = normalizeUrl(url)
	}

	export function setLobbyUrl(url:string) {
		lobbyUrl = normalizeUrl(url)
	}

	export function setAK(str:string) {
		ak = str 
	}

	export function getAK() {
		return ak
	}
}