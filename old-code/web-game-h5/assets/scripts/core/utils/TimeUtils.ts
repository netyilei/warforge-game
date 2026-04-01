export namespace TimeUtils {
	function padZero(num: number): string {
        return num.toString().padStart(2, '0');
    }

	export function format(time: number) {
        let hour = Math.floor(time / 3600);
        let minute = Math.floor(time / 60) % 60;
        let second = time % 60;
        return `${padZero(hour)}:${padZero(minute)}:${padZero(second)}`;
    }
	//时间戳转换成日期
	export function timestampToTime(timestamp: number, nline?: boolean) {
		if (timestamp < 1000000000000) {
			timestamp = timestamp * 1000
		}

		let date = new Date(timestamp)
		let arr = []
		arr.push(date.getFullYear())
		arr.push(date.getMonth() + 1)
		arr.push(date.getDate())
		arr.push(date.getHours())
		arr.push(date.getMinutes())
		arr.push(date.getSeconds())
		let str = ``
		arr.forEach((item, index) => {
			str += `${item < 10 ? `0${item}` : item}`
			if (index < 2) {
				str += `-`
			} else if (index == 2) {
				str += `${nline ? '\n' : ' '}`
			} else if (index < 5) {
				str += `:`
			}
		})
  
		return str
	}
    //      this.date('yyyy-mm-dd hh:ii:ss')
	export function date2(arg: string, time?: number) {
        let date :Date = new Date(time)
        
        //将yyyy地换成实际年份
        //
    }
	export function formatTime(timestamp: number, format: string = "YYYY-MM-DD HH:mm:ss") {
	    const date = new Date(timestamp);
		format = format.replace("YYYY", date.getFullYear().toString());
		const month = date.getMonth() + 1;
		format = format.replace("MM", month.toString().padStart(2, "0"));
		format = format.replace("DD", date.getDate().toString().padStart(2, "0"));
		format = format.replace("HH", date.getHours().toString().padStart(2, "0"));
		format = format.replace("mm", date.getMinutes().toString().padStart(2, "0"));
		format = format.replace("ss", date.getSeconds().toString().padStart(2, "0"));
		
		return format;
	}
}
