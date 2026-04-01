import { kdutils } from "kdweb-core/lib/utils";
import { ItemDefine } from "../pp-base-define/ItemDefine";
import { DB } from "./db";
import { DBDefine } from "../pp-base-define/DBDefine";
import { ClubDefine } from "../pp-base-define/ClubDefine";
import { Module_UserSerial } from "../pp-base-define/DM_UserDefine";
import { RobotEnvTools } from "./RobotEnvTools";

let redis = DB.getRedis()
let db = DB.get()
export namespace SerialHelper {
	export async function add(data:{
		userID:number,
		roomID?:number,
		billID?:number,
		itemID:string,
		setup?:boolean,
		changed:string,
		last:string,
		isLock?:boolean,
		lockID?:string,
		type:ItemDefine.SerialType,
		data?:any,
		reason?:string,
		gmID?:number,
	}) {
		let serial = <ItemDefine.tSerial>data 
		serial.isRobot = await RobotEnvTools.isRobot(serial.userID)
		serial.no = await redis.hincrby("access:ids","serial",1)
		serial.setup = !!serial.setup
		let time = kdutils.getMillionSecond()
		serial.timestamp = time  
		serial.date = kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
		await Module_UserSerial.insert(serial)
	}
	export async function addRoom(data:{
		userID:number,
		roomID?:number,
		billID?:number,
		itemID:string,
		setup?:boolean,
		changed:string,
		last:string,
		isLock?:boolean,
		lockID?:string,
		type:ItemDefine.SerialType,
		data?:any,
		reason?:string,
		gmID?:number,
	}) {
		let serial = <ItemDefine.tSerial>data 
		serial.isRobot = await RobotEnvTools.isRobot(serial.userID)
		serial.no = await redis.hincrby("access:ids","serial-room",1)
		serial.setup = !!serial.setup
		let time = kdutils.getMillionSecond()
		serial.timestamp = time  
		serial.date = kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
		await db.insert(DBDefine.tableSerialRoom,serial)
	}
	export async function addClub(data:{
		userID:number,
		clubID:number,
		isLock?:boolean,
		lockID?:String,
		valueIndex:number,
		setup?:boolean,
		changed:string,
		last:string,
		type?:ItemDefine.SerialType,
		data?:any,
		reason?:string,
		gmID?:number,
	}) {
		if(data.type == null) {
			data.type = ItemDefine.SerialType.System
		}
		let serial = <ClubDefine.tSerial>data 
		serial.no = await redis.hincrby("access:ids","serial-club",1)
		serial.setup = !!serial.setup
		let time = kdutils.getMillionSecond()
		serial.timestamp = time  
		serial.date = kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
		await db.insert(DBDefine.tableSerialClub,serial)
	}

	export async function addMember(data:{
		userID:number,
		fromUserID:number,
		type:ClubDefine.MemberRecordType,
		
		reason?:string,
		data?:any,
	}) {
		let serial = <ClubDefine.tMemberRecord>data 
		serial.no = await redis.hincrby("access:ids","serial-club-member",1)
		let time = kdutils.getMillionSecond()
		serial.timestamp = time  
		serial.date = kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
		await db.insert(DBDefine.tableClubMemberRecord,serial)
	}

	export async function initDB() {
		Module_UserSerial.checkAndCreateIndexes()
		await db.checkAndCreateIndexes(DBDefine.tableSerial,[
			{
				field:{
					userID:1,
				},
				opt:{
					name:"userID",
					background:true,
				}
			},
			{
				field:{
					userID:1,
					serialType:1,
				},
				opt:{
					name:"userID-serialType",
					background:true,
				}
			},
			{
				field:{
					userID:1,
					timestamp:-1,
				},
				opt:{
					name:"userID-timestamp",
					background:true,
				}
			},
		])
	}
}