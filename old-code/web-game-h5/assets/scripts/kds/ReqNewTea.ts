// import { WebReqBase } from "./WebReqBase"
// import { TeaDefine } from "../ServerDefines/TeaDefine"
// import { RoomDefine } from "../ServerDefines/RoomDefine"


// export namespace ReqNewTea {
// 	export let getStatus = WebReqBase.reqAK<tGetStatusReq,tGetStatusRes>("tea/user/getstatus")
// 	export type tGetStatusReq = {
// 		teaID:number,
// 	}
// 	export type tGetStatusRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		status:TeaDefine.UserStatus,
// 	}

// 	export let getList = WebReqBase.reqAK<tGetListReq,tGetListRes>("tea/user/list")
// 	export type tGetListReq = {
// 	}
// 	export type tGetListRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		teaIDs:number[],
// 	}

// 	export let getTeaFullData = WebReqBase.reqAK<tGetTeaFullDataReq,tGetTeaFullDataRes>("tea/user/getdata")
// 	export type tGetTeaFullDataReq = {
// 		teaIDOrCode:number | string,
// 	}
// 	export type tGetTeaFullDataRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		fullData:TeaDefine.FullData,
// 	}
// 	export let getRooms = WebReqBase.reqAK<tGetRoomsReq,tGetRoomsRes>("tea/user/rooms")
// 	export type tGetRoomsReq = {
// 		teaID:number,
// 	}
// 	export type tGetRoomsRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		rooms:TeaDefine.RoomData[],
// 	}

// 	export let jiesanRoom = WebReqBase.reqAK<tJiesanRoomReq,tJiesanRoomRes>("tea/user/jiesanroom")
// 	export type tJiesanRoomReq = {
// 		teaID:number,
// 		roomID:string | number
// 	}
// 	export type tJiesanRoomRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let addTemplate = WebReqBase.reqAK<tAddTemplateReq,tAddTemplateRes>("tea/template/add")
// 	export type tAddTemplateReq = {
// 		teaID:number,
// 		name:string,
// 		gameData:RoomDefine.GameData,
// 		teaExt:RoomDefine.TeaExtension,
// 	}
// 	export type tAddTemplateRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let removeTemplate = WebReqBase.reqAK<tRemoveTemplateReq,tRemoveTemplateRes>("tea/template/remove")
// 	export type tRemoveTemplateReq = {
// 		teaID:number,
// 		templateID:number,
// 	}
// 	export type tRemoveTemplateRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let renameTemplate = WebReqBase.reqAK<tRenameTemplateReq,tRenameTemplateRes>("tea/template/rename")
// 	export type tRenameTemplateReq = {
// 		teaID:number,
// 		templateID:number,
// 		name:string
// 	}
// 	export type tRenameTemplateRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let updateTemplate = WebReqBase.reqAK<tUpdateTemplateReq,tUpdateTemplateRes>("tea/template/update")
// 	export type tUpdateTemplateReq = {
// 		teaID:number,
// 		templateID:number,

// 		gameData:RoomDefine.GameData,
// 	}
// 	export type tUpdateTemplateRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let createRoomByTemplate = WebReqBase.reqAK<tCreateRoomByTemplateReq,tCreateRoomByTemplateRes>("tea/template/create")
// 	export type tCreateRoomByTemplateReq = {
// 		teaID:number,
// 		templateID:number,
// 	}
// 	export type tCreateRoomByTemplateRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let addAdmin = WebReqBase.reqAK<tAddAdminReq,tAddAdminRes>("tea/admin/add")
// 	export type tAddAdminReq = {
// 		teaID:number,
// 		userID:number,
// 	}
// 	export type tAddAdminRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let removeAdmin = WebReqBase.reqAK<tRemoveAdminReq,tRemoveAdminRes>("tea/admin/remove")
// 	export type tRemoveAdminReq = {
// 		teaID:number,
// 		userID:number,
// 	}
// 	export type tRemoveAdminRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let updateAuth = WebReqBase.reqAK<tUpdateAuthReq,tUpdateAuthRes>("tea/admin/auth")
// 	export type tUpdateAuthReq = {
// 		teaID:number,
// 		auth:TeaDefine.Auth,
// 	}
// 	export type tUpdateAuthRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let memberReq = WebReqBase.reqAK<tMemberReqReq,tMemberReqRes>("tea/member/req")
// 	export type tMemberReqReq = {
// 		teaID?:number,
// 		teaCode?:string,
// 	}
// 	export type tMemberReqRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let memberGetReqs = WebReqBase.reqAK<tMemberGetReqsReq,tMemberGetReqsRes>("tea/member/getreqs")
// 	export type tMemberGetReqsReq = {
// 		teaID:number,
// 	}
// 	export type tMemberGetReqsRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		reqs:TeaDefine.Req[],
// 	}

// 	export let memberAccept = WebReqBase.reqAK<tMemberAcceptReq,tMemberAcceptRes>("tea/member/accept")
// 	export type tMemberAcceptReq = {
// 		teaID:number,
// 		userID:number,
// 	}
// 	export type tMemberAcceptRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}
// 	export let memberRefuse = WebReqBase.reqAK<tMemberRefuseReq,tMemberRefuseRes>("tea/member/refuse")
// 	export type tMemberRefuseReq = {
// 		teaID:number,
// 		userID:number,
// 	}
// 	export type tMemberRefuseRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let memberRemove = WebReqBase.reqAK<tMemberRemoveReq,tMemberRemoveRes>("tea/member/remove")
// 	export type tMemberRemoveReq = {
// 		teaID:number,
// 		userID:number,
// 	}
// 	export type tMemberRemoveRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let memberInviteSearch = WebReqBase.reqAK<tMemberInviteSearchReq,tMemberInviteSearchRes>("tea/member/invite/search")
// 	export type tMemberInviteSearchReq = {
// 		teaID:number,
// 		userID:number,
// 	}
// 	export type tMemberInviteSearchRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		// loginData:UserDefine.tLoginData,
// 		loginData:any,
// 	}
// 	export let memberInvite = WebReqBase.reqAK<tMemberInviteReq,tMemberInviteRes>("tea/member/invite")
// 	export type tMemberInviteReq = {
// 		teaID:number,
// 		userID:number,
// 	}
// 	export type tMemberInviteRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let memberInviteAgree = WebReqBase.reqAK<tMemberInviteAgreeReq,tMemberInviteAgreeRes>("tea/member/invite/agree")
// 	export type tMemberInviteAgreeReq = {
// 		teaID:number,
// 	}
// 	export type tMemberInviteAgreeRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let memberInviteNotAgree = WebReqBase.reqAK<tMemberInviteNotAgreeReq,tMemberInviteNotAgreeRes>("tea/member/invite/notagree")
// 	export type tMemberInviteNotAgreeReq = {
// 		teaID:number,
// 	}
// 	export type tMemberInviteNotAgreeRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let memberGetInviting = WebReqBase.reqAK<tMemberGetInvitingReq,tMemberGetInvitingRes>("tea/member/invite/inviting")
// 	export type tMemberGetInvitingReq = {
// 		teaID:number,
// 	}
// 	export type tMemberGetInvitingRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		invites:TeaDefine.Invite[]
// 	}

// 	export let memberGetBeInvited = WebReqBase.reqAK<tMemberGetBeInvitedReq,tMemberGetBeInvitedRes>("tea/member/invite/beinvited")
// 	export type tMemberGetBeInvitedReq = {
// 	}
// 	export type tMemberGetBeInvitedRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		invites:TeaDefine.Invite[]
// 	}

// 	export let accountValue = WebReqBase.reqAK<tAccountValueReq,tAccountValueRes>("tea/account/value")
// 	export type tAccountValueReq = {
// 		teaID:number,
// 		userID:number,
// 		num:number,
// 	}
// 	export type tAccountValueRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let setProxyType = WebReqBase.reqAK<tSetProxyTypeReq,tSetProxyTypeRes>("tea/proxy/settype")
// 	export type tSetProxyTypeReq = {
// 		teaID:number,
// 		userID:number,
// 		proxyType:TeaDefine.ProxyType,
// 	}
// 	export type tSetProxyTypeRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let setDeskCosts = WebReqBase.reqAK<tSetDeskCostsReq,tSetDeskCostsRes>("tea/proxy/setcost")
// 	export type tSetDeskCostsReq = {
// 		teaID:number,
// 		templateID:number,
// 		targetUserID:number,
// 		num:number
// 		extIdx?:number
// 	}
// 	export type tSetDeskCostsRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let getDeskCosts = WebReqBase.reqAK<tGetDeskCostsReq,tGetDeskCostsRes>("tea/proxy/getcost")
// 	export type tGetDeskCostsReq = {
// 		teaID:number,
// 		targetUserID:number,
// 	}
// 	export type tGetDeskCostsRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		costs:TeaDefine.DeskCost[],
// 	}

// 	export let getUserValueRecord = WebReqBase.reqAK<tGetUserValueRecordReq,tGetUserValueRecordRes>("tea/record/user")
// 	export type tGetUserValueRecordReq = {
// 		teaID:number,
// 		userID:number,
// 		// cursor:YDefine.Cursor,
// 		cursor:any,
// 		types?:TeaDefine.Record.ValueChangeType[],
// 		startTime?:number,
// 		endTime?:number,
// 	}
// 	export type tGetUserValueRecordRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		ydata:any,
// 		// ydata:YDefine.Data,
// 		// records:TeaDefine.Record.ValueChanged[],
// 	}

// 	export let getTeaValueRecord = WebReqBase.reqAK<tGetTeaValueRecordReq,tGetTeaValueRecordRes>("tea/record/tea")
// 	export type tGetTeaValueRecordReq = {
// 		teaID:number,
// 		// cursor:YDefine.Cursor,
// 		cursor:any,
// 		types?:TeaDefine.Record.ValueChangeType[],
// 		startTime?:number,
// 		endTime?:number,
// 	}
// 	export type tGetTeaValueRecordRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 		// ydata:YDefine.Data,
// 		ydata:any,
// 		// records:TeaDefine.Record.ValueChanged[],
// 	}

// 	export let getTeaValueTotalCount = WebReqBase.reqAK<tGetTeaValueTotalCountReq,tGetTeaValueTotalCountRes>("tea/record/teacount")
// 	export type tGetTeaValueTotalCountReq = {
// 		teaID:number,
// 		types:TeaDefine.Record.ValueChangeType[],

// 		startTime:number,
// 		endTime:number,
// 	}
// 	export type tGetTeaValueTotalCountRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		count:number,
// 	}

// 	export let getTeaData = WebReqBase.reqAK<tGetTeaDataReq,tGetTeaDataRes>("tea/user/get/data")
// 	export type tGetTeaDataReq = {
// 		teaID?:number,
// 		teaCode?:string,
// 	}
// 	export type tGetTeaDataRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		teaData:TeaDefine.Data
// 	}
// 	export let getTeaAuth = WebReqBase.reqAK<tGetTeaAuthReq,tGetTeaAuthRes>("tea/user/get/auth")
// 	export type tGetTeaAuthReq = {
// 		teaID:number,
// 	}
// 	export type tGetTeaAuthRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		teaAuth:TeaDefine.Auth
// 	}
// 	export let getTeaMember = WebReqBase.reqAK<tGetTeaMemberReq,tGetTeaMemberRes>("tea/user/get/member")
// 	export type tGetTeaMemberReq = {
// 		teaID:number,
// 		key?:string,
// 		// cursor:YDefine.Cursor,
// 		cursor:any,
// 	}
// 	export type tGetTeaMemberRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		teaMember:TeaDefine.UserMembers
// 	}

// 	export let getSingleMember = WebReqBase.reqAK<tGetSingleMemberReq,tGetSingleMemberRes>("tea/user/get/singlemember")
// 	export type tGetSingleMemberReq = {
// 		teaID:number,
// 		userID:number,
// 	}
// 	export type tGetSingleMemberRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		member:TeaDefine.Member,
// 	}

// 	export let getSubMember = WebReqBase.reqAK<tGetSubMemberReq,tGetSubMemberRes>("tea/user/get/submember")
// 	export type tGetSubMemberReq = {
// 		teaID:number,
// 		userID:number,
// 		key?:string,
// 		// cursor:YDefine.Cursor,
// 		cursor:any,
// 	}
// 	export type tGetSubMemberRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		teaMember:TeaDefine.UserMembers,
// 	}

// 	export let getVisibleUserIDs = WebReqBase.reqAK<tGetVisibleUserIDsReq,tGetVisibleUserIDsRes>("tea/user/get/visibleuserids")
// 	export type tGetVisibleUserIDsReq = {
// 		teaID:number,
// 		userID:number,
// 		key?:string,
// 	}
// 	export type tGetVisibleUserIDsRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		userIDs:number[],
// 	}
// 	export let getTeaAccount = WebReqBase.reqAK<tGetTeaAccountReq,tGetTeaAccountRes>("tea/user/get/account")
// 	export type tGetTeaAccountReq = {
// 		teaID:number,
// 		userID?:number,
// 	}
// 	export type tGetTeaAccountRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 		teaAccount:TeaDefine.Account,
// 	}

// 	export let getTeaTemplate = WebReqBase.reqAK<tGetTeaTemplateReq,tGetTeaTemplateRes>("tea/user/get/template")
// 	export type tGetTeaTemplateReq = {
// 		teaID:number,
// 	}
// 	export type tGetTeaTemplateRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 		teaTemplates:TeaDefine.Template[]
// 	}

// 	export let getTeaUserBill = WebReqBase.reqAK<tGetTeaUserBillReq,tGetTeaUserBillRes>("tea/daily/user")
// 	export type tGetTeaUserBillReq = {
// 		teaID:number,
// 		lastCount:number,
// 	}
// 	export type tGetTeaUserBillRes = {
// 		errCode?:number,
// 		errMsg?:string,

// //		data:BillDefine.TeaUserBill,
// 		data:any,
// 	}

// 	export let getTeaFundBill = WebReqBase.reqAK<tGetTeaFundBillReq,tGetTeaFundBillRes>("tea/daily/fund")
// 	export type tGetTeaFundBillReq = {
// 		teaID:number,
// 		lastCount:number,
// 	}
// 	export type tGetTeaFundBillRes = {
// 		errCode?:number,
// 		errMsg?:string,

// //		data:BillDefine.TeaFundProxyBill,
// 		data:any,
// 	}

// 	export let getTeaFundUserBill = WebReqBase.reqAK<tGetTeaFundUserBillReq,tGetTeaFundUserBillRes>("tea/daily/funduser")
// 	export type tGetTeaFundUserBillReq = {
// 		teaID:number,
// 		userID:number,
// 		lastCount:number,
// 	}
// 	export type tGetTeaFundUserBillRes = {
// 		errCode?:number,
// 		errMsg?:string,

// //		data:BillDefine.TeaFundProxyBillItem,
// 		data:any,
// 	}

// 	export let getBlocks = WebReqBase.reqAK<tGetBlocksReq,tGetBlocksRes>("tea/block/get")
// 	export type tGetBlocksReq = {
// 		teaID:number,
// 	}
// 	export type tGetBlocksRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		blocks:TeaDefine.UserBlock[],
// 	}

// 	export let getUserBlock = WebReqBase.reqAK<tGetUserBlockReq,tGetUserBlockRes>("tea/block/getuser")
// 	export type tGetUserBlockReq = {
// 		teaID:number,
// 		userID:number,
// 	}
// 	export type tGetUserBlockRes = {
// 		errCode?:number,
// 		errMsg?:string,

// 		block:TeaDefine.UserBlock
// 	}

// 	export let addBlock = WebReqBase.reqAK<tAddBlockReq,tAddBlockRes>("tea/block/add")
// 	export type tAddBlockReq = {
// 		teaID:number,
// 		fromUserID:number,
// 		toUserID:number,
// 	}
// 	export type tAddBlockRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let removeBlock = WebReqBase.reqAK<tRemoveBlockReq,tRemoveBlockRes>("tea/block/remove")
// 	export type tRemoveBlockReq = {
// 		teaID:number,
// 		fromUserID:number,
// 		toUserID:number,
// 	}
// 	export type tRemoveBlockRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let removeUserBlocks = WebReqBase.reqAK<tRemoveUserBlocksReq,tRemoveUserBlocksRes>("tea/block/removeuser")
// 	export type tRemoveUserBlocksReq = {
// 		teaID:number,
// 		fromUserID:number,
// 	}
// 	export type tRemoveUserBlocksRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 	}

// 	export let getRelationUsers = WebReqBase.reqAK<tGetRelationUsersReq,tGetRelationUsersRes>("tea/relation/users")
// 	export type tGetRelationUsersReq = {
// 		teaID:number,
// 		userID:number,
// 	}
// 	export type tGetRelationUsersRes = {
// 		errCode?:number,
// 		errMsg?:string,
// 		userIDs:number[],
// 	}
// }