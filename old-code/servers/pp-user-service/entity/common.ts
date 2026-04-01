import { lambdaAsyncService, baseService } from "kdweb-core/lib/service/base";
import { Rpc } from "../rpc";
import { LoginLobbyDefine } from "../../pp-base-define/LoginLobbyDefine";
import { UserErrorCode } from "../../pp-base-define/UserErrorCode";
import { UserAccess } from "../../src/UserAccess";



export function AKVerifyService(func: (userID: number, params?: any) => Promise<any>) {
	return lambdaAsyncService.create(async function (params: { ak: string, params: any }) {
		if (params.ak == null) {

			return baseService.errJson(UserErrorCode.AKVerifyError, "登录参数为空")
		}
		let akInfo: LoginLobbyDefine.AKUserInfo = await UserAccess.verify(params.ak)
		if (akInfo == null) {
			return baseService.errJson(UserErrorCode.AKVerifyError, "登录效验失败")
		}
		return await func(akInfo.userID, params)
	})
}