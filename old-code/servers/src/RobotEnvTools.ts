import { kdutils } from "kdweb-core/lib/utils";
import { UserDefine } from "../pp-base-define/UserDefine";
import { IDUtils } from "./IDUtils";
import { UserAccess } from "./UserAccess";
import { TimeDate } from "./TimeDate";
import { DB } from "./db";
import { DBDefine } from "../pp-base-define/DBDefine";
import { RobotDefine } from "../pp-base-define/RobotDefine";
import Decimal from "decimal.js";
import { RedisLock } from "./RedisLock";
import _ from "underscore";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kds } from "../pp-base-define/GlobalMethods";
import { ItemDefine } from "../pp-base-define/ItemDefine";
import { Log } from "../pp-account/log";
import { Module_RobotRuntime } from "../pp-base-define/DM_RobotExtension";
import { Module_UserLoginData, Module_UserRelation } from "../pp-base-define/DM_UserDefine";
import { UserUtils } from "./UserUtils";

let db = DB.get()
let redis = DB.getRedis()
export namespace RobotEnvTools {
	export async function createRobot(name:string,iconUrl:string,opt?:{
		groupID?:number,
		matchID?:number,
	}) {
		let userID = await IDUtils.getUserID()
		let apiID = "BINDR-" + userID
		let loginData:UserDefine.tLoginData = {
			apiID: apiID,

			userID: userID,
			strUserID:String(userID),

			nickName: name || "R" + userID,
			sex: 0,
			iconUrl: iconUrl || null,

			deviceTag:"",
			channelTag:RobotDefine.LoginTag,

			robot:true,

			regTimestamp: kdutils.getMillionSecond(),
			regDate: TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
		}
		Module_UserLoginData.insert(loginData)
		let relation:UserDefine.PromoteRelation = {
			userID,
			level:0,
			performance:"0",
			leaders:[],
			subs:[],
		}
		Module_UserRelation.insert(relation)
		// await Rpc.center.callException("kds.sys.user.bind.set", userID, params.bindType, params.bindStr)
		let runtime:RobotDefine.tRuntime = {
			robotUserID:userID,
			status:RobotDefine.Status.Ready,
			startTimestamp:null,
			startDate:null,
			restTimestamp:null,
			restDate:null,

			targetGroupID:opt?.groupID || null,
			targetMatchID:opt?.matchID || null,
		}
		await Module_RobotRuntime.insert(runtime)
		await redis.hset(DBDefine.rTableIsRobot,String(userID),"1")
		await UserUtils.rebuildSearch(loginData.userID)
		return loginData
	}

	export async function isRobot(userID:number) {
		return !!await redis.hget(DBDefine.rTableIsRobot,String(userID))
	}


	export async function reqStore(
		rpcCenter:knRpcManagerInterface.rpc,
		robotUserID:number,itemID:string,value:string | Decimal,reason?:string,data?:any) {
		let lastValue = new Decimal(value)
		let skip = 0
		let limit = 10
		let effectStores:{
			value:string,
			store:RobotDefine.tStoreValue,
		}[] = []
		return RedisLock.callInLock(RedisLock.RobotStore(),30,async ()=>{
			while(true) {
				let stores:RobotDefine.tStoreValue[] = await db.getOption(DBDefine.tableRobotStoreValue,{itemID,ended:false},{
					skip,limit,sort:{
						timestamp:1
					}
				}) || []
				for(let store of stores) {
					let last = Decimal.sub(store.value,store.usedValue)
					if(last.greaterThanOrEqualTo(lastValue)) {
						store.usedValue = Decimal.add(store.usedValue,lastValue).toString()
						effectStores.push({
							value:lastValue.toString(),
							store,
						})
						lastValue = new Decimal(0)
					} else {
						store.usedValue = store.value 
						effectStores.push({
							value:last.toString(),
							store,
						})
						lastValue = lastValue.sub(last)
					}
					if(new Decimal(store.usedValue).greaterThanOrEqualTo(store.value)) {
						store.ended = true 
						store.endType = RobotDefine.StoreValueEndType.Robot,
						store.endData = {
							robotUserID,itemID,value,reason,data
						}
						store.endTimestamp = kdutils.getMillionSecond()
						store.endData = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
					}
					if(lastValue.isZero()) {
						break 
					}
				}
				if(lastValue.isZero()) {
					break 
				}
				if(stores.length < limit) {
					break 
				}
				skip += limit 
			}
			if(!lastValue.isZero()) {
				return false 
			}
			let ret = await rpcCenter.call(kds.item.add,robotUserID,itemID,value.toString(),ItemDefine.SerialType.System)
			if(!ret.data) {
				Log.oth.error("robot charge failed",ret)
				return false 
			}
			let ps = _.map(effectStores,(info)=>{
				return db.update(DBDefine.tableRobotStoreValue,{no:info.store.no},info.store)
			})
			ps.push.apply(ps,_.map(effectStores,async (info)=>{
				await db.insert(DBDefine.tableRobotUseStoreValueRecord,<RobotDefine.tUseStoreRecord>{
					no:await IDUtils.getRobotUseStoreRecordID(),					// 流水
					useNo:info.store.no,				// 库存流水
					robotUserID,
					itemID,
					value:info.value,
					reason,
					data,
					timestamp:kdutils.getMillionSecond(),
					date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
				})
			}))
			await Promise.all(ps)
			return true 
		})
	}
}