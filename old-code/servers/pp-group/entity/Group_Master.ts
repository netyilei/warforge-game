import { knProcess } from "kdweb-core/lib/rpc-kn/knProcess";
import { Rpc } from "../rpc";
import { knIpcMsg, knRpcDefine } from "kdweb-core/lib/rpc-kn/knRpcDefine";
import { Log } from "../log";
import { GroupDefine } from "../../pp-base-define/GroupDefine";
import { DB } from "../../src/db";
import { DBDefine } from "../../pp-base-define/DBDefine";
import { GroupInternalDefine } from "./GroupInternalDefine";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { kds } from "../../pp-base-define/GlobalMethods";
import { SrsUserMsg } from "../../pp-base-define/SrsUserMsg";
import { RoomDefine } from "../../pp-base-define/RoomDefine";
import { kdasync } from "kdweb-core/lib/tools/async";
import { SrsMessageLink } from "../../src/SrsMessageLink";
import { Module_RoomRealtime } from "../../pp-base-define/DM_RoomDefine";

let db = DB.get()
export class Group_Master {
	constructor() {
		this.master_ = new knProcess.master({
			count: -1,
			serviceInfo: Rpc.serviceInfo,
			keep: true,
			childClazz: knProcess.child,
			filename: "sub",
			funcGetArgs: (idx) => {
				let info = this.childs_.find(v => v.idx == idx)
				return [info.groupID]
			},
			funcGetName: (idx) => {
				return Rpc.serviceInfo.name + "-ipc-" + idx
			},
			funcCallMethod: async (req) => {
				Log.oth.info("funcCallMethod ", req)
				return null
			},
			funcSendCallMethod: async (serverName, req) => {
				Log.oth.info("funcSendCallMethod name = " + serverName, req)
				let serviceInfo = Rpc.center.getClientInfoByName(serverName)
				if (!serviceInfo) {
					Log.oth.error("send call failed serviceInfo not found name = " + serverName, req, req.sdata)
					this.master_.onProcessCallRes(<any>{ name: serverName }, {
						success: false,
						callID: req.callID,
						result: null,
						sdata: req.sdata,
					})
				}
				let p = Rpc.center.callServer(serverName, req.name, ...req.args)
				if (req.wait) {
					let ret = await p
					this.master_.onProcessCallRes(serviceInfo, {
						success: ret.type == knRpcDefine.ClientCallReturnType.Success,
						callID: req.callID,
						result: ret.data,
						sdata: req.sdata,
					})
				} else {
					this.master_.onProcessCallRes(serviceInfo, {
						success: true,
						callID: req.callID,
						result: null,
						sdata: req.sdata,
					})
				}
			},
		})

		SrsMessageLink.regLink(SrsUserMsg.EnterGroup, kds.group.nodelink.onUserMessage)

		setInterval(() => {
			this.onUpdate()
		}, 10000)
	}
	private master_: knProcess.master
	get knMaster() {
		return this.master_
	}
	private childs_: {
		idx: number,
		groupID: number,
		child: knProcess.child,
	}[] = []


	private isWorking_ = false
	async onUpdate() {
		if (this.isWorking_) {
			return
		}
		this.isWorking_ = true
		try {
			await this.checkGroups()
		} catch (error) {
			Log.oth.error("", error)
		}
		this.isWorking_ = false
	}

	async checkGroups() {
		let groups: GroupDefine.tData[] = await db.get(DBDefine.tableGroupData, {}) || []
		for (let group of groups) {
			let info = this.childs_.find(v => v.groupID == group.groupID)
			if (!info) {
				let idx = this.master_.nextIndex
				let t = {
					idx,
					groupID: group.groupID,
					child: null,
				}
				this.childs_.push(t)
				this.master_.startChild()
				let childInfo = this.master_.childs.find(v => v.idx == idx)
				t.child = childInfo.child
				Log.oth.info("create group sub worker idx = " + idx + " groupID = " + group.groupID)

				let prev = childInfo.child.funcMessage
				childInfo.child.funcMessage = (child, obj: knIpcMsg.Base) => {
					if (prev) {
						prev(child, obj)
					}
					switch (obj.cmd) {
						case knIpcMsg.CMD.RpcProcess: {
							let msg: knIpcMsg.tCMDRpc = obj.data
							switch (msg.msgName) {
								case GroupInternalDefine.toMaster.InitFailed: {
									Log.oth.info("group init failed groupID = " + group.groupID + " shutdown worker")
									this.master_.closeChild(idx)
								} break
								case GroupInternalDefine.toMaster.EnterFailed: {
									let t: GroupInternalDefine.toMaster.tEnterFailed = msg.obj
									this.sendToUser(t.userID, SrsUserMsg.EnterGroup, <SrsUserMsg.tEnterGroupRes>{
										b: false,
										groupID: group.groupID,
									})
								} break
								case GroupInternalDefine.toMaster.EnterSuccess: {
									let t: GroupInternalDefine.toMaster.tEnterSuccess = msg.obj
									this.sendToUser(t.userID, SrsUserMsg.EnterGroup, <SrsUserMsg.tEnterGroupRes>{
										b: true,
										groupID: group.groupID,
										roomID: t.roomID,
										gameData: t.gameData,
									})
								} break
								case GroupInternalDefine.toMaster.SendToUser: {
									let t: GroupInternalDefine.toMaster.tSendToUser = msg.obj
									this.sendToUser(t.userID, t.msgName, t.data)
								} break
							}
						} break
					}
				}
				//同步rpc method
				for (let client of Rpc.center.clients) {
					this.master_.sendMethodChangedToChild(childInfo.idx, client.serviceInfo, client.client.methods, client.client.wildcards)
				}
			}
		}
	}

	async restartGroup(groupID: number) {
		let groupData: GroupDefine.tData = await db.getSingle(DBDefine.tableGroupData, { groupID })
		if (!groupData) {
			return false
		}
		let info = this.childs_.find(v => v.groupID == groupID)
		if (!info) {
			return false
		}
		this.sendToWorker(info.groupID, GroupInternalDefine.toWorker.Restart, <GroupInternalDefine.toWorker.tRestart>{
			groupData
		})
		return true
	}

	sendToWorker(groupID: number, msgName: string, data: any) {
		let info = this.childs_.find(v => v.groupID == groupID)
		if (!info) {
			return false
		}
		Log.oth.info("send to worker " + groupID + " msg = " + msgName, data)
		return info.child.send({
			cmd: knIpcMsg.CMD.RpcProcess,
			data: <knIpcMsg.tCMDRpc>{
				msgName,
				obj: data,
			}
		})
	}

	sendToUser(userID: number, msgName: string, data: any) {
		Log.oth.info("send to user " + userID + " msg = " + msgName, data)
		Rpc.center.call(kds.srs.disp.sendToUser, userID, msgName, data)
	}


	private qRoom_ = new kdasync.queue
	async addRoomChanged(groupID: number, roomID: number) {
		this.qRoom_.call(async () => {
			let realtime: RoomDefine.RoomRealtime = await Module_RoomRealtime.getMain(roomID)
			if (!realtime) {
				return
			}
			this.sendToWorker(realtime.groupID, GroupInternalDefine.toWorker.RoomChanged, <GroupInternalDefine.toWorker.tRoomChanged>{
				roomID,
				realtime,
			})
		})
	}
	async addRoomRemoved(groupID: number, roomID: number) {
		this.qRoom_.call(async () => {
			this.sendToWorker(groupID, GroupInternalDefine.toWorker.RoomChanged, <GroupInternalDefine.toWorker.tRoomChanged>{
				roomID,
			})
		})
	}

	async onUserMessage(userID: number, msgName: string, data: any, fromNodeName: string) {
		Log.oth.info("onUserMessage userID = " + userID + " msgName = " + msgName + " node = " + fromNodeName, data)
		switch (msgName) {
			case SrsUserMsg.EnterGroup: {
				let t: SrsUserMsg.tEnterGroupReq = data
				let info = this.childs_.find(v => v.groupID == t.groupID)
				if (!info) {
					this.sendToUser(userID, SrsUserMsg.EnterGroup, <SrsUserMsg.tEnterGroupRes>{
						b: false,
						groupID: t.groupID,
					})
					return
				}
				this.sendToWorker(t.groupID, GroupInternalDefine.toWorker.Enter, <GroupInternalDefine.toWorker.tEnter>{
					userID, groupID: t.groupID,
					ignoreRoomIDs: t.ignoreRoomIDs,
				})
			} break
		}
	}
}