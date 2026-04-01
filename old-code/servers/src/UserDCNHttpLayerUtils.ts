import { kdutils } from "kdweb-core/lib/utils";
import { kdreq } from "kdweb-core/lib/service/req";
import { SrsDefine } from "../pp-base-define/SrsDefine";
import { DB } from "./db";
import { kdasync } from "kdweb-core/lib/tools/async";

let redis = DB.getRedis();
export namespace UserDCNHttpLayerUtils {
	let userCaches: {
		userID: number,
		nodeMap: SrsDefine.Redis.tSrsNodeMap,
		timestamp: number,
	}[] = []
	let inited = false
	function lazyInit() {
		if (inited) {
			return
		}
		inited = true
		setInterval(() => {
			UserDCNHttpLayerUtils.clearTimeoutCache()
		}, 10000);
	}
	export function clearTimeoutCache() {
		let now = kdutils.getMillionSecond()
		for (let i = userCaches.length - 1; i >= 0; --i) {
			let cache = userCaches[i]
			if (now - cache.timestamp > 60000) {
				userCaches.splice(i, 1)
			}
		}
	}
	async function getUserCache(userID: number, refresh: boolean = false) {
		if (refresh) {
			let idx = userCaches.findIndex((v) => v.userID == userID)
			if (idx >= 0) {
				userCaches.splice(idx, 1)
			}
		}
		let cache = userCaches.find((v) => v.userID == userID)
		if (cache) {
			return cache
		}
		let userNode = await redis.hget(SrsDefine.Redis.tableUserSrsNode, String(userID))
		if (!userNode) {
			return null
		}
		let layerInfo: SrsDefine.Redis.tSrsNodeMap = await redis.hget(SrsDefine.Redis.tableSrsNodeMap, userNode, true)
		if (!layerInfo) {
			return null
		}
		cache = {
			userID,
			nodeMap: layerInfo,
			timestamp: kdutils.getMillionSecond(),
		}
		userCaches.push(cache)
		return cache

	}
	async function _dcn(userID: number, msgName: string, jsonObj: any) {
		let cache = await getUserCache(userID)
		if (!cache) {
			return
		}
		let url = cache.nodeMap.layerConfig.httpHost + SrsDefine.Http.Layer.pathDCNChange
		let t: SrsDefine.Http.Layer.tDCNChangedReq = {
			filterUserIDs: [userID],
			dkey: msgName,
			data: jsonObj,
		}
		let res = await kdreq.postJson(url, t)
		return
	}

	async function _dcnFilter(userIDs: number[], msgName: string, jsonObj: any) {
		let layerUsers: {
			layerHost: string,
			userIDs: number[],
		}[] = []
		let caches = await Promise.all(userIDs.map(v => getUserCache(v)))
		for (let cache of caches) {
			if (!cache) {
				continue
			}
			let layerUser = layerUsers.find(v => v.layerHost == cache.nodeMap.layerConfig.httpHost)
			if (!layerUser) {
				layerUser = {
					layerHost: cache.nodeMap.layerConfig.httpHost,
					userIDs: [],
				}
				layerUsers.push(layerUser)
			}
			layerUser.userIDs.push(cache.userID)
		}
		for (let layerUser of layerUsers) {
			let url = layerUser.layerHost + SrsDefine.Http.Layer.pathDCNChange
			let t: SrsDefine.Http.Layer.tDCNChangedReq = {
				filterUserIDs: layerUser.userIDs,
				dkey: msgName,
				data: jsonObj,
			}
			await kdreq.postJson(url, t)
		}
	}
	export async function dcn(userID: number, msgName: string, jsonObj: any) {
		lazyInit()
		return await _dcn(userID, msgName, jsonObj)
	}

	export async function dcnFilter(userIDs: number[], msgName: string, jsonObj: any) {
		lazyInit()
		return await _dcnFilter(userIDs, msgName, jsonObj)
	}

	export async function sendToUser(userID: number, msgName: string, jsonObj: any) {
		lazyInit()
		let cache = await getUserCache(userID)
		if (!cache) {
			console.log("[UserDCNHttpLayerUtils] sendToUser FAILED: user cache not found, userID=" + userID + " msgName=" + msgName)
			return false
		}
		let url = cache.nodeMap.layerConfig.httpHost + SrsDefine.Http.Layer.pathSendToUser
		let t: SrsDefine.Http.Layer.tSendToUserReq = {
			userID,
			msg: {
				name: msgName,
				data: jsonObj,
			}
		}
		console.log("[UserDCNHttpLayerUtils] sendToUser url=" + url + " msgName=" + msgName, JSON.stringify(jsonObj))
		let res = await kdreq.postJson(url, t)
		console.log("[UserDCNHttpLayerUtils] sendToUser response:", res.body)
		if (res.body) {
			let t: SrsDefine.Http.Layer.tSendToUserRes = res.body
			if (t.code == "success") {
				return true
			}
			console.log("[UserDCNHttpLayerUtils] sendToUser FAILED: code=" + t.code + " userID=" + userID)
		}
		return false
	}
}