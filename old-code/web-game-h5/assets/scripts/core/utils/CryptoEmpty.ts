

class _Internal_CryptoEmpty implements kcore.ICrypto {
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
		return t 
	}

	decodeRes(t:any) {
		return t 
	}
}
export let rcCryptoEmpty = new _Internal_CryptoEmpty