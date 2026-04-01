import { ClubDefine } from "./ClubDefine"
import { MatchDefine } from "./MatchDefine"
import { RoomDefine } from "./RoomDefine"



export namespace SrsUserMsg {
	export const Heart = "SRS_Heart"
	export const SimpleHeart = "SSH"
	export const Login = "SRS_Login"
	export type tLoginReq = {
		ak:string,
	}

	export type tLoginRes = {
		success:boolean,

		roomID?:number,
		roomIDs?:number[],
	}

	export const DCNListen = "SRS_DCN_Listen";
	export type tDCNListenReq = {
		dkey:string,
	}
	export const DCNUnListen = "SRS_DCN_UnListen";
	export type tDCNUnListenReq = {
		dkey:string,
	}
	export const DCNUnListenAll = "SRS_DCN_UnListenAll";

	export let EnterRoom = "SRS_EnterRoom"
	export type tEnterRoomReq = {
		roomID:number,
		boxCode?:string,
		enterReq:any,
	}
	export type tEnterRoomRes = {
		b:boolean,
		gameID?:number,
		reason?:any,
	}

	export let EnterGroup = "SRS_Group_Enter"
	export type tEnterGroupReq = {
		groupID:number,
		ignoreRoomIDs?:number[],
	}
	export type tEnterGroupRes = {
		b:boolean,
		groupID:number,
		roomID:number,
		gameData?:RoomDefine.GameData,
	}

	export let ExitGroup = "SRS_Group_Exit"
	export type tExitGroupReq = {
		
	}
	export type tExitGroupRes = {
		b:boolean,	
	}

	export let IfCallFailed = "SRS_Failed_IfCall"
	export type tIfCallFailedNT = {
		code?:number,
		reason?:string,
	}
}

export namespace SrsUserNotify {
	export enum ErrorCode {
		SystemError 	= 0x0001,
		LoginTwice 		= 0x1001,

	}
	export const Error = "SRS_NT_Error"
	export type tError = {
		code:ErrorCode,
		msg:string,
	}
	
	export const DCNChanged = "SRS_DCN_Changed"
	export type tDCNChanged = {
		dkey:string,
		data:any,
	}
}

export namespace SrsDCN {
	export function bagChanged() {
		return "dcn/user/bag"
	}
	export function itemConfigChanged() {
		return "dcn/item/config"
	}
	export function lobbyRewardChanged() {
		return "dcn/user/lobbyreward"
	}
	export const UserRedDot = "dcn/user/reddot"

	export function clubRoomChanged(clubID:number) {
		return "dcn/club/room/" + clubID
	}
	export type tClubRoomChanged = {
		roomRealtimes:RoomDefine.RoomRealtime[],
		removedRoomIDs:number[],
	}

	export function clubMemberChanged(clubID:number) {
		return "dcn/club/member/" + clubID
	}
	export type tClubMemberChanged = {
		userIDs:number[],
		removeUserIDs:number[]
	}

	export function clubAccountChanged(clubID:number) {
		return "dcn/club/account/" + clubID
	}
	export type tClubAccountChanged = {
		account:ClubDefine.tUserAccount,
	}
	export function clubTemplateChanged(clubID:number) {
		return "dcn/club/template/" + clubID
	}
	export type tClubTemplateChanged = {
		template:ClubDefine.tRoomTemplate,
		del?:boolean,
	}
	export function clubSettingChanged(clubID:number) {
		return "dcn/club/setting/" + clubID
	}
	export type tClubSettingChanged = {
		setting:ClubDefine.tSetting,
	}

	export function clubDataChanged(clubID:number) {
		return "dcn/club/data/" + clubID
	}
	export type tClubDataChanged = {
		clubData:ClubDefine.tData,
	}

	export function matchEnterRoom() {
		return "dcn/match/enterroom"
	}
	export type tMatchEnterRoom = {
		matchID:number,
		roomID:number,
	}
	export function matchUserRuntimeChanged(matchID:number,userID:number) {
		return "dcn/match/runtime/" + matchID + "/" + userID
	}
	export type tMatchUserRuntimeChanged = {
		matchID:number,
		status:MatchDefine.UserMatchStatus,
		roomID?:number,
	}

	export function matchEvent() {
		return "dcn/match/event"
	}
	export type tMatchEvent = {
		event:MatchDefine.tUserMatchEvent
	}
}