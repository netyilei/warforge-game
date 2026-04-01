


import path = require("path")
let fs = null
try {
	fs = require("fs")
} catch(e) {

}
//import fs = require("fs")

export namespace CSVDefine {
	export function loadCsv<T = any>(filename:string,parseFunc?:(lineObj:{[key:string]:string})=>T) {
		let filePath = path.resolve(__dirname,"..","..","..","csv",filename)
		console.log("load csv filepath = " + filePath)
		if(!fs.existsSync(filePath)) {
			console.log("[tools] csv not exist path = " + filePath)
			return [] 
		}
		let data = fs.readFileSync(filePath,"utf-8")
		data = data.replace("\r","")
		let lines = data.split("\n")
		if(lines.length == 0) {
			console.log("[tools] csv format error path = " + filePath)
			return []
		}
		let ret:T[] = []
		let keys = lines[0].split(",")
		for(let i = 1 ; i < lines.length ; i ++) {
			let line = lines[i]
			if(line.length == 0) {
				continue
			}
			let datas = line.split(",")
			let t:any = {}
			for(let j = 0 ; j < keys.length ; j ++) {
				let key = keys[j]
				if(key == null || key.length == 0) {
					continue 
				}
				let data = datas[j]
				t[key] = data 
			}
			if(parseFunc) {
				t = parseFunc(t)
			}
			ret.push(<any>t)
		}
		return ret 
	}

	export function safeParseInt(str:string) {
		if(str == null || str.length == 0) {
			return null
		}
		let ret = parseInt(str)
		if(Number.isNaN(ret)) {
			return null 
		} 
		return ret 
	}
	export function safeParseFloat(str:string) {
		if(str == null || str.length == 0) {
			return null
		}
		let ret = parseFloat(str)
		if(Number.isNaN(ret)) {
			return null 
		} 
		return ret 
	}
}