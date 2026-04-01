import { kdutils } from "kdweb-core/lib/utils";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { SerialHelper } from "../../src/SerialHelper";
import { DB } from "../../src/db";
import { Rpc } from "../rpc";
import { SrsDefine } from "../../pp-base-define/SrsDefine";
import { GameSet } from "../../pp-base-define/GameSet";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { ClubDefine } from "../../pp-base-define/ClubDefine";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { Log } from "../log";
import { GSRpcMethods } from "../../pp-base-define/GSRpcMethods";
import { kds } from "../../pp-base-define/GlobalMethods";
import { IDUtils } from "../../src/IDUtils";
import { RedisLock } from "../../src/RedisLock";
import { Module_RoomData, Module_RoomGSSrsNode, Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine";


let db = DB.get()
async function callInMutex<T>(name,func:(...params)=>Promise<T>) {
	return await RedisLock.callInLock<T>(name,30,async ()=>{
		return await func()
	})
}
async function RoomRealtimeChanged(roomID:number,target:{clubID?:number,matchID?:number,groupID?:number}) {
	if(target.clubID) {
		Rpc.center.call(kds.club.hook.roomRealtimeChanged,target.clubID,roomID)
	} else if(target.groupID) {
		Rpc.center.call(kds.group.hook.roomRealtimeChanged,target.groupID,roomID)
	} else if(target.matchID) {
		Rpc.center.call(kds.match.hook.roomRealtimeChanged,target.matchID,roomID)
	}
}

async function createUser(h:string,userID:number,gameData:RoomDefine.GameData,type:SrsDefine.NodeType) {
	// let gss = await Module_RoomGSSrsNode.get({gameID:gameData.gameID,type})
	let gss = await Module_RoomGSSrsNode.get({gameID:gameData.gameID})
	if(!gss || gss.length == 0) {
		return false 
	}
	let gameSet = GameSet.createWithData(gameData)
	let cost = gameSet.getSpendMoney()
	let pay = false 
	let itemID = RoomDefine.getPayIndex(gameSet.getPayType())
	if(cost && cost > 0) {
		let b = await Rpc.center.callException("kds.item.use",userID,itemID,cost)
		if(!b) {
			return false 
		}
		pay = true 
	}
	let time = kdutils.getMillionSecond()
	let roomData:RoomDefine.RoomData = {
		roomID:await IDUtils.getRoomID(),
		boxCode:await Rpc.center.callException(kds.sys.code.room.get),
		gameData:gameData,

		boss:{
			userID:userID
		},
		club:null,
		roomType:RoomDefine.RoomType.Custom,
		createTimestamp:time,
		createDate:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
	}
	if(!roomData.roomID) {
		if(pay) {
			await Rpc.center.callException(kds.item.add,userID,itemID,cost)
		}
		return false 
	}
	await Module_RoomData.insert(roomData)
	await db.insert(DBDefine.tableRoomRecord,<RoomDefine.RoomCreateRecord>{
		roomID:roomData.roomID,
		roomData:roomData,
		reason:"user|" + userID,
		createTimestamp:roomData.createTimestamp,
		createDate:roomData.createDate,
	})
	let realtime:RoomDefine.RoomRealtime = {
		roomID:roomData.roomID,
		gameData:roomData.gameData,
		status:RoomDefine.RoomStatus.None,
		users:[],
	}
	await Module_RoomRealtime.insert(realtime)
	let gs = gss[kdutils.intRandom(0,gss.length)]
	let b:SrsRpcMethods.LayerCenter.tCallGSRes = await Rpc.center.callException(SrsRpcMethods.LayerCenter.callGS,gs.name,GSRpcMethods.createRoom,roomData)
	if(!b || !b.data) {
		await removeRoom(null,roomData.roomID)
		return false 
	}
	return roomData 
}
async function createSystem(h:string,gameData:RoomDefine.GameData) {
	let gss = await Module_RoomGSSrsNode.get({gameID:gameData.gameID})
	if(!gss || gss.length == 0) {
		return null 
	}
	let time = kdutils.getMillionSecond()
	let roomData:RoomDefine.RoomData = {
		roomID:await IDUtils.getRoomID(),
		boxCode:null,
		gameData:gameData,

		boss:{
			userID:-1
		},
		club:null,
		roomType:RoomDefine.RoomType.Custom,
		createTimestamp:time,
		createDate:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
	}
	if(!roomData.roomID) {
		return null 
	}
	await Module_RoomData.insert(roomData)
	await db.insert(DBDefine.tableRoomRecord,<RoomDefine.RoomCreateRecord>{
		roomID:roomData.roomID,
		roomData:roomData,
		reason:"system",
		createTimestamp:roomData.createTimestamp,
		createDate:roomData.createDate,
	})
	let realtime:RoomDefine.RoomRealtime = {
		roomID:roomData.roomID,
		gameData:roomData.gameData,
		status:RoomDefine.RoomStatus.None,
		users:[],
	}
	await Module_RoomRealtime.insert(realtime)
	let gs = gss[kdutils.intRandom(0,gss.length)]
	Rpc.center.call(SrsRpcMethods.LayerCenter.callGS,gs.name,GSRpcMethods.createRoom,roomData)
	return roomData
}

async function createGroup(h:string,groupID:number,gameData:RoomDefine.GameData) {
	let gss = await Module_RoomGSSrsNode.get({gameID:gameData.gameID})
	if(!gss || gss.length == 0) {
		return false 
	}
	let time = kdutils.getMillionSecond()
	let roomData:RoomDefine.RoomData = {
		roomID:await IDUtils.getRoomID(),
		boxCode:null,
		gameData:gameData,

		groupID,
		boss:{
			userID:-1
		},
		club:null,
		roomType:RoomDefine.RoomType.Group,
		createTimestamp:time,
		createDate:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
	}
	if(!roomData.roomID) {
		return false 
	}
	await Module_RoomData.insert(roomData)
	await db.insert(DBDefine.tableRoomRecord,<RoomDefine.RoomCreateRecord>{
		roomID:roomData.roomID,
		roomData:roomData,
		reason:"system",
		createTimestamp:roomData.createTimestamp,
		createDate:roomData.createDate,
	})
	let realtime:RoomDefine.RoomRealtime = {
		roomID:roomData.roomID,
		gameData:roomData.gameData,
		groupID,
		status:RoomDefine.RoomStatus.None,
		users:[],
	}
	await Module_RoomRealtime.insert(realtime)
	
	let gs = gss[kdutils.intRandom(0,gss.length)]
	Rpc.center.call(SrsRpcMethods.LayerCenter.callGS,gs.name,GSRpcMethods.createRoom,roomData)
	return roomData
}

async function createClub(h:string,clubID:number,gameData:RoomDefine.GameData) {
	let gss = await Module_RoomGSSrsNode.get({gameID:gameData.gameID})
	if(!gss || gss.length == 0) {
		return false 
	}
	let club:ClubDefine.tData = await db.getSingle(DBDefine.tableClubData,{clubID:clubID})
	if(!club) {
		return false 
	}
	let gameSet = GameSet.createWithData(gameData)
	let cost = gameSet.getSpendMoney()
	let pay = false 
	if(cost && cost > 0) {
		let valueIndex = RoomDefine.getPayIndex(gameSet.getPayType())
		let b = await Rpc.center.callException("kds.club.account.use",clubID,-1,valueIndex,cost)
		if(!b) {
			return false 
		}
		pay = true 
	}
	let time = kdutils.getMillionSecond()
	let roomData:RoomDefine.RoomData = {
		roomID:await IDUtils.getRoomID(),
		boxCode:null,
		gameData:gameData,

		boss:null,
		club:{
			clubID:club.clubID
		},
		roomType:RoomDefine.RoomType.Custom,
		createTimestamp:time,
		createDate:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
	}
	if(!roomData.roomID) {
		if(pay) {
			let valueIndex = RoomDefine.getPayIndex(gameSet.getPayType())
			await Rpc.center.callException("kds.club.account.add",clubID,-1,valueIndex,cost)
		}
		return false 
	}
	await Module_RoomData.insert(roomData)
	await db.insert(DBDefine.tableRoomRecord,<RoomDefine.RoomCreateRecord>{
		roomID:roomData.roomID,
		roomData:roomData,
		reason:"club|" + clubID,
		createTimestamp:roomData.createTimestamp,
		createDate:roomData.createDate,
	})
	let realtime:RoomDefine.RoomRealtime = {
		roomID:roomData.roomID,
		gameData:roomData.gameData,
		clubID:clubID,
		status:RoomDefine.RoomStatus.None,
		users:[],
	}
	await Module_RoomRealtime.insert(realtime)
	let gs = gss[kdutils.intRandom(0,gss.length)]
	Rpc.center.callException(SrsRpcMethods.LayerCenter.callGS,gs.name,GSRpcMethods.createRoom,roomData)
	.then((ret:SrsRpcMethods.LayerCenter.tCallGSRes)=>{
		if(!ret || ret.data == null || !ret.data) {
			Log.oth.error("gss create room failed",gs,roomData)
			removeRoom(null,roomData.roomID)
			return 
		}
		//Rpc.center.call(kds.club.hook.roomRealtimeChanged,clubID,roomData.roomID)
		RoomRealtimeChanged(roomData.roomID,{clubID:clubID})
	})
	return true 
}

async function createClubTemplate(h:string,clubID:number,templateID:number) {
	let template:ClubDefine.tRoomTemplate = await db.getSingle(DBDefine.tableClubRoomTemplate,{clubID:clubID,templateID:templateID})
	if(!template) {
		return null 
	}
	let gss = await Module_RoomGSSrsNode.get({gameID:template.gameData.gameID})
	if(!gss || gss.length == 0) {
		return false 
	}
	let club:ClubDefine.tData = await db.getSingle(DBDefine.tableClubData,{clubID:clubID})
	if(!club) {
		return false 
	}
	let gameSet = GameSet.createWithData(template.gameData)
	let cost = gameSet.getSpendMoney()
	let pay = false 
	if(cost && cost > 0) {
		let valueIndex = RoomDefine.getPayIndex(gameSet.getPayType())
		let b = await Rpc.center.callException("kds.club.account.use",clubID,-1,valueIndex,cost)
		if(!b) {
			return false 
		}
		pay = true 
	}
	let time = kdutils.getMillionSecond()
	let roomData:RoomDefine.RoomData = {
		roomID:await IDUtils.getRoomID(),
		boxCode:null,
		gameData:template.gameData,

		boss:null,
		club:{
			clubID:club.clubID,
			templateID,
		},
		roomType:RoomDefine.RoomType.Custom,
		createTimestamp:time,
		createDate:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
	}
	if(!roomData.roomID) {
		if(pay) {
			let valueIndex = RoomDefine.getPayIndex(gameSet.getPayType())
			await Rpc.center.callException("kds.club.account.add",clubID,-1,valueIndex,cost)
		}
		return false 
	}
	await Module_RoomData.insert(roomData)
	await db.insert(DBDefine.tableRoomRecord,<RoomDefine.RoomCreateRecord>{
		roomID:roomData.roomID,
		roomData:roomData,
		reason:"club|" + clubID,
		createTimestamp:roomData.createTimestamp,
		createDate:roomData.createDate,
	})
	let realtime:RoomDefine.RoomRealtime = {
		roomID:roomData.roomID,
		gameData:roomData.gameData,
		clubID:clubID,
		status:RoomDefine.RoomStatus.None,
		users:[],
	}
	await Module_RoomRealtime.insert(realtime)
	let gs = gss[kdutils.intRandom(0,gss.length)]
	Rpc.center.callException(SrsRpcMethods.LayerCenter.callGS,gs.name,GSRpcMethods.createRoom,roomData)
	.then((ret:SrsRpcMethods.LayerCenter.tCallGSRes)=>{
		if(!ret || ret.data == null || !ret.data) {
			Log.oth.error("gss create room failed",gs,roomData)
			removeRoom(null,roomData.roomID)
			return 
		}
		//Rpc.center.call(kds.club.hook.roomRealtimeChanged,clubID,roomData.roomID)
		RoomRealtimeChanged(roomData.roomID,{clubID:clubID})
		
	})
	return true 
}
async function createMatch(h:string,matchID:number,gameData:RoomDefine.GameData,params:GSRpcMethods.tCreateRoomExtensionParams) {
	let gss = await Module_RoomGSSrsNode.get({gameID:gameData.gameID})
	if(!gss || gss.length == 0) {
		return false 
	}
	let time = kdutils.getMillionSecond()
	let roomData:RoomDefine.RoomData = {
		roomID:await IDUtils.getRoomID(),
		boxCode:null,
		gameData:gameData,

		matchID,
		boss:{
			userID:-1
		},
		club:null,
		roomType:RoomDefine.RoomType.Match,
		createTimestamp:time,
		createDate:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
	}
	if(!roomData.roomID) {
		return false 
	}
	await Module_RoomData.insert(roomData)
	await db.insert(DBDefine.tableRoomRecord,<RoomDefine.RoomCreateRecord>{
		roomID:roomData.roomID,
		roomData:roomData,
		reason:"match|" + matchID,
		createTimestamp:roomData.createTimestamp,
		createDate:roomData.createDate,
	})
	let realtime:RoomDefine.RoomRealtime = {
		roomID:roomData.roomID,
		gameData:roomData.gameData,
		matchID,
		status:RoomDefine.RoomStatus.None,
		users:[],
	}
	await Module_RoomRealtime.insert(realtime)
	let gs = gss[kdutils.intRandom(0,gss.length)]
	Rpc.center.callException(SrsRpcMethods.LayerCenter.callGS,gs.name,GSRpcMethods.createRoom,roomData,params)
	.then((ret:SrsRpcMethods.LayerCenter.tCallGSRes)=>{
		if(!ret || ret.data == null || !ret.data) {
			Log.oth.error("gss create room failed",gs,roomData)
			removeRoom(null,roomData.roomID)
			return 
		}
		//Rpc.center.call(kds.club.hook.roomRealtimeChanged,clubID,roomData.roomID)
		RoomRealtimeChanged(roomData.roomID,{matchID:matchID})
		
	})
	
	return roomData
}

async function removeRoom(h:string,roomID:number,removeType?:RoomDefine.RemoveType) {
	let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
	if(!realtime) {
		return false 
	}
	if(realtime.gsName) {
		Rpc.center.call(SrsRpcMethods.LayerCenter.callGS,realtime.gsName,GSRpcMethods.jiesanRoom,roomID,removeType)
		
		if(realtime.clubID) {
			Rpc.center.call(kds.club.hook.roomRealtimeRemoved,realtime.clubID,realtime.roomID)
		} else if(realtime.groupID) {
			Rpc.center.call(kds.group.hook.roomRealtimeRemoved,realtime.groupID,realtime.roomID)
		} else if(realtime.matchID) {
			Rpc.center.call(kds.match.hook.roomRealtimeRemoved,realtime.matchID,realtime.roomID)
		}

	}
	let roomData = await Module_RoomData.getMain(roomID)
	if(roomData?.boxCode) {
		Rpc.center.call(kds.sys.code.room.release,roomData.boxCode)
	}
	await Module_RoomData.del({roomID:roomID})
	await Module_RoomRealtime.del({roomID:roomID})
	await db.del(DBDefine.tableRoomRobotSupport,{roomID:roomID})
	return true 
}

async function kickUser(h:string,roomID:number,userID:number) {
	let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
	if(!realtime) {
		return false 
	}
	if(realtime.gsName) {
		Rpc.center.call(SrsRpcMethods.LayerCenter.callGS,realtime.gsName,GSRpcMethods.forceUserExit,roomID,userID)
		RoomRealtimeChanged(realtime.roomID,{clubID:realtime.clubID,groupID:realtime.groupID,matchID:realtime.matchID})
		// if(realtime.clubID) {
		// 	Rpc.center.call(kds.club.hook.roomRealtimeChanged,realtime.clubID,realtime.roomID)
		// } else if(realtime.groupID) {
		// 	Rpc.center.call(kds.group.hook.roomRealtimeChanged,realtime.groupID,realtime.roomID)
		// }
		return true 
	}
	return false 
}
export let RpcRoomCreate = {
	user:createUser,
	club:createClub,
	clubTemplate:createClubTemplate,
	system:createSystem,
	group:createGroup,
	match:createMatch,
}
export let RpcRoom = {
	remove:removeRoom,
}
export let RpcRoomUser = {
	kick:kickUser,
}


async function realtime_addUser(h:string,roomID:number,userID:number,chairNo?:number,score?:number | string) {
	callInMutex("ROOMREALTIME|" + roomID,async ()=>{
		let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
		if(!realtime) {
			return 
		}
		let user = realtime.users.find(v=>v.userID == userID)
		if(user) {
			return 
		} else {
			user = {
				userID,chairNo,score:String(score || 0)
			}
			realtime.users.push(user)
		}
		await Module_RoomRealtime.update(realtime)

		RoomRealtimeChanged(realtime.roomID,{clubID:realtime.clubID,groupID:realtime.groupID,matchID:realtime.matchID})
		// if(realtime.clubID) {
		// 	Rpc.center.call(kds.club.hook.roomRealtimeChanged,realtime.clubID,realtime.roomID)
		// } else if(realtime.groupID) {
		// 	Rpc.center.call(kds.group.hook.roomRealtimeChanged,realtime.groupID,realtime.roomID)
		// }
	})
}

async function realtime_removeUser(h:string,roomID:number,userID:number) {
	callInMutex("ROOMREALTIME|" + roomID,async ()=>{
		let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
		if(!realtime) {
			return 
		}
		let idx = realtime.users.findIndex(v=>v.userID == userID)
		if(idx >= 0) {
			realtime.users.splice(idx,1)
			await Module_RoomRealtime.update(realtime)
			RoomRealtimeChanged(realtime.roomID,{clubID:realtime.clubID,groupID:realtime.groupID,matchID:realtime.matchID})
			// if(realtime.clubID) {
			// 	Rpc.center.call(kds.club.hook.roomRealtimeChanged,realtime.clubID,realtime.roomID)
			// } else if(realtime.groupID) {
			// 	Rpc.center.call(kds.group.hook.roomRealtimeChanged,realtime.groupID,realtime.roomID)
			// }
		}
	})
}

async function realtime_removeUsers(h:string,roomID:number,userIDs:number[]) {
	callInMutex("ROOMREALTIME|" + roomID,async ()=>{
		let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
		if(!realtime) {
			return 
		}
		let changed = false 
		for(let userID of userIDs) {
			let idx = realtime.users.findIndex(v=>v.userID == userID)
			if(idx >= 0) {
				realtime.users.splice(idx,1)
				changed = true 
			}
		}
		if(changed) {
			await Module_RoomRealtime.update(realtime)
			RoomRealtimeChanged(realtime.roomID,{clubID:realtime.clubID,groupID:realtime.groupID,matchID:realtime.matchID})
			// if(realtime.clubID) {
			// 	Rpc.center.call(kds.club.hook.roomRealtimeChanged,realtime.clubID,realtime.roomID)
			// } else if(realtime.groupID) {
			// 	Rpc.center.call(kds.group.hook.roomRealtimeChanged,realtime.groupID,realtime.roomID)
			// }
		}
	})
}

async function realtime_match_userScoreChanged(h:string,matchID:number,roomID:number,userID:number,score:string) {
	if(matchID){
		// Rpc.center.call(kds.match.hook.roomRealtimeUserScoreChanged,matchID,roomID,userID,score);
	}
}

async function realtime_userChanged(h:string,roomID:number,userID:number,chairNo:number,score:number | string) {
	callInMutex("ROOMREALTIME|" + roomID,async ()=>{
		let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
		if(!realtime) {
			return 
		}
		let user = realtime.users.find(v=>v.userID == userID)
		if(user) {
			user.chairNo = chairNo
			user.score = String(score)
		}
		await Module_RoomRealtime.update(realtime)

		RoomRealtimeChanged(realtime.roomID,{clubID:realtime.clubID,groupID:realtime.groupID,matchID:realtime.matchID})
		// if(realtime.clubID) {
		// 	Rpc.center.call(kds.club.hook.roomRealtimeChanged,realtime.clubID,realtime.roomID)
		// } else if(realtime.groupID) {
		// 	Rpc.center.call(kds.group.hook.roomRealtimeChanged,realtime.groupID,realtime.roomID)
		// }
	})
}
async function realtime_multiUserChanged(h:string,roomID:number,users:RoomDefine.tRoomRpcUserScoreChanged[]) {
	callInMutex("ROOMREALTIME|" + roomID,async ()=>{
		let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
		if(!realtime) {
			return 
		}
		for(let changedUser of users) {
			let user = realtime.users.find(v=>v.userID == changedUser.userID)
			if(user) {
				user.chairNo = changedUser.chairNo
				user.score = String(changedUser.score)
			}
		}
		await Module_RoomRealtime.update(realtime)

		RoomRealtimeChanged(realtime.roomID,{clubID:realtime.clubID,groupID:realtime.groupID,matchID:realtime.matchID})
		// if(realtime.clubID) {
		// 	Rpc.center.call(kds.club.hook.roomRealtimeChanged,realtime.clubID,realtime.roomID)
		// } else if(realtime.groupID) {
		// 	Rpc.center.call(kds.group.hook.roomRealtimeChanged,realtime.groupID,realtime.roomID)
		// }
	})
}

async function realtime_status(h:string,roomID:number,status:RoomDefine.RoomStatus,changedUsers?:RoomDefine.tRoomRpcUserScoreChanged[]) {
	callInMutex("ROOMREALTIME|" + roomID,async ()=>{
		let realtime:RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
		if(!realtime) {
			return 
		}

		if(changedUsers) {
			for(let changedUser of changedUsers) {
				let user = realtime.users.find(v=>v.userID == changedUser.userID)
				if(user) {
					user.chairNo = changedUser.chairNo
					user.score = String(changedUser.score)
				}
			}
			if(status == RoomDefine.RoomStatus.Start) {
				realtime.roundStartTimestamp = kdutils.getMillionSecond()
			}
			realtime.status = status
			await Module_RoomRealtime.update(realtime)
			RoomRealtimeChanged(realtime.roomID,{clubID:realtime.clubID,groupID:realtime.groupID,matchID:realtime.matchID})
		} else {
			if(status == RoomDefine.RoomStatus.Start) {
				await Module_RoomRealtime.updateOrigin({roomID:roomID},{
					$set:{
						status:status,
						roundStartTimestamp:kdutils.getMillionSecond(),
					}
				})
			} else {
				await Module_RoomRealtime.updateOrigin({roomID:roomID},{
					$set:{
						status:status,
					}
				})
				
			}
			RoomRealtimeChanged(realtime.roomID,{clubID:realtime.clubID,groupID:realtime.groupID,matchID:realtime.matchID})
		}
		
	})
}
async function realtime_update(h:string,roomID:number,realtime:RoomDefine.RoomRealtime) {
	callInMutex("ROOMREALTIME|" + roomID,async ()=>{
		if(!await Module_RoomRealtime.getMain(roomID)) {
			return 
		}
		await Module_RoomRealtime.update(realtime)

		RoomRealtimeChanged(realtime.roomID,{clubID:realtime.clubID,groupID:realtime.groupID,matchID:realtime.matchID})
		// if(realtime.clubID) {
		// 	Rpc.center.call(kds.club.hook.roomRealtimeChanged,realtime.clubID,realtime.roomID)
		// } else if(realtime.groupID) {
		// 	Rpc.center.call(kds.group.hook.roomRealtimeChanged,realtime.groupID,realtime.roomID)
		// }
	})
}

async function realtime_robotSupport(h:string,roomID:number,support:RoomDefine.RobotSupport) {
	if(await Module_RoomData.getMain(roomID)) {
		await db.updateOrInsert(DBDefine.tableRoomRobotSupport,support,{roomID})
		return true 
	}
	return false 
}

export let RpcRoomRealtime = {
	add:realtime_addUser,
	remove:realtime_removeUser,
	removes:realtime_removeUsers,
	changed:realtime_userChanged,
	multiChanged:realtime_multiUserChanged,
	totalScore:realtime_match_userScoreChanged,
	status:realtime_status,
	update:realtime_update,

	robotSupport:realtime_robotSupport,
}