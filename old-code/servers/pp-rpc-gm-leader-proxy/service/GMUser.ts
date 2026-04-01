import { baseService } from "kdweb-core/lib/service/base"
import { ClubDefine } from "../../pp-base-define/ClubDefine"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { kds } from "../../pp-base-define/GlobalMethods"
import { ItemDefine } from "../../pp-base-define/ItemDefine"
import { UserDefine } from "../../pp-base-define/UserDefine"
import { DB } from "../../src/db"
import { Rpc } from "../rpc"
import _ from "underscore"
import { Module_UserBag, Module_UserLoginChannel, Module_UserLoginData, Module_UserLoginRole, Module_UserRelation, Module_UserSerial } from "../../pp-base-define/DM_UserDefine"
import { UserUtils } from "../../src/UserUtils"
import { Module_UserBalance } from "../../pp-base-define/DM_LeaderDefine"
import { PromoteRelationUtils } from "../../src/PromoteRelationUtils"
import Decimal from "decimal.js"
import { LeaderHelper } from "../../src/LeaderHelper"

let db = DB.get()
export namespace GMUser {
	export async function getDisplay(userID:number,params:{
		
	}) {
		let leaderTag = await LeaderHelper.createTag(userID)
		let relation = await PromoteRelationUtils.getPromoteRelation(userID)
		return {
			leaderTag,
			relation,
		}
	}
	export async function getUsers(userID:number,params:{
		page:number,limit:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.LeaderProxy)) {
			return baseService.errJson(1,"权限不足")
		}
		let index:any = {}
		let relation = await PromoteRelationUtils.getPromoteRelation(userID)
		if(!relation) {
			return baseService.errJson(1,"没有下级关系")
		}
		let userIDs = relation.subs.slice(params.page * params.limit, (params.page + 1) * params.limit)
		index.userID = {$in:userIDs}

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
				balance:balances.find(k=>k.userID == v.userID),
			}
		})
		return {
			users,count:relation.subs.length
		}
	}


	export async function getUsersWithValue(userID:number,params:{
		itemID:string,
		minValue?:string|number,
		sort:"asc"|"desc",

		page:number,limit:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.LeaderProxy)) {
			return baseService.errJson(1,"权限不足")
		}
		let relation = await PromoteRelationUtils.getPromoteRelation(userID)
		if(!relation) {
			return baseService.errJson(1,"没有下级关系")
		}
		let userIDs = relation.subs.slice(params.page * params.limit, (params.page + 1) * params.limit)

		let minValueNum = params.minValue != null ? new Decimal(params.minValue || 0).toNumber() : null
		let aggArray:any[] = [
			{$match:{userID:{$in:userIDs}}},
			{$unwind:"$items"},
			{$match:{"items.id":params.itemID}},
			{$project:{
				userID:1,
				itemID:"$items.id",
				count:"$items.count",
				countNum:{$toDouble:"$items.count"}
			}},
			
		]
		if(minValueNum != null) {
			aggArray.push({$match:{countNum:{$gte:minValueNum}}})
		}
		aggArray.push({$sort:{countNum:params.sort == "asc" ? 1 : -1}})

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
			users,count:relation.subs.length
		}
	}

	export async function getSerials(userID:number,params:{
		userIDs?:number[],
		serialType?:ItemDefine.SerialType,
		setup?:boolean,
		itemID?:string,
		page:number,limit:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.LeaderProxy)) {
			return baseService.errJson(1,"权限不足")
		}
		let relation = await PromoteRelationUtils.getPromoteRelation(userID)
		if(!relation) {
			return baseService.errJson(1,"没有下级关系")
		}
		let index:any = {}
		if(params.userIDs) {
			// 过滤出下级用户
			let userIDs = relation.subs.filter(v=>params.userIDs.includes(v))
			index.userID = {$in:userIDs}
		} else {
			let userIDs = relation.subs
			index.userID = {$in:userIDs}
		}
		if(!index.userID.$in.includes(userID)) {
			index.userID.$in.push(userID)
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
		let count = await Module_UserSerial.getCount(index)
		let datas = await Module_UserSerial.getOption(index,{
			skip:params.page * params.limit,
			limit:params.limit,
			sort:{timestamp:-1}
		})
		return {
			count:count,
			datas:datas,
		}
	}
}