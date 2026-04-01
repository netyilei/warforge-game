import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { Rpc } from "../rpc"
import { DB } from "../../src/db"
import { Log } from "../log"
import { RoomDefine } from "../../pp-base-define/RoomDefine"
import { LobbyRewardUtils } from "../../pp-user-service/entity/LobbyRewardUtils"


let db = DB.get()
let redis = DB.getRedis()
let keyName = "t_bill_looper"
export class BillLooper {
	constructor(ignoreTimer?:boolean,rpc?:{center:knRpcManagerInterface.rpc}) {
		this.rpc_ = rpc || Rpc
		this.init(ignoreTimer)
	}
	private rpc_:{center:knRpcManagerInterface.rpc}
	async init(ignoreTimer?:boolean) {
		this.cache_ = await redis.hget(DBDefine.rTableLooper,keyName,true) || {
			billNo:-1,
			idNo:-1
		}
		if(ignoreTimer) {
			return 
		}
		setInterval(() => {
			this.onUpdate()
		}, 60000);
		this.onUpdate()
	} 
	private cache_:{
		billNo:number,
		idNo:number,
	}
	async savePrevTimestamp() {
		await redis.hset(DBDefine.rTableLooper,keyName,this.cache_,true)
	}
	private updating_ =false 
	async onUpdate() {
		if(this.updating_) {
			return 
		}
		this.updating_ = true 
		try {
			let curBillNo = parseInt(await redis.hget("access:ids","bill-id",false))
			if(curBillNo != this.cache_.idNo) {
				try {
					let bills:RoomDefine.BillData[] = await db.getOption(DBDefine.tableBill,{
						billID:{$gt:this.cache_.idNo,$lte:curBillNo}
					},{
						projection:{billID:1},
						sort:{billID:1},
					}) || []
					let billIDs = bills.map(v=>v.billID)
					let step = 50
					for(let i = 0 ; i < billIDs.length ; i += step) {
						let bills:RoomDefine.BillData[] = await db.get(DBDefine.tableBill,{
							billID:{$in:billIDs.slice(i,i+step)}
						}) || []
						for(let bill of bills) {
							await LobbyRewardUtils.createProcessAction_RoomBill(bill)
							this.cache_.billNo = bill.billID
						}
					}
					
				} catch (error) {
					Log.oth.error("bill looper error",this.cache_,error)	
				}
				this.cache_.idNo = curBillNo
			}
		} catch (error) {
			Log.oth.error("",error)
		} finally {
			this.updating_ = false 
		}
	}
}