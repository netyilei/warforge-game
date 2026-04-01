import { kdutils } from "kdweb-core/lib/utils";
import { GameSet } from "../../pp-base-define/GameSet";
import { GSUserMsg } from "../../pp-base-define/GSUserMsg";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { IRobotProcessWorker } from "../entity/IRobotProcessWorker";
import { Log } from "../log";
import { TexasUserMsg } from "../../pp-game-texas/TexasDefine";
import { RobotDefine } from "../../pp-base-define/RobotDefine";
import { TexasRobotDefine } from "../../pp-game-texas/TexasRobotDefine";


export class BaseRobotLogic {
	constructor(params:{
		worker:IRobotProcessWorker,
		userID:number,
		roomData:RoomDefine.RoomData,
		gsName:string,
		strategy:RobotDefine.RuntimeStrategy,
		strategyData:RobotDefine.tStrategyData_Base,
		personality:RobotDefine.tPersonalityGameConfig_Base,
	}) {
		this.worker_ = params.worker
		this.selfUserID_ = params.userID
		this.roomData_ = params.roomData
		this.gameSet_ = GameSet.createWithData(params.roomData.gameData)
		this.gsName_ = params.gsName
		this.strategy_ = params.strategy
		this.strategyData_ = params.strategyData
		this.personality_ = params.personality
	}
	protected worker_:IRobotProcessWorker
	private strategy_:RobotDefine.RuntimeStrategy = null
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

	private selfUserID_:number = null 
	get selfUserID() {
		return this.selfUserID_
	}
	get roomID() {
		return this.roomData_?.roomID
	}

	private roomData_:RoomDefine.RoomData = null 
	get roomData() {
		return this.roomData_
	}

	private gameSet_:GameSet = null 
	get gameSet() {
		return this.gameSet_
	}

	private gsName_:string = null 
	get gsName() {
		return this.gsName_
	}

	private gsStatus_:boolean = false 
	get gsStatus() {
		return this.gsStatus_
	}

	onGSStatusChanged(b:boolean) {
		this.gsStatus_ = b 
	}

	private playingChairNos_:number[] = []
	get playingChairNos() {
		return this.playingChairNos_
	}

	private users_:GSUserMsg.tUserEnterData[] = []
	get users() {
		return this.users_
	}

	private selfChairNo_:number = -1
	get selfChairNo() {
		return this.selfChairNo_
	}

	private robotMarkList_:number[] = []
	get robotMarkList() {
		return this.robotMarkList_
	}
	set robotMarkList(v) {
		this.robotMarkList_ = v
	}

	isChairNoWatcher(chairNo:number) {
		return chairNo >= 100000
	}

	resetDatas() {
		this.users_ = []
		this.playingChairNos_ = []
		this.selfChairNo_ = -1
		this.handleResetDatas();
	}

	
	async onInitRobotLogic() {
		Log.oth.error("onInitRobotLogic")
		this.listen(GSUserMsg.GameStart,kdutils.handler(this,this.handleGameStart))
		this.listen(GSUserMsg.GameEnd,kdutils.handler(this,this.handleGameEnd))
		this.listen(GSUserMsg.RoundEnd,kdutils.handler(this,this.handleRoundEnd))
		this.listen(GSUserMsg.UserEnter,kdutils.handler(this,this.handleUserEnter))
		this.listen(GSUserMsg.UserExit,kdutils.handler(this,this.handleUserExit))
		this.listen(GSUserMsg.GameSync,kdutils.handler(this,this.handleGameSync))
		this.listen(GSUserMsg.ScoreChange,kdutils.handler(this,this.handleScoreChange))
		this.listen(GSUserMsg.UserSitdown,kdutils.handler(this,this.handleUserSitdown))
		this.listen(GSUserMsg.UserStandUp,kdutils.handler(this,this.handleUserStandup))
	}
	private listenFuncs_ = new Map<string,Function>()
	listen(msgName:string,func) {
		this.listenFuncs_.set(msgName,func)
	}

	onMessage(msgName:string,jsonObj:any) {
		if(!this.listenFuncs_){
			Log.oth.error("onMessage listenFuncs_ is null")
			return;
		}
		this.log("robot onMessage listen msgName = ",msgName," data = ",jsonObj)
		let func = this.listenFuncs_.get(msgName)
		if(func) {
			func(jsonObj)
		} else {
			this.log("cannot handle msgName = " + msgName,jsonObj)
		}
	}
	handleGameStart(msg:GSUserMsg.tGameStartNT){
		this.handleGameStartData(msg);
	}
	handleGameStartData(msg:GSUserMsg.tGameStartNT){
		if(msg.gameData) {
			this.gameSet_ = GameSet.createWithData(msg.gameData)
		}
		this.playingChairNos_ = msg.playingChairNos.slice()
	}
	handleGameEnd(msg:GSUserMsg.tGameEndNT){
		
	}
	handleUserEnter(msg:GSUserMsg.tUserEnterNT){
		this.log("recv user enter ",JSON.stringify(msg.users,null,4))
		for(let user of msg.users) {
			let idx = this.users_.findIndex(v=>v.userID == user.userID)
			if(idx >= 0) {
				this.users_[idx] = user
			} else {
				this.users_.push(user)
			}
			if(user.userID == this.selfUserID) {
				this.selfChairNo_ = user.chairNo
			}
		}
	}
	handleUserExit(msg:GSUserMsg.tUserExitNT){
		let idx = this.users_.findIndex(v=>v.chairNo == msg.chairNo)
		if(idx >= 0) {
			this.users_.splice(idx,1)
		}
	}
	handleGameSync(msg:GSUserMsg.tGameSyncNT){
		this.users_ = []
		
		if(msg.gameStartNT) {
			this.handleGameStartData(msg.gameStartNT)
		}
		this.handleUserEnter({
			users:msg.users
		})
		
	}
	handleRoundEnd(msg:GSUserMsg.tRoundEndNT){
		
	}
	handleScoreChange(msg:GSUserMsg.tScoreChangeNT){
		let user_ = this.users_.find(v=>v.chairNo == msg.chairNo)
		if(user_) {
			user_.score = msg.score
		}
	}
	handleUserSitdown(msg:GSUserMsg.tUserSitdownNT){
		let user_ = this.users_.find(v=>v.chairNo == msg.chairNo)
		if(user_) {
			user_.chairNo = msg.toChairNo
			if(user_.userID == this.selfUserID) {
				this.selfChairNo_ = user_.chairNo
			}
		}
	}
	handleUserStandup(msg:GSUserMsg.tUserStandUpNT){
		let user_ = this.users_.find(v=>v.chairNo == msg.chairNo)
		if(user_) {
			user_.chairNo = msg.toChairNo
			if(user_.userID == this.selfUserID) {
				this.selfChairNo_ = user_.chairNo
			}
		}
	}
	handleResetDatas(){

	}

	getSelfUser() {
		return this.users_.find(v=>v.userID == this.selfUserID)
	}

	sendToGS(msgName:string,jsonObj) {
		if(!this.gsStatus) {
			return false 			
		}
		this.worker_.sendToGS(this.selfUserID,msgName,jsonObj)
		return true 
	}

	setTreeConfig(key:string,value:any) {
		
	}
	

	log(msg:string,...params) {
		let ctor = (<any>this).constructor.name
		Log.oth.info("[ctor="+ctor+"]"+"[userID="+this.selfUserID+"][roomID=" + this.roomData.roomID + "] " + msg,...params)
	}
	logError(msg:string,...params) {
		let ctor = (<any>this).constructor.name
		Log.oth.error("[ctor="+ctor+"]"+"[userID="+this.selfUserID+"][roomID=" + this.roomData.roomID + "] " + msg,...params)
	}
}