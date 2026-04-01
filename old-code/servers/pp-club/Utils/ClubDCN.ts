import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { SrsDCN } from "../../pp-base-define/SrsUserMsg";
import { Rpc } from "../rpc";


export namespace ClubDCN {
	export async function sendRoom(clubID:number,nt:SrsDCN.tClubRoomChanged) {
		Rpc.center.callAll(SrsRpcMethods.LayerCenter.dcnChanged,SrsDCN.clubRoomChanged(clubID),nt)
	}	
	export async function sendMember(clubID:number,toUserIDs:number[],nt:SrsDCN.tClubMemberChanged) {
		Rpc.center.callAll(SrsRpcMethods.LayerCenter.dcnFilterChanged,toUserIDs,SrsDCN.clubMemberChanged(clubID),nt)
	}	
	export async function sendSingleMember(clubID:number,userID:number,toUserIDs:number[],remove?:boolean) {
		Rpc.center.callAll(SrsRpcMethods.LayerCenter.dcnFilterChanged,toUserIDs,SrsDCN.clubMemberChanged(clubID),<SrsDCN.tClubMemberChanged>{
			userIDs:remove ? null : [userID],
			removeUserIDs:remove ? [userID] : null,
		})
	}	
	export async function sendAccountTo(clubID:number,toUserIDs:number[],nt:SrsDCN.tClubAccountChanged) {
		Rpc.center.callAll(SrsRpcMethods.LayerCenter.dcnFilterChanged,toUserIDs,SrsDCN.clubAccountChanged(clubID),nt)
	}
	export async function sendTemplate(clubID:number,nt:SrsDCN.tClubTemplateChanged) {
		Rpc.center.callAll(SrsRpcMethods.LayerCenter.dcnChanged,SrsDCN.clubTemplateChanged(clubID),nt)
	}
	export async function sendSetting(clubID:number,nt:SrsDCN.tClubSettingChanged) {
		Rpc.center.callAll(SrsRpcMethods.LayerCenter.dcnChanged,SrsDCN.clubSettingChanged(clubID),nt)
	}
	export async function sendClubData(clubID:number,nt:SrsDCN.tClubDataChanged) {
		Rpc.center.callAll(SrsRpcMethods.LayerCenter.dcnChanged,SrsDCN.clubDataChanged(clubID),nt)
	}

	export async function sendUsers(userIDs:number[],key:string,nt:any) {
		Rpc.center.callAll(SrsRpcMethods.LayerCenter.dcnFilterChanged,userIDs,key,nt)
	}
}