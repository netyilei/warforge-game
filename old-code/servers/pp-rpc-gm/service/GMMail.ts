import { kds } from "../../pp-base-define/GlobalMethods";
import { MailDefine } from "../../pp-base-define/MailDefine";
import { IDUtils } from "../../src/IDUtils";
import { MailUtils } from "../../src/MailUtils";
import { Rpc } from "../rpc";

export namespace GMMail {
    export async function sendSystemMail(userID:number,params:{
		title:string,
		content:string,
		reason?:string,
		attachs?:MailDefine.tMailAttach[]
	}){
		//生成邮件
		let mail = await MailUtils.newMail()
		mail.title = params.title
		mail.content = params.content
		mail.type = MailDefine.MailType.System;
		mail.attachs = params.attachs;
		mail.seqID = await IDUtils.getMailSystemSeq()
        
		await Rpc.center.callException(kds.mail.addsystem,mail)
		return {}
    }
 
    // export async function sendClubMail(userID:number,params:{
    //     clubID:number,
	// 	title:string,
    //     content:string,
	// 	attachs?:MailDefine.tMailAttach[]
	// }){
    //     //生成邮件
	// 	let mail = await MailUtils.newMail()
	// 	mail.title = params.title
	// 	mail.content = params.content
	// 	mail.type = MailDefine.MailType.Club;
	// 	mail.attachs = params.attachs
	// 	await Rpc.center.callException("kds.mail.addclub",params.clubID,mail)
	// 	return {}
    // }
    export async function sendUserMail(userID:number,params:{
        userID:number,
		title:string,
        content:string,
		attachs?:MailDefine.tMailAttach[]
	}){
        let mail = await MailUtils.newMail()
		mail.toUserID = params.userID
		mail.title = params.title
		mail.content = params.content
		mail.attachs = params.attachs
		//mail.setSystem();
		await Rpc.center.callException(kds.mail.add,mail)
		return {}
    }
}