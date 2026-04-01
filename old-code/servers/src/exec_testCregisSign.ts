

import md5 = require("md5")
let key = "f502a9ac9ca54327986f29c03b271491"

let t = {
  "pid": 1382528827416576,
  "currency": "195@195",
  "address": "TXsmKpEuW7qWnXzJLGP9eDLvWPR2GRn1FS",
  "amount": "1.1",
  "remark": "payout",
  "third_party_id": "19faf9d3c8f34caf926f332f3021e887",
  "callback_url": "http://192.168.2.29:9099/callback",
  "nonce": "mb8udu",
  "timestamp": 1688003966801
}

export function sign(data:any) {
	let keys = Object.keys(data)
	let idx = keys.indexOf("sign")
	if(idx >= 0) {
		keys.splice(idx,1)
	}
	keys.sort()
	let str = ""
	for(let k of keys) {
		str += k + data[k]
	}
	str = key + str 

	console.log("sign str ",str)
	return md5(str)
}
async function main() {
	
	console.log(sign(t))
	console.log("> done")
	process.exit()
}

main()