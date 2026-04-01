import { fileLogs } from "../utils/FileUtils"

class _Internal_Http implements kcore.IHttp {
	async postJson(params:{
		url:string,
		headers?:Map<string,string>,
		data:any,
		timeout?:number,
		block?:string,
		blockForceShow?:boolean,
	}):Promise<kcore.HttpReturnValue> {
		return new Promise<kcore.HttpReturnValue>((resolve,reject)=>{
			let rt = {
				stoped:false,
				stop:()=>{
					if(rt.stoped) {
						return false 
					}
					rt.stoped = true 
					return true 
				}
			}
			let blocker = params.block ? kcore.block.create(params.block) : null
			blocker ? blocker.start(params.blockForceShow) : null
			kcore.log.info("[Web] post url = " + params.url)
			let http = cc.loader.getXMLHttpRequest()
			http.onload = function() {
				blocker ? blocker.stop() : null
				if(rt.stop() == false) {
					return 
				}
				if(http.status == 200) {
					let data = http.responseText
					kcore.log.info("[Web] received text = " + data + " | url = " + params.url)
					let t = JSON.parse(data)
					resolve({
						data:t,
						error:null
					})
				} else {
					kcore.log.info("[Web] received text = undefined error | url = " + params.url + " code = " + http.status)
					resolve({
						data:null,
						error:"http error code = " + http.status,
					})
				}
			}
			http.onerror = function(evt) {
				//kcore.log(evt)
				kcore.log.info("[Web] post failed url = " + params.url)
				blocker ? blocker.stop() : null 
				if(rt.stop()) {
					resolve({
						data:null,
						error:evt,
					})
				}
			}
			http.onreadystatechange = function(evt) {
				if(http.readyState == 4) {
					blocker ? blocker.stop() : null 
				}
			}
			http.ontimeout = function(evt) {
				kcore.log.info("[Web] post timeout url = " + params.url)
				blocker ? blocker.stop() : null
				if(rt.stop()) {
					resolve({
						data:null,
						error:"post timeout",
					})
				}
			}
			http.open("POST",params.url,true)
			http.timeout = params.timeout || 10000
			if(params.headers) {
				params.headers.forEach((v,k)=>{
					http.setRequestHeader(k,v)
				})
			}
			if(params.data == null) {
				http.send()
			} else {
				http.setRequestHeader("Content-Type","application/json")
				let str = JSON.stringify(params.data)
				http.send(str)
				kcore.log.info("[Web] log data = " + str)
			}
		})
	}

	async get(params:{
		url:string,
		headers?:Map<string,string>,
		timeout?:number,
		block?:string,
		blockForceShow?:boolean,
	}):Promise<kcore.HttpReturnValue> {
		return new Promise<kcore.HttpReturnValue>((resolve,reject)=>{
			let rt = {
				stoped:false,
				stop:()=>{
					if(rt.stoped) {
						return false 
					}
					rt.stoped = true 
					return true 
				}
			}
			let blocker = params.block ? kcore.block.create(params.block) : null
			blocker ? blocker.start(params.blockForceShow) : null
			kcore.log.info("[Web] get url = " + params.url)
			let http = new XMLHttpRequest()
			http.onreadystatechange = function() {
				if(http.readyState == 4) {
					blocker ? blocker.stop() : null
					if(rt.stop() == false) {
						return 
					}
					if(http.status == 200) {
						let data = http.responseText
						kcore.log.info("[Web] received text = " + data + " | url = " + params.url)
						resolve({
							data:data,
							error:null,
						})
					} else {
						kcore.log.info("[Web] response error url = " + params.url + " ")
						resolve({
							data:null,
							error:"http get error code = " + http.status
						})
					}
				}
			}
			http.onerror = function(evt) {
				//kcore.log(evt)
				kcore.log.info("[Web] get failed url = " + params.url)
				blocker ? blocker.stop() : null
				if(rt.stop()) {
					resolve({
						data:null,
						error:evt,
					})
				}
			}
			http.ontimeout = function(evt) {
				kcore.log.info("[Web] get timeout url = " + params.url)
				blocker ? blocker.stop() : null
				if(rt.stop()) {
					resolve({
						data:null,
						error:"get timeout"
					})
				}
			}
			http.open("GET",params.url,true)
			http.timeout = params.timeout || 10000
			if(params.headers) {
				params.headers.forEach((v,k)=>{
					http.setRequestHeader(k,v)
				})
			}
			http.send()
		})
	}
	async getJson(params:{
		url:string,
		headers?:Map<string,string>,
		timeout?:number,
		block?:string,
		blockForceShow?:boolean,
	}):Promise<kcore.HttpReturnValue> {
		let ret = await this.get(params)
		if(ret && ret.data) {
			try {
				ret.data = JSON.parse(ret.data)
			} catch (error) {
				kcore.log.error("",error)
			}
		}
		return ret 
	}
}

export const rcHttp = new _Internal_Http
class _Internal_HttpAK implements kcore.IHttpAK {
	ak:string
	private loginUrl_:string = null 
	get loginUrl() {
		return this.loginUrl_
	}
	set loginUrl(v) {
		if(!v) {
			this.loginUrl_ = v 
			return 
		}
		if(v[v.length - 1] != "/") {
			v = v + "/"
		}
		this.loginUrl_ = v
	}

	private lobbyUrl_:string = null 
	get lobbyUrl() {
		return this.lobbyUrl_
	}
	set lobbyUrl(v) {
		if(!v) {
			this.lobbyUrl_ = v 
			return 
		}
		if(v[v.length - 1] != "/") {
			v = v + "/"
		}
		this.lobbyUrl_ = v
	}

	private customerUrl_:string = null 
	get customerUrl() {
		return this.customerUrl_
	}
	set customerUrl(v) {
		if(!v) {
			this.customerUrl_ = v 
			return 
		}
		if(v[v.length - 1] != "/") {
			v = v + "/"
		}
		this.customerUrl_ = v
	}

	private crypto_:kcore.ICrypto
	get crypto() {
		// if(this.crypto_ === undefined) {
		// 	this.crypto_ = kcore.crypto
		// }
		return this.crypto_ 
	}
	set crypto(v) {
		this.crypto_ = v
	}

	private _parsePath(path:string) {
		if(path[0] == "/") {
			return path.slice(1)
		}
		return path 
	}
	async postJson(params:{
		path:string,
		headers?:Map<string,string>,
		data:any,
		timeout?:number,
		ignoreAK?:boolean,
		block?:string,
		blockForceShow?:boolean,
	}):Promise<kcore.HttpReturnValue> {
		let path = this._parsePath(params.path)
		let data = params.data || {}
		if(!params.ignoreAK) {
			data.ak = this.ak
		}
		if(this.crypto) {
			data = this.crypto.encodeReq(data)
		}
		path = (params.ignoreAK ? this.loginUrl : this.lobbyUrl) + path
		let res = await rcHttp.postJson({
			url:path,
			headers:params.headers,
			data:data,
			timeout:params.timeout,
			block:params.block,
			blockForceShow:params.blockForceShow,
		})
		if(res && res.data && this.crypto) {
			res.data = this.crypto.decodeRes(res.data)
		}
		return res
	}
	async postCustomerJson(params:{
		path:string,
		headers?:Map<string,string>,
		data:any,
		timeout?:number,
		ignoreAK?:boolean,
		block?:string,
		blockForceShow?:boolean,
	}):Promise<kcore.HttpReturnValue> {
		let path = this._parsePath(params.path)
		let data = params.data || {}
		if(!params.ignoreAK) {
			data.ak = this.ak
		}
		if(this.crypto) {
			data = this.crypto.encodeReq(data)
		}
		path = this.customerUrl + path
		let res = await rcHttp.postJson({
			url:path,
			headers:params.headers,
			data:data,
			timeout:params.timeout,
			block:params.block,
			blockForceShow:params.blockForceShow,
		})
		if(res && res.data && this.crypto) {
			res.data = this.crypto.decodeRes(res.data)
		}
		return res
	}

	async upload(params:{
		path:string,
		pathType:"login" | "lobby" | "customer",
		file:File,
		tag:string,
	}) {
		let path = this._parsePath(params.path)
		let ak:string
		if(params.pathType == "login") {
			path = this.loginUrl + path
		} else if(params.pathType == "lobby") {
			path = this.lobbyUrl + path
			ak = this.ak
		} else if(params.pathType == "customer") {
			path = this.customerUrl + path
			ak = this.ak
		}
		
		// 原生平台：手动构造multipart/form-data
		if (cc.sys.isNative && (params.file as any).filePath) {
			fileLogs.log('[HTTP] Native platform detected, building multipart/form-data');
			return new Promise<any>(async (resolve,reject)=>{
				try {
					const xhr = new XMLHttpRequest();
					const fileObj = params.file as any;
					
					// 从文件路径直接读取文件内容
					fileLogs.log('[HTTP] Reading file from path: ' + fileObj.filePath);
					let fileBytes: Uint8Array;
					
					try {
						// 使用jsb.fileUtils读取二进制数据
						if (typeof jsb !== 'undefined' && jsb.fileUtils) {
							// 优先使用getDataFromFile（返回ArrayBuffer）
							if (typeof (jsb.fileUtils as any).getDataFromFile === 'function') {
								const fileBuffer = (jsb.fileUtils as any).getDataFromFile(fileObj.filePath);
								if (fileBuffer && fileBuffer.byteLength > 0) {
									fileBytes = new Uint8Array(fileBuffer);
									fileLogs.log('[HTTP] File read with getDataFromFile, size: ' + fileBytes.byteLength + ' bytes');
								} else {
									fileLogs.logError('[HTTP] getDataFromFile returned empty buffer');
									resolve(null);
									return;
								}
							} else if (typeof (jsb.fileUtils as any).getStringFromFile === 'function') {
								// 对于二进制文件，getStringFromFile不适用
								// 但我们可以尝试手动从字符串转换
								const str = (jsb.fileUtils as any).getStringFromFile(fileObj.filePath);
								if (str && str.length > 0) {
									// 将字符串转为字节数组（Latin-1编码）
									fileBytes = new Uint8Array(str.length);
									for (let i = 0; i < str.length; i++) {
										fileBytes[i] = str.charCodeAt(i) & 0xFF;
									}
									fileLogs.log('[HTTP] File read with getStringFromFile, size: ' + fileBytes.byteLength + ' bytes');
								} else {
									fileLogs.logError('[HTTP] getStringFromFile returned empty string');
									resolve(null);
									return;
								}
							} else {
								fileLogs.logError('[HTTP] jsb.fileUtils has no suitable read method');
								resolve(null);
								return;
							}
						} else {
							fileLogs.logError('[HTTP] jsb.fileUtils not available');
							resolve(null);
							return;
						}
					} catch (e) {
						fileLogs.logError('[HTTP] Failed to read file: ' + e);
						resolve(null);
						return;
					}
					
					// 生成boundary
					const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
					
					// 手动字符串转字节数组的辅助函数（不使用TextEncoder）
					const stringToBytes = (str: string): Uint8Array => {
						const bytes = new Uint8Array(str.length);
						for (let i = 0; i < str.length; i++) {
							bytes[i] = str.charCodeAt(i) & 0xFF;
						}
						return bytes;
					};
					
					// 手动构造multipart/form-data body
					const parts: Uint8Array[] = [];
					
					// 开始boundary
					parts.push(stringToBytes('--' + boundary + '\r\n'));
					parts.push(stringToBytes(`Content-Disposition: form-data; name="${params.tag}"; filename="${fileObj.fileName || 'file'}"\r\n`));
					parts.push(stringToBytes(`Content-Type: ${fileObj.type || 'application/octet-stream'}\r\n\r\n`));
					
					// 文件数据
					parts.push(fileBytes);
					
					// 结束boundary
					parts.push(stringToBytes('\r\n--' + boundary + '--\r\n'));
					
					// 计算总大小
					let totalLength = 0;
					for (const part of parts) {
						totalLength += part.byteLength;
					}
					
					// 合并所有部分
					const body = new Uint8Array(totalLength);
					let offset = 0;
					for (const part of parts) {
						body.set(part, offset);
						offset += part.byteLength;
					}
					
					fileLogs.log('[HTTP] Multipart body created, size: ' + body.byteLength + ' bytes');
					
					xhr.onload = () => {
						if (xhr.status >= 200 && xhr.status < 300) {
							fileLogs.log('✅ 上传成功:' + xhr.responseText);
							try {
								const res = JSON.parse(xhr.responseText);
								resolve(res)
							} catch (e) {
								fileLogs.logWarn('响应不是 JSON' + e);
								resolve(null)
							}
						} else {
							fileLogs.logError('❌ 上传失败，状态码:' + xhr.status);
							resolve(null)
						}
					};
					
					xhr.onerror = () => {
						fileLogs.logError('❌ 网络错误');
						resolve(null)
					};
					
					xhr.onabort = () => {
						fileLogs.logWarn('⚠️ 上传被中止');
						resolve(null)
					};
					
					xhr.open('POST', path, true);
					if(ak) {
						xhr.setRequestHeader("Authorization", ak)
					}
					xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
					
					fileLogs.log('[HTTP] Sending multipart request...');
					xhr.send(body.buffer);
				} catch (error) {
					fileLogs.logError('❌ 上传异常:' + error);
					resolve(null);
				}
			})
		}
		
		// Web平台：原有逻辑
		return new Promise<any>(async (resolve,reject)=>{
			const xhr = new XMLHttpRequest();
			const formData = new FormData();

			// 添加文件字段（字段名需与后端 Multer 配置一致）
			formData.append(params.tag, params.file); // 第三个参数是 filename（可选）

			// 设置请求完成回调
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					fileLogs.log('✅ 上传成功:' + xhr.responseText);
					// 可解析 JSON 响应
					try {
						const res = JSON.parse(xhr.responseText);
						// 处理成功逻辑
						resolve(res)
					} catch (e) {
						fileLogs.logWarn('响应不是 JSON');
					}
				} else {
					fileLogs.logError('❌ 上传失败，状态码:' + xhr.status);
				}
				resolve(null)
			};

			xhr.onerror = () => {
				fileLogs.logError('❌ 网络错误或跨域问题');
				resolve(null)
			};

			xhr.onabort = () => {
				fileLogs.logWarn('⚠️ 上传被中止');
				resolve(null)
			};

			// 【可选】监听上传进度
			// xhr.upload.onprogress = (event) => {
			// 	if (event.lengthComputable) {
			// 		const percent = (event.loaded / event.total) * 100;
			// 		fileLogs.log(`上传进度: ${percent.toFixed(1)}%`);
			// 		// 可更新 UI 进度条
			// 	}
			// };

			// 打开请求（POST 到你的注册接口）
			xhr.open('POST', path, true);
			if(ak) {
				xhr.setRequestHeader("Authorization", ak)
			}

			// ⚠️ 关键：不要设置 Content-Type！
			// xhr.setRequestHeader('Content-Type', 'multipart/form-data'); // ❌ 绝对不要加这行！

			// 发送请求
			xhr.send(formData);
		})
	}
}

export const rcHttpAK = new _Internal_HttpAK
