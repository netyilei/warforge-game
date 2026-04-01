import { kdutils } from "kdweb-core/lib/utils"
import { ClubDefine } from "../../pp-base-define/ClubDefine"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { UserDefine } from "../../pp-base-define/UserDefine"
import { DB } from "../../src/db"
import { Rpc } from "../rpc"
import { ClubMember } from "../Utils/ClubMember"
import { ClubDCN } from "../Utils/ClubDCN"
import { IDUtils } from "../../src/IDUtils"


let db = DB.get()
async function createClub(h:string,userID:number) {
	let loginData:UserDefine.tLoginData = await db.getSingle(DBDefine.tableUserLoginData,{userID:userID})
	if(!loginData) {
		return null 
	}
	let data:ClubDefine.tData = {
		clubID:await IDUtils.getClubID(),
		code:"",
		bossUserID:userID,
		name:"",
		desc:"",
		iconUrl:"",
	}
	await db.insert(DBDefine.tableClubData,data)
	let member = new ClubMember(data.clubID)
	await member.saveMember({
		clubID:data.clubID,
		userID:userID,
		leaderUserID:null,

		type:ClubDefine.MemberType.Boss,
		job:ClubDefine.JobType.None,
		joinTimestamp:kdutils.getMillionSecond(),
	})
	await db.insert(DBDefine.tableClubSetting,<ClubDefine.tSetting> {
		clubID:data.clubID,
		autoDesk:false,
		mode:ClubDefine.ClubMode.Normal,
		invite:ClubDefine.ClubInviteMode.Both,
		adminAcceptReq:false,
	})
	return data 
}

async function updateClub(h:string,data:ClubDefine.tData) {
	let old:ClubDefine.tData = await db.getSingle(DBDefine.tableClubData,{clubID:data.clubID})
	if(!old) {
		return false 
	}
	old.name = String(data.name).trim()
	old.desc = String(data.desc).trim()
	old.iconUrl = String(data.iconUrl).trim()
	await db.update(DBDefine.tableClubData,{clubID:data.clubID},old)
	ClubDCN.sendClubData(data.clubID,{clubData:old})
	return true 
}

async function updateSetting(h:string,setting:ClubDefine.tSetting) {
	let old = await db.getSingle(DBDefine.tableClubSetting,{clubID:setting.clubID})
	if(old) {
		await db.update(DBDefine.tableClubSetting,{clubID:setting.clubID},setting)
		ClubDCN.sendSetting(setting.clubID,{setting})
	}
}

async function setCode(h:string,clubID:number,code:string) {
	let data:ClubDefine.tData = await db.getSingle(DBDefine.tableClubData,{code:code})
	if(data) {
		return data.clubID == clubID
	}
	data = await db.getSingle(DBDefine.tableClubData,{clubID:clubID})
	if(!data) {
		return false 
	}
	data.code = code 
	await db.update(DBDefine.tableClubData,{clubID:clubID},data)
	ClubDCN.sendClubData(data.clubID,{clubData:data})
	return data 
}

async function getClub(h:string,clubID:number) {
	return <ClubDefine.tData>await db.getSingle(DBDefine.tableClubData,{clubID:clubID})
}

async function getSetting(h:string,clubID:number) {
	return <ClubDefine.tSetting>await db.getSingle(DBDefine.tableClubSetting,{clubID:clubID})
}

async function getFull(h:string,clubID:number) {
	let data = await getClub(h,clubID)
	if(!data) {
		return null 
	}
	let full:ClubDefine.tFull = {
		data,
		setting:await getSetting(h,clubID),
		templates:await db.get(DBDefine.tableClubRoomTemplate,{clubID}) || []
	}
	return full 
}

async function getClubs(h:string,skip?:number,limit?:number) {
	if(skip != null) {
		return <ClubDefine.tData[]>await db.getOption(DBDefine.tableClubData,{},{
			skip,
			limit,
		}) || []
	}
	return <ClubDefine.tData[]>await db.get(DBDefine.tableClubData,{}) || []
}
async function getSettings(h:string,skip?:number,limit?:number) {
	if(skip != null) {
		return <ClubDefine.tSetting[]>await db.getOption(DBDefine.tableClubSetting,{},{
			skip,
			limit,
		}) || []
	}
	return <ClubDefine.tSetting[]>await db.get(DBDefine.tableClubSetting,{}) || []
}
async function getFulls(h:string,skip?:number,limit?:number) {
	let datas:ClubDefine.tData[]
	if(skip != null) {
		datas = await db.getOption(DBDefine.tableClubData,{},{
			skip,
			limit,
		}) || []
	} else {
		datas = await db.get(DBDefine.tableClubData,{}) || []
	}
	let settings:ClubDefine.tSetting[] = await db.get(DBDefine.tableClubSetting,{clubID:{$in:datas.map(v=>v.clubID)}}) || []
	let fulls:ClubDefine.tFull[] = []
	for(let data of datas) {
		fulls.push({
			data,
			setting:settings.find(v=>v.clubID == data.clubID),
			templates:await db.get(DBDefine.tableClubRoomTemplate,{ClubDefine:data.clubID}) || []
		})
	}
	return fulls
}
export let RpcClubData = {
	create:createClub,
	updateData:updateClub,
	updateSetting,
	setCode,

	getData:getClub,
	getSetting:getSetting,
	getFull:getFull,

	getDatas:getClubs,
	getSettings:getSettings,
	getFulls:getFulls,
}