import { kdutils } from "kdweb-core/lib/utils";
import { ClubDefine } from "../../pp-base-define/ClubDefine";
import { kds } from "../../pp-base-define/GlobalMethods";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { Rpc } from "../rpc";
import { DB } from "../../src/db";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { ClubMember } from "../Utils/ClubMember";
import { ClubDCN } from "../Utils/ClubDCN";
import { IDUtils } from "../../src/IDUtils";
import { Module_RoomData } from "../../pp-base-define/DM_RoomDefine";

let db = DB.get()
async function getTemplates(h:string,clubID:number) {
	return <ClubDefine.tRoomTemplate[]>await db.get(DBDefine.tableClubRoomTemplate,{clubID})
}

async function createTemplate(h:string,clubID:number,userID:number,template:ClubDefine.tRoomTemplate) {
	let auth = new Rpc.authClass(clubID)
	if(!await auth.isCreateTemplateEnabled(userID)) {
		return null 
	}
	let newTemplate:ClubDefine.tRoomTemplate = {
		templateID:await IDUtils.getTemplateID(),
		clubID,
		userID,
		name:String(template.name),
		desc:String(template.desc),
		gameData:template.gameData,

		timestamp:kdutils.getMillionSecond(),
		date:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
	}

	await db.insert(DBDefine.tableClubRoomTemplate,newTemplate)
	ClubDCN.sendTemplate(clubID,{
		template:newTemplate,
	})
	return newTemplate 
}

async function updateTemplate(h:string,clubID:number,userID:number,template:ClubDefine.tRoomTemplate) {
	let auth = new Rpc.authClass(clubID)
	if(!await auth.isCreateTemplateEnabled(userID)) {
		return null 
	}
	let old:ClubDefine.tRoomTemplate = await db.getSingle(DBDefine.tableClubRoomTemplate,{clubID,templateID:template.templateID})
	if(!old) {
		return null 
	}
	old.name = String(template.name)
	old.desc = String(template.desc)
	if(template.gameData) {
		old.gameData = template.gameData
	}
	await db.update(DBDefine.tableClubRoomTemplate,{clubID,templateID:template.templateID},old)
	ClubDCN.sendTemplate(clubID,{
		template:template,
	})
	return old 
}

async function delTemplate(h:string,clubID:number,userID:number,templateID:number) {
	let auth = new Rpc.authClass(clubID)
	if(!await auth.isCreateTemplateEnabled(userID)) {
		return false 
	}
	let template = await db.getSingle(DBDefine.tableClubRoomTemplate,{clubID,templateID})
	if(!template) {
		return true 
	}
	ClubDCN.sendTemplate(clubID,{
		template:template,
		del:true
	})
	await db.delMany(DBDefine.tableClubDeskCost,{templateID:templateID})
	return await db.del(DBDefine.tableClubRoomTemplate,{clubID,templateID}) > 0
}

async function createRoom(h:string,clubID:number,userID:number,templateID:number) {
	let auth = new Rpc.authClass(clubID)
	if(!await auth.isCreateRoomEnabled(userID)) {
		return false 
	}
	let template:ClubDefine.tRoomTemplate = await db.getSingle(DBDefine.tableClubRoomTemplate,{clubID,templateID:templateID})
	if(!template) {
		return false 
	}
	let b = !!await Rpc.center.callException(kds.room.create.clubTemplate,clubID,templateID)
	return b
}

async function jiesanRoom(h:string,clubID:number,userID:number,roomID:number) {
	let auth = new Rpc.authClass(clubID)
	if(!await auth.isCreateRoomEnabled(userID)) {
		return false 
	}
	let room = await Module_RoomData.getMain(roomID)
	if(!room || !room.club || room.club.clubID != clubID) {
		return false 
	}
	Rpc.center.call(kds.room.remove,roomID,RoomDefine.RemoveType.Jiesan)
	return true 
}

export let RpcClubRealtime = {
	getTemplates,
	createTemplate,
	updateTemplate,
	delTemplate,

	createRoom,
	jiesanRoom,
}