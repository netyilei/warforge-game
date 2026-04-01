

import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { Rpc } from "./rpc"
import { knRpcTools } from "../src/knRpcTools"
import { Config } from "./config"
import { DB } from "../src/db"
import { DBDefine } from "../pp-base-define/DBDefine"
import { serviceEntity } from "kdweb-core/lib/service/entity"
import { AKVerifyFuncs } from "../src/AKVerifyFuncs"
import { ChatAdminService } from "./service/ChatAdminService"
import { ChatService } from "./service/ChatUserService"
import { Module_CustomerChatData, Module_CustomerChatRoom } from "../pp-base-define/DM_CustomerDefine"
import { ChatInternalService } from "./service/ChatInternalService"
import { ChatWSServer } from "./entity/ChatWSServer"

Rpc.init()
.then(async ()=>{
	Rpc.userServer = new ChatWSServer()
	{
		let app = new serviceEntity(Config.kdsConfig.servicePort)
		app.setAllowOrigin()
		app.addInstance("/admin/getrooms",			AKVerifyFuncs.ConsoleVerifyFunctional(ChatAdminService.getRooms))
		// 获取未被接入客服的聊天房间列表
		app.addInstance("/admin/getnofromrooms",	AKVerifyFuncs.ConsoleVerifyFunctional(ChatAdminService.getNoFromRooms))
		// 当fromUserID为空时，表示用户未被接入客服, 需要客服去接入
		app.addInstance("/admin/startroom",			AKVerifyFuncs.ConsoleVerifyFunctional(ChatAdminService.startRoom))

		app.addInstance("/admin/changecustomer",	AKVerifyFuncs.ConsoleVerifyFunctional(ChatAdminService.changeCustomer))
		app.addInstance("/admin/getchats",			AKVerifyFuncs.ConsoleVerifyFunctional(ChatAdminService.getChats))
		// 获取可转接的客服列表
		app.addInstance("/admin/getchangeenabledcustomers",		AKVerifyFuncs.ConsoleVerifyFunctional(ChatAdminService.getChangeEnabledCustomers))
		// 检测某个用户是否是客服
		app.addInstance("/admin/iscustomerid",		AKVerifyFuncs.ConsoleVerifyFunctional(ChatAdminService.isCustomerID))

		app.addInstance("/user/startchat",			AKVerifyFuncs.AppVerifyFunctional(ChatService.startChat))
		app.addInstance("/user/getrooms",			AKVerifyFuncs.AppVerifyFunctional(ChatService.getRooms))
		app.addInstance("/user/getroom",			AKVerifyFuncs.AppVerifyFunctional(ChatService.getRoom))
		app.addInstance("/user/getchats",			AKVerifyFuncs.AppVerifyFunctional(ChatService.getChats))

		app.listen()
	}
	{
		let app = new serviceEntity(Config.otherConfig.internalPort)
		app.setAllowOrigin()
		app.addInstance("/sendtouser",			AKVerifyFuncs.ConsoleVerifyFunctional(ChatInternalService.sendToUser))

		app.listen()
	}

	if(Config.localConfig.mainIndex) {
		await Module_CustomerChatData.checkAndCreateIndexes()
		await Module_CustomerChatRoom.checkAndCreateIndexes()
	}

})