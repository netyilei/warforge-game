import { baseService } from "kdweb-core/lib/service/base"
import { ClubDefine } from "../../pp-base-define/ClubDefine"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { kds } from "../../pp-base-define/GlobalMethods"
import { ItemDefine } from "../../pp-base-define/ItemDefine"
import { UserDefine } from "../../pp-base-define/UserDefine"
import { DB } from "../../src/db"
import { Rpc } from "../rpc"
import _ from "underscore"
import { Module_LoginAccessToken, Module_RegisterAudit, Module_RegisterUpload, Module_UserBag, Module_UserLoginChannel, Module_UserLoginData, Module_UserLoginRole, Module_UserRelation, Module_UserSearch, Module_UserSerial } from "../../pp-base-define/DM_UserDefine"
import { UserUtils } from "../../src/UserUtils"
import { Module_UserBalance, Module_UserProxyCharge } from "../../pp-base-define/DM_LeaderDefine"
import { PromoteRelationUtils } from "../../src/PromoteRelationUtils"
import Decimal from "decimal.js"
import { LeaderHelper } from "../../src/LeaderHelper"
import fs = require("fs")

let db = DB.get()
export namespace GMUser {
	export async function getUsers(userID:number,params:{
		userID?:number,
		userIDs?:number[],
		account?:string,
		ignoreRobot?:boolean,
		channel?:UserDefine.LoginChannel,
		target?:UserDefine.LoginTarget,
		page:number,limit:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.UserInfos)) {
			return baseService.errJson(1,"权限不足")
		}
		let index:any = {}
		if(params.userID != null) {
			index.userID = params.userID
		}
		if(params.userIDs) {
			index.userID = {$in:params.userIDs}
		}
		if(params.ignoreRobot) {
			index.robot = {$ne:true}
		}
		let userIDs:number[]
		let loginDatas:UserDefine.tLoginData[]
		let loginChannels:UserDefine.tLoginChannel[]
		let loginRoles:UserDefine.tLoginRole[]
		let bags:ItemDefine.tBag[]
		let count:number
		if(params.channel != null || params.account != null) {
			if(params.channel != null) {
				index.type = params.channel
			}
			if(params.account != null) {
				index.account = {$regex:params.account}
			}
			count = await Module_UserLoginChannel.getCount(index)
			loginChannels = await Module_UserLoginChannel.getOption(index,{
				skip:params.page * params.limit,
				limit:params.limit
			})

			userIDs = _.uniq(loginChannels.map(v=>v.userID))
			loginDatas = await Module_UserLoginData.get({userID:{$in:userIDs}})
			loginRoles = await Module_UserLoginRole.get({userID:{$in:userIDs}})
		} else if(params.target != null) {
			index.targets = {$elemMatch:{target:params.target}}
			count = await Module_UserLoginRole.getCount(index)
			loginRoles = await Module_UserLoginRole.getOption(index,{
				skip:params.page * params.limit,
				limit:params.limit
			})

			userIDs = _.uniq(loginRoles.map(v=>v.userID))
			loginDatas = await Module_UserLoginData.get({userID:{$in:userIDs}})
			loginChannels = await Module_UserLoginChannel.get({userID:{$in:userIDs}})
		} else {
			count = await Module_UserLoginData.getCount(index)
			loginDatas = await Module_UserLoginData.getOption(index,{
				skip:params.page * params.limit,
				limit:params.limit
			})
			userIDs = _.uniq(loginDatas.map(v=>v.userID))
			loginChannels = await Module_UserLoginChannel.get({userID:{$in:userIDs}})
			loginRoles = await Module_UserLoginRole.get({userID:{$in:userIDs}})
		}
		bags = await Module_UserBag.get({userID:{$in:userIDs}})
		// 数值平衡
		let balances = await Module_UserBalance.get({userID:{$in:userIDs}})
		let users = loginDatas.map(v=>{
			return {
				userID:v.userID,
				loginData:v,
				loginChannels:_.each(loginChannels.filter(k=>k.userID == v.userID),v=>v.pwdMD5 ? delete v.pwdMD5 : 0),
				loginRole:loginRoles.find(k=>k.userID == v.userID),
				bag:bags.find(k=>k.userID == v.userID),
				balance:balances.find(k=>k.userID == v.userID),
			}
		})
		return {
			users,count
		}
	}

	export async function getNormalUsers(userID:number,params:{
		userID?:number,
		userIDs?:number[],
		account?:string,
		nickName?:string,
		disabled?:boolean,
		lockWithdraw?:boolean,
		containsProxy?:boolean,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.userID != null) {
			index.userID = params.userID
		}
		if(params.userIDs) {
			index.userID = {$in:params.userIDs}
		}
		if(params.account) {
			index.account = {$regex:params.account}
		}
		if(params.nickName) {
			index.nickName = {$regex:params.nickName}
		}
		if(!params.disabled) {
			index.disabled = false
		}
		if(params.lockWithdraw) {
			index.lockWithdraw = true
		}
		index.robot = false
		index.$or = [
			{targets:UserDefine.LoginTarget.App},
			{targetEmpty:true}
		]
		if(!params.containsProxy) {
			index.roles = {$ne:UserDefine.RoleType.LeaderProxy}
		}
		let count = await Module_UserSearch.getCount(index)
		let searches:UserDefine.tUserSearch[] = await Module_UserSearch.getOption(index,{
			sort:{userID:-1},
			skip:params.page * params.limit,
			limit:params.limit
		})
		let userIDs = searches.map(v=>v.userID)
		let loginDatas = await Module_UserLoginData.get({userID:{$in:userIDs}})
		let loginChannels = await Module_UserLoginChannel.get({userID:{$in:userIDs}})
		let loginRoles = await Module_UserLoginRole.get({userID:{$in:userIDs}})
		let bags = await Module_UserBag.get({userID:{$in:userIDs}})
		let balances = await Module_UserBalance.get({userID:{$in:userIDs}})
		let users = searches.map(v=>{
			return {
				userID:v.userID,
				search:v,
				loginData:loginDatas.find(k=>k.userID == v.userID),
				loginChannels:_.each(loginChannels.filter(k=>k.userID == v.userID),v=>v.pwdMD5 ? delete v.pwdMD5 : 0),
				loginRole:loginRoles.find(k=>k.userID == v.userID),
				bag:bags.find(k=>k.userID == v.userID),
				balance:balances.find(k=>k.userID == v.userID),
			}
		})
		return {
			users,count
		}
	}

	export async function getProxyUsers(userID:number,params:{
		userID?:number,
		userIDs?:number[],
		account?:string,
		nickName?:string,
		disabled?:boolean,
		lockWithdraw?:boolean,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.userID != null) {
			index.userID = params.userID
		}
		if(params.userIDs) {
			index.userID = {$in:params.userIDs}
		}
		if(params.account) {
			index.account = {$regex:params.account}
		}
		if(params.nickName) {
			index.nickName = {$regex:params.nickName}
		}
		if(!params.disabled) {
			index.disabled = false
		}
		if(params.lockWithdraw) {
			index.lockWithdraw = true
		}
		index.robot = false
		index.targets = UserDefine.LoginTarget.Console
		index.roles = UserDefine.RoleType.LeaderProxy
		let count = await Module_UserSearch.getCount(index)
		let searches:UserDefine.tUserSearch[] = await Module_UserSearch.getOption(index,{
			sort:{userID:-1},
			skip:params.page * params.limit,
			limit:params.limit
		})
		let userIDs = searches.map(v=>v.userID)
		let loginDatas = await Module_UserLoginData.get({userID:{$in:userIDs}})
		let loginChannels = await Module_UserLoginChannel.get({userID:{$in:userIDs}})
		let loginRoles = await Module_UserLoginRole.get({userID:{$in:userIDs}})
		let bags = await Module_UserBag.get({userID:{$in:userIDs}})
		let balances = await Module_UserBalance.get({userID:{$in:userIDs}})
		let proxyCharges = await Module_UserProxyCharge.get({userID:{$in:userIDs}})
		let users = searches.map(v=>{
			return {
				userID:v.userID,
				search:v,
				loginData:loginDatas.find(k=>k.userID == v.userID),
				loginChannels:_.each(loginChannels.filter(k=>k.userID == v.userID),v=>v.pwdMD5 ? delete v.pwdMD5 : 0),
				loginRole:loginRoles.find(k=>k.userID == v.userID),
				bag:bags.find(k=>k.userID == v.userID),
				balance:balances.find(k=>k.userID == v.userID),
				proxyCharge:proxyCharges.find(k=>k.userID == v.userID),
			}
		})
		return {
			users,count
		}
	}

	export async function getAdminUsers(userID:number,params:{
		userID?:number,
		userIDs?:number[],
		account?:string,
		nickName?:string,
		disabled?:boolean,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.userID != null) {
			index.userID = params.userID
		}
		if(params.userIDs) {
			index.userID = {$in:params.userIDs}
		}
		if(params.account) {
			index.account = {$regex:params.account}
		}
		if(params.nickName) {
			index.nickName = {$regex:params.nickName}
		}
		if(!params.disabled) {
			index.disabled = false
		}
		index.robot = false
		index.targets = UserDefine.LoginTarget.Console
		index.roles = {$ne:UserDefine.RoleType.LeaderProxy}
		let count = await Module_UserSearch.getCount(index)
		let searches:UserDefine.tUserSearch[] = await Module_UserSearch.getOption(index,{
			sort:{userID:-1},
			skip:params.page * params.limit,
			limit:params.limit
		})
		let userIDs = searches.map(v=>v.userID)
		let loginDatas = await Module_UserLoginData.get({userID:{$in:userIDs}})
		let loginChannels = await Module_UserLoginChannel.get({userID:{$in:userIDs}})
		let loginRoles = await Module_UserLoginRole.get({userID:{$in:userIDs}})
		let bags = await Module_UserBag.get({userID:{$in:userIDs}})
		let balances = await Module_UserBalance.get({userID:{$in:userIDs}})
		let users = searches.map(v=>{
			return {
				userID:v.userID,
				search:v,
				loginData:loginDatas.find(k=>k.userID == v.userID),
				loginChannels:_.each(loginChannels.filter(k=>k.userID == v.userID),v=>v.pwdMD5 ? delete v.pwdMD5 : 0),
				loginRole:loginRoles.find(k=>k.userID == v.userID),
				bag:bags.find(k=>k.userID == v.userID),
				balance:balances.find(k=>k.userID == v.userID),
			}
		})
		return {
			users,count
		}
	}

	export async function getRobotUsers(userID:number,params:{
		userID?:number,
		userIDs?:number[],
		nickName?:string,
		disabled?:boolean,
		groupID?:number,
		matchID?:number,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.userID != null) {
			index.userID = params.userID
		}
		if(params.userIDs) {
			index.userID = {$in:params.userIDs}
		}
		if(params.nickName) {
			index.nickName = {$regex:params.nickName}
		}
		if(!params.disabled) {
			index.disabled = false
		}
		if(params.groupID) {
			index.robotGroupID = params.groupID
		}
		if(params.matchID) {
			index.robotMatchID = params.matchID
		}

		index.robot = true
		let count = await Module_UserSearch.getCount(index)
		let searches:UserDefine.tUserSearch[] = await Module_UserSearch.getOption(index,{
			sort:{userID:-1},
			skip:params.page * params.limit,
			limit:params.limit
		})
		let userIDs = searches.map(v=>v.userID)
		let loginDatas = await Module_UserLoginData.get({userID:{$in:userIDs}})
		let loginChannels = await Module_UserLoginChannel.get({userID:{$in:userIDs}})
		let loginRoles = await Module_UserLoginRole.get({userID:{$in:userIDs}})
		let bags = await Module_UserBag.get({userID:{$in:userIDs}})
		let balances = await Module_UserBalance.get({userID:{$in:userIDs}})
		let users = searches.map(v=>{
			return {
				userID:v.userID,
				search:v,
				loginData:loginDatas.find(k=>k.userID == v.userID),
				loginChannels:_.each(loginChannels.filter(k=>k.userID == v.userID),v=>v.pwdMD5 ? delete v.pwdMD5 : 0),
				loginRole:loginRoles.find(k=>k.userID == v.userID),
				bag:bags.find(k=>k.userID == v.userID),
				balance:balances.find(k=>k.userID == v.userID),
			}
		})
		return {
			users,count
		}
	}

	export async function setUserDisabled(userID:number,params:{
		userID:number,
		disabled:boolean,
	}) {
		let loginData = await Module_UserLoginData.getMain(params.userID)
		if(!loginData) {
			return baseService.errJson(1,"用户不存在")
		}
		loginData.disabled = !!params.disabled
		if(params.disabled) {
			await Module_LoginAccessToken.delMany({userID:params.userID})
		}
		await Module_UserLoginData.update(loginData)
		await UserUtils.rebuildSearch(params.userID,{loginData})
		return {
			loginData
		}
	}
	export async function setUserLockWithdraw(userID:number,params:{
		userID:number,
		lockWithdraw:boolean,
	}) {
		let loginData = await Module_UserLoginData.getMain(params.userID)
		if(!loginData) {
			return baseService.errJson(1,"用户不存在")
		}
		loginData.lockWithdraw = !!params.lockWithdraw
		if(params.lockWithdraw) {
			await Module_LoginAccessToken.delMany({userID:params.userID})
		}
		await Module_UserLoginData.update(loginData)
		await UserUtils.rebuildSearch(params.userID,{loginData})
		return {
			loginData
		}
	}

	// 获取用户背包
	export async function getUserBags(userID:number,params:{
		userID?:number,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.userID) {
			index.userID = params.userID
		}
		let count = await Module_UserBag.getCount(index)
		let datas:ItemDefine.tBag[] = await Module_UserBag.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit
		})
		return {
			datas,count
		}
	}

	// 获取用户背包
	export async function getUserClubBags(userID:number,params:{
		userID?:number,
		clubID?:number,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.userID) {
			index.userID = params.userID
		}
		if(params.clubID) {
			index.clubID = params.clubID
		}
		let count = await db.getCount(DBDefine.tableClubUserAccount,index)
		let datas:ClubDefine.tUserAccount[] = await db.getOption(DBDefine.tableClubUserAccount,index,{
			skip:params.page * params.limit,
			limit:params.limit
		})
		return {
			datas,count
		}
	}

	/**
	 * 获取用户平台冻结账户
	 * 注意 lock里的id是string类型，映射ItemID
	 */
	export async function getUserLocked(userID:number,params:{
		userID?:number,
		clubID?:number,
		roomID?:number,
		lockID?:string,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.userID) {
			index.userID = params.userID
		}
		if(params.clubID) {
			index.clubID = params.clubID
		}
		if(params.roomID) {
			index.roomID = params.roomID
		}
		if(params.lockID) {
			index.lockID = {$regex:params.lockID}
		}
		let count = await db.getCount("t_item_lock",index)
		let datas:ItemDefine.tLock[] = await db.getOption("t_item_lock",index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				timestamp:-1
			}
		})
		return {
			datas,count
		}
	}

	/**
	 * 获取用户俱乐部冻结账户
	 * 注意 lock里的id是number类型，映射ClubDefine.ValueIndex
	 */
	export async function getUserClubLocked(userID:number,params:{
		userID?:number,
		clubID?:number,
		roomID?:number,
		lockID?:string,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.userID) {
			index.userID = params.userID
		}
		if(params.clubID) {
			index.clubID = params.clubID
		}
		if(params.roomID) {
			index.roomID = params.roomID
		}
		if(params.lockID) {
			index.lockID = {$regex:params.lockID}
		}
		let count = await db.getCount("t_club_item_lock",index)
		let datas:ItemDefine.tLock[] = await db.getOption("t_club_item_lock",index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				timestamp:-1
			}
		})
		return {
			datas,count
		}
	}

	export async function createLockItem(userID:number,params:{
		userID:number,
		lockID:string,
		itemID?:string,

		clubID?:number,
		valueIndex?:number,	// club使用
		count:number,
		serialType:ItemDefine.SerialType,
	}) {
		if(!params.clubID) {
			let b = await Rpc.center.callException(kds.item.lockItem,params.userID,params.lockID,params.itemID,params.count,params.serialType || ItemDefine.SerialType.GM)
			if(!b) {
				return baseService.errJson(1,"冻结失败")
			}
			return {}
		} else {
			let b = await Rpc.center.callException(kds.club.account.lockValue,params.clubID,params.userID,params.lockID,params.valueIndex,params.count,params.serialType || ItemDefine.SerialType.GM)
			if(!b) {
				return baseService.errJson(1,"冻结失败")
			}
			return {}
		}
	}

	export async function addUserItem(userID:number,params:{
		userID:number,
		itemID:string,
		count:number,
		// 是否给冻结账户加
		lockID?:string,

		serialType?:ItemDefine.SerialType,
	}) {
		if(params.lockID) {
			let account = params.count < 0  ?
				await Rpc.center.callException(kds.item.useLockItem,params.userID,params.lockID,params.itemID,Math.abs(params.count),true,params.serialType || ItemDefine.SerialType.GM)
				:
				await Rpc.center.callException(kds.item.addLockItem,params.userID,params.lockID,params.itemID,params.count,params.serialType || ItemDefine.SerialType.GM)
			return account ? {account} : baseService.errJson(1,"操作失败")
		} else {
			let account = params.count < 0 ? 
				await Rpc.center.callException(kds.item.use,params.userID,params.itemID,Math.abs(params.count),true,params.serialType || ItemDefine.SerialType.GM)
				:
				await Rpc.center.callException(kds.item.add,params.userID,params.itemID,params.count,params.serialType || ItemDefine.SerialType.GM)

			return account ? {account} : baseService.errJson(1,"操作失败")
		}
	}

	/**
	 * 增加俱乐部账户
	 */
	export async function addUserClubValue(userID:number,params:{
		clubID:number,
		userID:number,
		valueIndex:ClubDefine.ValueIndex,
		count:number,
		// 是否给冻结账户加
		lockID?:string,

		serialType?:ItemDefine.SerialType,
	}) {
		if(!await Rpc.center.callException(kds.club.member.isMember,params.clubID,params.userID)) {
			return baseService.errJson(1,"不是成员")
		}
		if(params.lockID) {
			let account = params.count < 0  ?
				await Rpc.center.callException(kds.club.account.useLockValue,params.clubID,params.userID,params.lockID,params.valueIndex,Math.abs(params.count),true,params.serialType || ItemDefine.SerialType.GM)
				:
				await Rpc.center.callException(kds.club.account.addLockValue,params.clubID,params.userID,params.lockID,params.valueIndex,params.count,params.serialType || ItemDefine.SerialType.GM)
			return account ? {account} : baseService.errJson(1,"操作失败")
		} else {
			let account = params.count < 0 ? 
				await Rpc.center.callException(kds.club.account.use,params.clubID,params.userID,params.valueIndex,Math.abs(params.count),true,params.serialType || ItemDefine.SerialType.GM)
				:
				await Rpc.center.callException(kds.club.account.add,params.clubID,params.userID,params.valueIndex,params.count,params.serialType || ItemDefine.SerialType.GM)

			return account ? {account} : baseService.errJson(1,"操作失败")
		}
	}

	/**
	 * 取消冻结并返还剩余
	 */
	export async function unlock(userID:number,params:{
		clubID?:number,
		userID:number,
		lockID:string,

		serialType?:ItemDefine.SerialType,
	}) {
		if(params.clubID) {
			if(!await Rpc.center.callException(kds.club.member.isMember,params.clubID,params.userID)) {
				return baseService.errJson(1,"不是成员")
			}
			await Rpc.center.callException(kds.club.account.unlockUser,params.clubID,params.userID,params.lockID,params.serialType || ItemDefine.SerialType.GM)
		} else {
			await Rpc.center.callException(kds.item.unlockUser,params.userID,params.lockID,params.serialType || ItemDefine.SerialType.GM)
		}
		return {}
	}

	export async function addLock(userID:number,params:{
		
	}) {
		return {}
	}
		
	export async function setupLeader(userID:number,params:{
		userID:number,
		leaderUserID?:number,	// 如果是空则是解除上级
	}) {
		let b = await PromoteRelationUtils.setLeader(params.userID,params.leaderUserID || null)
		if(!b) {
			return baseService.errJson(1,"设置失败")
		}
		return {}
	}

	////

	
	export async function getUsersWithValue(userID:number,params:{
		userID?:number,
		userIDs?:number[],
		itemID:string,
		minValue?:string|number,
		sort:"asc"|"desc",

		page:number,limit:number,
	}) {
		let userIDs:number[] = []
		if(params.userID != null) {
			userIDs.push(params.userID)
		}
		if(params.userIDs) {
			userIDs = userIDs.concat(params.userIDs)
		}

		let count = await Module_UserLoginData.getCount(userIDs.length > 0 ? {userID:{$in:userIDs}} : {})
		let minValueNum = params.minValue != null ? new Decimal(params.minValue || 0).toNumber() : null
		let aggArray:any[] = [
			{$unwind:"$items"},
			{$match:{"items.id":params.itemID}},
			{$project:{
				userID:1,
				itemID:"$items.id",
				count:"$items.count",
				countNum:{$toDouble:"$items.count"}
			}},
		]
		if(userIDs.length > 0) {
			aggArray.unshift({$match:{userID:{$in:userIDs}}})
		}
		if(minValueNum != null) {
			aggArray.push({$match:{countNum:{$gte:minValueNum}}})
		}
		aggArray.push({$sort:{countNum:params.sort == "asc" ? 1 : -1}})
		aggArray.push({$skip:params.page * params.limit})
		aggArray.push({$limit:params.limit})

		let bagDatas:{
			userID:number,
			itemID:string,
			count:string,
			countNum:number,
		}[] = await Module_UserBag.aggregateOption(aggArray,{allowDiskUse:true}) || []

		let userIDs2 = bagDatas.map(v=>v.userID)
		
		let index:any = {}
		index.userID = {$in:userIDs2}

		let loginDatas:UserDefine.tLoginData[]
		let loginChannels:UserDefine.tLoginChannel[]
		let loginRoles:UserDefine.tLoginRole[]
		let bags:ItemDefine.tBag[]
		loginDatas = await Module_UserLoginData.get(index)
		loginChannels = await Module_UserLoginChannel.get(index)
		loginRoles = await Module_UserLoginRole.get(index)
		bags = await Module_UserBag.get(index)
		// 数值平衡
		let balances = await Module_UserBalance.get(index)
		let users = loginDatas.map(v=>{
			return {
				userID:v.userID,
				loginData:v,
				loginChannels:_.each(loginChannels.filter(k=>k.userID == v.userID),v=>v.pwdMD5 ? delete v.pwdMD5 : 0),
				loginRole:loginRoles.find(k=>k.userID == v.userID),
				bag:bags.find(k=>k.userID == v.userID),
				bagData:bagDatas.find(k=>k.userID == v.userID),
				balance:balances.find(k=>k.userID == v.userID),
			}
		})
		return {
			users,count,
		}
	}

	export async function getSerials(userID:number,params:{
		userIDs?:number[],
		serialType?:ItemDefine.SerialType,
		setup?:boolean,
		robot?:boolean,
		itemID?:string,
		page:number,limit:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.LeaderProxy)) {
			return baseService.errJson(1,"权限不足")
		}
		let index:any = {}
		if(params.userIDs) {
			// 过滤出下级用户
			index.userID = {$in:params.userIDs}
		}
		if(params.serialType != null) {
			index.type = params.serialType
		}
		if(params.itemID != null) {
			index.itemID = params.itemID
		}
		if(params.setup != null) {
			if(params.setup) {
				index.setup = true 
			} else {
				index.setup = {$ne:true}
			}
		}
		if(!params.robot) {
			index.isRobot = {$ne:true}
		}
		let count = await Module_UserSerial.getCount(index)
		let datas = await Module_UserSerial.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				timestamp:-1,
			}
		})
		return {
			count:count,
			datas:datas,
		}
	}

	export async function getRegisterAudits(userID:number,params:{
		account?:string,
		confirm?:boolean,
		oper?:boolean,
		page:number,limit:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.RegisterAudit)) {
			return baseService.errJson(1,"权限不足")
		}
		let index:any = {}
		if(params.account) {
			index.account = {$regex:params.account}
		}
		if(params.confirm != null) {
			index.confirm = params.confirm
		}
		if(params.oper != null) {
			index.oper = params.oper
		}
		let count = await Module_RegisterAudit.getCount(index)
		let datas = await Module_RegisterAudit.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{
				no:-1
			}
		})
		return {
			count,
			datas
		}
	}

	export async function confirmRegisterAudit(userID:number,params:{
		no:number,
		confirm:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.RegisterAudit)) {
			return baseService.errJson(1,"权限不足")
		}
		let module = await Module_RegisterAudit.searchLockedSingleData(params.no)
		if(!module) {
			return baseService.errJson(1,"审核数据不存在")
		}
		if(module.data.oper) {
			await module.release()
			return baseService.errJson(1,"该申请已被处理")
		}
		module.data.oper = true
		module.data.confirm = !!params.confirm
		module.data.gmUserID = userID
		await module.saveAndRelease()
		if(params.confirm) {
			await Promise.all([
				module.saveAndRelease(),
				Module_UserLoginData.insert(module.data.loginData),
				Module_UserLoginChannel.insert(module.data.loginChannel),
				Module_UserLoginRole.updateOrInsert(module.data.loginRole),
				Module_UserRelation.insert(module.data.relation),
			])
			if(module.data.leaderTag) {
				let leader = await LeaderHelper.getLeaderByTag(module.data.leaderTag)
				if(leader) {
					await PromoteRelationUtils.setLeader(module.data.userID,leader)
				}
			}
			await UserUtils.rebuildSearch(module.data.userID)
		}
		return {
			success:true
		}
	}

	export async function getRegisterAuditUpload(userID:number,params:{
		no:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.RegisterAudit)) {
			return baseService.errJson(1,"权限不足")
		}
		let audit = await Module_RegisterAudit.getMain(params.no)
		if(!audit) {
			return baseService.errJson(1,"审核数据不存在")
		}
		let upload = await Module_RegisterUpload.getMain(audit.uploadToken)
		if(!upload) {
			return baseService.errJson(1,"上传数据不存在")
		}
		let base64Data = fs.readFileSync(upload.fullPath,"base64")
		return {
			base64Data
		}
	}
}