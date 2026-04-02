

var mime = {'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'bmp': 'image/bmp'};
var mimeReverse = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/bmp': 'bmp'};

function myCreateObjectURL(obj){
	if(window.URL != undefined) {
		return window.URL.createObjectURL(obj);
	}
	return <string>window['webkitURL']['createObjectURL'](obj);
}

function myRevokeObjectUrl(uri) {
	if(window.URL != undefined) {
		return window.URL.revokeObjectURL(uri);
	}
	window['webkitURL']['revokeObjectURL'](uri);
}

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

// 根据文件名获取MIME类型
function getMimeType(filename: string): string {
	const ext = filename.match(/\.([^\.]+)$/i)?.[1]?.toLowerCase();
	const mimeTypes: { [key: string]: string } = {
		// 图片
		'png': 'image/png',
		'jpg': 'image/jpeg',
		'jpeg': 'image/jpeg',
		'gif': 'image/gif',
		'webp': 'image/webp',
		'bmp': 'image/bmp',
		'svg': 'image/svg+xml',
		'ico': 'image/x-icon',
		// 文档
		'pdf': 'application/pdf',
		'doc': 'application/msword',
		'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'xls': 'application/vnd.ms-excel',
		'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'ppt': 'application/vnd.ms-powerpoint',
		'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		// 文本
		'txt': 'text/plain',
		'csv': 'text/csv',
		'html': 'text/html',
		'css': 'text/css',
		'js': 'text/javascript',
		'json': 'application/json',
		'xml': 'application/xml',
		// 音频
		'mp3': 'audio/mpeg',
		'wav': 'audio/wav',
		'ogg': 'audio/ogg',
		'm4a': 'audio/mp4',
		// 视频
		'mp4': 'video/mp4',
		'webm': 'video/webm',
		'avi': 'video/x-msvideo',
		'mov': 'video/quicktime',
		// 压缩包
		'zip': 'application/zip',
		'rar': 'application/x-rar-compressed',
		'7z': 'application/x-7z-compressed',
		'tar': 'application/x-tar',
		'gz': 'application/gzip',
	};
	return mimeTypes[ext || ''] || 'application/octet-stream';
}

// FormData Polyfill for Native platforms
if ((isNativeAndroid() || isNativeIOS()) && typeof FormData === 'undefined') {
	log('Installing FormData polyfill for native platform');
	
	(window as any).FormData = class FormDataPolyfill {
		private data: Map<string, any>;
		
		constructor() {
			this.data = new Map();
		}
		
		append(name: string, value: any, filename?: string) {
			if (value && typeof value === 'object' && (value.filePath || value.blob)) {
				// 这是我们的File-like对象
				this.data.set(name, {
					type: 'file',
					value: value,
					filename: filename || value.name || value.fileName || 'file'
				});
			} else {
				this.data.set(name, {
					type: 'string',
					value: String(value)
				});
			}
		}
		
		delete(name: string) {
			this.data.delete(name);
		}
		
		get(name: string) {
			const item = this.data.get(name);
			return item ? item.value : null;
		}
		
		getAll(name: string) {
			const item = this.data.get(name);
			return item ? [item.value] : [];
		}
		
		has(name: string) {
			return this.data.has(name);
		}
		
		set(name: string, value: any, filename?: string) {
			this.append(name, value, filename);
		}
		
		entries() {
			return Array.from(this.data.entries()).map(([key, item]) => [key, item.value]);
		}
		
		keys() {
			return Array.from(this.data.keys());
		}
		
		values() {
			return Array.from(this.data.values()).map(item => item.value);
		}
		
		forEach(callback: (value: any, key: string, parent: any) => void) {
			this.data.forEach((item, key) => {
				callback(item.value, key, this);
			});
		}
		
		// 内部方法，用于获取原始数据
		_getData() {
			return this.data;
		}
	};
	
	log('FormData polyfill installed successfully');
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
function log(message: string) {
    if (isNativeAndroid()) { androidLog('FileUtils', message, 'D'); }
    else if (isNativeIOS()) { iosLog('FileUtils', message); }
    else { cc.log(message); }
}

function logWarn(message: string) {
    if (isNativeAndroid()) { androidLog('FileUtils', message, 'W'); }
    else if (isNativeIOS()) { iosLog('FileUtils', message); }
    else { cc.warn(message); }
}

function logError(message: string) {
    if (isNativeAndroid()) { androidLog('FileUtils', message, 'E'); }
    else if (isNativeIOS()) { iosLog('FileUtils', message); }
    else { cc.error(message); }
}

export let fileLogs = {
	log,
	logWarn,
	logError
}
// Native文件选择结果
type NativeFilePickerResult = {
	filePath: string;
	fileName: string;
	resultCode: number; // 0=成功, 1=取消, -1=失败
}

// 全局回调队列，用于处理原生文件选择回调
let nativeFilePickerCallbacks: Array<{
	resolve: (result: NativeFilePickerResult) => void;
	reject: (error: any) => void;
}> = [];

// 全局回调函数，由原生层调用
(window as any).onNativeFilePickerResult = function(filePath: string, fileName: string, resultCode: number) {
	log('Native file picker result: ' + filePath + ', ' + fileName + ', code=' + resultCode);
	
	if (nativeFilePickerCallbacks.length > 0) {
		const callback = nativeFilePickerCallbacks.shift();
		callback.resolve({ filePath, fileName, resultCode });
	}
};
(window as any).rcNativeFilePickerResult = function(str) {
	let t = {}
	if(str && str.length > 0) {
		try {
			t = JSON.parse(str)
		} catch (error) {
			logError('Failed to parse native file picker result: ' + error);
		}
	}
	let filePath = t['filePath'] || '';
	let fileName = t['fileName'] || '';
	let resultCode = t['resultCode'];
	resultCode = typeof resultCode === 'number' ? resultCode : -1; // 确保resultCode是数字

	log('Native file picker result: ' + filePath + ', ' + fileName + ', code=' + resultCode);
	
	if (nativeFilePickerCallbacks.length > 0) {
		const callback = nativeFilePickerCallbacks.shift();
		callback.resolve({ filePath, fileName, resultCode });
	}
};

/**
 * 读取原生平台文件内容
 */
function readNativeFile(filePath: string): ArrayBuffer {
	log('readNativeFile called for: ' + filePath);
	
	if (typeof jsb !== 'undefined' && jsb.fileUtils) {
		log('jsb.fileUtils available');
		// 尝试使用jsb.fileUtils读取文件
		try {
			// 某些版本的Cocos Creator使用getDataFromFile
			if (typeof (jsb.fileUtils as any).getDataFromFile === 'function') {
				log('Using getDataFromFile');
				const data = (jsb.fileUtils as any).getDataFromFile(filePath);
				log('getDataFromFile returned, size: ' + (data ? data.byteLength : 0));
				return data;
			}
			// 某些版本使用getStringFromFile
			if (typeof (jsb.fileUtils as any).getStringFromFile === 'function') {
				log('Using getStringFromFile');
				const str = (jsb.fileUtils as any).getStringFromFile(filePath);
				log('getStringFromFile returned, length: ' + (str ? str.length : 0));
				// 手动将字符串转换为ArrayBuffer（不使用TextEncoder）
				const bytes = new Uint8Array(str.length);
				for (let i = 0; i < str.length; i++) {
					bytes[i] = str.charCodeAt(i) & 0xFF;
				}
				return bytes.buffer;
			}
			logWarn('Neither getDataFromFile nor getStringFromFile available');
		} catch (error) {
			logError('Error reading file with jsb.fileUtils: ' + error);
		}
	} else {
		logWarn('jsb or jsb.fileUtils not available');
	}
	
	// 如果上述方法都失败，返回空的ArrayBuffer
	logWarn('Unable to read native file, returning empty buffer');
	return new ArrayBuffer(0);
}

export namespace FileUtils {
	export type SelectLocalFileRet = {
		uri:string,
		ext:string,
		blob:Blob,
		// 原生平台特有字段
		filePath?:string,
		fileName?:string,
	}

	/**
	 * 选择本地文件
	 * @param node 用于生命周期管理的节点（Web平台用）
	 * @param accept MIME类型或扩展名，如 "image/*", "*\/*", "image/png"
	 */
	export async function selectLocalFile(node:cc.Node,accept?:string) {
		// Native Android平台
		if (isNativeAndroid()) {
			return selectLocalFileNativeAndroid(accept);
		}
		
		// Native iOS平台
		if (isNativeIOS()) {
			return selectLocalFileNativeIOS(accept);
		}
		
		// Web平台（原有逻辑）
		return selectLocalFileWeb(node, accept);
	}

	/**
	 * Native Android文件选择实现
	 */
	async function selectLocalFileNativeAndroid(accept?: string): Promise<SelectLocalFileRet> {
		return new Promise<SelectLocalFileRet>((resolve, reject) => {
			try {
				// 将accept转换为MIME类型
				const mimeType = accept || "*/*";
				
				log('Opening native Android file picker with mimeType: ' + mimeType);
				
				// 添加回调到队列
				nativeFilePickerCallbacks.push({
					resolve: async (result: NativeFilePickerResult) => {
						if (result.resultCode === 0) {
							// 成功选择文件
							log('File selected: ' + result.filePath);
							
							try {
								// 读取文件内容
								log('Reading file data...');
								const fileData = readNativeFile(result.filePath);
								log('File data read, size: ' + (fileData ? fileData.byteLength : 0));
								
								if (fileData && fileData.byteLength > 0) {
									const mimeType = getMimeType(result.fileName);
									const blob = new Blob([fileData], { type: mimeType });
									const ext = result.fileName.match(/\.([^\.]+)$/i)?.[1] || '';
									
									log('Blob created with type: ' + mimeType + ', resolving with file info');
									resolve({
										uri: result.filePath,
										ext: ext,
										blob: blob,
										filePath: result.filePath,
										fileName: result.fileName,
									});
								} else {
									logError('Failed to read file data or file is empty');
									reject(new Error('Failed to read file data'));
								}
							} catch (error) {
								logError('Error in file selection callback: ' + error);
								reject(error);
							}
						} else if (result.resultCode === 1) {
							// 用户取消
							log('File picker cancelled');
							resolve(null);
						} else {
							// 失败
							reject(new Error('File picker failed'));
						}
					},
					reject: reject
				});
				
				// 调用Java层方法
				jsb.reflection.callStaticMethod(
					"org/cocos2dx/javascript/AppActivity",
					"openFilePicker",
					"(Ljava/lang/String;)V",
					mimeType
				);
			} catch (error) {
				logError('Error opening native file picker: ' + error);
				reject(error);
			}
		});
	}

	/**
	 * Native iOS文件选择实现（预留）
	 */
	async function selectLocalFileNativeIOS(accept?: string): Promise<SelectLocalFileRet> {
		return new Promise<SelectLocalFileRet>((resolve, reject) => {
			try {
				// TODO: 实现iOS原生文件选择
				log('Opening native iOS file picker (not implemented yet)');
				
				// 添加回调到队列
				nativeFilePickerCallbacks.push({
					resolve: async (result: NativeFilePickerResult) => {
						if (result.resultCode === 0) {
							// 成功选择文件
							log('File selected: ' + result.filePath);
							
							// 读取文件内容
							const fileData = readNativeFile(result.filePath);
							if (fileData && fileData.byteLength > 0) {
								const mimeType = getMimeType(result.fileName);
								const blob = new Blob([fileData], { type: mimeType });
								const ext = result.fileName.match(/\.([^\.]+)$/i)?.[1] || '';
								
								resolve({
									uri: result.filePath,
									ext: ext,
									blob: blob,
									filePath: result.filePath,
									fileName: result.fileName,
								});
							} else {
								reject(new Error('Failed to read file data'));
							}
						} else if (result.resultCode === 1) {
							// 用户取消
							log('File picker cancelled');
							resolve(null);
						} else {
							// 失败
							// reject(new Error('File picker failed'));
							logError('File picker failed with code: ' + result.resultCode);
							resolve(null); // 先回退到返回null，避免未实现时抛出错误
						}
					},
					reject: reject
				});
				
				// 通过 jsb.reflection 调用 OC 的 DoPickFile: 方法
				try {
					const mimeType = accept || "image/*";
					log('Opening native iOS file picker with mimeType: ' + mimeType);
					jsb.reflection.callStaticMethod(
						"xdPlatform",
						"DoPickFile:",
						JSON.stringify({ mimeType })
					);
				} catch (error) {
					logError('Error calling iOS file picker: ' + error);
					reject(error);
				}
			} catch (error) {
				logError('Error opening iOS file picker: ' + error);
				reject(error);
			}
		});
	}

	/**
	 * Web平台文件选择实现（原有逻辑）
	 */
	async function selectLocalFileWeb(node:cc.Node, accept?:string): Promise<SelectLocalFileRet> {
		return new Promise<SelectLocalFileRet>(function(resolve,reject) {
			let fileInput = <HTMLInputElement>document.getElementById("fileInput");
			if(fileInput != null) {
				fileInput.parentNode.removeChild(fileInput)
				fileInput = null
			}
			if(fileInput == null){
				fileInput = <HTMLInputElement>document.createElement("input");
				fileInput.id = "fileInput";
				fileInput.type = "file";
				fileInput.accept = accept || "image/*";
				fileInput.style.height = "0px";
				fileInput.style.display = "block";
				fileInput.style.overflow = "hidden";
				document.body.insertBefore(fileInput,document.body.firstChild);
				fileInput.addEventListener('change', function(evt:Event) {
					let target = evt.target as HTMLInputElement;
					if(target.files.length == 0) {
						resolve(null)
						return 
					}
					log("image selected...");
					var file = target.files[0];
					var type = file.type;
					let ext = file.name.match(/\.([^\.]+)$/i)[1]
					if (!type) {
						type = mime[ext];
					}
					var uri = myCreateObjectURL(file);
					if(uri) {
						kcore.nodeCycle.listenDestroy(node,function() {
							myRevokeObjectUrl(uri)		
						})
					}
					resolve({
						uri:uri,
						ext:ext,
						blob:file,
					})
				}, false);
			}
			if(fileInput) {
				setTimeout(function(){fileInput.click()},100);
			}
		})
	}

	/**
	 * 选择本地文件（返回File对象）
	 * @param node 用于生命周期管理的节点（Web平台用）
	 * @param accept MIME类型或扩展名
	 */
	export async function selectLocalFileWithFile(node:cc.Node,accept?:string) {
		// Native平台不支持File对象，使用selectLocalFile替代
		if (isNativeAndroid() || isNativeIOS()) {
			log('Native platform detected, using native file selection');
			try {
				const result = await selectLocalFile(node, accept);
				log('selectLocalFile returned, result: ' + (result ? 'OK' : 'null'));
				
				if (!result) {
					log('No file selected, returning null');
					return null;
				}
				
				log('Creating File-like object, blob size: ' + result.blob.size);
				// 在原生平台创建一个File-like对象（不使用File构造函数）
				const fileLike: any = {
					name: result.fileName || 'file',
					size: result.blob.size,
					type: result.blob.type || 'application/octet-stream',
					lastModified: Date.now(),
					// 添加原生平台特有属性
					filePath: result.filePath,
					fileName: result.fileName,
					// 保留blob引用
					blob: result.blob,
					// 模拟File对象的方法
					slice: function(start?: number, end?: number, contentType?: string) {
						return result.blob.slice(start, end, contentType);
					},
					arrayBuffer: function() {
						return result.blob.arrayBuffer();
					},
					text: function() {
						return result.blob.text();
					}
				};
				
				log('File-like object created with filePath: ' + result.filePath);
				return fileLike as File;
			} catch (error) {
				logError('Error in selectLocalFileWithFile: ' + error);
				throw error;
			}
		}
		
		// Web平台（原有逻辑）
		return selectLocalFileWithFileWeb(node, accept);
	}

	/**
	 * Web平台选择文件（返回File对象）
	 */
	async function selectLocalFileWithFileWeb(node:cc.Node,accept?:string) {
		return new Promise<File>(function(resolve,reject) {
			let fileInput = <HTMLInputElement>document.getElementById("fileInput");
			if(fileInput != null) {
				fileInput.parentNode.removeChild(fileInput)
				fileInput = null
			}
			if(fileInput == null){
				fileInput = <HTMLInputElement>document.createElement("input");
				fileInput.id = "fileInput";
				fileInput.type = "file";
				fileInput.accept = accept || "image/*";
				fileInput.style.height = "0px";
				fileInput.style.display = "block";
				fileInput.style.overflow = "hidden";
				document.body.insertBefore(fileInput,document.body.firstChild);
				
				let resolved = false;
				
				fileInput.addEventListener('change', function(evt:Event) {
					if(resolved) return;
					resolved = true;
					let target = evt.target as HTMLInputElement;
					if(target.files.length == 0) {
						resolve(null)
						return 
					}
					log("image selected...");
					var file = target.files[0];
					resolve(file)
				}, false);
				
				let focusHandler = function() {
					if(resolved) return;
					setTimeout(function() {
						if(resolved) return;
						if(fileInput.files.length == 0) {
							resolved = true;
							window.removeEventListener('focus', focusHandler);
							resolve(null);
						}
					}, 300);
				};
				window.addEventListener('focus', focusHandler);
			}
			if(fileInput) {
				setTimeout(function(){fileInput.click()},100);
			}
		})
	}

	/**
	 * 选择本地文件并转换为Base64
	 * @param node 用于生命周期管理的节点
	 * @param accept MIME类型或扩展名
	 */
	export async function selectLocalFileBase64(node:cc.Node,accept?:string) {
		let file = await selectLocalFile(node,accept)
		if(!file) {
			return null 
		}
		
		// Native平台直接读取文件并转为Base64
		if ((isNativeAndroid() || isNativeIOS()) && file.filePath) {
			try {
				const fileData = readNativeFile(file.filePath);
				if (fileData) {
					// 将ArrayBuffer转为Base64
					const base64 = arrayBufferToBase64(fileData);
					return {
						ext: file.ext,
						base64: base64,
						filePath: file.filePath,
						fileName: file.fileName,
					};
				}
			} catch (error) {
				logError('Error reading file for base64: ' + error);
				return null;
			}
		}
		
		// Web平台使用Blob转换
		let base64 = await blobToUploadedBase64(file.blob)
		return {
			ext:file.ext,
			base64:base64,
		}
	}

	/**
	 * ArrayBuffer转Base64（用于Native平台）
	 */
	function arrayBufferToBase64(buffer: ArrayBuffer): string {
		let binary = '';
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}

	/**
	 * 将File对象转换为SpriteFrame
	 * 支持Web和Native平台
	 */
	export async function fileToSpriteFrame(file:File) {
		// Native平台：如果file有filePath属性（自定义添加的），直接使用路径加载
		if ((isNativeAndroid() || isNativeIOS()) && (file as any).filePath) {
			const filePath = (file as any).filePath;
			log('Loading image from native path: ' + filePath);
			
			return new Promise<cc.SpriteFrame>((resolve, reject) => {
				cc.loader.load(filePath, (err, texture: cc.Texture2D) => {
					if (err) {
						logError('Failed to load texture: ' + err);
						resolve(null);
						return;
					}
					log('Texture loaded successfully, creating SpriteFrame');
					const spriteFrame = new cc.SpriteFrame(texture);
					resolve(spriteFrame);
				});
			});
		}
		
		// Web平台：使用FileReader
		return new Promise<cc.SpriteFrame>((resolve,reject)=>{
			const reader = new FileReader();
			reader.onload = function(e) {
				const img = new Image();
				img.onload = function() {
					const texture = new cc.Texture2D();
					texture.initWithElement(img);
					texture.handleLoadedTexture();

					const spriteFrame = new cc.SpriteFrame(texture);
					resolve(spriteFrame);
				}
				img.onerror = function() {
					logError('Failed to load image');
					resolve(null);
				}
				img.src = e.target.result as string;
			}
			reader.readAsDataURL(file);
			reader.onerror = function() {
				logError('Failed to read file');
				resolve(null)
			}
		})
	}
	
	export async function loadTextureByUri(uri:string) {
		return new Promise<cc.SpriteFrame>(function(resolve,reject) {
			let my:any = document.getElementById("divCreator");
			if(my == null) { 
				my = document.createElement("div");   
				document.body.appendChild(my);   
				my.style.position="absolute";   
				my.id="divCreator";
				my.style.width=100;   
				my.style.height=100;   
				my.style.backgroundColor="#ffffcc";   
			}
			my.innerHTML = '<img id=imghead>';
			let img = <HTMLImageElement>document.getElementById('imghead');
			let onloadFunc = function(){
				let texture = new cc.Texture2D();
				texture.initWithElement(img);
				texture.handleLoadedTexture();

				let spriteFrame = new cc.SpriteFrame(texture)
				resolve(spriteFrame)
			}
			img.onload = onloadFunc
			if(img.src == uri) {
				onloadFunc()
			} else {
				img.src = uri;
			}
			my.style.display='none';
			my.style.visibility = "hidden";
		})
	}
	export async function blobToUploadedBase64(blob:Blob) {
		return new Promise<string>((resolve, reject) => {
			const fileReader = new FileReader();
			fileReader.onload = (e) => {
				let data = <string>e.target.result 
				let arr = data.split(";")
				let dataStr = arr[0]
				let fileMimeType = dataStr.split(":")[1]
				let ext = mimeReverse[fileMimeType]
				// if(ext) {
				// 	this.fileType_ = ext 
				// } else {
				// 	this.fileType_ = "jpg"
				// }
				let fileData = arr[1].split(",")[1]
				resolve(fileData)
			};
			fileReader.readAsDataURL(blob);
			fileReader.onerror = () => {
				resolve(null)
			};
		});
	}

	
	export function toCsv(desc:string[],keys:string[],arr:any[],filename:string) {
		let str = ""
		for(let i = 0 ; i < desc.length ; i ++) {
			if(i > 0) {
				str += ","
			}
			str += desc[i]
		}
		str += "\n"
		for(let info of arr) {
			for(let i = 0 ; i < keys.length ; i ++) {
				if(i > 0) {
					str += ","
				}
				let key = keys[i]
				let value = info[key]
				str += value
			}
			str += "\n"
		}
		
		let blob = new Blob([str],{type:"text/plain"})
		const a= document.createElement("a")
		a.href = URL.createObjectURL(blob)
		a.download = filename
		a.click()
		URL.revokeObjectURL(a.href)
		a.remove();
		return str 
	}
}