import { kdutils } from "kdweb-core/lib/utils";
import { ClubDefine } from "../../pp-base-define/ClubDefine";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { DB } from "../../src/db";
import { MutexFunctional } from "../../src/MutexTools";
import { Rpc } from "../rpc";
import { ClubMember } from "../Utils/ClubMember";
import { BinaryFlag } from "../../src/BinaryFlag";
import { RedisLock } from "../../src/RedisLock";
import { RpcClubAccount } from "./club_account";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { ClubDCN } from "../Utils/ClubDCN";
import Decimal from "decimal.js";
import { SrsDCN } from "../../pp-base-define/SrsUserMsg";
// import { MailUtils } from "../../pp-base-define/MailUtils";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { RobotEnvTools } from "../../src/RobotEnvTools";

let db = DB.get()
async function callInMutex<T>(name,func:(...params)=>Promise<T>) {
	return await RedisLock.callInLock<T>(name,30,async ()=>{
		return await func()
	})
}
async function callInItemMutex<T>(userID:number,func:(...params)=>Promise<T>) {
	return await callInMutex<T>("ITEM|" + userID,func)
}

async function isMember(h:string,clubID:number,userID:number) {
	if(await RobotEnvTools.isRobot(userID)) {
		return true 
	}
	return await new ClubMember(clubID).isMember(userID)
}

async function add(h:string,clubID:number,userID:number,leaderUserID?:number) {
	let club = new ClubMember(clubID)
	let data = await club.getData()
	if(!data) {
		return false 
	}
	let member = await club.getMember(userID)
	if(member) {
		return true 
	}
	if(!await db.getSingle(DBDefine.tableUserLoginData,{userID})) {
		return false 
	}
	member = {
		clubID,
		userID,
		leaderUserID:null,

		type:ClubDefine.MemberType.Normal,
		job:ClubDefine.JobType.None,
		joinTimestamp:kdutils.getMillionSecond(),
	}
	await club.saveMember(member)
	if(leaderUserID) {
		await club.setLeader(userID,leaderUserID)
	}
	return true 
}

async function remove(h:string,clubID:number,userID:number,fromUserID?:number,fromGMID?:number) {
	let auth = new Rpc.authClass(clubID);
	let _isEnableRemove = true;
	if(fromUserID){
		_isEnableRemove = await auth.isAdminOrBoss(fromUserID)
	}
	if(!_isEnableRemove){
		return false 
	}

	
	let club = new ClubMember(clubID)
	let data = await club.getData()
	if(!data) {
		return false 
	}
	let member = await club.getMember(userID)
	if(!member) {
		return true 
	}
	if(data.bossUserID == userID) {
		return false 
	}
	let leader = member.leaderUserID
	let subMembers = await club.getSubMembers(userID,false)
	let ps = []
	for(let subMember of subMembers) {
		ps.push(
			club.setLeader(subMember.userID,leader)
		)
	}
	ps.push(
		club.setLeader(userID,null)
	)
	await Promise.all(ps)
	await db.del(DBDefine.tableClubMember,{clubID,userID})
	await db.del(DBDefine.tableClubRelation,{clubID,userID})
	await db.delMany(DBDefine.tableClubDeskCost,{userID:userID})
	await db.delMany(DBDefine.tableClubDeskCost,{targetUserID:userID})
	await db.del(DBDefine.tableClubReq,{clubID,userID})
	await db.del(DBDefine.tableClubInvite,{clubID,userID})
	return true 
}

async function setLeader(h:string,clubID:number,userID:number,leaderUserID:number) {
	let club = new ClubMember(clubID)
	let data = await club.getData()
	if(!data) {
		return false 
	}
	let member = await club.getMember(userID)
	if(!member) {
		return true 
	}
	if(data.bossUserID == userID) {
		return false 
	}
	return await club.setLeader(userID,leaderUserID)
}

async function changeMemberType(h:string,clubID:number,userID:number,toUserID:number,memberType?:ClubDefine.MemberType) {
	let auth = new Rpc.authClass(clubID)
	if(!await auth.isChangeMemberTypeEnabled(userID,toUserID)) {
		return false 
	}
	let toMember = await auth.member.getMember(toUserID)
	toMember.type = memberType
	await auth.member.saveMember(toMember)
	ClubDCN.sendSingleMember(clubID,toUserID,toMember.leaderUserID ? [userID,toMember.leaderUserID] : [userID])
	return true 
}

async function changeJobType(h:string,clubID:number,userID:number,toUserID:number,jobType?:ClubDefine.JobType) {
	let auth = new Rpc.authClass(clubID)
	if(!await auth.isChangeMemberJobTypeEnabled(userID,toUserID)) {
		return false 
	}
	let toMember = await auth.member.getMember(toUserID)
	toMember.job = jobType
	await auth.member.saveMember(toMember)
	ClubDCN.sendSingleMember(clubID,toUserID,toMember.leaderUserID ? [userID,toMember.leaderUserID] : [userID])
	return true 
}

async function req(h:string,clubID:number,userID:number,userReason?:string) {
	let auth = new Rpc.authClass(clubID)
	if(!await auth.isReqEnabled(userID)) {
		return false 
	}
	return await RedisLock.callInLock(RedisLock.ClubJoin(clubID),5,async ()=>{
		let req:ClubDefine.tMemberReq = await db.getSingle(DBDefine.tableClubReq,{clubID,userID})
		if(req) {
			return true 
		}
		req = {
			clubID,userID,expireTime:0,
			userReason:userReason ? String(userReason).trim() : null,
			timestamp:kdutils.getMillionSecond(),
			date:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		}
		await db.insert(DBDefine.tableClubReq,req)
		return true 
	})
}

// 同意申请
async function accept(h:string,clubID:number,userID:number,toUserID:number,b:boolean) {
	let auth = new Rpc.authClass(clubID)
	if(!await auth.isAcceptEnabled(userID)) {
		return false 
	}
	let club = auth.member
	return await RedisLock.callInLock(RedisLock.ClubJoin(clubID),5,async ()=>{
		let req:ClubDefine.tMemberReq = await db.getSingle(DBDefine.tableClubReq,{clubID,userID:toUserID})
		if(!req) {
			return true 
		}
		if(!b) {
			await db.del(DBDefine.tableClubReq,{clubID,userID:toUserID})
			return true 
		}
		await db.del(DBDefine.tableClubReq,{clubID,userID:toUserID})
		let member = {
			clubID,
			userID:toUserID,
			leaderUserID:null,
	
			type:ClubDefine.MemberType.Normal,
			job:ClubDefine.JobType.None,
			joinTimestamp:kdutils.getMillionSecond(),
		}
		await club.saveMember(member)
		await club.setLeader(toUserID,userID)

		ClubDCN.sendMember(clubID,[
			userID,toUserID,
		],{
			userIDs:[toUserID],
			removeUserIDs:null,
		})
		return true 
	})
}

async function invite(h:string,clubID:number,userID:number,toUserID:number,userReason?:string) {
	let auth = new Rpc.authClass(clubID)
	if(!await auth.isInviteEnabled(userID)) {
		return false 
	}
	let loginData:UserDefine.tLoginData = await db.getSingle(DBDefine.tableUserLoginData,{userID:toUserID})
	if(!loginData) {
		return false 
	}

	let userInfo:UserDefine.tLoginData = await db.getSingle(DBDefine.tableUserLoginData,{userID:userID})
	if(!userInfo) {
		return false 
	}
	
	return await RedisLock.callInLock(RedisLock.ClubJoin(clubID),5,async ()=>{
		// let invite:ClubDefine.tMemberInvite = await db.getSingle(DBDefine.tableClubInvite,{clubID,userID,toUserID})
		// if(invite) {
		// 	return true 
		// }
		// invite = {
		// 	clubID,userID,expireTime:0,toUserID,
		// 	userReason:userReason ? String(userReason).trim() : null,
		// 	timestamp:kdutils.getMillionSecond(),
		// 	date:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		// }
		// //生成邮件
		// let _mail = new MailUtils(userID,toUserID)
		// _mail.setTitle("俱乐部邀请")
		// _mail.setContent(`你被${userInfo.nickName}邀请加入俱乐部`)
		// _mail.setInvite(kdutils.clone(invite));

		// invite.mailID = _mail.getMailInfo().mailID

		// await Rpc.center.callException("kds.mail.add",_mail.getMailInfo())
		// await db.insert(DBDefine.tableClubInvite,invite)
		return true 
	})
}
// 同意邀请
async function agree(h:string,clubID:number,userID:number,b:boolean) {
	let auth = new Rpc.authClass(clubID)
	if(!await auth.isAgreeEnabled(userID)) {
		return false 
	}
	return await RedisLock.callInLock(RedisLock.ClubJoin(clubID),5,async ()=>{
		let invite:ClubDefine.tMemberInvite = await db.getSingle(DBDefine.tableClubInvite,{clubID,toUserID:userID})
		if(!invite) {
			return true 
		}
		if(invite.mailID){
			await Rpc.center.callException("kds.mail.invite.state",userID,invite.mailID,b)
		}
		if(!b) {
			await db.del(DBDefine.tableClubInvite,{clubID,toUserID:userID})
			return true 
		}
		await db.del(DBDefine.tableClubInvite,{clubID,toUserID:userID})
		let club = new ClubMember(clubID)
		let member = {
			clubID,
			userID,
			leaderUserID:null,
	
			type:ClubDefine.MemberType.Normal,
			job:ClubDefine.JobType.None,
			joinTimestamp:kdutils.getMillionSecond(),
		}
		await club.saveMember(member)
		await club.setLeader(userID,invite.userID)

		ClubDCN.sendMember(clubID,[
			userID,invite.userID,
		],{
			userIDs:[invite.userID],
			removeUserIDs:null,
		})
		return true 
	})
}

async function giveValue(h:string,clubID:number,userID:number,toUserID:number,value:Decimal,valueIndex:number) {
	value = new Decimal(value)
	let auth = new Rpc.authClass(clubID)
	if(!await auth.isGiveValueEnabled(userID,toUserID)) {
		return false 
	}

	let b = await RpcClubAccount.use(null,clubID,userID,valueIndex,value,false,ItemDefine.SerialType.Give)
	if(!b) {
		return false 
	}
	let give = await RpcClubAccount.add(null,clubID,toUserID,valueIndex,value,ItemDefine.SerialType.Receive)
	if(!give) {
		await RpcClubAccount.add(null,clubID,userID,valueIndex,value,ItemDefine.SerialType.GiveFailed)
		return b 
	}
	return true 
}

async function getSubMember(h:string,clubID:number,userID:number,subUserID:number) {
	let club = new ClubMember(clubID)
	let relation = await club.getRelation(userID)
	if(!relation || !relation.subs.includes(subUserID)) {
		return null 
	}
	return club.getMember(subUserID)
}

async function getSubMembers(h:string,clubID:number,userID:number,skip:number,limit:number,account?:boolean) {
	let club = new ClubMember(clubID)
	let member = await club.getMember(userID)
	if(!member) {
		return []
	}
	let subs = await club.getSubs(userID,true)
	if(limit){
		if(!skip){
			skip = 0;
		}
		subs = subs.slice(skip,skip + limit)
	}
	
	if(subs.length > 0) {
		let members = await club.getMembers(subs)
		if(account) {
			let accounts:ClubDefine.tUserAccount[] = await db.get(DBDefine.tableClubUserAccount,{clubID,userID:{$in:subs}})
			return {
				members,
				accounts,
			}
		}
		return members
	}
	return []
}
async function getSubIds(h:string,clubID:number,userID:number) {
	let club = new ClubMember(clubID)
	let _result = await club.getSubs(userID,true)
	return _result
}

async function getSubAccount(h:string,clubID:number,userID:number,subUserID:number) {
	let club = new ClubMember(clubID)
	let relation = await club.getRelation(userID)
	if(!relation || !relation.subs.includes(subUserID)) {
		return null 
	}
	return await RpcClubAccount.getAccount(h,clubID,subUserID)
}

async function isSearchUserIDEnabled(h:string,clubID:number,userID:number) {
	let auth = new Rpc.authClass(clubID)
	return await auth.isInviteEnabled(userID)
}

async function setDeskCost(h:string,clubID:number,tId:number,userID:number,targetUserID:number,ratio:number){
	let club = new ClubMember(clubID)
	return await club.setDeskCost(tId,userID,targetUserID,ratio)
}

async function getDeskCost(h:string,clubID:number,userID:number,targetUserID:number){
	let club = new ClubMember(clubID)
	return await club.getDeskCost(userID,targetUserID)
}

export let RpcClubMember = {
	isMember,
	add,
	remove,
	setLeader,
	changeMemberType,
	changeJobType,
	req,
	accept,

	invite,
	agree,

	giveValue,
	getSubMember,
	getSubMembers,
	getSubIds,

	getSubAccount,

	isSearchUserIDEnabled,
	
	setDeskCost,
	getDeskCost,
}