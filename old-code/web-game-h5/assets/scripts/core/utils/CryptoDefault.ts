
import pako = require("pako");
import { rcApis } from "./Utils";

class _Internal_Crypto implements kcore.ICrypto {
	encode(data:string) {

	}

	decode(data:string) {

	}

	// encodeReq(t:any) {
	// 	let str = JSON.stringify(t)
	// 	let arr = rcApis.StringToUint8Array(str)
	// 	let bStr = rcApis.Uint8ArrayToBase64(arr)
	// 	let data = rcApis.gzip(bStr)
	// 	return {
	// 		_et:data
	// 	}
	// }

	// decodeRes(t:any) {
	// 	if(!t._et) {
	// 		return t
	// 	}
	// 	let data = t._et
	// 	let bStr = rcApis.gunzip(data)
	// 	let arr = rcApis.base64ToUint8Array(bStr)
	// 	let str = rcApis.Uint8ArrayToString(arr)
	// 	let ret = JSON.parse(str)
	// 	return ret 
	// }
	encodeReq(t:any) {
		let str = JSON.stringify(t)
		let arr = rcApis.gzipArr(str)
		let n = Math.floor(arr.length / 2)
		let len = arr.length
		for(let i = 0 ; i < n ; i +=2) {
			let to = len - i - 1
			let c = arr[i]
			arr[i] = arr[to]
			arr[to] = c 
		}
		return {
			dd:rcApis.Uint8ArrayToBase64(arr)
		}
	}

	decodeRes(t:any) {
		if(!t.dd) {
			return t
		}
		let data = t.dd
		let arr = rcApis.base64ToUint8Array(data)
		let n = Math.floor(arr.length / 2)
		let len = arr.length
		for(let i = 0 ; i < n ; i +=2) {
			let to = len - i - 1
			let c = arr[i]
			arr[i] = arr[to]
			arr[to] = c 
		}
		let str = rcApis.gunzipArr(arr)
		let ret = JSON.parse(str)
		return ret 
	}
}
export let rcCrypto = new _Internal_Crypto