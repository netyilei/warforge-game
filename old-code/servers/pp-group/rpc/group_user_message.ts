import { SrsMessageLink } from "../../src/SrsMessageLink";
import { Rpc } from "../rpc";


async function onUserMessage(h:string,data:SrsMessageLink.tLinkCallData) {
	Rpc.master.onUserMessage(data.userID,data.msgName,data.data,data.fromNodeName)
}

export let RpcGroupUserMessage = {
	onUserMessage,
}