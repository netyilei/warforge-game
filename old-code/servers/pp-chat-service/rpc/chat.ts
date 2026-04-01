import { CustomerDefine } from "../../pp-base-define/CustomerDefine";
import { Config } from "../config";

async function getHost(h:string) {
	return <CustomerDefine.tRpcGetChatHostRes>{
		wsHost:Config.otherConfig.userWSHost,
		httpHost:Config.otherConfig.userServiceHost,
	}
}

export let RpcCustomerChat = {
	getHost,
}
