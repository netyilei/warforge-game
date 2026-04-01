import { kdutils } from "kdweb-core/lib/utils";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { DB } from "../../src/db";
import { Rpc } from "../rpc";
import { SrsDefine } from "../../pp-base-define/SrsDefine";

import { MailDefine } from "../../pp-base-define/MailDefine";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { SrsDCN } from "../../pp-base-define/SrsUserMsg";
import { log } from "kdweb-core";
import { Log } from "../log";
import { MailRedBot } from "../entity/MailRedBot";
import { ClubDefine } from "../../pp-base-define/ClubDefine";
import { kds } from "../../pp-base-define/GlobalMethods";
import { Module_Mail, Module_SystemMail } from "../../pp-base-define/DM_MailDefine";
import { UserFlag } from "../../src/UserFlag";
import { UserFlagDefine } from "../../pp-base-define/UserFlag";


let db = DB.get()
let redis = DB.getRedis()
async function addMail(h:string,data:MailDefine.tMail) {
	if(!data){
		return false;
	}
	if(!data.toUserID){
		return false;
	}
	Module_Mail.insert(data);
	await MailRedBot.updateMailRed(data.toUserID)
	return true
}
async function addSystem(h:string,data:MailDefine.tMail) {
	// let _mail = new MailUtils(-1,-1)
	// _mail.setTitle(title)
	// _mail.setContent(content)
	// _mail.setSystem();
	//系统邮件
	// db.insert(DBDefine.tableSystemMail,data);
	Module_SystemMail.insert(data)
	return true
}
// async function addClubMail(h:string,clubID:number,data:MailDefine.tMail) {
// 	let members:ClubDefine.tUserMember[] = await db.get(DBDefine.tableClubMember,{clubID})
// 	for (const user of members) {
// 		let _copy = kdutils.clone(data);
// 		_copy.toUserID = user.userID;
// 		// _mail.setTitle(title)
// 		// _mail.setContent(content)
// 		// _mail.setSystem();
// 		await db.insert(DBDefine.tableUserMail,_copy);
// 	}
// 	return true;
// }

async function read(h:string,userID:number,mailID:number) {
	let mail:MailDefine.tMail = await db.getSingle(DBDefine.tableUserMail,{toUserID:userID,mailID:mailID});
	if(!mail){
		return false;
	}
	mail.isRead = true;
	await db.update(DBDefine.tableUserMail,{mailID:mailID},mail);
	await MailRedBot.updateMailRed(userID)
	return mail
}

async function updateRedDot(h:string,userID:number) {
	await MailRedBot.updateMailRed(userID)
	return true
}

async function refreshSystem(h:string,userID:number) {
	let startTime = kdutils.getMillionSecond() - 15 * 24 * 3600 * 1000
	let seq = await UserFlag.get(userID,UserFlagDefine.UserMailSystemSeq) || -1
	let systems :MailDefine.tMail[] = await Module_SystemMail.getOption({
		mailID:{$gt:seq},
		sendTime:{$gte:startTime},
	},{sort:{sendTime:1}})

	for (const mail of systems) {
		let copy = kdutils.clone(mail);
		copy.mailID += "-" + userID
		copy.toUserID = userID;
		Module_Mail.insert(copy)
	}
	let last = systems[systems.length -1]
	if(!last){
		return true
	}
	MailRedBot.updateMailRed(userID)
	await UserFlag.set(userID,UserFlagDefine.UserMailSystemSeq,last.seqID)
	return true
}

export let RpcMail = {
	add:addMail,
	addsystem:addSystem,
	updateRedDot,
	refreshSystem,
	// addclub:addClubMail,
	read,
}
