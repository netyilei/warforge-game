import { DBDefine } from "../../pp-base-define/DBDefine"
import { Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine"
import { RoomDefine } from "../../pp-base-define/RoomDefine"
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods"
import { SrsDCN } from "../../pp-base-define/SrsUserMsg"
import { RedisLock } from "../../src/RedisLock"
import { DB } from "../../src/db"
import { ClubDCN } from "../Utils/ClubDCN"
import { Rpc } from "../rpc"

let redis = DB.getRedis()
type ClubRoomCache = {
	roomIDs:number[],
	removedRoomIDs:number[],
}
let tableName = "t_club_room_changed"
let db = DB.get()
export class ClubRoomLooper {

	constructor() {

		setInterval(()=>{
			this.onUpdate()
		},3000)
	}

	async onUpdate() {
		let keys:string[] = await redis.hkeys(tableName)
		let clubIDs = keys.map(v=>Number(v))
		for(let clubID of clubIDs) {
			let cache:ClubRoomCache
				= await RedisLock.callInLock(RedisLock.ClubHookLooperLock(clubID),5,async ()=>{
					let ret = <ClubRoomCache>await redis.hget(tableName,String(clubID),true)
					await redis.hdel(tableName,String(clubID))
					return ret
				})
			if(!cache) {
				continue 
			}
			for(let i = cache.roomIDs.length - 1; i >= 0 ; i --) {
				let roomID = cache.roomIDs[i]
				if(cache.removedRoomIDs.includes(roomID)) {
					cache.roomIDs.splice(i,1)
				}
			}
			if(cache.roomIDs.length == 0 && cache.removedRoomIDs.length == 0) {
				continue 
			}
			let roomRealtimes:RoomDefine.RoomRealtime[] = 
				await Module_RoomRealtime.get({
					roomID:{$in:cache.roomIDs}
				})
			let nt:SrsDCN.tClubRoomChanged = {
				roomRealtimes,
				removedRoomIDs:cache.removedRoomIDs,
			}
			ClubDCN.sendRoom(clubID,nt)
		}
	}

	async addChanged(clubID:number,roomID:number) {
		await RedisLock.callInLock(RedisLock.ClubHookLooperLock(clubID),10,async ()=>{
			let cache:ClubRoomCache = await redis.hget(tableName,String(clubID),true)
			if(!cache) {
				cache = {
					roomIDs:[],
					removedRoomIDs:[],
				}
			}
			if(cache.roomIDs.includes(roomID)) {
				return 
			}
			cache.roomIDs.push(roomID)
			await redis.hset(tableName,String(clubID),cache,true)
		})
	}
	async addRemoved(clubID:number,roomID:number) {
		await RedisLock.callInLock(RedisLock.ClubHookLooperLock(clubID),10,async ()=>{
			let cache:ClubRoomCache = await redis.hget(tableName,String(clubID),true)
			if(!cache) {
				cache = {
					roomIDs:[],
					removedRoomIDs:[],
				}
			}
			if(cache.removedRoomIDs.includes(roomID)) {
				return 
			}
			cache.removedRoomIDs.push(roomID)
			await redis.hset(tableName,String(clubID),cache,true)
		})
	}
}