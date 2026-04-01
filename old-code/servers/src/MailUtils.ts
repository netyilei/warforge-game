import { kdutils } from "kdweb-core/lib/utils"
import { Module_Mail } from "../pp-base-define/DM_MailDefine"
import { MailDefine } from "../pp-base-define/MailDefine"
import { IDUtils } from "./IDUtils"
import { TimeDate } from "./TimeDate"


export namespace MailUtils {
	export async function newLockMail(reason?:string) {
		let mailID = await IDUtils.getMailID()
		let time = kdutils.getMillionSecond()
		return await Module_Mail.newEntity(mailID, reason, async (mailID) => {
			return {
				mailID: String(mailID),
				fromUserID: 0, // -1 ,0=系统 
				toUserID: 0,
				type: MailDefine.MailType.None,
				title: "",
				content: "",
				sendTime: time,
				sendDate: TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",time),
				isRead: false,
				isReceived: false,
				isDel: false,
			}
		})
	}
	export async function newMail() {
		let mailID = await IDUtils.getMailID()
		let time = kdutils.getMillionSecond()
		return <MailDefine.tMail>{
			mailID: String(mailID),
			fromUserID: 0, // -1 ,0=系统 
			toUserID: 0,
			type: MailDefine.MailType.None,
			title: "",
			content: "",
			sendTime: time,
			sendDate: TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",time),
			isRead: false,
			isReceived: false,
			isDel: false,
		}
	}
}
