import _ = require("underscore");
import { ClubDefine } from "../../pp-base-define/ClubDefine";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { DB } from "../../src/db";
import { RedisLock } from "../../src/RedisLock";
import { kdasync } from "kdweb-core/lib/tools/async";
import { Log } from "../log";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { parentPort } from "worker_threads";
import { ClubAccount } from "./ClubAccount";
import Decimal from "decimal.js";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { GameSet } from "../../pp-base-define/GameSet";
import { Rpc } from "../rpc";


let db = DB.get()
export class ClubMember {
	constructor(clubID:number) {
		this.clubID_ = clubID
	}
	private clubID_:number = null 
	get clubID() {
		return this.clubID_
	}
	set clubID(v) {
		this.clubID_ = v
	}
	async setLeader(userID:number,leaderUserID?:number) {
		return await this.runInLockQueue(async ()=>{
			let member = await this.getMember(userID)
			if(!member) {
				Log.oth.info("setLeader 1")
				return false 
			}
			if(member.leaderUserID == leaderUserID) {
				Log.oth.info("setLeader 2")
				return false 
			}
			// 反向关系
			if(leaderUserID && await this.isLeader(leaderUserID,userID,true)) {
				Log.oth.info("setLeader 3")
				return false 
			}

			let newLeaderMember:ClubDefine.tUserMember 
			let newLeaderRelation:ClubDefine.tUserRelation
			if(leaderUserID) {
				newLeaderMember = await this.getMember(leaderUserID)
				if(!newLeaderMember) {
					Log.oth.info("setLeader n 4")
					return false 
				}
				newLeaderRelation = await this.getRelation(leaderUserID) || {
					clubID:this.clubID,
					userID:leaderUserID,
					subs:[],
					leaders:[],
				}
				// if(!newLeaderRelation) {
				// 	Log.oth.info("setLeader n 5")
				// 	return false 
				// }
			}

			let allSubs = await this.getSubs(userID,true) || []

			// 清理之前的关系
			let oldLeaderMember:ClubDefine.tUserMember 
			let oldLeaderRelation:ClubDefine.tUserRelation
			if(member.leaderUserID) {
				oldLeaderMember = await this.getMember(member.leaderUserID)
				if(!oldLeaderMember) {
					Log.oth.info("setLeader 5")
					return false 
				}
				oldLeaderRelation = await this.getRelation(member.leaderUserID)
				// if(!oldLeaderRelation) {
				// 	Log.oth.info("setLeader 6")
				// 	return false 
				// }
			}
			if(member.leaderUserID) {
				member.leaderUserID = null 
			}
			let relation = await this.getRelation(userID)
			if(relation) {
				relation.leaders = []
			}
			if(oldLeaderRelation) {
				let idx = oldLeaderRelation.subs.findIndex(v=>v == userID)
				if(idx >= 0) {
					oldLeaderRelation.subs.splice(idx,1)
				}
				await this.saveRelation(oldLeaderRelation)
			}

			// 去掉所有下级从自己开始的上级链条
			let subRelations = await this.getRelations(allSubs)
			{
				let ps = []
				for(let subRelation of subRelations) {
					let idx = subRelation.leaders.indexOf(userID)
					if(idx >= 0) {
						subRelation.leaders.splice(idx+1)
						if(!leaderUserID) {
							ps.push(
								this.saveRelation(subRelation)
							)
						}
					}
				}
				if(ps.length > 0) {
					await Promise.all(ps)
				}
			}

			if(!leaderUserID) {
				await this.saveMember(member)
				if(relation) {
					await this.saveRelation(relation)
				}
				return true 
			}
			newLeaderRelation.subs.push(userID)
			await this.saveRelation(newLeaderRelation)

			member.leaderUserID = leaderUserID
			if(!relation) {
				relation = {
					clubID:this.clubID,
					userID,
					leaders:[],
					subs:[],
				}
			}
			relation.leaders.push(leaderUserID)
			relation.leaders.push.apply(relation.leaders,newLeaderRelation.leaders)
			{
				let ps = []
				for(let subRelation of subRelations) {
					subRelation.leaders.push.apply(subRelation.leaders,relation.leaders)
					ps.push(
						this.saveRelation(subRelation)
					)
				}
				if(ps.length > 0) {
					await Promise.all(ps)
				}
			}
			await this.saveMember(member)
			await this.saveRelation(relation)

			if(oldLeaderMember) {
				await db.delMany(DBDefine.tableClubDeskCost,{
					clubID:this.clubID,
					targetUserID:userID,
					userID:oldLeaderMember.userID
				})
			}
			return true 
		})
	}

	async setDeskCost(tID:number,userID:number,targetUserID:number,num:number) {
		return await this.runInLockQueue(async ()=>{
			let clubID = this.clubID
			Log.oth.info("setDeskCost start",{
				clubID,userID,targetUserID,num,
			})
		
			if(!Number.isSafeInteger(num)) {
				return {code:1,msg:"请输入整数"}
			}
			if(num < 0) {
				return {code:1,msg:"请输入大于0的整数"}
			}
			
			let member = await this.getMember(userID)
			if(!member) {
				return {code :1,msg:"用户不存在"}
			}
			let leader:ClubDefine.DeskCost = null;
			if(member.type != ClubDefine.MemberType.Boss) {
				leader = await db.getSingle(DBDefine.tableClubDeskCost,{tID:tID,targetUserID:userID})
				if(leader == null) {
					return {code :1,msg:"请先设置上级桌费"} 
				}
			}
			let template = await this.getTemplate(tID)
			if(!template) {
				return false 
			}
			let max = leader ? leader.num : 100
			num = parseFloat(num.toFixed(1))
			// 不能超出上级设定
			if(num > max) {
				return {code :1,msg:"不能超出上级设定"}  
			}
			// 非超级合伙人无法设置桌费
			if(!member ||member.type == ClubDefine.MemberType.Normal) {
				return {code :1,msg:"非超级合伙人无法设置桌费"}
			}

			let targetMember = await this.getMember(targetUserID)
	
			// 不是自己的下级，不是合伙人，不能设置桌费
			if(!targetMember || targetMember.leaderUserID != userID) {
				return {code :1,msg:"非下级无法设置桌费"}
			}
			
			let cost:ClubDefine.DeskCost = await db.getSingle(DBDefine.tableClubDeskCost,{clubID:clubID,tID:tID,userID:userID,targetUserID:targetUserID})
			let old = cost ? cost.num : null 
			cost = {
				clubID:this.clubID,
				tID:tID,
				userID:userID,
				targetUserID:targetUserID,
				num:num,
				max:max,
			}
			await db.updateOrInsert(DBDefine.tableClubDeskCost,cost,{clubID:clubID,tID:tID,userID:userID,targetUserID:targetUserID})
			Log.oth.info("setDeskCost end",{
				num,old
			})
			
			if(old != null && num != old) {
				// 下级
				let subs = await this.getSubs(targetUserID)
				for (const subId of subs) {
					this.checkDeskCost(tID,targetUserID,subId)
				}

			}

			return {code:0,msg:"设置成功"}
		})
	}

	async checkDeskCost(tID:number,userID:number,targetUserID:number) {

		let leader:ClubDefine.DeskCost = await db.getSingle(DBDefine.tableClubDeskCost,{clubID:this.clubID,tID:tID,targetUserID:userID});
		if(leader == null) {
			return false
		}
		let template = await this.getTemplate(tID)
		if(!template) {
			return false 
		}

		let member = await this.getMember(userID)
		if(!member || member.type == ClubDefine.MemberType.Normal) {
			return {code :1,msg:"非超级合伙人无法设置桌费"}
		}
		let targetMember = await this.getMember(targetUserID)
		if(!targetMember || targetMember.leaderUserID != userID) {
			return {code :1,msg:"非下级无法设置桌费"}
		}
		let cost:ClubDefine.DeskCost = await db.getSingle(DBDefine.tableClubDeskCost,{clubID:this.clubID,tID:tID,userID:userID,targetUserID:targetUserID});
		if(!cost) {
			return 
		}
		Log.oth.info("cost,leader",cost,leader)
		if(cost.num > leader.num) {
			await this.setDeskCost(tID,userID,targetUserID,leader.num)
		} else {
			await this.setDeskCost(tID,userID,targetUserID,cost.num)
		}
		return true 
	}
	/**
	 * 获取桌费
	 * @param userID 
	 * @param targetUserID 
	 * @returns 
	 */
	async getDeskCost(userID:number,targetUserID:number) {
		let member = await this.getMember(userID)
		if(!member) {
			return []
		}
		let targetMember = await this.getMember(targetUserID)
		if(!targetMember) {
			return []
		}
		let templates:ClubDefine.tRoomTemplate[] = await db.getOption(DBDefine.tableClubRoomTemplate,{clubID:this.clubID},{
			projection:{
				gameData:1,
				templateID:1,
			}
		})
		let ids = templates.map(v=>v.templateID)
		let deskCosts:ClubDefine.DeskCost[] = await db.get(DBDefine.tableClubDeskCost,{userID:userID,targetUserID:targetUserID,tID:{$in:ids}}) || []
		let leaders:ClubDefine.DeskCost[] = member.type == ClubDefine.MemberType.Boss ? [] : await db.get(DBDefine.tableClubDeskCost,{targetUserID:userID,tID:{$in:ids}})
		let ret:ClubDefine.DeskCost[] = []
		for(let template of templates) {
			let tID = template.templateID
			let deskCost = deskCosts.find(v=>v.tID == tID)
			let leader = leaders.find(v=>v.tID == tID)
			let max = member.type == ClubDefine.MemberType.Boss ? 100 : (leader ? leader.num : 0)
			let update = false 
			if(!deskCost) {
				deskCost = {
					clubID:this.clubID,
					tID:tID,
					userID,
					targetUserID,
					num:0,
					max:max,
				}
				update = true 
			} else {
				if(deskCost.max != max) {
					if(deskCost.max > max) {
						if(leader) {
							deskCost.max = max
							await this.checkDeskCost(tID,userID,targetUserID)
						}
					} else {
						deskCost.max = max 
						update = true 
					}

				}
			}
			ret.push(deskCost)

			if(update) {
				await db.updateOrInsert(DBDefine.tableClubDeskCost,deskCost,{clubID:this.clubID,tID:tID,userID:userID,targetUserID:targetUserID})
			}
		}
		return ret
	}
	/**
	 * 分红
	 * @param userID 
	 * @param tID 
	 * @param cost 
	 * @returns 
	 */
	async giveCostToLeaderRate(userID:number,tID:number,costStr:string){
		let cost = new Decimal(costStr)
		let template = await this.getTemplate(tID)
		let clubData = await this.getData();
		
		if(!clubData) {
			return 
		}
		do {
			// 如果模板不存在，则全部分配给老板
			if(!template) {
				break 
			}
			// 老板支付给自己
			if(userID == clubData.bossUserID) {
				break 
			}
			let relation = await this.getRelation(userID)
			// 只有一个上级，直接给老板
			if(relation.leaders.length <= 1) {
				break 
			}
			let last = cost
			//暂时默认100
			let max = 100;

			let relations = relation.leaders.reverse()
			for(let i = 0 ; i < relations.length - 1 ; i ++) {
				if(last.lessThanOrEqualTo(0)) {
					break 
				}
				let leader1 = relations[i]
				let leader2 = relations[i+1]
				let deskCost:ClubDefine.DeskCost = await db.getSingle(DBDefine.tableClubDeskCost,{clubID:this.clubID,tID:tID,userID:leader1,targetUserID:leader2});

				let num = new Decimal(0)
				if(!deskCost) {
					// 没设置，就全部给自己
					num = last
				} else {
					let rate = new Decimal(deskCost.num).dividedBy(max);
					num = last.minus(cost.times(rate).floor());
					if(num.lessThan(0)) {
						num = new Decimal(0);
					}
					// let rate = deskCost.num / max
					// num =  last-Math.floor(cost * rate)
					// if(num < 0) {
					// 	num = 0
					// }
				}
				if(num.lessThanOrEqualTo(0)){
					continue 
				}
				last = last.sub(num)
				await this.addValueFromSystem(leader1,new Decimal(num),template,ItemDefine.SerialType.WaterEarn)
			}
			if(last.greaterThan(0)) {
				let lastLeader = relation.leaders[relation.leaders.length - 1]
				await this.addValueFromSystem(lastLeader,new Decimal(last),template,ItemDefine.SerialType.WaterEarn)
			}
			return
		}while(false)
		
		await this.addValueFromSystem(clubData.bossUserID,new Decimal(cost),template,ItemDefine.SerialType.WaterEarn)

	}
	async addValueFromSystem(userID:number,count:Decimal,templateData:ClubDefine.tRoomTemplate,type?:ItemDefine.SerialType) {

		let gameSet = GameSet.createWithData(templateData.gameData)
		let payType = RoomDefine.getPayType(gameSet.getPayType())
		let payIndex = RoomDefine.getPayIndex(gameSet.getPayType())

		if(count.greaterThan(0)) {
			switch(payType) {
				case RoomDefine.PayType.Item:{
					await Rpc.center.callException("kds.item.add",userID,String(payIndex),count.toString(),type)
				} break 
				case RoomDefine.PayType.Club:{
					await ClubAccount.addValue(this.clubID,userID,payIndex,count,type)
			
				} break 
			}
		} else {
			Log.oth.info("giveCostToLeaderRate error lessThan 0",{
				userID,count,templateData,type
			})
		}
	}


	async callInLock<T>(func:()=>Promise<T>) {
		return await RedisLock.callInLock(RedisLock.ClubMember(this.clubID),10,func)
	}

	private q_:kdasync.queue = new kdasync.queue
	async runInLockQueue<T>(func:()=>Promise<T>) {
		return new Promise<T>(async (resolve,reject)=>{
			this.q_.call(async ()=>{
				resolve(await this.callInLock(func))
			})
		})
	}
	async saveMember(member:ClubDefine.tUserMember) {
		await db.updateOrInsert(DBDefine.tableClubMember,member,{clubID:this.clubID,userID:member.userID})
	}
	async saveRelation(relation:ClubDefine.tUserRelation) {
		await db.updateOrInsert(DBDefine.tableClubRelation,relation,{clubID:this.clubID,userID:relation.userID})
	}

	async isMember(userID:number) {
		let count = await db.getCount(DBDefine.tableClubMember,{clubID:this.clubID,userID:userID})
		return count > 0
	}

	async getData() {
		return <ClubDefine.tData>await db.getSingle(DBDefine.tableClubData,{clubID:this.clubID})
	}
	async getMember(userID:number) {
		return <ClubDefine.tUserMember>await db.getSingle(DBDefine.tableClubMember,{clubID:this.clubID,userID:userID})
	}
	async getMembers(userIDs:number[]) {
		return <ClubDefine.tUserMember[]>await db.get(DBDefine.tableClubMember,{clubID:this.clubID,userID:{$in:userIDs}}) || []
	}
	async getRelation(userID:number) {
		return <ClubDefine.tUserRelation>await db.getSingle(DBDefine.tableClubRelation,{clubID:this.clubID,userID:userID})
	}
	async getRelations(userIDs:number[]) {
		return <ClubDefine.tUserRelation[]>await db.get(DBDefine.tableClubRelation,{clubID:this.clubID,userID:{$in:userIDs}}) || []
	}
	async getTemplate(tID:number) {
		return <ClubDefine.tRoomTemplate>await db.getSingle(DBDefine.tableClubRoomTemplate,{templateID:tID,clubID:this.clubID})
	}
	/**
	 * 
	 * @param userID 
	 * @param leaderUserID 
	 * @param deep 是否处于关系链中
	 */
	async isLeader(userID:number,leaderUserID:number,deep?:boolean) {
		let member = await this.getMember(userID)
		if(!member) {
			return false 
		}
		if(member.leaderUserID == leaderUserID) {
			return true 
		}
		if(!deep) {
			return false 
		}
		let relation = await this.getRelation(userID)
		if(relation && relation.leaders.includes(leaderUserID)) {
			return true 
		}
		return false 
	}

	/**
	 * 
	 * @param userID 
	 * @param nearToFar true - 由近及远 false - 由远及近
	 * @returns 
	 */
	async getLeaders(userID:number,nearToFar?:boolean) {
		let relation = await this.getRelation(userID)
		if(relation) {
			return nearToFar ? relation.leaders : relation.leaders.reverse()
		}
		return []
	}

	/**
	 * 
	 * @param userID 
	 * @param deep 是否全部下级 false - 直接下级
	 */
	async getSubs(userID:number,deep?:boolean) {
		if(deep) {
			let relations:ClubDefine.tUserRelation[] = 
			await db.get(DBDefine.tableClubRelation,{
				clubID:this.clubID,
				userID:{$ne:userID},
				leaders:userID
			}) || []
			let userIDs:number[] = []
			for(let relation of relations) {
				userIDs.push(relation.userID)
				userIDs.push.apply(userIDs,relation.subs || [])
			}
			return _.uniq(userIDs)
		}
		let relation = await this.getRelation(userID)
		if(relation) {
			return relation.subs
		}
		return []
	}

	/**
	 * 
	 * @param userID 
	 * @param deep 是否全部下级 false - 直接下级
	 */
	async getSubMembers(userID:number,deep?:boolean) {
		let subs = await this.getSubs(userID,deep)
		return this.getMembers(subs)
	}
}