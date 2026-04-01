
import { kdlog } from "kdweb-core/lib/log"
kdlog.init(process.argv[3])
import wcore = require("kdweb-core")
import { Config } from "./config"
import { Rpc } from "./rpc"
import { lambdaAsyncService } from "kdweb-core/lib/service/base"
// import { FastLoginServices } from "./service/fastLogin"
import { kdreq } from "kdweb-core/lib/service/req"
import { ServerValues } from "../pp-base-define/ServerConfig"
import { Log } from "./log"
import { knRpcTools } from "../src/knRpcTools"
import { RegisterService } from "./service/register"
import { LoginService } from "./service/login"
import { Module_UserLoginChannel, Module_UserLoginData, Module_UserLoginRole, Module_UserRelation } from "../pp-base-define/DM_UserDefine"
import { IDUtils } from "../src/IDUtils"
import { UserDefine } from "../pp-base-define/UserDefine"
import { kdutils } from "kdweb-core/lib/utils"
import { TimeDate } from "../src/TimeDate"
import { LoginUploadService } from "./service/upload"
import { UserUtils } from "../src/UserUtils"

Rpc.init()

knRpcTools.getKDSConfig(Config.myName)
.then(function(config) {
	if(!config) {
		Log.oth.error("init config failed name = " + Config.myName)
		return 
	}
	Log.oth.info("start:::::");
	let app = new wcore.service.entity(config.servicePort)
	app.setAllowOrigin()
	app.addInstance("/login/account",lambdaAsyncService.create(LoginService.loginApp))
	app.addInstance("/register",new RegisterService.RegisterAuditEntity())
	LoginUploadService.initUpload(app.app)
	
	app.addInstance("/changepwd",new RegisterService.ChangePasswwordEntity())
	app.addInstance("/changetradepwd",new RegisterService.ChangeTradePasswwordEntity())
	app.addInstance("/sendcode",new RegisterService.SendCodeEntity())
	app.addInstance("/verifycode",new RegisterService.VerifyCodeToTokenEntity())

	// 登录客服后台
	app.addInstance("/login/console",lambdaAsyncService.create(LoginService.loginConsole))
	// 登录代理后台
	app.addInstance("/login/leaderproxy",lambdaAsyncService.create(LoginService.loginLeaderProxy))
	app.listen()
})


async function checkAdminDefaultAccount() {
	if(Config.localConfig.defaultAdmins) {
		for(let adminInfo of Config.localConfig.defaultAdmins) {
			let channel = await Module_UserLoginChannel.getSingle({account:adminInfo.account})
			if(!channel) {
				let userID = await IDUtils.getUserID()
				let loginData:UserDefine.tLoginData = {
					userID:userID,
					strUserID:String(userID),

					apiID:String(userID),
					countryCode:null,	// 国家代码

					deviceTag:"Server",		// 
					channelTag:"Server",

					regTimestamp:kdutils.getMillionSecond(),
					regDate:TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss"),
				}
				channel = {
					userID,
					type:UserDefine.LoginChannel.Account,
					account:adminInfo.account,
					pwdMD5:adminInfo.pwdMD5,
					openID:null,
					accessToken:null,
				}
				let loginRole:UserDefine.tLoginRole = {
					userID,
					targets:[
						{
							target:UserDefine.LoginTarget.Console,
							roles:[UserDefine.RoleType.Admin],
						}
					]
				}
				let relation:UserDefine.PromoteRelation = {
					userID,
					level:0,
					performance:"0",
					leaders:[],
					subs:[],
				}
				await Promise.all([
					Module_UserLoginData.updateOrInsert(loginData),
					Module_UserLoginChannel.updateOrInsert(channel),
					Module_UserLoginRole.updateOrInsert(loginRole),
					Module_UserRelation.updateOrInsert(relation),
				])
				UserUtils.rebuildSearch(loginData.userID)
			}
		}
	}
}

checkAdminDefaultAccount()