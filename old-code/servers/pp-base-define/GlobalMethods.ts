export namespace kds {
	export namespace customer {
		/**
		 * no params
		 */
		export const getHost = "kds.customer.getHost"
	}
	export namespace group {
		export namespace hook {
			/**
			 * groupID:number,roomID:number
			 */
			export const roomRealtimeChanged = "kds.group.hook.roomRealtimeChanged"
			/**
			 * groupID:number,roomID:number
			 */
			export const roomRealtimeRemoved = "kds.group.hook.roomRealtimeRemoved"
		}
		export namespace nodelink {
			/**
			 * data:SrsMessageLink.tLinkCallData
			 */
			export const onUserMessage = "kds.group.nodelink.onUserMessage"
		}
	}
	export namespace room {
		export namespace create {
			/**
			 * groupID:number,gameData:RoomDefine.GameData
			 */
			export const group = "kds.room.create.group"
			/**
			 * userID:number,gameData:RoomDefine.GameData,type:SrsDefine.NodeType
			 */
			export const user = "kds.room.create.user"
			/**
			 * clubID:number,templateID:number
			 */
			export const clubTemplate = "kds.room.create.clubTemplate"
			/**
			 * clubID:number,gameData:RoomDefine.GameData
			 */
			export const club = "kds.room.create.club"
			/**
			 * gameData:RoomDefine.GameData
			 */
			export const system = "kds.room.create.system"
			/**
			 * matchID:number,gameData:RoomDefine.GameData,params:GSRpcMethods.tCreateRoomExtensionParams
			 */
			export const match = "kds.room.create.match"
		}
		export namespace user {
			/**
			 * roomID:number,userID:number
			 */
			export const kick = "kds.room.user.kick"
		}
		/**
		 * roomID:number,removeType?:RoomDefine.RemoveType
		 */
		export const remove = "kds.room.remove"
		export namespace realtime {
			/**
			 * roomID:number,status:RoomDefine.RoomStatus,changedUsers?:RoomDefine.tRoomRpcUserScoreChanged[]
			 */
			export const status = "kds.room.realtime.status"
			/**
			 * roomID:number,userID:number,chairNo:number,score:number | string
			 */
			export const changed = "kds.room.realtime.changed"
			/**
			 * roomID:number,userIDs:number[]
			 */
			export const removes = "kds.room.realtime.removes"
			/**
			 * roomID:number,realtime:RoomDefine.RoomRealtime
			 */
			export const update = "kds.room.realtime.update"
			/**
			 * roomID:number,userID:number
			 */
			export const remove = "kds.room.realtime.remove"
			/**
			 * roomID:number,userID:number,chairNo?:number,score?:number | string
			 */
			export const add = "kds.room.realtime.add"
			/**
			 * roomID:number,users:RoomDefine.tRoomRpcUserScoreChanged[]
			 */
			export const multiChanged = "kds.room.realtime.multiChanged"
			/**
			 * roomID:number,support:RoomDefine.RobotSupport
			 */
			export const robotSupport = "kds.room.realtime.robotSupport"
			/**
			 * matchID:number,roomID:number,userID:number,score:string
			 */
			export const totalScore = "kds.room.realtime.totalScore"
		}
	}
	export namespace chain {
		/**
		 * userID:number,chainID:number
		 */
		export const getChargeAddress = "kds.chain.getChargeAddress"
		/**
		 * tag:string,chainID:number
		 */
		export const getSubMainAddress = "kds.chain.getSubMainAddress"
		/**
		 * userID:number,orderID:number
		 */
		export const withdraw = "kds.chain.withdraw"
	}
	export namespace item {
		/**
		 * userID:number
		 */
		export const getBag = "kds.item.getBag"
		/**
		 * userID:number,itemID:string,count:Decimal,type?:ItemDefine.SerialType,data?:any
		 */
		export const set = "kds.item.set"
		/**
		 * userID:number,itemID:string,uuid:string,type?:ItemDefine.SerialType,data?:any
		 */
		export const useUUID = "kds.item.useUUID"
		/**
		 * userID:number,lockID:string,itemID:string,count?:Decimal,type?:ItemDefine.SerialType,data?:any
		 */
		export const matchLockItem = "kds.item.matchLockItem"
		/**
		 * userID:number,lockID:string,type?:ItemDefine.SerialType,data?:any
		 */
		export const unlockUser = "kds.item.unlockUser"
		/**
		 * lockID:string
		 */
		export const getLocks = "kds.item.getLocks"
		/**
		 * userID:number,items:ItemDefine.tItem[]
		 */
		export const check = "kds.item.check"
		/**
		 * userID:number,items:ItemDefine.tItem[],type?:ItemDefine.SerialType,data?:any
		 */
		export const addItems = "kds.item.addItems"
		/**
		 * userID:number,itemID:string,count:Decimal,ignoreNeg?:boolean,type?:ItemDefine.SerialType,data?:any
		 */
		export const use = "kds.item.use"
		/**
		 * userID:number,lockID:string
		 */
		export const getUserLock = "kds.item.getUserLock"
		/**
		 * userID:number,lockID:string,itemID:string,count:Decimal,type?:ItemDefine.SerialType,data?:any
		 */
		export const addLockItem = "kds.item.addLockItem"
		/**
		 * userID:number
		 */
		export const getUserLocks = "kds.item.getUserLocks"
		/**
		 * userID:number,items:ItemDefine.tItem[],type?:ItemDefine.SerialType,data?:any
		 */
		export const useItems = "kds.item.useItems"
		/**
		 * userID:number,itemID:string,count:Decimal,type?:ItemDefine.SerialType,data?:any
		 */
		export const add = "kds.item.add"
		/**
		 * lockID:string,type?:ItemDefine.SerialType,data?:any
		 */
		export const unlockAll = "kds.item.unlockAll"
		/**
		 * itemID:string,userID?:number
		 */
		export const delItem = "kds.item.delItem"
		/**
		 * userID:number,lockID:string,itemID:string,count:Decimal,type?:ItemDefine.SerialType,data?:any
		 */
		export const lockItem = "kds.item.lockItem"
		/**
		 * userID:number,lockID:string,itemID:string,count:Decimal,ignoreNeg?:boolean,type?:ItemDefine.SerialType,data?:any
		 */
		export const useLockItem = "kds.item.useLockItem"
		export namespace config {
			/**
			 * no params
			 */
			export const getAll = "kds.item.config.getAll"
			/**
			 * itemIDs:string[]
			 */
			export const gets = "kds.item.config.gets"
			/**
			 * no params
			 */
			export const refresh = "kds.item.config.refresh"
			/**
			 * itemID:string
			 */
			export const get = "kds.item.config.get"
		}
		/**
		 * userID:number,lockID:string,itemID:string
		 */
		export const getUserLockItemCount = "kds.item.getUserLockItemCount"
	}
	export namespace club {
		export namespace member {
			/**
			 * clubID:number,userID:number,targetUserID:number
			 */
			export const getDeskCost = "kds.club.member.getDeskCost"
			/**
			 * clubID:number,userID:number,toUserID:number,userReason?:string
			 */
			export const invite = "kds.club.member.invite"
			/**
			 * clubID:number,userID:number,subUserID:number
			 */
			export const getSubAccount = "kds.club.member.getSubAccount"
			/**
			 * clubID:number,userID:number,toUserID:number,b:boolean
			 */
			export const accept = "kds.club.member.accept"
			/**
			 * clubID:number,tId:number,userID:number,targetUserID:number,ratio:number
			 */
			export const setDeskCost = "kds.club.member.setDeskCost"
			/**
			 * clubID:number,userID:number,leaderUserID:number
			 */
			export const setLeader = "kds.club.member.setLeader"
			/**
			 * clubID:number,userID:number,skip:number,limit:number,account?:boolean
			 */
			export const getSubMembers = "kds.club.member.getSubMembers"
			/**
			 * clubID:number,userID:number,toUserID:number,value:Decimal,valueIndex:number
			 */
			export const giveValue = "kds.club.member.giveValue"
			/**
			 * clubID:number,userID:number
			 */
			export const getSubIds = "kds.club.member.getSubIds"
			/**
			 * clubID:number,userID:number,userReason?:string
			 */
			export const req = "kds.club.member.req"
			/**
			 * clubID:number,userID:number,fromUserID?:number,fromGMID?:number
			 */
			export const remove = "kds.club.member.remove"
			/**
			 * clubID:number,userID:number,leaderUserID?:number
			 */
			export const add = "kds.club.member.add"
			/**
			 * clubID:number,userID:number,subUserID:number
			 */
			export const getSubMember = "kds.club.member.getSubMember"
			/**
			 * clubID:number,userID:number
			 */
			export const isMember = "kds.club.member.isMember"
			/**
			 * clubID:number,userID:number
			 */
			export const isSearchUserIDEnabled = "kds.club.member.isSearchUserIDEnabled"
			/**
			 * clubID:number,userID:number,toUserID:number,jobType?:ClubDefine.JobType
			 */
			export const changeJobType = "kds.club.member.changeJobType"
			/**
			 * clubID:number,userID:number,b:boolean
			 */
			export const agree = "kds.club.member.agree"
			/**
			 * clubID:number,userID:number,toUserID:number,memberType?:ClubDefine.MemberType
			 */
			export const changeMemberType = "kds.club.member.changeMemberType"
		}
		export namespace hook {
			/**
			 * clubID:number,roomID:number
			 */
			export const roomRealtimeChanged = "kds.club.hook.roomRealtimeChanged"
			/**
			 * clubID:number,roomID:number
			 */
			export const roomRealtimeRemoved = "kds.club.hook.roomRealtimeRemoved"
		}
		export namespace account {
			/**
			 *  clubID:number, userID:number, valueIndex:number, count:Decimal, ignoreNeg?:boolean, type?:ItemDefine.SerialType
			 */
			export const use = "kds.club.account.use"
			/**
			 *  clubID:number, userID:number, valueIndex:number, count:Decimal, type?:ItemDefine.SerialType
			 */
			export const set = "kds.club.account.set"
			/**
			 *  clubID:number, userID:number
			 */
			export const getUserLocks = "kds.club.account.getUserLocks"
			/**
			 *  clubID:number, userID:number
			 */
			export const getAccount = "kds.club.account.getAccount"
			/**
			 *  clubID:number, userID:number, lockID:string, valueIndex:number, count:Decimal, ignoreNeg?:boolean, type?:ItemDefine.SerialType
			 */
			export const useLockValue = "kds.club.account.useLockValue"
			/**
			 *  clubID:number, userID:number, lockID:string, type?:ItemDefine.SerialType
			 */
			export const unlockUser = "kds.club.account.unlockUser"
			/**
			 *  clubID:number, userID:number, valueIndex:number, count:Decimal, type?:ItemDefine.SerialType
			 */
			export const add = "kds.club.account.add"
			/**
			 *  clubID:number, userID:number, lockID:string
			 */
			export const getUserLock = "kds.club.account.getUserLock"
			/**
			 *  clubID:number, lockID:string
			 */
			export const unlockAll = "kds.club.account.unlockAll"
			/**
			 *  clubID:number, lockID:string
			 */
			export const getLocks = "kds.club.account.getLocks"
			/**
			 *  clubID:number, userID:number, lockID:string, valueIndex:number, count:Decimal, type?:ItemDefine.SerialType
			 */
			export const addLockValue = "kds.club.account.addLockValue"
			/**
			 *  clubID:number, userID:number, lockID:string, valueIndex:number, count:Decimal, type?:ItemDefine.SerialType
			 */
			export const lockValue = "kds.club.account.lockValue"
		}
		export namespace reward {
			/**
			 * clubID:number
			 */
			export const getReward = "kds.club.reward.getReward"
			/**
			 * clubID:number
			 */
			export const getPlan = "kds.club.reward.getPlan"
			/**
			 * clubID:number,planID:number
			 */
			export const setPlanID = "kds.club.reward.setPlanID"
		}
		export namespace realtime {
			/**
			 * clubID:number,userID:number,roomID:number
			 */
			export const jiesanRoom = "kds.club.realtime.jiesanRoom"
			/**
			 * clubID:number,userID:number,templateID:number
			 */
			export const delTemplate = "kds.club.realtime.delTemplate"
			/**
			 * clubID:number,userID:number,template:ClubDefine.tRoomTemplate
			 */
			export const updateTemplate = "kds.club.realtime.updateTemplate"
			/**
			 * clubID:number,userID:number,template:ClubDefine.tRoomTemplate
			 */
			export const createTemplate = "kds.club.realtime.createTemplate"
			/**
			 * clubID:number
			 */
			export const getTemplates = "kds.club.realtime.getTemplates"
			/**
			 * clubID:number,userID:number,templateID:number
			 */
			export const createRoom = "kds.club.realtime.createRoom"
		}
		export namespace bill {
			/**
			 * bill:RoomDefine.BillData,roomData:RoomDefine.RoomData
			 */
			export const room = "kds.club.bill.room"
			/**
			 * bill:RoomDefine.FinalBillData,roomData:RoomDefine.RoomData
			 */
			export const round = "kds.club.bill.round"
		}
		export namespace data {
			/**
			 * clubID:number,code:string
			 */
			export const setCode = "kds.club.data.setCode"
			/**
			 * setting:ClubDefine.tSetting
			 */
			export const updateSetting = "kds.club.data.updateSetting"
			/**
			 * userID:number
			 */
			export const create = "kds.club.data.create"
			/**
			 * clubID:number
			 */
			export const getFull = "kds.club.data.getFull"
			/**
			 * skip?:number,limit?:number
			 */
			export const getDatas = "kds.club.data.getDatas"
			/**
			 * skip?:number,limit?:number
			 */
			export const getSettings = "kds.club.data.getSettings"
			/**
			 * data:ClubDefine.tData
			 */
			export const updateData = "kds.club.data.updateData"
			/**
			 * clubID:number
			 */
			export const getSetting = "kds.club.data.getSetting"
			/**
			 * skip?:number,limit?:number
			 */
			export const getFulls = "kds.club.data.getFulls"
			/**
			 * clubID:number
			 */
			export const getData = "kds.club.data.getData"
		}
	}
	export namespace oss {
		export namespace seq {
			/**
			 * filename:string
			 */
			export const cancel = "kds.oss.seq.cancel"
			/**
			 * ossName:string,filename:string,totalSize?:number
			 */
			export const start = "kds.oss.seq.start"
			/**
			 * filename:string,newSize:number
			 */
			export const checkSize = "kds.oss.seq.checkSize"
			/**
			 * filename:string
			 */
			export const end = "kds.oss.seq.end"
			/**
			 * filename:string,base64Str:string
			 */
			export const upload = "kds.oss.seq.upload"
		}
		/**
		 * ossName:string
		 */
		export const cdnPrefix = "kds.oss.cdnPrefix"
		/**
		 * ossName:string,path:string
		 */
		export const list = "kds.oss.list"
		/**
		 * ossName:string,fileName:string,base64Str:string
		 */
		export const upload = "kds.oss.upload"
		/**
		 * ossName:string,path:string
		 */
		export const refresh = "kds.oss.refresh"
		/**
		 * ossName:string,fileName:string
		 */
		export const remove = "kds.oss.remove"
		/**
		 * ossName:string,path:string
		 */
		export const removePath = "kds.oss.removePath"
		/**
		 * ossName:string,fileName:string,url:string,useCache?:boolean
		 */
		export const uploadRemoteImg = "kds.oss.uploadRemoteImg"
		export namespace icon {
			/**
			 * ossName:string,userID:number
			 */
			export const getUrl = "kds.oss.icon.getUrl"
			/**
			 * ossName:string,userID:number,iconUrl:string
			 */
			export const upload = "kds.oss.icon.upload"
			/**
			 * ossName:string,userID:number,iconUrl:string
			 */
			export const uploadXLApp = "kds.oss.icon.uploadXLApp"
		}
	}
	export namespace paypal {
		/**
		 * h: string, userID: number, paypalOrderId: string
		 */
		export const getPaypalOrderDetails = "kds.paypal.getPaypalOrderDetails"
		/**
		 * h: string, userID: number, paypalOrderId: string
		 */
		export const capturePaypalOrder = "kds.paypal.capturePaypalOrder"
		/**
		 * no params
		 */
		export const refundPaypalPayment = "kds.paypal.refundPaypalPayment"
		/**
		 * no params
		 */
		export const createPaypalOrder = "kds.paypal.createPaypalOrder"
	}
	export namespace sys {
		export namespace code {
			/**
			 * code:string,maxLength?:number,name?:string
			 */
			export const release = "kds.sys.code.release"
			/**
			 * code:string,maxLength:number,name?:string
			 */
			export const use = "kds.sys.code.use"
			export namespace room {
				/**
				 * code:string
				 */
				export const release = "kds.sys.code.room.release"
				/**
				 * code:string
				 */
				export const use = "kds.sys.code.room.use"
				/**
				 * no params
				 */
				export const get = "kds.sys.code.room.get"
			}
			/**
			 * maxLength?:number,name?:string
			 */
			export const get = "kds.sys.code.get"
		}
		export namespace mutex {
			/**
			 * name:string,tag?:string
			 */
			export const release = "kds.sys.mutex.release"
			/**
			 * name:string,waitTimeout:number,tag?:string
			 */
			export const get = "kds.sys.mutex.get"
		}
		export namespace user {
			export namespace bind {
				/**
				 * userID
				 */
				export const getBindInfos = "kds.sys.user.bind.getBindInfos"
				/**
				 * userID:number,bindType:string,bindStr:string
				 */
				export const set = "kds.sys.user.bind.set"
				/**
				 * bindType:string,bindStr:string
				 */
				export const get = "kds.sys.user.bind.get"
			}
		}
		export namespace id {
			/**
			 * name:string,fromId?:number,step?:number
			 */
			export const get = "kds.sys.id.get"
		}
		export namespace email {
			/**
			 * to:string,code:string,templateName?:string
			 */
			export const sendEmailCode = "kds.sys.email.sendEmailCode"
			/**
			 * to:string,subject:string,content:string
			 */
			export const sendEmail = "kds.sys.email.sendEmail"
		}
	}
	export namespace srs {
		export namespace disp {
			/**
			 * userID:number,msgName:string,data:any
			 */
			export const sendToUser = "kds.srs.disp.sendToUser"
			export namespace internal {
				/**
				 * userID:number,msgName:string,data:any
				 */
				export const sendToUser = "kds.srs.disp.internal.sendToUser"
				/**
				 * deviceID:string,msgName:string,data:any
				 */
				export const sendToDevice = "kds.srs.disp.internal.sendToDevice"
			}
			/**
			 * deviceID:string,msgName:string,data:any
			 */
			export const sendToDevice = "kds.srs.disp.sendToDevice"
		}
	}
	export namespace mutex {
		/**
		 * name:string,tag?:string
		 */
		export const release = "kds.mutex.release"
		/**
		 * name:string,waitTimeout:number,tag?:string
		 */
		export const get = "kds.mutex.get"
	}
	export namespace robotenv {
		/**
		 * matchID:number
		 */
		export const stopRobotLogicByMatchID = "kds.robotenv.stopRobotLogicByMatchID"
	}
	export namespace dbp {
		export namespace kv {
			export namespace c {
				/**
				 * key:string,value:string
				 */
				export const set = "kds.dbp.kv.c.set"
				/**
				 * key:string
				 */
				export const del = "kds.dbp.kv.c.del"
				/**
				 * key:string,tag:string
				 */
				export const get = "kds.dbp.kv.c.get"
			}
			/**
			 * key:string,value:string
			 */
			export const set = "kds.dbp.kv.set"
			export namespace r0 {
				/**
				 * key:string,value:string
				 */
				export const set = "kds.dbp.kv.r0.set"
				/**
				 * key:string
				 */
				export const get = "kds.dbp.kv.r0.get"
				export const removet = "kds.dbp.kv.r0.removet"
				export const gettKeys = "kds.dbp.kv.r0.gettKeys"
				export const gettAll = "kds.dbp.kv.r0.gettAll"
				export const sett = "kds.dbp.kv.r0.sett"
				/**
				 * key:string
				 */
				export const del = "kds.dbp.kv.r0.del"
				export const delt = "kds.dbp.kv.r0.delt"
				export const gett = "kds.dbp.kv.r0.gett"
				export const cleart = "kds.dbp.kv.r0.cleart"
			}
			export namespace r1 {
				export const sett = "kds.dbp.kv.r1.sett"
				export const delt = "kds.dbp.kv.r1.delt"
				export const gett = "kds.dbp.kv.r1.gett"
				export const removet = "kds.dbp.kv.r1.removet"
				export const gettKeys = "kds.dbp.kv.r1.gettKeys"
				export const gettAll = "kds.dbp.kv.r1.gettAll"
				export const cleart = "kds.dbp.kv.r1.cleart"
			}
			/**
			 * key:string
			 */
			export const get = "kds.dbp.kv.get"
			export const gettKeys = "kds.dbp.kv.gettKeys"
			export const removet = "kds.dbp.kv.removet"
			export namespace m {
				/**
				 * tableName:string,data:any
				 */
				export const insert = "kds.dbp.kv.m.insert"
				/**
				 * tableName:string,data:any,index:any
				 */
				export const updateOrInsert = "kds.dbp.kv.m.updateOrInsert"
				/**
				 * tableName:string,index:any
				 */
				export const get = "kds.dbp.kv.m.get"
				/**
				 * tableName:string,index:any,data:any
				 */
				export const update = "kds.dbp.kv.m.update"
				/**
				 * tableName:string,index:any
				 */
				export const getSingle = "kds.dbp.kv.m.getSingle"
				/**
				 * tableName:string,pipelines:any[]
				 */
				export const aggregate = "kds.dbp.kv.m.aggregate"
				/**
				 * tableName:string,index:any,opt?:FindOneOptions
				 */
				export const getCount = "kds.dbp.kv.m.getCount"
				/**
				 * tableName:string,index:any,opt:FindOneOptions
				 */
				export const getOption = "kds.dbp.kv.m.getOption"
				/**
				 * tableName:string,index:any
				 */
				export const delete_ = "kds.dbp.kv.m.delete"
			}
			export const gettAll = "kds.dbp.kv.gettAll"
			export const sett = "kds.dbp.kv.sett"
			export namespace s {
				/**
				 * tableName:string,key:string,count?:number
				 */
				export const step = "kds.dbp.kv.s.step"
				/**
				 * tableName:string,key:string
				 */
				export const get = "kds.dbp.kv.s.get"
				/**
				 * tableName:string
				 */
				export const clear = "kds.dbp.kv.s.clear"
				/**
				 * tableName:string
				 */
				export const getAll = "kds.dbp.kv.s.getAll"
				/**
				 * tableName:string
				 */
				export const remove = "kds.dbp.kv.s.remove"
				/**
				 * tableName:string,key:string
				 */
				export const delete_ = "kds.dbp.kv.s.delete"
			}
			/**
			 * key:string
			 */
			export const del = "kds.dbp.kv.del"
			export const delt = "kds.dbp.kv.delt"
			export const gett = "kds.dbp.kv.gett"
			export const cleart = "kds.dbp.kv.cleart"
		}
	}
	export namespace mail {
		/**
		 * userID:number,mailID:number
		 */
		export const read = "kds.mail.read"
		/**
		 * userID:number
		 */
		export const updateRedDot = "kds.mail.updateRedDot"
		/**
		 * data:MailDefine.tMail
		 */
		export const add = "kds.mail.add"
		/**
		 * userID:number
		 */
		export const refreshSystem = "kds.mail.refreshSystem"
		/**
		 * data:MailDefine.tMail
		 */
		export const addsystem = "kds.mail.addsystem"
	}
	export namespace match {
		export namespace oper {
			/**
			 * matchID:number
			 */
			export const endMatch = "kds.match.oper.endMatch"
		}
		export namespace hook {
			/**
			 * matchID:number,roomID:number
			 */
			export const roomRealtimeChanged = "kds.match.hook.roomRealtimeChanged"
			/**
			 * matchID:number,roomID:number
			 */
			export const roomRealtimeRemoved = "kds.match.hook.roomRealtimeRemoved"
		}
	}
}
