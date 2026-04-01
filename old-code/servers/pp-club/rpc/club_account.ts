import { kdutils } from "kdweb-core/lib/utils";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { SerialHelper } from "../../src/SerialHelper";
import { DB } from "../../src/db";
import { Rpc } from "../rpc";
import { ClubDefine } from "../../pp-base-define/ClubDefine";
import { ClubDCN } from "../Utils/ClubDCN";
import Decimal from "decimal.js";
import { ClubAccount } from "../Utils/ClubAccount";


async function addValue(h:string, clubID:number, userID:number, valueIndex:number, count:Decimal, type?:ItemDefine.SerialType) {
	return await ClubAccount.addValue(clubID, userID, valueIndex, count, type);
}

async function useValue(h:string, clubID:number, userID:number, valueIndex:number, count:Decimal, ignoreNeg?:boolean, type?:ItemDefine.SerialType) {
	return await ClubAccount.useValue(clubID, userID, valueIndex, count, ignoreNeg, type);
}

async function setValue(h:string, clubID:number, userID:number, valueIndex:number, count:Decimal, type?:ItemDefine.SerialType) {
	return await ClubAccount.setValue(clubID, userID, valueIndex, count, type);
}

async function getAccount(h:string, clubID:number, userID:number) {
	return await ClubAccount.getAccount(clubID, userID);
}

async function lockValue(h:string, clubID:number, userID:number, lockID:string, valueIndex:number, count:Decimal, type?:ItemDefine.SerialType) {
	return await ClubAccount.lockValue(clubID, userID, lockID, valueIndex, count, type);
}

async function addLockValue(h:string, clubID:number, userID:number, lockID:string, valueIndex:number, count:Decimal, type?:ItemDefine.SerialType) {
	return await ClubAccount.addLockValue(clubID, userID, lockID, valueIndex, count, type);
}

async function useLockValue(h:string, clubID:number, userID:number, lockID:string, valueIndex:number, count:Decimal, ignoreNeg?:boolean, type?:ItemDefine.SerialType) {
	return await ClubAccount.useLockValue(clubID, userID, lockID, valueIndex, count, ignoreNeg, type);
}

async function unlockUser(h:string, clubID:number, userID:number, lockID:string, type?:ItemDefine.SerialType) {
	return await ClubAccount.unlockUser(clubID, userID, lockID, type);
}

async function unlockAll(h:string, clubID:number, lockID:string) {
	return await ClubAccount.unlockAll(clubID, lockID);
}

async function getUserLock(h:string, clubID:number, userID:number, lockID:string) {
	return await ClubAccount.getUserLock(clubID, userID, lockID);
}

async function getUserLocks(h:string, clubID:number, userID:number) {
	return await ClubAccount.getUserLocks(clubID, userID);
}

async function getLocks(h:string, clubID:number, lockID:string) {
	return await ClubAccount.getLocks(undefined, clubID, lockID);
}

export let RpcClubAccount = {
	add:addValue,
	use:useValue,
	set:setValue,
	getAccount,

	lockValue,
	useLockValue,
	addLockValue,
	unlockAll,
	unlockUser,
	getUserLock,
	getUserLocks,
	getLocks,
}
