import { ClubDefine } from "../../pp-base-define/ClubDefine";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { RewardDefine } from "../../pp-base-define/RewardDefine";
import { DB } from "../../src/db";
import { ClubMember } from "../Utils/ClubMember";


let db = DB.get()
async function getReward(h:string,clubID:number) {
	let ret:ClubDefine.tReward = await db.getSingle(DBDefine.tableClubRewardPlan,{clubID})
	return ret 
}

async function getPlan(h:string,clubID:number) {
	let ret:ClubDefine.tReward = await db.getSingle(DBDefine.tableClubRewardPlan,{clubID})
	if(!ret || !ret.planID) {
		return null 
	}
	let plan:RewardDefine.tPlan = await db.getSingle(DBDefine.tableRewardPlan,{planID:ret.planID})
	return plan
}

async function setPlanID(h:string,clubID:number,planID:number) {
	let data = await db.getSingle(DBDefine.tableClubData,{clubID})
	if(!data) {
		return false 
	}
	let plan:RewardDefine.tPlan = await db.getSingle(DBDefine.tableRewardPlan,{planID:planID})
	if(!plan) {
		return false 
	}
	let reward:ClubDefine.tReward = await db.getSingle(DBDefine.tableClubRewardPlan,{clubID})
	if(!reward) {
		reward = {
			clubID,planID
		}
	} else {
		reward.planID = planID
	}
	await db.updateOrInsert(DBDefine.tableClubRewardPlan,reward,{clubID})
	return true 
}

export let RpcClubReward = {
	getReward,
	getPlan,
	setPlanID,
}