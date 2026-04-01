
function format(fmt) { //author: meizz
	let date = new Date()
	var o = {
	"M+": date.getMonth() + 1, //月份
	"d+": date.getDate(), //日
	"h+": date.getHours(), //小时
	"m+": date.getMinutes(), //分
	"s+": date.getSeconds(), //秒
	"q+": Math.floor((date.getMonth() + 3) / 3), //季度
	"S": date.getMilliseconds() //毫秒
	};
	if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
	if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
}

function getTitle() {
	return "kcore"
}
class _Internal_Log implements kcore.ILog {
	info(title: string, ...params: any[]) {
		if(kcore.logConfig && kcore.logConfig.closeLog){
			return;
		}
		if(kcore.logConfig && kcore.logConfig.forceConsole) {
			if(kcore.logConfig && kcore.logConfig.withDate) {
				console.log(getTitle(),"[" + format("hh:mm:ss") + "]",title,...params)
			} else {
				console.log(getTitle(),title,...params)
			}
		} else {
			if(kcore.logConfig && kcore.logConfig.withDate) {
				cc.log(getTitle(),"[" + format("hh:mm:ss") + "]",title,...params)
			} else {
				cc.log(getTitle(),title,...params)
			}
		}
	}
	error(title: string, ...params: any[]) {
		if(kcore.logConfig && kcore.logConfig.forceConsole) {
			if(kcore.logConfig && kcore.logConfig.withDate) {
				console.error(getTitle(),"[" + format("hh:mm:ss") + "]",title,...params)
			} else {
				console.error(getTitle(),title,...params)
			}
		} else {
			if(kcore.logConfig && kcore.logConfig.withDate) {
				cc.error(getTitle(),"[" + format("hh:mm:ss") + "]",title,...params)
			} else {
				cc.error(getTitle(),title,...params)
			}
		}
	}
}
class _Internal_Console implements kcore.IConsole {
	info(title: string, ...params: any[]) {
		console.log(getTitle(),"[" + format("hh:mm:ss") + "]",title,...params)
	}
	error(title: string, ...params: any[]) {
		console.error(getTitle(),"[" + format("hh:mm:ss") + "]",title,...params)
	}
}
class _Internal_LogEmpty implements kcore.ILog {
	info(title: string, ...params: any[]) {
	}
	error(title: string, ...params: any[]) {
	}
}
class _Internal_ConsoleEmpty implements kcore.IConsole {
	info(title: string, ...params: any[]) {
	}
	error(title: string, ...params: any[]) {
	}
}

export const rcLog = new _Internal_Log
export const rcConsole = new _Internal_Console