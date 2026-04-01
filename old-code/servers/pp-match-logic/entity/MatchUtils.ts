import { kdutils } from "kdweb-core/lib/utils";
import { MatchDefine } from "../../pp-base-define/MatchDefine";
import { SrsDefine } from "../../pp-base-define/SrsDefine";
import { SrsDCN } from "../../pp-base-define/SrsUserMsg";
import { DB } from "../../src/db";
import { kdreq } from "kdweb-core/lib/service/req";
import { UserDCNHttpLayerUtils } from "../../src/UserDCNHttpLayerUtils";
import { kdasync } from "kdweb-core/lib/tools/async";
import { Rpc } from "../rpc";
import { kds } from "../../pp-base-define/GlobalMethods";
import { IDUtils } from "../../src/IDUtils";
import { Module_UserMatchEvent } from "../../pp-base-define/DM_MatchDefine";

let redis = DB.getRedis();
export namespace MatchUtils {
	let q = new kdasync.queue
	export async function onUserRuntimeChanged(matchData:MatchDefine.tData,runtime:MatchDefine.tUserRuntime) {
		q.call(async ()=>{
			if(runtime.status == MatchDefine.UserMatchStatus.Out) { 
				(Rpc.center || Rpc.subProcess)
					.callException(kds.item.unlockUser,runtime.userID,MatchDefine.getLockID(matchData.matchID,matchData.gameData.gameID))
			}
			if(!runtime.robot) {
				await UserDCNHttpLayerUtils.dcn(runtime.userID,SrsDCN.matchUserRuntimeChanged(runtime.matchID,runtime.userID),{
					matchID:runtime.matchID,
					status:runtime.status,
					roomID:runtime.roomID,
				})	
			}
		})
	}
	export async function onUserRuntimesChanged(matchData:MatchDefine.tData,runtimes:MatchDefine.tUserRuntime[]) {
		for(let runtime of runtimes) {
			await onUserRuntimeChanged(matchData,runtime)
		}
	}

	export async function sendMatchEvent(event:Partial<MatchDefine.tUserMatchEvent>) { 
		if(!event.userID) {
			return false 
		}
		event.eventID = await IDUtils.getMatchEventID()
		event.timestamp = event.timestamp || kdutils.getMillionSecond()
		event.expireTimestamp = event.expireTimestamp || (event.timestamp + 10 * 60 * 1000)
		event.read = false 
		Module_UserMatchEvent.insert(event as MatchDefine.tUserMatchEvent)
		UserDCNHttpLayerUtils.dcn(event.userID,SrsDCN.matchEvent(),{
			event:event as MatchDefine.tUserMatchEvent,
		})
		return true
	}
}