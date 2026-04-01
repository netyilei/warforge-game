import { UserDefine } from "../../ServerDefines/UserDefine";
import { rcAsync } from "./asyncUtils";
import { Datar } from "./Datar";
import { GBKURI } from "./GBKUtils";
import pako = require("./pako.js");
import { WebUtils } from "./WebUtils";

let normalDir: cc.Vec2 = new cc.Vec2(0, 1);

function iosLog(tag: string, message: string) {
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
let nativeWait:rcAsync.waitTimeout
window["rcCallback_Utils"] = (str)=>{
	kcore.log.info("rcCallback_Utils ",str)
	iosLog("rcCallback_Utils",str)
	let t = null 
	if(str) {
		try {
			t = JSON.parse(str)
		} catch (error) {
			kcore.log.error("rcCallback_Utils error ",error)
		}
	}
	if(nativeWait) {
		let temp = nativeWait
		nativeWait = null;
		temp.resolve(t);
	}
}
// 引擎相关
class _Internal_rcUtils implements kcore.IUtils {


	isWalletLogin(): boolean {
		// let loginData: UserDefine.tLoginData = Datar.get("login/data")
		// return (loginData.address && loginData.chainID) ? true : false;
		return false 
	}


	/**
	 * 设置剪贴板内容
	 * @param content 要复制的文本
	 * @returns Promise<boolean> 是否成功
	 */
	async copyToClipboard(content: string): Promise<boolean> {
		try {
			if (cc.sys.isBrowser) {
				return await WebUtils.copyToClipboard(content);
			} else if (cc.sys.isNative) {
				// Android平台
				if (cc.sys.os === cc.sys.OS_ANDROID) {
					const result = jsb.reflection.callStaticMethod(
						"org/cocos2dx/javascript/AppActivity",
						"setClipboardText",
						"(Ljava/lang/String;)Z",
						content
					);
					return result;
				}
				// iOS平台（待实现）
				else if (cc.sys.os === cc.sys.OS_IOS) {
					nativeWait = new rcAsync.waitTimeout(1000)
					jsb.reflection.callStaticMethod(
						"xdPlatform",
						"DoClipboard:",
						JSON.stringify({content})
					)
					let t = await nativeWait.promise
					return true;
				}
			}
			return false;
		} catch (error) {
			console.error("copyToClipboard error:", error);
			return false;
		}
	}

	/**
	 * 获取剪贴板内容
	 * @returns Promise<string> 剪贴板中的文本
	 */
	async getClipboard(): Promise<string> {
		try {
			if (cc.sys.isBrowser) {
				return await WebUtils.getClipboard();
			} else if (cc.sys.isNative) {
				// Android平台
				if (cc.sys.os === cc.sys.OS_ANDROID) {
					const result = jsb.reflection.callStaticMethod(
						"org/cocos2dx/javascript/AppActivity",
						"getClipboardText",
						"()Ljava/lang/String;"
					);
					return result || "";
				}
				// iOS平台（待实现）
				else if (cc.sys.os === cc.sys.OS_IOS) {
					nativeWait = new rcAsync.waitTimeout(1000)
					jsb.reflection.callStaticMethod(
						"xdPlatform",
						"DoGetClipboard:",
						JSON.stringify({})
					)
					let t = await nativeWait.promise
					iosLog("getClipboard", "clipboard content: " + JSON.stringify(t))
					return t?.content || "";
				}
			}
			return "";
		} catch (error) {
			console.error("getClipboard error:", error);
			return "";
		}
	}

	/**
	 * 清空剪贴板
	 * @returns Promise<boolean> 是否成功
	 */
	async clearClipboard(): Promise<boolean> {
		try {
			if (cc.sys.isBrowser) {
				return await WebUtils.clearClipboard();
			} else if (cc.sys.isNative) {
				// Android平台
				if (cc.sys.os === cc.sys.OS_ANDROID) {
					const result = jsb.reflection.callStaticMethod(
						"org/cocos2dx/javascript/AppActivity",
						"clearClipboard",
						"()Z"
					);
					return result;
				}
				// iOS平台（待实现）
				else if (cc.sys.os === cc.sys.OS_IOS) {
					nativeWait = new rcAsync.waitTimeout(1000)
					jsb.reflection.callStaticMethod(
						"xdPlatform",
						"DoUseClipboard:",
						JSON.stringify({})
					)
					let t = await nativeWait.promise
					return true;
				}
			}
			return false;
		} catch (error) {
			console.error("clearClipboard error:", error);
			return false;
		}
	}

	getQueryString(name: string): string {
		if (cc.sys.isBrowser) {
			let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
			let r = window.location.search.substr(1).match(reg);
			if (r != null) {
				return decodeURIComponent(r[2]);
			};
			return null;
		} else {
			return null;
		}
	}

	calculateAge(idCard: string): number | null {
		// 假设idCard是一个18位的有效身份证号码
		const birthStr: string = idCard.slice(6, 14);
		const birthDate: Date = new Date(`${birthStr.slice(0, 4)}-${birthStr.slice(4, 6)}-${birthStr.slice(6, 8)}`);

		if (isNaN(birthDate.getTime())) {
			// 无法解析出生日期，返回null或者抛出错误，具体根据需求而定
			return null;
		}

		// 计算年龄
		const today: Date = new Date();
		const age: number = today.getFullYear() - birthDate.getFullYear() - (today.getMonth() < birthDate.getMonth() ||
			(today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

		return age;
	}


	safeNumber(value: any): number {
		switch (typeof (value)) {
			case "string":
				if (value.indexOf(".") != -1) {
					value = parseFloat(value);
				} else {
					value = parseInt(value);
				}
				break;
			case "number":
				//nothing to do
				break;

			default:
				value = 0;
				break;
		}
		if (isNaN(value))
			value = 0;
		return value;
	}


	generateRandomString(length: number): string {
		let charset: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result: string = '';
		let charsetLength: number = charset.length;
		for (let i = 0; i < length; i++) {
			let randomIndex: number = Math.floor(Math.random() * charsetLength);
			result += charset.charAt(randomIndex);
		}
		return result;
	}

	cutString(str: string, len: number, readd: string = "..."): string {
		if (str.length * 2 <= len) {
			return str;
		}
		let strlen: number = 0;
		let s: string = "";
		for (let i = 0; i < str.length; i++) {
			s = s + str.charAt(i);
			if (str.charCodeAt(i) > 128) {
				strlen = strlen + 2;
				if (strlen >= len) {
					return s.substring(0, s.length - 1) + readd;
				}
			} else {
				strlen = strlen + 1;
				if (strlen >= len) {
					return s.substring(0, s.length - 2) + readd;
				}
			}
		}
		return s;
	}

	/**
	* 截断 tween 的运行，让 tween 的运行状态从指定的时间开始
	* @param tween 
	* @param reStartTime 
	*/
	tweenTruncation(tween: cc.Tween, reStartTime: number) {
		let finalAction = tween._finalAction;
		finalAction._elapsed = reStartTime;
	}

	createUUID(len: any, radix: any): string {
		var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
		var uuid = [], i;
		radix = radix || chars.length;

		if (len) {
			// Compact form
			for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
		} else {
			// rfc4122, version 4 form
			var r;

			// rfc4122 requires these characters
			uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
			uuid[14] = '4';

			// Fill in random data.  At i==19 set the high bits of clock sequence as
			// per rfc4122, sec. 4.1.5
			for (i = 0; i < 36; i++) {
				if (!uuid[i]) {
					r = 0 | Math.random() * 16;
					uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
				}
			}
		}

		return uuid.join('');
	}
	// vec2(0,1) 为0度，遵循node.setRotation
	rotationToDir(rotation: number): cc.Vec2 {
		let degree = 90 - rotation

		let radian = this.toRadian(degree)
		let x = Math.cos(radian)
		let y = Math.sin(radian)
		return cc.v2(x, y).normalizeSelf()
	}

	// vec2(0,1) 为0度，遵循node.setRotation
	dirToRotation(dir: cc.Vec2): number {
		let radian = dir.signAngle(normalDir)
		// dir to BaseRenderer.normalDir 右手定则
		return this.toDegree(radian)
	}

	// 返回 degree 角度
	dirToDir(fromDir: cc.Vec2, toDir: cc.Vec2): number {
		let radian = fromDir.signAngle(toDir)
		return this.toDegree(radian)
	}

	nodeLocalDir(node: cc.Node): cc.Vec2 {
		return this.rotationToDir(node.rotation)
	}

	// 世界坐标下的direction
	nodeWDir(node: cc.Node): cc.Vec2 {
		let localDir = this.rotationToDir(node.rotation)
		let localPos = node.position2
		let worldPos = node.parent.convertToWorldSpaceAR(localPos)
		let nextLocalPos = localPos.add(localDir)
		let nextWorldPos = node.parent.convertToWorldSpaceAR(nextLocalPos)
		return nextWorldPos.subSelf(worldPos).normalizeSelf()
	}

	wdirToldir(wdir: cc.Vec2, node: cc.Node): cc.Vec2 {
		let dir = node.convertToNodeSpace(wdir)
		return dir
	}
	wdirTopdir(wdir: cc.Vec2, node: cc.Node): cc.Vec2 {
		let dir = node.parent.convertToNodeSpace(wdir)
		return dir
	}


	faceTo(from: cc.Node, to: cc.Node): cc.Vec2 {
		let dpos = this.convertPositionType(to, from, cc.v2(), kcore.ConvertType.LS_to_PS)
		let pos = from.position2
		let dir = dpos.sub(pos)
		from.setRotation(this.dirToRotation(dir))
		return dir.normalizeSelf()
	}

	toDegree(radian: number) {
		return radian * 180 / Math.PI
	}

	toRadian(degree: number) {
		return degree * Math.PI / 180
	}

	// rotation和坐标系角的转换
	switchRotationMode(degree: number) {
		return 90 - degree;
	}

	printCallStack() {
		console.log(new Error().stack)
	}

	// 浮动值
	valuePer(value: number, per: number): number {
		if (per == 0) {
			return value
		}
		let min = value * (1 - per)
		let max = value * (1 + per)
		let ret = Math.random() * (max - min) + min
		ret = cc.misc.clampf(ret, min, max)
		return ret
	}

	initDesignSize() {
		let _canvas = cc.Canvas.instance;
		let _rateR = _canvas.designResolution.height / _canvas.designResolution.width;
		let _rateV = cc.winSize.height / cc.winSize.width;
		console.log("winSize: rateR: " + _rateR + " rateV: " + _rateV);
		if (_rateV > _rateR) {
			_canvas.fitHeight = false;
			_canvas.fitWidth = true;
			console.log("winSize: fitWidth");
		}
		else {
			_canvas.fitHeight = true;
			_canvas.fitWidth = false;
			console.log("winSize: fitHeight");
		}
	}

	getCanvasSize(): cc.Size {
		return cc.Canvas.instance.node.getContentSize()
	}

	/**
	 * 从 from 自己的坐标系到 to.parent的坐标系
	 * @param from 
	 * @param to 
	 * @param pos 
	 */
	convertPosition(from: cc.Node, to: cc.Node, pos?: cc.Vec2): cc.Vec2 {
		pos = pos || cc.v2(0, 0)
		let wpos = from.convertToWorldSpaceAR(pos)
		let lpos = to.parent.convertToNodeSpaceAR(wpos)
		return lpos
	}
	/**
	 * 从 from 自己的坐标系到 to 的坐标系
	 * @param from 
	 * @param to 
	 * @param pos 
	 */
	convertPositionST(from: cc.Node, to: cc.Node, pos?: cc.Vec2): cc.Vec2 {
		pos = pos || cc.v2(0, 0)
		let wpos = from.convertToWorldSpaceAR(pos)
		let lpos = to.convertToNodeSpaceAR(wpos)
		return lpos
	}

	// local space
	convertPositionLS(from: cc.Node, to: cc.Node, pos?: cc.Vec2): cc.Vec2 {
		return this.convertPosition(from, to, pos)
	}
	// parent space
	convertPositionPS(from: cc.Node, to: cc.Node, pos?: cc.Vec2): cc.Vec2 {
		pos = pos || cc.v2(0, 0)
		let wpos = from.parent.convertToWorldSpaceAR(pos)
		let lpos = to.parent.convertToNodeSpaceAR(wpos)
		return lpos
	}

	convertPositionType(from: cc.Node, to: cc.Node, pos: cc.Vec2, type: kcore.ConvertType): cc.Vec2 {
		pos = pos || cc.v2(0, 0)
		if (type == kcore.ConvertType.PS_to_PS || type == kcore.ConvertType.PS_to_LS) {
			from = from.parent
		}
		if (type == kcore.ConvertType.PS_to_PS || type == kcore.ConvertType.LS_to_PS) {
			to = to.parent
		}
		let wpos = from.convertToWorldSpaceAR(pos)
		let lpos = to.convertToNodeSpaceAR(wpos)
		return lpos
	}

	// x,y使用左上角坐标系
	convertBoundingBoxToView(node: cc.Node) {
		let canvasSize = rcUtils.getCanvasSize()
		let c = <any>window["canvas"]
		let winSize: cc.Size = null
		if (c == null) {
			// 非微信下，使用视图尺寸
			winSize = cc.director.getWinSize()
		} else {
			// 使用微信分辨率
			//winSize = cc.size(c.width,c.height)//cc.winSize
			winSize = cc.view.getFrameSize()
			// rcLog.info("use wechat size")
			// rcLog(winSize)
		}
		let rect = node.getBoundingBox()
		let p1 = cc.v2(rect.xMin, rect.yMax)
		let p2 = cc.v2(rect.xMax, rect.yMin)
		// rcLog({nodePos:node.position2})
		// rcLog({nodeWPos:node.convertToWorldSpace(cc.v2())})
		// rcLog({p1,p2})
		p1 = node.parent.convertToWorldSpaceAR(p1)
		p2 = node.parent.convertToWorldSpaceAR(p2)
		//rcLog({p1,p2})
		let x = winSize.width * (p1.x / canvasSize.width)
		let y = winSize.height * (1 - p1.y / canvasSize.height)
		// rcLog.info("canvas ",canvasSize)
		// rcLog({x,y})
		let width = Math.abs(p2.x - p1.x) / canvasSize.width * winSize.width
		let height = Math.abs(p2.y - p1.y) / canvasSize.height * winSize.height
		return cc.rect(x, y, width, height)
	}

	getBoundingBox(node: cc.Node, pos?: cc.Vec2, toNodeSpace?: cc.Node) {
		pos = pos || node.position2
		let size = node.getContentSize()
		let ap = node.getAnchorPoint()
		// 左下角
		let lpos = cc.v2(pos.x - size.width * ap.x, pos.y - size.height * ap.y)
		// 右上角
		let rpos = cc.v2(pos.x + size.width * (1 - ap.x), pos.y + size.height * (1 - ap.y))
		if (toNodeSpace) {
			let wLeftPos = this.convertPosition(node.parent, toNodeSpace, lpos)
			let wRightPos = this.convertPosition(node.parent, toNodeSpace, rpos)
			return cc.rect(wLeftPos.x, wLeftPos.y,
				Math.abs(wRightPos.x - wLeftPos.x),
				Math.abs(wRightPos.y - wLeftPos.y))
		}

		let wLeftPos = node.parent.convertToWorldSpaceAR(lpos)
		let wRightPos = node.parent.convertToWorldSpaceAR(rpos)
		return cc.rect(wLeftPos.x, wLeftPos.y,
			Math.abs(wRightPos.x - wLeftPos.x),
			Math.abs(wRightPos.y - wLeftPos.y))
	}


	scaleToSize(node: cc.Node, size: cc.Size) {
		let nodeSize = node.getContentSize()
		let sx = size.width / nodeSize.width
		let sy = size.height / nodeSize.height
		if (sx < sy) {
			node.scale = sx
		} else {
			node.scale = sy
		}
	}

	getScaledContentSize(node: cc.Node): cc.Size {
		let nodeSize = node.getContentSize()
		let sx = node.scaleX
		let sy = node.scaleY
		return cc.size(nodeSize.width * sx, nodeSize.height)
	}

	checkComponent<T extends cc.Component>(node: cc.Node, type: { prototype: T, new(): T }): T {
		let ret = node.getComponent(type)
		if (ret == null) {
			ret = node.addComponent(type)
		}
		return ret
	}

	getComponentByMethod<T>(node: cc.Node, methodName: string): T {
		let coms = node.getComponents(cc.Component)
		for (let com of coms) {
			if (com[methodName]) {
				return <T>com
			}
		}
		return null
	}

	getComponentsByMethod<T>(node: cc.Node, methodName: string): T[] {
		let coms = node.getComponents(cc.Component)
		let ret: T[] = []
		for (let com of coms) {
			if (com[methodName]) {
				ret.push(<T>com)
			}
		}
		return ret
	}

	// (-size ~ size)
	randomSizeRange(sizeOrW: cc.Size | number, h?: number): cc.Vec2 {
		if (typeof (sizeOrW) == "number") {
			let w = sizeOrW
			h = h == null ? 0 : h
			let x = Math.random() * 2 * w - w
			let y = Math.random() * 2 * h - h
			return cc.v2(x, y)
		}
		let size = sizeOrW
		let x = Math.random() * 2 * size.width - size.width
		let y = Math.random() * 2 * size.height - size.height
		return cc.v2(x, y)
	}
	// (-v ~ v)
	randomRangeSingle(v): number {
		let x = Math.random() * 2 * v - v
		return x
	}

	/**
	 * a ~ b 随机取值
	 * @param a 
	 * @param b 
	 */
	randomRange(a, b): number {
		let s = (b - a) * Math.random() + a
		return s
	}

	// 整数随机，return [a,b)
	intRandomRange(a: number, b: number) {
		let max = a > b ? a : b
		let min = a < b ? a : b
		let sub = max - min
		let tenCount = sub.toString().length + 1
		let ten = Math.pow(10, tenCount)
		return Math.floor(Math.random() * ten) % sub + min
	}
	// async loadres
	loadRes<T extends cc.Asset>(url, type?: { prototype: T }): Promise<T> {
		return new Promise<T>(function (resolve, reject) {
			if (url == null || url == "NULL") {
				resolve(null)
				return
			}
			if (type) {
				cc.loader.loadRes(url, <any>type, function (error, res: T) {
					if (error) {
						console.error(error.message)
						console.error(error.stack)
						reject(error)
						return
					}
					resolve(res)
				})
			} else {
				cc.loader.loadRes(url, function (error, res: T) {
					if (error) {
						console.error(error.message)
						console.error(error.stack)
						reject(error)
						return
					}
					resolve(res)
				})
			}
		})
	}
	// async loadres
	loadWeb<T extends cc.Asset>(url, type?: { prototype: T }, opt?: any): Promise<T> {
		return new Promise<T>(function (resolve, reject) {
			if (url == null || url == "NULL") {
				resolve(null)
				return
			}
			cc.assetManager.loadRemote(url, opt || {}, function (error, res: T) {
				if (error) {
					console.error(error.message)
					console.error(error.stack)
					reject(error)
					return
				}
				resolve(res)
			})
		})
	}

	addToNewParent(node: cc.Node, parent: cc.Node) {
		let wpos = node.convertToWorldSpaceAR(cc.v2())
		let pos = parent.convertToNodeSpaceAR(wpos)
		node.removeFromParent()
		parent.addChild(node)
		node.position2 = pos
		return node
	}
	private clickTime = {};

	/**
	 * @description 是否频繁点击
	 * @param 判断重点的一个id，用于区分不同时机 
	 * @duration 少于该时长即认为发生了重复点击（毫秒）     
	 **/
	isQuickClick(tag?: string, duration?: number): boolean {
		if (!tag) tag = 'normal';
		if (!this.clickTime) this.clickTime = {};
		if (this.clickTime[tag] == undefined) this.clickTime[tag] = 0;
		let gapTime = new Date().getTime() - this.clickTime[tag];
		if (!duration) duration = 500;
		if (gapTime < duration) {
			console.log('请勿重复点击');
			return true;
		}
		this.clickTime[tag] = new Date().getTime();
		return false;
	}
}

export const rcUtils = new _Internal_rcUtils

class FuncGroup implements kcore.IFuncGroup {
	private $cache: Array<Function> = new Array<Function>();
	add(func: Function) {
		let idx = this.$cache.indexOf(func);
		if (idx < 0) {
			this.$cache.push(func)
		}
	}
	call(...params: any[]) {
		for (let func of this.$cache) {
			func(...params);
		}
	}
	clearcall(...params: any[]) {
		for (let func of this.$cache) {
			func(...params);
		}
		this.clear();
	}
	clear() {
		this.$cache.splice(0);
	}
}
let base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
let base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);
let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

var __extends = (function () {
	// var extendStatics = function (d, b) {
	// 	extendStatics = Object.setPrototypeOf ||
	// 		({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	// 		function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p) && !d[p]) d[p] = b[p]; };
	// 	return extendStatics(d, b);
	// };
	// return function (d, b) {
	// 	extendStatics(d, b);
	// 	function __() { this.constructor = d; }
	// 	d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	// };
})();
// 运行时相关
class _Internal_rcApis implements kcore.IApis {
	stringformat(fmt, ...arg: any[]) {
		var result = fmt.split("").join(""),
			reg = /\{\d*\}/g,
			res = reg.exec(result);
		if (res) {
			for (var i = 0; i < arg.length; i++) {
				result = result.replace("{" + i + "}", arg[i]);
			}
		}
		return result;
	}

	private _getHex(array: ArrayBuffer): string {
		let hexStr = "";
		let uint8Array = new Uint8Array(array)
		for (var i: number = 0; i < uint8Array.length; ++i) {
			var byteStr = uint8Array[i].toString(16);
			hexStr += ("%") + (byteStr.length == 1 ? (0 + byteStr) : byteStr);
		}
		return hexStr.toLocaleUpperCase();
	}

	private _char2buf(str: string): ArrayBuffer {
		var out = new ArrayBuffer(str.length * 2);
		var bytes = new DataView(out)
		var pos = 0
		for (var i = 0; i < str.length; i++) {
			let char = str.charAt(i);
			if (char == "%") {
				let cs = "0x" + str.charAt(i + 1) + str.charAt(i + 2);
				let code = Number(cs);
				i += 2;
				bytes.setUint8(pos, code);
				pos++
			} else {
				let code = char.charCodeAt(0);
				bytes.setUint8(pos, code);
				pos++
			}
		}
		var ret = bytes.buffer.slice(0, pos);
		return ret;
	}

	GBKBufferToUTF8(array: ArrayBuffer, len?: number): string {
		len = len == null ? array.byteLength : len
		if (len > 0) {
			let ret = GBKURI.decode(this._getHex(array));
			return ret;
		}
		return "";
	}

	UTF8ToGBKBuffer(strUTF: string): ArrayBuffer {
		let str = GBKURI.encode(strUTF);
		let buf = this._char2buf(str);
		return buf;
	}


	private inRange(a, min, max) {
		return min <= a && a <= max;
	};

	private div(n, d) {
		return Math.floor(n / d);
	};

	private stringToCodePoints(str: string) {
		/** @type {Array.<number>} */
		var cps = [];
		// Based on http://www.w3.org/TR/WebIDL/#idl-DOMString
		var i = 0, n = str.length;
		while (i < str.length) {
			var c = str.charCodeAt(i);
			if (!this.inRange(c, 0xD800, 0xDFFF)) {
				cps.push(c);
			}
			else if (this.inRange(c, 0xDC00, 0xDFFF)) {
				cps.push(0xFFFD);
			}
			else {
				if (i == n - 1) {
					cps.push(0xFFFD);
				}
				else {
					var d = str.charCodeAt(i + 1);
					if (this.inRange(d, 0xDC00, 0xDFFF)) {
						var a = c & 0x3FF;
						var b = d & 0x3FF;
						i += 1;
						cps.push(0x10000 + (a << 10) + b);
					}
					else {
						cps.push(0xFFFD);
					}
				}
			}
			i += 1;
		}
		return cps;
	};
	StringToUint8Array(str: string, maxlen: number = -1) {
		var pos = 0;
		var codePoints = this.stringToCodePoints(str);
		var outputBytes = [];
		while (codePoints.length > pos) {
			var code_point = codePoints[pos++];
			if (this.inRange(code_point, 0xD800, 0xDFFF)) {
				return null;
			}
			else if (this.inRange(code_point, 0x0000, 0x007f)) {
				if (maxlen >= 0 && outputBytes.length + 1 >= maxlen) {
					break;
				}
				outputBytes.push(code_point);
			}
			else {
				var count = void 0, offset = void 0;
				if (this.inRange(code_point, 0x0080, 0x07FF)) {
					count = 1;
					offset = 0xC0;
				}
				else if (this.inRange(code_point, 0x0800, 0xFFFF)) {
					count = 2;
					offset = 0xE0;
				}
				else if (this.inRange(code_point, 0x10000, 0x10FFFF)) {
					count = 3;
					offset = 0xF0;
				}
				if (maxlen >= 0 && outputBytes.length + count >= maxlen) {
					break;
				}
				outputBytes.push(this.div(code_point, Math.pow(64, count)) + offset);
				while (count > 0) {
					var temp = this.div(code_point, Math.pow(64, count - 1));
					outputBytes.push(0x80 + (temp % 64));
					count -= 1;
				}
			}
		}
		return new Uint8Array(outputBytes);
	};

	Uint8ArrayToString(array: Uint8Array | number[]) {
		var out, i, len, c;
		var char2, char3;

		out = "";
		len = array.length;
		i = 0;
		while (i < len) {
			c = array[i++];
			switch (c >> 4) {
				case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
					// 0xxxxxxx
					out += String.fromCharCode(c);
					break;
				case 12: case 13:
					// 110x xxxx   10xx xxxx
					char2 = array[i++];
					out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
					break;
				case 14:
					// 1110 xxxx  10xx xxxx  10xx xxxx
					char2 = array[i++];
					char3 = array[i++];
					out += String.fromCharCode(((c & 0x0F) << 12) |
						((char2 & 0x3F) << 6) |
						((char3 & 0x3F) << 0));
					break;
			}
		}
		return out;
	}

	ifcall(obj: any, funcName: string, ...params: any[]): any {
		let func: Function = obj[funcName];
		if (typeof (func) == "function") {
			return func.call(obj, ...params);
		}
		return false;
	}

	swap(obj1: any, obj2: any, propertyName: string) {
		let temp = obj1[propertyName];
		obj1[propertyName] = obj2[propertyName];
		obj2[propertyName] = temp;
	}


	getClassName(clazz: any): string {
		return clazz.prototype.constructor.name;
	}
	/**
	 * obj1和obj2是否是同一类型
	 */
	sameClass(obj1: any, obj2: any): boolean {
		return obj1.__proto__.__class__ === obj2.__proto__.__class__;
	}

	/**
	 * obj的类型是否是ty
	 */
	isType(obj: any, ty: any): boolean {
		return obj.__proto__.__class__ === ty.prototype.__class__;
	}

	/**
	 * obj的类型是否是数组 
	 */
	isArray(obj: any): boolean {
		return Array.isArray ? Array.isArray(obj) : Object.prototype.toString.call(obj) == "[object Array]";
	}

	/**
	 * 对拷
	 */
	copyTo(src: any, dst: any) {
		for (let key in src) {
			let value = src[key];
			dst[key] = value;
		}
		return dst;
	}

	/**
	 * or
	 */
	or<T>(...params: T[]): T {
		let i = 0;
		let ret = null;
		for (; i < params.length; i++) {
			ret = params[i];
			if (!ret) {
				continue;
			}
			break;
		}
		return ret;
	}

	/**
	 * and 
	 */
	and(...params: any[]): boolean {
		for (let i = 0; i < params.length; i++) {
			if (!params[i]) {
				return false;
			}
		}
		return true;
	}

	/**
	 * clamp
	 */
	clamp<T>(v: T, min: T, max: T): T {
		if (min > max) {
			let temp: T = min;
			min = max;
			max = temp;
		}
		return v < min ? min : (v > max ? max : v);
	}

	clone(obj: any): any {
		if (obj instanceof Array) {
			let buf = [];
			for (let i = 0; i < obj.length; i++) {
				buf[i] = this.clone(obj[i]);
			}
			return buf;
		} else if (obj instanceof Object) {
			let buf = {}
			for (let k in obj) {
				buf[k] = this.clone(obj[k]);
			}
			return buf;
		}
		return obj;
	}

	handler<T>(self, selfFunc: T): T {
		return <T><unknown>function (...params) {
			return (<Function><unknown>selfFunc).apply(self, params)
		}
	}

	lifeFunc(node: cc.Node, func: Function, unActiveFunc?: Function) {
		let rt = {
			active: true,
		}
		kcore.nodeCycle.listenDestroy(node, function () {
			rt.active = false
		})
		return function (...params: any[]) {
			if (!rt.active) {
				if (unActiveFunc) {
					unActiveFunc()
				}
				return
			}
			return func(...params)
		}
	}


	/**
	 * 回调函数集合
	 */
	funcs(): FuncGroup {
		return new FuncGroup();
	}
	private base64_encode(str) {
		var c1, c2, c3;
		var i = 0, len = str.length, ret = [];

		while (i < len) {
			c1 = str.charCodeAt(i++) & 0xff;
			if (i == len) {
				ret.push(base64EncodeChars.charAt(c1 >> 2));
				ret.push(base64EncodeChars.charAt((c1 & 0x3) << 4));
				ret.push("==");
				break;
			}
			c2 = str.charCodeAt(i++);
			if (i == len) {
				ret.push(base64EncodeChars.charAt(c1 >> 2));
				ret.push(base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4)));
				ret.push(base64EncodeChars.charAt((c2 & 0xF) << 2));
				ret.push("=");
				break;
			}
			c3 = str.charCodeAt(i++);
			ret.push(base64EncodeChars.charAt(c1 >> 2));
			ret.push(base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4)));
			ret.push(base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6)));
			ret.push(base64EncodeChars.charAt(c3 & 0x3F))
		}
		return ret.join("")
	}
	private base64_decode(str) {
		var c1, c2, c3, c4;
		var i, len, out;
		len = str.length;
		i = 0;
		out = "";
		while (i < len) {
			/* c1 */
			do {
				c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
			}
			while (i < len && c1 == -1);
			if (c1 == -1)
				break;
			/* c2 */
			do {
				c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
			}
			while (i < len && c2 == -1);
			if (c2 == -1)
				break;
			out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
			/* c3 */
			do {
				c3 = str.charCodeAt(i++) & 0xff;
				if (c3 == 61)
					return out;
				c3 = base64DecodeChars[c3];
			}
			while (i < len && c3 == -1);
			if (c3 == -1)
				break;
			out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
			/* c4 */
			do {
				c4 = str.charCodeAt(i++) & 0xff;
				if (c4 == 61)
					return out;
				c4 = base64DecodeChars[c4];
			}
			while (i < len && c4 == -1);
			if (c4 == -1)
				break;
			out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
		}
		return out;
	}
	base64ToArrayBuffer(base64String) {
		const padding = '='.repeat((4 - base64String.length % 4) % 4);
		const base64 = (base64String + padding)
			.replace(/\-/g, '+')
			.replace(/_/g, '/');

		const rawData = window.atob ? window.atob(base64) : this.base64_decode(base64);
		const outputArray = new Uint8Array(rawData.length);

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray.buffer;
	}
	base64ToUint8Array(base64String) {
		const padding = '='.repeat((4 - base64String.length % 4) % 4);
		const base64 = (base64String + padding)
			.replace(/\-/g, '+')
			.replace(/_/g, '/');

		const rawData = window.atob ? window.atob(base64) : this.base64_decode(base64);
		const outputArray = new Uint8Array(rawData.length);

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	encodeBase64Fast(arraybuffer) {
		var bytes = new Uint8Array(arraybuffer),
			i, len = bytes.length, base64 = "";

		for (i = 0; i < len; i += 3) {
			base64 += chars[bytes[i] >> 2];
			base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
			base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
			base64 += chars[bytes[i + 2] & 63];
		}

		if ((len % 3) === 2) {
			base64 = base64.substring(0, base64.length - 1) + "=";
		} else if (len % 3 === 1) {
			base64 = base64.substring(0, base64.length - 2) + "==";
		}

		return base64;
	};

	decodeBase64Fast(base64) {
		var bufferLength = base64.length * 0.75,
			len = base64.length, i, p = 0,
			encoded1, encoded2, encoded3, encoded4;

		if (base64[base64.length - 1] === "=") {
			bufferLength--;
			if (base64[base64.length - 2] === "=") {
				bufferLength--;
			}
		}

		var arraybuffer = new ArrayBuffer(bufferLength),
			bytes = new Uint8Array(arraybuffer);

		for (i = 0; i < len; i += 4) {
			encoded1 = chars.indexOf(base64[i]);
			encoded2 = chars.indexOf(base64[i + 1]);
			encoded3 = chars.indexOf(base64[i + 2]);
			encoded4 = chars.indexOf(base64[i + 3]);

			bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
			bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
			bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
		}

		return arraybuffer;
	};
	getBase64BufferByteLength(base64) {
		var bufferLength = base64.length * 0.75,
			len = base64.length, i, p = 0,
			encoded1, encoded2, encoded3, encoded4;

		if (base64[base64.length - 1] === "=") {
			bufferLength--;
			if (base64[base64.length - 2] === "=") {
				bufferLength--;
			}
		}
		return Math.ceil(bufferLength)
	}
	gzip(str: string) {
		let arr = pako.gzip(str)
		return this.Uint8ArrayToBase64(arr)
		return null
	}

	gzipArr(str: string) {
		let arr = pako.gzip(str)
		return arr
		return null
	}
	gunzip(base64String: string) {
		let arr = this.base64ToUint8Array(base64String)
		let array = pako.ungzip(arr)
		if (array) {
			return this.Uint8ArrayToString(array)
		}
		return null

		// 如果字符太大，会导致内存溢出报错，这里使用分片处理
		// var str = '';
		// var chunk = 8 * 1024
		// var i;
		// for (i = 0; i < array.length / chunk; i++) {
		// 	str += String.fromCharCode.apply(null, array.slice(i * chunk, (i + 1) * chunk));
		// }
		// str += String.fromCharCode.apply(null, array.slice(i * chunk));
		// // Base64.decode 解压必须也要使用相同的编译方式
		// return str 
	}

	gunzipArr(arr: Uint8Array) {
		let array = pako.ungzip(arr)
		return this.Uint8ArrayToString(array)
		return null
	}

	arrayBufferToBase64(buffer) {
		var binary = [];
		var bytes = new Uint8Array(buffer);
		var len = bytes.byteLength;
		for (var i = 0; i < len; i++) {
			binary.push(String.fromCharCode(bytes[i]));
		}
		if (window.btoa) {
			return window.btoa(binary.join(""));
		}
		return this.base64_encode(binary.join(""))
	}
	arrayBufferToString(buffer) {
		var binary = [];
		var bytes = new Uint8Array(buffer);
		var len = bytes.byteLength;
		for (var i = 0; i < len; i++) {
			binary.push(String.fromCharCode(bytes[i]));
		}
		return binary.join("")
	}

	Uint8ArrayToBase64(bytes) {
		var binary = '';
		var len = bytes.byteLength;
		for (var i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		if (window.btoa) {
			return window.btoa(binary);
		}
		return this.base64_encode(binary)
	}

	fixedLen(str: string, len: number, pattern?: string) {
		if (str.length < len) {
			return str
		}
		str = str.slice(0, len)
		if (pattern) {
			str += pattern
		}
		return str
	}
	strlen(str: string) {
		var len = 0;
		for (var i = 0; i < str.length; i++) {
			var c = str.charCodeAt(i);
			//单字节加1 
			if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
				len++;
			}
			else {
				len += 2;
			}
		}
		return len;
	}

	fixedBytesLen(str: string, len: number, pattern?: string) {
		var l = 0;
		for (var i = 0; i < str.length; i++) {
			var c = str.charCodeAt(i);
			//单字节加1 
			if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
				l++;
			}
			else {
				l += 2;
			}
			if (l > len) {
				if (pattern) {
					return str.slice(0, i) + pattern
				}
				else {
					return str.slice(0, i)
				}
			}
		}
		return str;
	}

	extends(clazz, superClazz) {
		// __extends(clazz,superClazz)
	}
}

export const rcApis = new _Internal_rcApis