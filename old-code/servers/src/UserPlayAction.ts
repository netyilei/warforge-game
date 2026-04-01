import { DBDefine } from "../pp-base-define/DBDefine"
import { UserDefine } from "../pp-base-define/UserDefine"
import { DB } from "./db"
import { RedisLock } from "./RedisLock"


let db = DB.get()
export namespace UserPlayAction {
	export async function record(gameID:number,userID:number,name:string,count?:number) {
		count = count || 1
		await RedisLock.callInLock(RedisLock.UserPlayAction(userID),10,async ()=>{
			let action:UserDefine.PlayAction = await db.getSingle(DBDefine.tableUserPlayAction,{userID:userID,gameID:gameID})
			if(!action) {
				action = {
					gameID,userID,records:[],
				}
			}
			let record = action.records.find(v=>v.name == name)
			if(!record) {
				record = {
					name,count
				}
				action.records.push(record)
			} else {
				record.count += count
			}
			await db.updateOrInsert(DBDefine.tableUserPlayAction,action,{userID,gameID})
		})
	}
}