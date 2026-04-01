import { kdutils } from "kdweb-core/lib/utils";
import moment = require("moment");


export namespace TimeDate {
	export function getMoment(timestamp?:number) {
		return moment(timestamp).utcOffset(8)
	}
	export function timestamp() {
		return kdutils.getMillionSecond()
	}
	export function getFmtMoment(fmt:string,timestamp?:number) {
		return getMoment(timestamp).format(fmt)
	}
	/**
	 * "YYYY-MM-DD HH:mm:ss" 不需要增加时区
	 * @param date 
	 * @param fmt 
	 * @returns 
	 */
	export function dateToTime(date:string,fmt:string) {
		return Number(moment(date + " +0800",fmt + " Z").format("x"))
	}
}