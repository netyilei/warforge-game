import { ClubDefine } from "../../pp-base-define/ClubDefine"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { BinaryFlag } from "../../src/BinaryFlag"
import { DB } from "../../src/db"
import { ClubMember } from "./ClubMember"


let db = DB.get()
export class ClubAuthBase  {
	constructor(clubID:number) {
		this.clubID_ = clubID
		this.member_ = new ClubMember(this.clubID)
	}

	private clubID_:number
	get clubID() {
		return this.clubID_
	}
	set clubID(v) {
		this.clubID_ = v
	}

	private member_:ClubMember
	get member() {
		return this.member_
	}

	private setting_:ClubDefine.tSetting
	async getSetting() {
		this.setting_ = this.setting_ || await db.getSingle(DBDefine.tableClubSetting,{clubID:this.clubID})
		return this.setting_
	}
	private data_:ClubDefine.tData
	async getData() {
		this.data_ = this.data_ || await db.getSingle(DBDefine.tableClubData,{clubID:this.clubID})
		return this.data_
	}

	async isReqEnabled(userID:number) {
		let setting = await this.getSetting()
		if(!setting) {
			return false 
		}
		let flag = new BinaryFlag(setting.invite)
		if(!flag.contains(ClubDefine.ClubInviteMode.Req)) {
			return false 
		}
		return true 
	}
	async isAcceptEnabled(userID:number) {
		let setting = await this.getSetting()
		if(!setting) {
			return false 
		}
		let flag = new BinaryFlag(setting.invite)
		if(!flag.contains(ClubDefine.ClubInviteMode.Req)) {
			return false 
		}
		let member = await this.member.getMember(userID)
		if(!member) {
			return false 
		}
		if(member.type != ClubDefine.MemberType.Boss) {
			if(member.job != ClubDefine.JobType.Admin) {
				return false 
			}
			let setting = await this.getSetting()
			if(!setting.adminAcceptReq) {
				return false 
			}
		}
		return true 
	}

	async isInviteEnabled(userID:number) {
		let setting = await this.getSetting()
		if(!setting) {
			return false 
		}
		let flag = new BinaryFlag(setting.invite)
		if(!flag.contains(ClubDefine.ClubInviteMode.Invite)) {
			return false 
		}
		let member = await this.member.getMember(userID)
		if(!member) {
			return false 
		}
		// FUND: 代理模式？
		if(member.type == ClubDefine.MemberType.Normal) {
			return false 
		}
		return true 
	}

	async isAgreeEnabled(userID:number) {
		let setting = await this.getSetting()
		if(!setting) {
			return false 
		}
		let flag = new BinaryFlag(setting.invite)
		if(!flag.contains(ClubDefine.ClubInviteMode.Invite)) {
			return false 
		}
		return true 
	}

	async isChangeMemberTypeEnabled(userID:number,toUserID:number) {
		if(userID < 0) {
			return true 
		}
		let member = await this.member.getMember(userID)
		if(!member) {
			return false 
		}
		let toMember = await this.member.getMember(toUserID)
		if(!toMember) {
			return false 
		}
		if(member.type == ClubDefine.MemberType.Boss || member.type == ClubDefine.MemberType.Promote_Super) {
			return true 
		}
		return false 
	}
	async isChangeMemberJobTypeEnabled(userID:number,toUserID:number) {
		if(userID < 0) {
			return true 
		}
		let member = await this.member.getMember(userID)
		if(!member) {
			return false 
		}
		let toMember = await this.member.getMember(toUserID)
		if(!toMember) {
			return false 
		}
		if(member.type == ClubDefine.MemberType.Boss || toMember.type == ClubDefine.MemberType.Promote_Super) {
			return true 
		}
		return false 
	}

	async isGiveValueEnabled(userID:number,toUserID:number) {
		let member = await this.member.getMember(userID)
		if(!member) {
			return false 
		}
		if(member.type == ClubDefine.MemberType.Boss) {
			return true 
		}
		let relation = await this.member.getRelation(userID)
		if(!relation) {
			return false 
		}
		return relation.subs.includes(toUserID)
	}

	async isCreateTemplateEnabled(userID:number) {
		if(userID < 0) {
			return true 
		}
		let member = await this.member.getMember(userID)
		if(!member) {
			return false 
		}
		if(member.type == ClubDefine.MemberType.Boss) {
			return true 
		}
		if(member.job == ClubDefine.JobType.Admin) {
			let setting = await this.getSetting()
			if(!setting) {
				return false 
			}
			return !!setting.adminCreateTemplate
		}
		return false 
	}

	async isCreateRoomEnabled(userID:number) {
		if(userID < 0) {
			return true 
		}
		let member = await this.member.getMember(userID)
		if(!member) {
			return false 
		}
		if(member.type == ClubDefine.MemberType.Boss) {
			return true 
		}
		if(member.job == ClubDefine.JobType.Admin) {
			let setting = await this.getSetting()
			if(!setting) {
				return false 
			}
			return !!setting.adminCreateRoom
		}
		return false 
	}

	async isAdminOrBoss(userID:number) {
		if(userID < 0) {
			return true 
		}
		let member = await this.member.getMember(userID)
		if(!member) {
			return false 
		}
		if(member.type == ClubDefine.MemberType.Boss) {
			return true 
		}
		if(member.job == ClubDefine.JobType.Admin){
			return true
		}
		return false
	}
}