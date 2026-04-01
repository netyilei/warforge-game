import { kdutils } from "kdweb-core/lib/utils"
import { RoomDefine } from "../../pp-base-define/RoomDefine"
import { IRobotProcessWorker } from "../entity/IRobotProcessWorker"
import { RobotEntityRegister } from "../entity/RobotEntityRegister"
import { BaseRobotLogic } from "./BaseRobotLogic"
import { GSUserMsg } from "../../pp-base-define/GSUserMsg"
import { Log } from "../log"
import { RobotDefine } from "../../pp-base-define/RobotDefine"
import { GSCommonMsg } from "../../pp-game-base/GSCommonMsg"
import { DB } from "../../src/db"
import { ItemDefine } from "../../pp-base-define/ItemDefine"
import { TexasStrategyLogic } from "../game/texas/TexasStrategyLogic"
import { GameSet } from "../../pp-base-define/GameSet"
import { RobotEnvTools } from "../../src/RobotEnvTools"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { RobotStrategyTask } from "../../src/RobotStrategyTask"
import Decimal from "decimal.js"
import { IDUtils } from "../../src/IDUtils"
import { TimeDate } from "../../src/TimeDate"
import { Module_RobotExtGroupPlan, Module_RobotExtMatchPlan } from "../../pp-base-define/DM_RobotExtension"
import { Module_UserBag } from "../../pp-base-define/DM_UserDefine"
import { RobotExtDefine } from "../../pp-base-define/RobotExtDefine"
import { kdlock } from "kdweb-core/lib/tools/lock"

let db = DB.get()
let redis = DB.getRedis()

export class BaseRobotStrategy {
	constructor(params:{
		worker:IRobotProcessWorker,userID:number,roomData:RoomDefine.RoomData,
		gsName:string,
		strategy:RobotDefine.RuntimeStrategy,
		strategyData:any,
		personality:RobotDefine.tPersonalityGameConfig_Base,
		taskID?:number,
		groupPlanID?:number,
		matchPlanID?:number,
	}) {
		this.worker_ = params.worker
		this.userID_ = params.userID
		this.roomData_ = params.roomData
		this.strategy_ = params.strategy
		this.strategyData_ = params.strategyData
		this.personality_ = params.personality
		this.taskID_ = params.taskID
		this.groupPlanID_ = params.groupPlanID
		this.matchPlanID_ = params.matchPlanID
		this.isTaskFinshed_ = false;
		this.log("strategy inited",{
			userID:params.userID,roomData:params.roomData,
			gsName:params.gsName,
			strategyData:params.strategyData,
		})

		let logicClazz = RobotEntityRegister.logics.get(params.roomData.gameData.gameID) || BaseRobotLogic
		this.logic_ = new logicClazz(params)

		this.log("create logic ",logicClazz)
		this.initRobotStrategy()
	}
	private updateHandler_ = null 
	private logic_:BaseRobotLogic = null 
	get logic() {
		return this.logic_
	}
	private strategy_:RobotDefine.RuntimeStrategy
	get strategy() {
		return this.strategy_
	}

	private strategyData_:RobotDefine.tStrategyData_Base = null
	get strategyData() {
		return this.strategyData_
	}
	private personality_:RobotDefine.tPersonalityGameConfig_Base = null
	get personality() {
		return this.personality_
	}

	private taskID_:number = null 
	get taskID() {
		return this.taskID_
	}
	private groupPlanID_:number = null 
	get groupPlanID() {
		return this.groupPlanID_
	}
	private matchPlanID_:number = null 
	get matchPlanID() {
		return this.matchPlanID_
	}
	// private groupPlan_:RobotExtDefine.tGroupPlan = null
	// get groupPlan() {
	// 	return this.groupPlan_
	// }
	// private matchPlan_:RobotExtDefine.tMatchPlan = null 
	// get matchPlan() {
	// 	return this.matchPlan_
	// }
	private userID_:number = null 
	get userID() {
		return this.userID_
	}

	private roomData_:RoomDefine.RoomData = null 
	get roomData() {
		return this.roomData_
	}
	
	private worker_:IRobotProcessWorker = null 
	get worker() {
		return this.worker_
	}

	private waitSendReadyToEnter_ = true 
	get waitSendReadyToEnter() {
		return this.waitSendReadyToEnter_
	}

	private gsStatus_:boolean = false 
	get gsStatus() {
		return this.gsStatus_
	}
	set gsStatus(v) {
		if(v) {
			this.prevGSOfflineTimestamp_ = null
			this.log("gs online")
		} else if(this.gsStatus_) {
			this.prevGSOfflineTimestamp_ = kdutils.getMillionSecond()
			this.log("gs offline, wait to " + this.prevGSOfflineTimestamp)
		}

		this.gsStatus_ = v 
		this.onGSStatusChanged()
		this.logic.onGSStatusChanged(v)
	}

	private gsTimeoutMS_:number = 30000
	get gsTimeoutMS() {
		return this.gsTimeoutMS_
	}
	set gsTimeoutMS(v) {
		this.gsTimeoutMS_ = v
	}

	private prevGSOfflineTimestamp_:number
	get prevGSOfflineTimestamp() {
		return this.prevGSOfflineTimestamp_
	}

	private readyToDestory_:boolean = false 
	get readyToDestory() {
		return this.readyToDestory_
	}
	set readyToDestory(v) {
		this.readyToDestory_ = v
	}
	

	private robotBag_:ItemDefine.tBag = null
	get robotBag() {
		return this.robotBag_
	}

	private gameStrategyTree_:TexasStrategyLogic = null
	get gameStrategyTree() {
		return this.gameStrategyTree_
	}

	private isTaskFinshed_:boolean = false
	get isTaskFinished() {
		return this.isTaskFinshed_
	}


	async getTaskStatus() {
		if(this.taskID_) {
			let task:RobotDefine.tStrategyTask = await db.getSingle(DBDefine.tableRobotStrategyTask,{taskID:this.taskID_})
			return task ? task.status : RobotDefine.StrategyTaskStatus.End
		}
		return null 
	}

	async getPlanStatus() {
		if(this.groupPlanID) {
			let plan = await Module_RobotExtGroupPlan.getMain(this.groupPlanID)
			return !!plan?.enabled
		} else if(this.matchPlanID) {
			let plan = await Module_RobotExtMatchPlan.getMain(this.matchPlanID)
			return !!plan?.enabled
		}
		return false 
	}

	/**
	 * 汇报分数和局数
	 * 观战也要调用,value传空
	 * vtodo 这里要改成plan相关
	 * @param value 
	 * @param toUserID 
	 * @returns 任务是否结束
	 */
	async reportTaskValue(value?:string,toUserIDs?:number[]) {
		if(value) {
			this.recordSerialValue(value)
		} 
		let lockName:string 
		if(this.groupPlanID) {
			let groupPlan = await Module_RobotExtGroupPlan.getMain(this.groupPlanID)
			if(!groupPlan?.enabled) {
				return false 
			}
			lockName = Module_RobotExtGroupPlan.getLockName(this.groupPlanID)
		}
		else if(this.matchPlanID) {
			let matchPlan = await Module_RobotExtMatchPlan.getMain(this.matchPlanID)
			if(!matchPlan?.enabled) {
				return false 
			}
			lockName = Module_RobotExtMatchPlan.getLockName(this.matchPlanID)
		}
		if(!lockName) {
			return false 
		}
		if(!value) {
			return true 
		}
		return await kdlock.redis.callInLock(lockName,30,async ()=>{
			let strategyData:RobotDefine.tStrategyData_Base
			if(this.groupPlanID) {
				let groupPlan = await Module_RobotExtGroupPlan.getMain(this.groupPlanID)
				strategyData = groupPlan.strategyData
			} else if(this.matchPlanID) {
				let matchPlan = await Module_RobotExtMatchPlan.getMain(this.matchPlanID)
				strategyData = matchPlan.strategyData
			} else {
				return false 
			}

			let notEnd = true 
			strategyData.curJuCount = strategyData.curJuCount || 0
			strategyData.curJuCount ++
			if(strategyData.juLimitCount && strategyData.curJuCount >= strategyData.juLimitCount) {
				notEnd = false 
			}
			let data:any = strategyData
			if(data.limitValue) {
				switch(this.strategy) {
					case RobotDefine.RuntimeStrategy.Normal: {
					} break 
					case RobotDefine.RuntimeStrategy.Kill: {
						let cur = new Decimal(data.curValue || "0")
						cur = cur.add(value)
						data.curValue = cur.toString()
						if(notEnd) {
							if(cur.greaterThan(data.limitValue || "0")) {
								notEnd = false 
							}
						}
					} break 
					case RobotDefine.RuntimeStrategy.Bonus: {
						let cur = new Decimal(data.curValue || "0")
						cur = cur.sub(value)
						data.curValue = cur.toString()
						if(notEnd) {
							if(cur.greaterThan(data.limitValue || "0")) {
								notEnd = false 
							}
						}
					} break 
					case RobotDefine.RuntimeStrategy.Target: {
						let targetData:RobotDefine.tStrategyData_Target = data 
						for(let toUserID of toUserIDs) {
							if(data.targetUserIDs.include(toUserID)) {
								targetData.curValues = targetData.curValues || []
								let curValueInfo = targetData.curValues.find(v=>v.userID == toUserID)
								if(!curValueInfo) {
									curValueInfo = {
										userID:toUserID,value:"0"
									}
									targetData.curValues.push(curValueInfo)
								}
								let newValue = Decimal.add(curValueInfo.value,value)
								curValueInfo.value = newValue.toString()
							}
						}
						if(notEnd) {
							let b = true 
							for(let targetUserID of targetData.targetUserIDs) {
								let curValueInfo = targetData.curValues.find(v=>v.userID == targetUserID)
								let d = new Decimal(curValueInfo ? curValueInfo.value : "0")
								if(d.lessThan(targetData.limitValue)) {
									b = false 
									break 
								}
							}
							if(b) {
								notEnd = false 
							}
						}
					} break 
				}
			}
			if(this.groupPlanID) {
				await Module_RobotExtGroupPlan.updateOrigin({planID:this.groupPlanID},{
					$set:{
						enabled:notEnd,
						strategyData,
					}
				})
				// this.groupPlan_ = await Module_RobotExtGroupPlan.getMain(this.groupPlanID)
			} else if(this.matchPlanID) {
				await Module_RobotExtMatchPlan.updateOrigin({planID:this.matchPlanID},{
					$set:{
						enabled:notEnd,
						strategyData,
					}
				})
				// this.matchPlan_ = await Module_RobotExtMatchPlan.getMain(this.matchPlanID)
			}
			return true 
		})
	}

	async recordSerialValue(value:string) {
		let type = GameSet.createWithData(this.roomData.gameData).getPayType()
		let payType = RoomDefine.getPayType(type)
		let payIndex = RoomDefine.getPayIndex(type)
		let serial:RobotDefine.tRobotGameSerial = {
			no:await IDUtils.getRobotGameSerialNo(),
			userID:this.userID,
			roomID:this.roomData.roomID,
			gameID:this.roomData.gameData.gameID,
			clubID:this.roomData.club?.clubID,
			matchID:this.roomData.matchID,
			groupID:this.roomData.groupID,
			templateID:this.roomData.club?.templateID,
			payType:payType,
			itemID:payType == RoomDefine.PayType.Item ? String(payIndex) : null,
			valueIndex:payType == RoomDefine.PayType.Club ? payIndex : null,
			scoreChanged:value,
			numScoreChanged:new Decimal(value).toNumber(),

			timestamp:kdutils.getMillionSecond(),
			date:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
		}
		db.insert(DBDefine.tableRobotGameSerial,serial)
	}

	private robotMarkList = [];
	async initRobotStrategy() {
		// if(this.groupPlanID) {
		// 	this.groupPlan_ = await Module_RobotExtGroupPlan.getMain(this.groupPlanID)
		// }
		// if(this.matchPlanID) {
		// 	this.matchPlan_ = await Module_RobotExtMatchPlan.getMain(this.matchPlanID)
		// }
		if(this.isUseStrategy()){
			this.initListen();
			this.gameStrategyTree_ = new TexasStrategyLogic()
			this.gameStrategyTree_.init();
			this.gameStrategyTree_.saveWorker(this.worker_);
			this.gameStrategyTree_.saveGameSet(GameSet.createWithData(this.roomData.gameData));
			this.gameStrategyTree_.saveSelfUserID(this.userID);
			this.gameStrategyTree_.saveStrategy(this.strategy,this.strategyData,this.personality);
		}
		await this.logic.onInitRobotLogic()
		
		this.handleAfterStrategyTreeInit();
		await this.loadUserInfo();
		await this.loadRobotStrategyDB();
		await this.onInitRobotStrategy()
	
	}
	isUseStrategy(){
		return true;
	}

	release() {
		if(this.readyToDestory) {
			return 
		}
		if(this.updateHandler_) {
			clearInterval(this.updateHandler_)
			this.updateHandler_ = null 
		}
		if(this.logic){
			this.logic.resetDatas();
		}
		this.readyToDestory = true 
		this.onRelease()
	}
	update() {
		if(this.prevGSOfflineTimestamp) {
			if(kdutils.getMillionSecond() - this.prevGSOfflineTimestamp >= this.gsTimeoutMS) {
				// gs超时，强制退出房间
				this.log("gs timeout")
				this.release()
			}
		}
		if(!this.readyToDestory) {
			if(this.gameStrategyTree_){
				this.checkRobotMark();
				this.logic.robotMarkList = this.robotMarkList;
				this.gameStrategyTree_.saveRobotList(this.robotMarkList);
				this.gameStrategyTree_.saveUsers(this.logic.users)
				this.gameStrategyTree_.tick({userBag:this.robotBag,isMatch:!!this.roomData_.groupID,taskFinsh:this.isTaskFinshed_});
			}
			this.onUpdate()
		}
	}
	handleMessage(msgName:string,jsonObj:any) {
		this.log("handleMessage name = " + msgName,jsonObj)
		switch(msgName) {
			case GSUserMsg.UserExit:{
				let msg:GSUserMsg.tUserExitNT = jsonObj
				if(this.logic.selfChairNo == msg.chairNo) {
					this.log("self exit")
					this.release()
					return 
				}
			} break 
			case GSUserMsg.RoundEnd:{
				this.log("handle round end")
				if(!this.readyToDestory) {
					this.release()
				}
			} break 
		}
		this.onMessage(msgName,jsonObj)
		if(this.readyToDestory) {
			return 
		}
		if(!this.listenFuncs_){
			Log.oth.error("onMessage listenFuncs_ is null")
			return;
		}
		
		let func = this.listenFuncs_.get(msgName)
		if(func) {
			Log.oth.log("robot onMessage listen msgName = ",msgName," data = ",jsonObj)
			func(jsonObj)
		} else {
			//this.log("cannot handle msgName = " + msgName,jsonObj)
		}
		this.logic.onMessage(msgName,jsonObj)
	}

	handleForceExit(roomID:number) {
		if(!this.readyToDestory && this.roomData.roomID == roomID) {
			this.log("handle exit from gs")
			this.release()
		}
	}
	async initListen() {
		this.listen(GSUserMsg.GameStart,kdutils.handler(this,this.handleGameStart))
		this.listen(GSUserMsg.RoundEnd,kdutils.handler(this,this.handleRoundEnd))
		this.listen(GSUserMsg.GameEnd,kdutils.handler(this,this.handleGameEnd))
		this.listen(GSUserMsg.GameSync,kdutils.handler(this,this.handleGameSync))
		this.listen(GSCommonMsg.GameResult,kdutils.handler(this,this.handleGameResult))
		this.listen(GSCommonMsg.BuyinOrStand,kdutils.handler(this,this.handleBuyinOrStand))
	}
	private listenFuncs_ = new Map<string,Function>()
	listen(msgName:string,func) {
		this.listenFuncs_.set(msgName,func)
	}
	protected async onInitRobotStrategy() {}
	protected onGSStatusChanged() {
		if(this.waitSendReadyToEnter_ && this.gsStatus) {
			this.worker.sendToGS(this.userID,GSUserMsg.ReadyToEnter,{})
			this.waitSendReadyToEnter_ = false 
		}
	}

	protected onMessage(msgName:string,jsonObj:any) {

	}
	protected onUpdate() {}
	protected onRelease() {}
	protected handleWinRate(){
		return 0;
	}
	protected handleAfterStrategyTreeInit(){
		//do nothing
	}

	handleGameStart(msg:GSUserMsg.tGameStartNT){
		let playingChairNos_ = msg.playingChairNos.slice()
		if(this.gameStrategyTree_){
			this.gameStrategyTree_.saveGameStart();
			this.gameStrategyTree_.savePlayingChairNos(playingChairNos_);
		}
		//TODO 计算胜率
		this.logic.setTreeConfig("forceWinRate",this.handleWinRate());
		var self = this;
		this.getPlanStatus().then((b)=>{
			self.isTaskFinshed_ = !b
		})
	}


	handleGameSync(msg:GSUserMsg.tGameSyncNT){

		this.loadUserInfo();
	}
	handleRoundEnd(msg:GSUserMsg.tRoundEndNT){
		
	}
	handleGameResult(msg:GSCommonMsg.tGameResultNT){
		let _selfRResult = msg.users.find(v=>v.userID == this.userID_)
		if(!_selfRResult){
			this.reportTaskValue(null)
			return;
		}
		this.reportTaskValue(_selfRResult.scoreChanged)
	}
	handleGameEnd(msg:GSUserMsg.tGameEndNT){
		this.loadUserInfo();
	}


	private handleBuyinOrStand(msg:GSCommonMsg.tBuyinOrStandNT) {
		
		if(msg.chairNo != this.getSelfUser().chairNo) {
			return;		
		}
		if(this.gameStrategyTree_){
			this.gameStrategyTree_.saveBuyinStatus(true);
		}
		//this.worker_.sendToGS(this.userID_,GSCommonMsg.BuyinCancel,{})
		this.loadUserInfo();
	}
	getSelfUser() {
		return this.logic.users.find(v=>v.userID == this.userID_)
	}
	
	private isGetUserBag_:boolean = false;
	async loadUserInfo(){
		if(this.isGetUserBag_) {
			return;
		}
		this.robotBag_ = null;
		this.isGetUserBag_ = true;
		let bag:ItemDefine.tBag = await Module_UserBag.getSingle({userID:this.userID})
		if(bag){
			this.robotBag_ = bag;

		}
		this.isGetUserBag_ = false;
	}

	async checkRobotMark(){
		if(!this.logic){
			return;
		}
		if(this.logic.users.length <= 0){
			return;
		}
		for (const user of this.logic.users) {
			if(!this.robotMarkList.includes(user.userID)){
				let _result = await RobotEnvTools.isRobot(user.userID)
				if(_result){
					this.robotMarkList.push(user.userID);
					Log.oth.log("robotMarkList",this.robotMarkList);
				}
			}
		}
	}
	async loadRobotStrategyDB(){
		return true;
	}

	async saveRobotStrategyDB(){
		return true;
	}
	
	
	log(msg:string,...params) {
		let ctor = (<any>this).constructor.name
		Log.oth.info("[ctor="+ctor+"]"+"[userID="+this.userID+"][roomID=" + this.roomData.roomID + "] " + msg,...params)
	}
	logError(msg:string,...params) {
		let ctor = (<any>this).constructor.name
		Log.oth.error("[ctor="+ctor+"]"+"[userID="+this.userID+"][roomID=" + this.roomData.roomID + "] " + msg,...params)
	}
		
}