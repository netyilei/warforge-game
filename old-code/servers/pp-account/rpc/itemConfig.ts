import { DBDefine } from "../../pp-base-define/DBDefine";
import { ItemDefine } from "../../pp-base-define/ItemDefine";
import { DB } from "../../src/db";


export let itemConfigs:ItemDefine.tConfig[] = []

let db = DB.get()
async function refresh() {
	itemConfigs = await db.get(DBDefine.tableConfigItems,{})
}

async function get(h:string,itemID:string) {
	return itemConfigs.find(v=>v.id == itemID)
}

async function gets(h:string,itemIDs:string[]) {
	return itemConfigs.filter(v=>itemIDs.includes(v.id))
}

async function getAll(h:string) {
	return itemConfigs
}

export let RpcItemConfig = {
	refresh,

	get,
	gets,
	getAll,
}