import { knRpcManager } from "kdweb-core/lib/rpc-kn/knRpcManager";
import { knRpcManagerInterface } from "kdweb-core/lib/rpc-kn/knRpcManagerInterface";
import { kdasync } from "kdweb-core/lib/tools/async";
import { knRpcTools } from "../src/knRpcTools";
import { Config } from "./config";
import { RpcClubHook } from "./rpc/club_hook";
import { ClubRoomLooper } from "./looper/ClubRoomLooper";
import { RpcClubAccount } from "./rpc/club_account";
import { RpcClubData } from "./rpc/club_data";
import { RpcClubMember } from "./rpc/club_member";
import { kds } from "../pp-base-define/GlobalMethods";
import { ClubAuthBase } from "./Utils/ClubAuth";
import { RpcClubRealtime } from "./rpc/club_realtime";
import { RpcClubReward } from "./rpc/club_reward";
import { RpcClubRoomBill } from "./rpc/club_bill";

export namespace Rpc {
	export let center:knRpcManagerInterface.rpc
	export let looper:ClubRoomLooper
	export let authClass:{new(clubID:number):ClubAuthBase}

	export async function init(callback?:Function) {
		knRpcTools.setupEnv()
		center = await knRpcTools.initRpc()
		looper = new ClubRoomLooper()
		initMethods()
		if(callback) {
			callback()
		}
	}

	export async function initSub(callback?:Function) {
		knRpcTools.setupEnv()
		center = await knRpcTools.initSubProcess()
		initMethods()
		if(callback) {
			callback()
		}
	}

	async function initMethods() {
		center.methodGroup.addGroup("kds.club.data",RpcClubData)
		center.methodGroup.addGroup("kds.club.member",RpcClubMember)
		center.methodGroup.addGroup("kds.club.account",RpcClubAccount)
		center.methodGroup.addGroup("kds.club.hook",RpcClubHook)
		center.methodGroup.addGroup("kds.club.realtime",RpcClubRealtime)
		center.methodGroup.addGroup("kds.club.reward",RpcClubReward)
		center.methodGroup.addGroup("kds.club.bill",RpcClubRoomBill)
	}
}