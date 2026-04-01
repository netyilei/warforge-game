


// 应该是没用了
export class RobotSync {
	constructor() {
		this.buffer_ = Buffer.alloc(1024)
	}

	private buffer_:Buffer 
	private offsetIdx_ = 0
	protected checkLength(len:number) {
		if(this.offsetIdx_ + len > this.buffer_.byteLength) {
			let ret = Buffer.alloc(this.buffer_.byteLength * 2)
			this.buffer_.copy(ret,0,0,this.buffer_.byteLength)
			this.buffer_ = ret 
		}
	}
	protected pushString(str:string) {
		let bytes = StreamUtils.stringToByte(str)
		let len = bytes.length + 4
		this.checkLength(len)
		this.offsetIdx_ = this.buffer_.writeUInt32LE(bytes.length,this.offsetIdx_)
		for(let b of bytes) {
			this.offsetIdx_ = this.buffer_.writeUInt8(b,this.offsetIdx_)
		}
	}
	protected pushChar(num:number) {
		this.checkLength(1)
		this.offsetIdx_ = this.buffer_.writeInt8(num,this.offsetIdx_)
	}
	protected pushInt(num:number) {
		this.checkLength(4)
		this.offsetIdx_ = this.buffer_.writeInt32LE(num,this.offsetIdx_)
	}
}

namespace StreamUtils {
	export const MaxMsgLen = 8192
	export enum BitType {
		Int32,
		Int32Array,
		String,
	}
	export function stringToByte(str) {
		var bytes = new Array();
		var len, c;
		len = str.length;
		for(var i = 0; i < len; i++) {
			c = str.charCodeAt(i);
			if(c >= 0x010000 && c <= 0x10FFFF) {
				bytes.push(((c >> 18) & 0x07) | 0xF0);
				bytes.push(((c >> 12) & 0x3F) | 0x80);
				bytes.push(((c >> 6) & 0x3F) | 0x80);
				bytes.push((c & 0x3F) | 0x80);
			} else if(c >= 0x000800 && c <= 0x00FFFF) {
				bytes.push(((c >> 12) & 0x0F) | 0xE0);
				bytes.push(((c >> 6) & 0x3F) | 0x80);
				bytes.push((c & 0x3F) | 0x80);
			} else if(c >= 0x000080 && c <= 0x0007FF) {
				bytes.push(((c >> 6) & 0x1F) | 0xC0);
				bytes.push((c & 0x3F) | 0x80);
			} else {
				bytes.push(c & 0xFF);
			}
		}
		return bytes;
	}


	export function byteToString(arr) {
		if(typeof arr === 'string') {
			return arr;
		}
		var str = '',
			_arr = arr;
		for(var i = 0; i < _arr.length; i++) {
			var one = _arr[i].toString(2),
				v = one.match(/^1+?(?=0)/);
			if(v && one.length == 8) {
				var bytesLength = v[0].length;
				var store = _arr[i].toString(2).slice(7 - bytesLength);
				for(var st = 1; st < bytesLength; st++) {
					store += _arr[st + i].toString(2).slice(2);
				}
				str += String.fromCharCode(parseInt(store, 2));
				i += bytesLength - 1;
			} else {
				str += String.fromCharCode(_arr[i]);
			}
		}
		return str;
	}
}