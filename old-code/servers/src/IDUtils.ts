import { kdutils } from "kdweb-core/lib/utils"
import { DB } from "./db"

let rTablename = "access:ids"
let redis = DB.getRedis()
let idInfos:{
	name:string,
	from:number,
	step?:number,
	rand?:boolean,
}[] = [
	{
		name:"user-id",
		from:30000,
		step:10,
		rand:true,
	},
	{
		name:"register-serial-no",
		from:1,
	},
	{
		name:"guest-id",
		from:1000,
	},
	{
		name:"group-id",
		from:1000,
	},
	{
		name:"club-id",
		from:6000,
	},
	{
		name:"template-id",
		from:6000,
	},
	{
		name:"room-id",
		from:1000,
	},
	{
		name:"serial-id",
		from:1000,
	},
	{
		name:"order-id",
		from:1000,
	},
	{
		name:"reward-plan-id",
		from:1000,
	},
	{
		name:"robot-plan-id",
		from:1000,
	},
	{
		name:"robot-plan-task-id",
		from:1,
	},
	{
		name:"bill-id",
		from:1000,
	},
	{
		name:"chain-req-no",
		from:0,
	},
	{
		name:"collect-task",
		from:0,
	},
	{
		name:"mail_id",
		from:1,
	},
	{
		name:"mail-system-seq",
		from:1,
	},
	{
		name:"chain-ps-notify-id",
		from:1,
	},
	{
		name:"chain-record-id",
		from:1,
	},
	{
		name:"withdraw-req-id",
		from:1,
	},
	{
		name:"robot-store",
		from:1,
	},
	{
		name:"robot-store-record",
		from:1,
	},
	{
		name:"robot-game-serial-no",
		from:1,
	},
	{
		name:"match-id",
		from:1000,
	},
	{
		name:"auto-create-match-id",
		from:2000,
	},
	{
		name:"lobby-action-id",
		from:1,
	},
	{
		name:"lobby-task",
		from:1,
	},
	{
		name:"lobby-process-action",
		from:1,
	},
	{
		name:"announcement-id",
		from:100,
	},
	{
		name:"banner-id",
		from:100,
	},
	{
		name:"chat-seq",
		from:100,
	},
	{
		name:"chat-room-id",
		from:100,
	},
	{
		name:"charge-type-id",
		from:800,
	},
	{
		name:"charge-bank-id",
		from:100,
	},
	{
		name:"charge-bank-branch-id",
		from:100,
	},
	{
		name:"charge-paypal-id",
		from:100,
	},
	{
		name:"withdraw-user-record-no",
		from:1,
	},
	{
		name:"charge-order",
		from:100000,
	},
	{
		name:"withdraw-order",
		from:100000,
	},
	{
		name:"robot-ext-store-id",
		from:1000,
	},
	{
		name:"robot-ext-plan-id",
		from:1000,
	},
	{
		name:"robot-ext-charge-record-no",
		from:1,
	},
	{
		name:"robot-ext-store-record-no",
		from:1,
	},
	{
		name:"news-id",
		from:300,
	},
	{
		name:"pot-id",
		from:80000,
	},
	{
		name:"match-event-id",
		from:1,
	},
	{
		name:"robot-name-id",
		from:1000,
	},
	{
		name:"withdraw-chain-main-address-no",
		from:1,
	}
]

export namespace IDUtils {
	export async function checkOrInit() {
		for(let info of idInfos) {
			let s = await redis.hget(rTablename,info.name)
			if(s == null) {
				await redis.hset(rTablename,info.name,String(info.from),false)
			}
		}
	}
	async function step(name:string) {
		let info = idInfos.find(v=>v.name == name)
		if(!info) {
			return null 
		}
		return await redis.hincrby(rTablename,info.name,info.rand ? kdutils.intRandom(1,info.step) : info.step)
	}
	
	export async function getUserID() {
		return step("user-id")
	}
	export async function getRegisterSerialNo() {
		return step("register-serial-no")
	}
	export async function getGuestID() {
		return step("guest-id")
	}
	export async function getGroupID() {
		return step("group-id")
	}
	export async function getClubID() {
		return step("club-id")
	}
	export async function getTemplateID() {
		return step("template-id")
	}
	export async function getRoomID() {
		return step("room-id")
	}
	export async function getSerialNo() {
		return step("serial-id")
	}
	export async function getOrderNo() {
		return step("order-id")
	}
	export async function getRewardPlanID() {
		return step("reward-plan-id")
	}
	export async function getRoomBillID() {
		return step("bill-id")
	}
	export async function getChainReqNo() {
		return step("chain-req-no")
	}
	export async function getCollectTaskID() {
		return step("collect-task")
	}
	export async function getMailID() {
		return step("mail_id")	
	}
	export async function getMailSystemSeq() {
		return step("mail-system-seq")
	}
	export async function getRobotPlanID() {
		return step("robot-plan-id")
	}
	export async function getRobotPlanTaskID() {
		return step("robot-plan-task-id")
	}
	export async function getChainPSNotifyID() {
		return step("chain-ps-notify-id")	
	}
	export async function getChainRecordID() {
		return step("chain-record-id")	
	}
	export async function getWithdrawReqID() {
		return step("withdraw-req-id")
	}
	export async function getRobotStoreID() {
		return step("robot-store")
	}
	export async function getRobotUseStoreRecordID() {
		return step("robot-store-record")
	}
	export async function getRobotGameSerialNo() {
		return step("robot-game-serial-no")
	}
	export async function getMatchID() {
		return step("match-id")
	}
	export async function getAutoCreateMatchID() {
		return step("auto-create-match-id")
	}
	export async function getLobbyActionID() {
		return step("lobby-action-id")
	}
	export async function getTaskID() {
		return step("lobby-task")
	}
	export async function getProcessActionID() {
		return step("lobby-process-action")
	}
	export async function getAnnouncementID() {
		return step("announcement-id")
	}
	export async function getBannerID() {
		return step("banner-id")
	}
	export async function getChatSeq() {
		return step("chat-seq")
	}
	export async function getChatRoomID() {
		return step("chat-room-id")
	}
	export async function getChargeTypeID() {
		return step("charge-type-id")
	}
	export async function getChargeBankID() {
		return step("charge-bank-id")
	}
	export async function getChargeBankBranchID() {
		return step("charge-bank-branch-id")
	}
	export async function getChargePaypalID() {
		return step("charge-paypal-id")
	}
	export async function getWithdrawUserRecordNo() {
		return step("withdraw-user-record-no")
	}
	export async function getChargeOrderID() {
		return step("charge-order")
	}
	export async function getWithdrawOrderID() {
		return step("withdraw-order")
	}
	export async function getRobotExtStoreID() {
		return step("robot-ext-store-id")
	}
	export async function getRobotExtPlanID() {
		return step("robot-ext-plan-id")
	}
	export async function getRobotExtChargeRecordNo() {
		return step("robot-ext-charge-record-no")
	}
	export async function getRobotExtStoreRecordNo() {
		return step("robot-ext-store-record-no")
	}
	export async function getNewsID() {
		return step("news-id")
	}
	export async function getPotID() {
		return step("pot-id")
	}
	export async function getMatchEventID() {
		return step("match-event-id")
	}
	export async function getRobotNameID() {
		return step("robot-name-id")
	}
	export async function getWithdrawChainMainAddressNo() {
		return step("withdraw-chain-main-address-no")
	}
}