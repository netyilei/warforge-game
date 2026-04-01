import { LoginHeler } from "../helper/loginHelper";

async function getNewUserID(h:string) {
	return await LoginHeler.getNewUserID()
}


export let RpcTools = {
	getNewUserID:getNewUserID
}