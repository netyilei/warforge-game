import { kdutils } from "kdweb-core/lib/utils";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { SerialHelper } from "../../src/SerialHelper";
import { DB } from "../../src/db";
import { Rpc } from "../rpc";
import { ClubDefine } from "../../pp-base-define/ClubDefine";
import { ClubDCN } from "./ClubDCN";
import Decimal from "decimal.js";
import { RedisLock } from "../../src/RedisLock";


let tableBag = DBDefine.tableClubUserAccount
let tableLock = "t_club_item_lock"
let db = DB.get()
export namespace ClubAccount {

    export async function callInMutex<T>(name, func: (...params) => Promise<T>) {
        return await RedisLock.callInLock(name, 30, async () => {
            return await func()
        })
    }

    export async function callInItemMutex<T>(userID: number, func: (...params) => Promise<T>) {
        return await callInMutex<T>("ITEM|" + userID, func)
    }

    export async function callInLockMutex<T>(userID: number, func: (...params) => Promise<T>) {
        return await callInMutex<T>("LOCKITEM|" + userID, func)
    }

    export async function addValue(clubID: number, userID: number, valueIndex: number, count: Decimal, type?: ItemDefine.SerialType) {
        count = new Decimal(count)
        if (count.lessThanOrEqualTo(0)) {
            return false
        }
        return await callInItemMutex(userID, async () => {
            let bag: ClubDefine.tUserAccount = await db.getSingle(tableBag, { userID: userID, clubID: clubID })
            if (!bag) {
                bag = {
                    userID,
                    clubID,
                    values: [],
                }
            }
            bag.values[valueIndex] = bag.values[valueIndex] || "0"
            bag.values[valueIndex] = Decimal.add(bag.values[valueIndex], count).toString()
            await db.updateOrInsert(tableBag, bag, { userID: userID, clubID: clubID })
            SerialHelper.addClub({
                userID,
                clubID,
                valueIndex,
                changed: count.toString(),
                last: bag.values[valueIndex],

                type: type
            })
            let member: ClubDefine.tUserMember = await db.getSingle(DBDefine.tableClubMember, { clubID, userID })
            if (member) {
                ClubDCN.sendAccountTo(clubID,
                    member.leaderUserID ? [userID, member.leaderUserID] : [userID],
                    { account: bag })
            }
            return true
        })
    }

    export async function useValue(clubID: number, userID: number, valueIndex: number, count: Decimal, ignoreNeg?: boolean, type?: ItemDefine.SerialType) {
        count = new Decimal(count)
        if (count.lessThanOrEqualTo(0)) {
            return false
        }
        return await callInItemMutex(userID, async () => {
            let bag: ClubDefine.tUserAccount = await db.getSingle(tableBag, { userID: userID, clubID: clubID })
            if (!bag) {
                return false
            }
            bag.values[valueIndex] = bag.values[valueIndex] || "0"
            let valueCount = new Decimal(bag.values[valueIndex])
            if (valueCount.lessThan(count)) {
                if (!ignoreNeg) {
                    return false
                }
            }
            bag.values[valueIndex] = valueCount.sub(count).toString()
            await db.updateOrInsert(tableBag, bag, { userID: userID, clubID: clubID })
            SerialHelper.addClub({
                userID,
                clubID,
                valueIndex,
                changed: count.neg().toString(),
                last: bag.values[valueIndex],

                type: type
            })
            let member: ClubDefine.tUserMember = await db.getSingle(DBDefine.tableClubMember, { clubID, userID })
            if (member) {
                ClubDCN.sendAccountTo(clubID,
                    member.leaderUserID ? [userID, member.leaderUserID] : [userID],
                    { account: bag })
            }
            return true
        })
    }

    export async function setValue(clubID: number, userID: number, valueIndex: number, count: Decimal, type?: ItemDefine.SerialType) {
        count = new Decimal(count)
        if (count.lessThan(0)) {
            return false
        }
        return await callInItemMutex(userID, async () => {
            let bag: ClubDefine.tUserAccount = await db.getSingle(tableBag, { userID: userID, clubID: clubID })
            if (!bag) {
                bag = {
                    userID,
                    clubID,
                    values: []
                }
            }
            bag.values[valueIndex] = count.toString()
            await db.updateOrInsert(tableBag, bag, { userID: userID, clubID: clubID })
            SerialHelper.addClub({
                userID,
                clubID,
                valueIndex,
                setup: true,
                changed: count.toString(),
                last: bag.values[valueIndex],

                type,
            })
            let member: ClubDefine.tUserMember = await db.getSingle(DBDefine.tableClubMember, { clubID, userID })
            if (member) {
                ClubDCN.sendAccountTo(clubID,
                    member.leaderUserID ? [userID, member.leaderUserID] : [userID],
                    { account: bag })
            }
            return true
        })
    }

    export async function getAccount(clubID: number, userID: number) {
        let bag: ClubDefine.tUserAccount = await db.getSingle(tableBag, { userID: userID, clubID: clubID })
        if (!bag) {
            bag = {
                userID,
                clubID,
                values: []
            }
        }
        return bag
    }

    export async function lockValue(clubID: number, userID: number, lockID: string, valueIndex: number, count: Decimal, type?: ItemDefine.SerialType) {
        count = new Decimal(count)
        if (count.lessThan(0)) {
            return false
        }
        lockID = String(lockID)
        return await callInLockMutex(userID, async () => {
            let lock: ItemDefine.tLock = await db.getSingle(tableLock, {
                userID: userID, lockID: lockID, clubID: clubID,
            })
            let b = count.greaterThan(0) ? await useValue(clubID, userID, valueIndex, count) : true
            if (!b) {
                return false
            }
            let time = kdutils.getMillionSecond()
            if (lock) {
                let item = lock.items.find(v => v.id == valueIndex)
                if (!item) {
                    lock.items.push({
                        id: valueIndex, count: count.toString(),
                    })
                } else {
                    item.count = Decimal.add(item.count, count).toString()
                }
                lock.records.push({
                    id: valueIndex,
                    count: count.toString(),
                    timestamp: time,
                    date: kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss", time)
                })
                SerialHelper.addClub({
                    clubID,
                    userID,
                    isLock: true,
                    lockID,
                    valueIndex,
                    changed: count.toString(),
                    last: item.count,
                    type: type || ItemDefine.SerialType.Lock,
                })
            } else {
                lock = {
                    userID, lockID, clubID,
                    items: [{
                        id: valueIndex,
                        count: count.toString(),
                    }],
                    records: [{
                        id: valueIndex,
                        count: count.toString(),
                        timestamp: time,
                        date: kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss", time)
                    }],
                    timestamp: time,
                    date: kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss", time)
                }

                SerialHelper.addClub({
                    clubID,
                    userID,
                    isLock: true,
                    lockID,
                    valueIndex,
                    changed: count.toString(),
                    last: count.toString(),
                    type: type || ItemDefine.SerialType.Lock,
                })
            }
            await db.updateOrInsert(tableLock, lock, { userID: userID, lockID: lockID, clubID: clubID })
            return true
        })
    }

    export async function addLockValue(clubID: number, userID: number, lockID: string, valueIndex: number, count: Decimal, type?: ItemDefine.SerialType) {
        lockID = String(lockID)
        count = new Decimal(count)
        if (count.lessThan(0)) {
            return false
        }
        return await callInLockMutex(userID, async () => {
            let lock: ItemDefine.tLock = await db.getSingle(tableLock, {
                userID: userID, lockID: lockID, clubID: clubID,
            })
            if (!lock) {
                return false
            }
            let item = lock.items.find(v => v.id == valueIndex)
            if (!item) {
                item = {
                    id: valueIndex,
                    count: "0",
                }
                lock.items.push(item)
            }
            item.count = Decimal.add(item.count, count).toString()
            let time = kdutils.getMillionSecond()
            lock.records.push({
                id: valueIndex,
                count: count.toString(),
                timestamp: time,
                date: kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss", time)
            })

            SerialHelper.addClub({
                clubID,
                userID,
                isLock: true,
                lockID,
                valueIndex,
                changed: count.toString(),
                last: item.count,
                type,
            })
            await db.updateOrInsert(tableLock, lock, {
                userID: userID,
                lockID: lockID,
                clubID: clubID,
            })
            return true
        })
    }

    export async function useLockValue(clubID: number, userID: number, lockID: string, valueIndex: number, count: Decimal, ignoreNeg?: boolean, type?: ItemDefine.SerialType) {
        lockID = String(lockID)
        count = new Decimal(count)
        if (count.lessThan(0)) {
            return false
        }
        return await callInLockMutex(userID, async () => {
            let lock: ItemDefine.tLock = await db.getSingle(tableLock, {
                userID: userID, lockID: lockID, clubID: clubID,
            })
            if (!lock) {
                return false
            }
            let item = lock.items.find(v => v.id == valueIndex)
            if (!item) {
                return false
            }
            let itemCount = new Decimal(item.count)
            if (itemCount.lessThan(count)) {
                if (!ignoreNeg) {
                    return false
                }
            }
            item.count = itemCount.sub(count).toString()
            await db.updateOrInsert(tableLock, lock, { userID: userID })
            let time = kdutils.getMillionSecond()
            lock.records.push({
                id: valueIndex,
                count: count.neg().toString(),
                timestamp: time,
                date: kdutils.getFmtMoment("YYYY-MM-DD HH:mm:ss", time)
            })
            SerialHelper.addClub({
                clubID,
                userID,
                isLock: true,
                lockID,
                valueIndex,
                changed: count.neg().toString(),
                last: item.count,
                type,
            })
            await db.updateOrInsert(tableLock, lock, {
                userID: userID,
                lockID: lockID,
                clubID: clubID,
            })
            return true
        })
    }

    export async function unlockUser(clubID: number, userID: number, lockID: string, type?: ItemDefine.SerialType) {
        lockID = String(lockID)
        return await callInLockMutex(userID, async () => {
            let lock: ItemDefine.tLock = await db.getSingle(tableLock, {
                userID: userID, lockID: lockID, clubID: clubID,
            })
            if (!lock) {
                return false
            }
            for (let item of lock.items) {
                let count = new Decimal(item.count)
                if (count.greaterThan(0)) {
                    await addValue(clubID, userID, item.id, count, type || ItemDefine.SerialType.Unlock)
                } else if (count.lessThan(0)) {
                    await useValue(clubID, userID, item.id, count.abs(), true, type || ItemDefine.SerialType.Unlock)
                }
            }
            await db.del(tableLock, {
                userID: userID, lockID: lockID, clubID: clubID,
            })
            return true
        })
    }

    export async function unlockAll(clubID: number, lockID: string) {
        lockID = String(lockID)
        let locks: ItemDefine.tLock[] = await db.get(tableLock, { clubID: clubID, lockID: lockID }) || []
        for (let lock of locks) {
            await unlockUser(clubID, lock.userID, lock.lockID)
        }
    }

    export async function getUserLock(clubID: number, userID: number, lockID: string) {
        lockID = String(lockID)
        let lock: ItemDefine.tLock = await db.getSingle(tableLock, {
            userID: userID, lockID: lockID, clubID: clubID,
        })
        return lock
    }

    export async function getUserLocks(clubID: number, userID: number) {
        let locks: ItemDefine.tLock[] = await db.get(tableLock, {
            userID: userID, clubID: clubID,
        })
        return locks
    }
    export async function getLocks(h: string, clubID: number, lockID: string) {
        lockID = String(lockID)
        let locks: ItemDefine.tLock[] = await db.get(tableLock, {
            lockID: lockID, clubID: clubID,
        })
        return locks
    }
}
