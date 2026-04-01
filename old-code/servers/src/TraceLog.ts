import { kdutils } from "kdweb-core/lib/utils"
import { DB } from "./db"
import { TimeDate } from "./TimeDate"


export type tTraceLog = {
	no:number,
	tag:string,
	timestamp:number,
	date:string,
	targetID:number,
	serviceName:string,
	workerIdx:number,
	content:string,

}
let redis = DB.getRedis()
let db = DB.get()
export namespace TraceLog {
	async function getNo() {
		return await redis.hincrby("access:ids","trace-log")
	}
	export async function robot(robotUserID:number,content:string,...params) {
		let data:any = <tTraceLog>{
			no:await getNo(),
			tag:"robot",
			
			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),

			targetID:robotUserID,
			serviceName:process.env.sname,
			workerIdx:process.env.child_start ? JSON.parse(process.env.child_start).idx : null,
			content,
		}
		if(params && params.length > 0) {
			for(let i = 0 ; i < params.length ; i ++) {
				data["param" + i] = params[i]
			}
		}
		await db.insert("t_trace_log_robot",data)
	}
	export async function robotEnv(robotUserID:number,content:string,...params) {
		let data:any = <tTraceLog>{
			no:await getNo(),
			tag:"robot",
			
			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),

			targetID:robotUserID,
			serviceName:process.env.sname,
			workerIdx:process.env.child_start ? JSON.parse(process.env.child_start).idx : null,
			content,
		}
		if(params && params.length > 0) {
			for(let i = 0 ; i < params.length ; i ++) {
				data["param" + i] = params[i]
			}
		}
		await db.insert("t_trace_log_robot_env",data)
	}
	export async function match(subID:number,content:string,...params) {
		let data:any = <tTraceLog>{
			no:await getNo(),
			tag:"match",
			
			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),

			targetID:subID,
			serviceName:process.env.sname,
			workerIdx:process.env.child_start ? JSON.parse(process.env.child_start).idx : null,
			content,
		}
		if(params && params.length > 0) {
			for(let i = 0 ; i < params.length ; i ++) {
				data["param" + i] = params[i]
			}
		}
		await db.insert("t_trace_log_match",data)
	}
}