import Decimal from "decimal.js";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { ClubMember } from "../Utils/ClubMember";
import { Log } from "../log";
import { Rpc } from "../rpc";
import { kds } from "../../pp-base-define/GlobalMethods";
import { ClubDefine } from "../../pp-base-define/ClubDefine";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { DB } from "../../src/db";
import { RobotEnvTools } from "../../src/RobotEnvTools";

let db = DB.get()
async function roomBill(h:string,bill:RoomDefine.BillData,roomData:RoomDefine.RoomData) {
	if(!bill.clubID) {
		return false 
	}
	let club = new ClubMember(bill.clubID)
	if(!await club.getData()) {
		return false 
	}
	if(!roomData) {
		return false 
	}
	if(!roomData.club || !roomData.club.templateID) {
		return false
	}

	for(let user of bill.users) {
		if(await RobotEnvTools.isRobot(user.userID)) {
			continue 
		}
		let fee = new Decimal(user.fee || "0")
		if(fee.lessThanOrEqualTo(0)) {
			continue 
		}
		Log.oth.log("roomBill -- ",`club:${bill.clubID} tid:${roomData.club.templateID} user:${user.userID} fee:${fee}`)
		await club.giveCostToLeaderRate(user.userID,roomData.club.templateID,user.fee)

	}
	return true 
}

async function roundBill(h:string,bill:RoomDefine.FinalBillData,roomData:RoomDefine.RoomData) {
	if(!roomData || !roomData.club){
		return false;
	}
	if(roomData.club.clubID && roomData.club.templateID){
		if(bill && (bill.removeType == RoomDefine.RemoveType.GM || bill.removeType == RoomDefine.RemoveType.System)){
			return false;
		}
		let setting:ClubDefine.tSetting = await db.getSingle(DBDefine.tableClubSetting,{clubID:roomData.club.clubID})
		if(setting && setting.autoDesk) {
			let template:ClubDefine.tRoomTemplate = await db.getSingle(DBDefine.tableClubRoomTemplate,{clubID:roomData.club.clubID,templateID:roomData.club.templateID})
			if(!template) {
				return false 
			}
			await Rpc.center.callException(kds.room.create.clubTemplate,roomData.club.clubID,roomData.club.templateID)
		}
		
	}
	return true
}

export let RpcClubRoomBill = {
	room:roomBill,
	round:roundBill,
}