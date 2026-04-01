import { kdutils } from "kdweb-core/lib/utils";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { SerialHelper } from "../../src/SerialHelper";
import { DB } from "../../src/db";
import { Rpc } from "../rpc";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { SrsDCN } from "../../pp-base-define/SrsUserMsg";
import Decimal from "decimal.js";
import { itemConfigs } from "./itemConfig";
import uuid from "uuid";
import { Log } from "../log";
import { RedisLock } from "../../src/RedisLock";
import { Module_UserBag, Module_UserBagLock } from "../../pp-base-define/DM_UserDefine";


async function callInMutex<T>(name,func:(...params)=>Promise<T>) {
	return await RedisLock.callInLock("ACCOUNT|" + name,10,async ()=>{
		return await func()
	})
}

async function callInItemMutex<T>(userID:number,func:(...params)=>Promise<T>) {
	return await callInMutex<T>("ITEM|" + userID,func)
}

async function callInLockMutex<T>(userID:number,func:(...params)=>Promise<T>) {
	return await callInMutex<T>("LOCKITEM|" + userID,func)
}

function operAddItemToBag(itemID:string,count:Decimal | string | number,bag:ItemDefine.tBag) {
	count = new Decimal(count)
	let config = itemConfigs.find(v=>v.id == itemID)
	if(!config) {
		return null  
	}
	let item:ItemDefine.tItem
	let addCount:Decimal 
	// 可堆叠
	if(config.overlapped) {
		item = bag.items.find(v=>v.id == itemID)
		if(!item) {
			item = {
				id:itemID,count:"0"
			}
			bag.items.push(item)
		}
		item.count = Decimal.add(item.count,count).toString()
		addCount = count
	} else {
		if(config.expireOverlapped && config.expireTime) {
			item = bag.items.find(v=>v.id == itemID)
			if(item) {
				let time = kdutils.getMillionSecond()
				if(time > item.expire) {
					item.count = "1"
					item.expire = time + config.expireTime
					addCount = new Decimal("1")
				} else {
					item.expire += config.expireTime
					addCount = new Decimal("0")
				}
			} else {
				item = {
					id:itemID,count:"1",uuid:uuid.v1(),
					expire:config.expireTime ? kdutils.getMillionSecond() + config.expireTime : null,
				}
				bag.items.push(item)
				addCount = new Decimal("1")
			}
		} else {
			item = {
				id:itemID,count:"1",uuid:uuid.v1(),
				expire:config.expireTime ? kdutils.getMillionSecond() + config.expireTime : null,
			}
			bag.items.push(item)
			addCount = new Decimal("1")
		}
	}
	return {
		item,addCount
	}
}
async function addItem(h:string,userID:number,itemID:string,count:Decimal,type?:ItemDefine.SerialType,data?:any) {
	count = new Decimal(count)
	if(count.lessThanOrEqualTo(0)) {
		return false 
	}
	itemID = String(itemID)
	return await callInItemMutex(userID,async ()=>{
		let bag:ItemDefine.tBag = await Module_UserBag.getMain(userID)
		if(!bag) {
			bag = {
				userID,
				items:[]
			}
		}
		let ret = operAddItemToBag(itemID,count,bag)
		if(!ret) {
			return false
		}
		await Module_UserBag.updateOrInsert(bag)
		SerialHelper.add({
			userID,
			itemID,
			changed:ret.addCount.toString(),
			last:ret.item.count,

			type:type || ItemDefine.SerialType.System,
			data,
		})
		Rpc.center?.callAll(SrsRpcMethods.LayerCenter.dcnFilterChanged,[userID],SrsDCN.bagChanged(),{})
		return true 
	})
}
async function addItems(h:string,userID:number,items:ItemDefine.tItem[],type?:ItemDefine.SerialType,data?:any) {
	return await callInItemMutex(userID,async ()=>{
		let bag:ItemDefine.tBag = await Module_UserBag.getMain(userID)
		if(!bag) {
			bag = {
				userID,
				items:[]
			}
		}
		//检测数据合法性
		for (const item of items) {
			if(!item.id || !item.count) {
				return false 
			}
			let _count = new Decimal(item.count)
			if(_count.lessThanOrEqualTo(0)) {
				return false 
			}

		}
		for (const item of items) {
			let ret = operAddItemToBag(item.id,item.count,bag)
			if(ret) {
				SerialHelper.add({
					userID,
					itemID:ret.item.id,
					changed:ret.addCount.toString(),
					last:ret.item.count,
		
					type:type || ItemDefine.SerialType.System,
					data,
				})
			} else {
				Log.oth.error("add items failed item = ",item)
			}
		}
		await Module_UserBag.updateOrInsert(bag)
		
		Rpc.center?.callAll(SrsRpcMethods.LayerCenter.dcnFilterChanged,[userID],SrsDCN.bagChanged(),{})
		return true 
	})
}
async function useItem(h:string,userID:number,itemID:string,count:Decimal,ignoreNeg?:boolean,type?:ItemDefine.SerialType,data?:any) {
	count = new Decimal(count)
	if(count.lessThanOrEqualTo(0)) {
		return false 
	}
	itemID = String(itemID)
	let config = itemConfigs.find(v=>v.id == itemID)
	// 不可堆叠的不可锁定
	if(!config || !config.overlapped) {
		return false 
	}
	return await callInItemMutex(userID,async ()=>{
		let bag:ItemDefine.tBag = await Module_UserBag.getMain(userID)
		if(!bag) {
			return false 
		}
		let item = bag.items.find(v=>v.id == itemID)
		if(!item) {
			return false 
		}
		let itemCount = new Decimal(item.count)
		if(itemCount.lessThan(count)) {
			if(!ignoreNeg) {
				return false 
			}
		}
		item.count = itemCount.sub(count).toString()
		await Module_UserBag.updateOrInsert(bag)
		SerialHelper.add({
			userID,
			itemID,
			changed:count.neg().toString(),
			last:item.count,

			type:type || ItemDefine.SerialType.System,
			data,
		})
		Rpc.center?.callAll(SrsRpcMethods.LayerCenter.dcnFilterChanged,[userID],SrsDCN.bagChanged(),{})
		return true 
	})
}
async function useItems(h:string,userID:number,items:ItemDefine.tItem[],type?:ItemDefine.SerialType,data?:any) {
	return await callInItemMutex(userID,async ()=>{
		let bag:ItemDefine.tBag = await Module_UserBag.getMain(userID)
		if(!bag) {
			return false 
		}
		for (const item_ of items) {
			let id = String(item_.id)
			let config = itemConfigs.find(v=>v.id == id) 
			if(!config || !config.overlapped) {
				return false 
			}
            let bagItem = bag.items.find(v=>v.id == id)
			let count = new Decimal(item_.count)
			if(count.lessThanOrEqualTo(0)) {
				return false 
			}
            if(new Decimal(bagItem.count).lessThan(count)){
                return false
            }
        }
		for (const item_ of items) {
			let _id = String(item_.id)
            let bagItem = bag.items.find(v=>v.id == _id)
			let _count = new Decimal(item_.count)
			bagItem.count = new Decimal(bagItem.count).sub(_count).toString()

			SerialHelper.add({
				userID,
				itemID:_id,
				changed:_count.neg().toString(),
				last:item_.count,
				type:type || ItemDefine.SerialType.System,
				data,
			})
		}
		await Module_UserBag.updateOrInsert(bag)
		Rpc.center?.callAll(SrsRpcMethods.LayerCenter.dcnFilterChanged,[userID],SrsDCN.bagChanged(),{})
		return true 
	})
}

async function useItemUUID(h:string,userID:number,itemID:string,uuid:string,type?:ItemDefine.SerialType,data?:any) {
	itemID = String(itemID)
	let config = itemConfigs.find(v=>v.id == itemID)
	if(!config || config.overlapped) {
		return false 
	}
	return await callInItemMutex(userID,async ()=>{
		let bag:ItemDefine.tBag = await Module_UserBag.getMain(userID)
		if(!bag) {
			return false 
		}
		let idx = bag.items.findIndex(v=>v.id == itemID && v.uuid == uuid)
		if(idx < 0) {
			return false 
		}
		let item = bag.items[idx]
		bag.items.splice(idx,1)
		Module_UserBag.updateOrInsert(bag)
		Rpc.center?.callAll(SrsRpcMethods.LayerCenter.dcnFilterChanged,[userID],SrsDCN.bagChanged(),{})
		if(item.expire < kdutils.getMillionSecond()) {
			return false 
		}
		return true 
	})
}

async function setItem(h:string,userID:number,itemID:string,count:Decimal,type?:ItemDefine.SerialType,data?:any) {
	count = new Decimal(count)
	if(count.lessThan(0)) {
		return false 
	}
	itemID = String(itemID)
	return await callInItemMutex(userID,async ()=>{
		let bag:ItemDefine.tBag = await Module_UserBag.getMain(userID)
		if(!bag) {
			bag = {
				userID,
				items:[]
			}
		}
		let item = bag.items.find(v=>v.id == itemID)
		if(!item) {
			item = {
				id:itemID,count:""
			}
			bag.items.push(item)
		}
		item.count = count.toString()
		await Module_UserBag.updateOrInsert(bag)
		SerialHelper.add({
			userID,
			itemID,
			setup:true,
			changed:count.toString(),
			last:item.count,

			type:type || ItemDefine.SerialType.System,
			data,
		})
		Rpc.center?.callAll(SrsRpcMethods.LayerCenter.dcnFilterChanged,[userID],SrsDCN.bagChanged(),{})
		return true 
	})
}

async function getBag(h:string,userID:number) {
	let bag:ItemDefine.tBag = await Module_UserBag.getMain(userID)
	if(!bag) {
		bag = {
			userID,
			items:[]
		}
	}
	return bag 
}

async function lockItem(h:string,userID:number,lockID:string,itemID:string,count:Decimal,type?:ItemDefine.SerialType,data?:any) {
	count = new Decimal(count)
	if(count.lessThanOrEqualTo(0)) {
		return false 
	}
	lockID = String(lockID)
	itemID = String(itemID)
	let config = itemConfigs.find(v=>v.id == itemID)
	// 不可堆叠的不可锁定
	if(!config || !config.overlapped) {
		return false 
	}
	return await callInLockMutex(userID,async ()=>{
		let lock = await Module_UserBagLock.getSingle({
			userID:userID,lockID:lockID
		})
		let b = await useItem(h,userID,itemID,count,false,type,data)
		if(!b) {
			return false 
		}
		let time = kdutils.getMillionSecond()
		if(lock) {
			let item = lock.items.find(v=>v.id == itemID)
			if(!item) {
				lock.items.push({
					id:itemID,count:count.toString(),
				})
			} else {
				item.count = Decimal.add(item.count,count).toString()
			}
			lock.records.push({
				id:itemID,
				count:count.toString(),
				timestamp:time,
				date:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
			})
			SerialHelper.add({
				userID,
				isLock:true,
				lockID,
				itemID,
				changed:count.toString(),
				last:item.count,
				type:type || ItemDefine.SerialType.Lock,
				data,
			})
		} else {
			lock = {
				userID,lockID,
				items:[{
					id:itemID,
					count:count.toString(),
				}],
				records:[{
					id:itemID,
					count:count.toString(),
					timestamp:time,
					date:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
				}],
				timestamp:time,
				date:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
			}
			SerialHelper.add({
				userID,
				isLock:true,
				lockID,
				itemID,
				changed:count.toString(),
				last:count.toString(),
				type:type || ItemDefine.SerialType.Lock,
				data,
			})
		}
		await Module_UserBagLock.updateOrInsert({userID:userID,lockID:lockID},lock)
		return true 
	})
}

async function matchLockItem(h:string,userID:number,lockID:string,itemID:string,count?:Decimal,type?:ItemDefine.SerialType,data?:any) {
	return await callInLockMutex(userID,async ()=>{
		let lock = await Module_UserBagLock.getSingle({
			userID:userID,lockID:lockID
		})
		if(lock) {
			return lock.items.find(v=>v.id == itemID)?.count || "0" 
		}
		let bag = await getBag(h,userID)
		let item = bag.items.find(v=>v.id == itemID)
		if(!item) {
			return null 
		}
		count = new Decimal(count || 0)
		if(count == null || count.lessThanOrEqualTo(0)) {
			count = new Decimal(item.count)
		} else {
			count = new Decimal(count)
			if(count.lessThanOrEqualTo(0)) {
				return null 
			}
		}
		let b = await useItem(h,userID,itemID,count,false,type,data)
		if(!b) {
			return null 
		}
		let time = kdutils.getMillionSecond()
		if(!lock) {
			lock = {
				userID,lockID,
				items:[{
					id:itemID,
					count:count.toString(),
				}],
				records:[{
					id:itemID,
					count:count.toString(),
					timestamp:time,
					date:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
				}],
				timestamp:time,
				date:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
			}
			SerialHelper.add({
				userID,
				isLock:true,
				lockID,
				itemID,
				changed:count.toString(),
				last:count.toString(),
				type:type || ItemDefine.SerialType.Lock,
				data,
			})
		}
		await Module_UserBagLock.updateOrInsert({userID:userID,lockID:lockID},lock)
		return count.toString() 
	})
}

async function addLockItem(h:string,userID:number,lockID:string,itemID:string,count:Decimal,type?:ItemDefine.SerialType,data?:any) {
	count = new Decimal(count)
	if(count.lessThan(0)) {
		return false 
	}
	lockID = String(lockID)
	itemID = String(itemID)
	return await callInLockMutex(userID,async ()=>{
		let lock:ItemDefine.tLock = await Module_UserBagLock.getSingle({
			userID:userID,lockID:lockID
		})
		if(!lock) {
			return false 
		}
		let item = lock.items.find(v=>v.id == itemID)
		if(!item) {
			item = {
				id:itemID,
				count:"0",
			}
			lock.items.push(item)
		}
		item.count = Decimal.add(item.count,count).toString()
		let time = kdutils.getMillionSecond()
		lock.records.push({
			id:itemID,
			count:count.toString(),
			timestamp:time,
			date:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
		})
		SerialHelper.add({
			userID,
			isLock:true,
			lockID,
			itemID,
			changed:count.toString(),
			last:item.count,
			type:type,
			data,
		})
		await Module_UserBagLock.updateOrInsert({userID:userID,lockID:lockID},lock)
		return true 
	})
}

async function useLockItem(h:string,userID:number,lockID:string,itemID:string,count:Decimal,ignoreNeg?:boolean,type?:ItemDefine.SerialType,data?:any) {
	lockID = String(lockID)
	count = new Decimal(count)
	if(count.lessThan(0)) {
		return false 
	}
	itemID = String(itemID)
	return await callInLockMutex(userID,async ()=>{
		let lock:ItemDefine.tLock = await Module_UserBagLock.getSingle({
			userID:userID,lockID:lockID
		})
		if(!lock) {
			return false 
		}
		let item = lock.items.find(v=>v.id == itemID)
		if(!item) {
			return false 
		}
		let itemCount = new Decimal(item.count)
		if(itemCount.lessThan(count)) {
			if(!ignoreNeg) {
				return false 
			}
		}
		item.count = itemCount.sub(count).toString()
		await Module_UserBagLock.updateOrInsert({userID:userID,lockID:lockID},lock)
		let time = kdutils.getMillionSecond()
		lock.records.push({
			id:itemID,
			count:count.neg().toString(),
			timestamp:time,
			date:kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss",time)
		})
		SerialHelper.add({
			userID,
			isLock:true,
			lockID,
			itemID,
			changed:count.neg().toString(),
			last:item.count,
			type:type,
			data,
		})
		return true 
	})
}

async function unlockUser(h:string,userID:number,lockID:string,type?:ItemDefine.SerialType,data?:any) {
	lockID = String(lockID)
	return await callInLockMutex(userID,async ()=>{
		let lock:ItemDefine.tLock = await Module_UserBagLock.getSingle({
			userID:userID,lockID:lockID
		})
		if(!lock) {
			return false 
		}
		for(let item of lock.items) {
			let count = new Decimal(item.count)
			if(count.greaterThan(0)) {
				await addItem(h,userID,item.id,count,type,data)
			} else if(count.lessThan(0)) {
				await useItem(h,userID,item.id,count.abs(),true,type,data)
			}
		}
		await Module_UserBagLock.del({
			userID:userID,lockID:lockID
		})
		return true 
	})
}

async function unlockAll(h:string,lockID:string,type?:ItemDefine.SerialType,data?:any) {
	lockID = String(lockID)
	let locks:ItemDefine.tLock[] = await Module_UserBagLock.get({lockID:lockID}) || []
	for(let lock of locks) {
		await unlockUser(h,lock.userID,lock.lockID,type,data)
	}
}

async function getUserLock(h:string,userID:number,lockID:string) {
	lockID = String(lockID)
	let lock:ItemDefine.tLock = await Module_UserBagLock.getSingle({
		userID:userID,lockID:lockID
	})
	return lock
}

async function getUserLockItemCount(h:string,userID:number,lockID:string,itemID:string) {
	lockID = String(lockID)
	itemID = String(itemID)
	let lock:ItemDefine.tLock = await Module_UserBagLock.getSingle({
		userID:userID,lockID:lockID
	})
	if(!lock) {
		return "0"
	}
	let item = lock.items.find(v=>v.id == itemID)
	if(!item) {
		return "0"
	}
	return item.count
}

async function getUserLocks(h:string,userID:number) {
	let locks:ItemDefine.tLock[] = await Module_UserBagLock.get({
		userID:userID
	})
	return locks
}
async function getLocks(h:string,lockID:string) {
	lockID = String(lockID)
	let locks:ItemDefine.tLock[] = await Module_UserBagLock.get({
		lockID:lockID
	})
	return locks
}

async function delItem(h:string,itemID:string,userID?:number) {

}
async function check(h:string,userID:number,items:ItemDefine.tItem[]) {
	let bag:ItemDefine.tBag = await Module_UserBag.getMain(userID)
	if(!bag) {
		return false 
	}
	for (const item_ of items) {
		let _id = String(item_.id)
		let bagItem = bag.items.find(v=>v.id == _id)
		let _count = new Decimal(item_.count)

		if(_count.lessThanOrEqualTo(0)) {
			return false 
		}
		if(new Decimal(bagItem.count).lessThan(_count)){
			return false
		}
	}
	return true 
}

export let RpcAccountItem = {
	add:addItem,
	use:useItem,
	useUUID:useItemUUID,
	set:setItem,
	useItems,
	addItems,
	getBag,
	check,

	lockItem,
	matchLockItem,
	useLockItem,
	addLockItem,
	unlockAll,
	unlockUser,
	getUserLock,
	getUserLocks,
	getUserLockItemCount,
	getLocks,

	delItem
}
