import {
    LoginAccount,
    tLoginAccountReq,
    tLoginAccountRes,
    Register,
    tRegisterReq,
    tRegisterRes,
    Changepwd,
    tChangepwdReq,
    tChangepwdRes,
    Sendcode,
    tSendcodeReq,
    tSendcodeRes,
    tLoginConsoleReq,
    tLoginConsoleRes,
    LoginConsole
} from 'pp-base-define/AdminLoginReqDefine'
import { Config } from '../Config'
import Http, { ConnectMethod } from './Http'

function loginReq<Req_, Res_>(method: string) {
    return async (params: Req_) => {
        let res: Res_ = <Res_>await Http.instance.connect({
            domain: Config.loginUrl,
            path: method,
            method: ConnectMethod.POST,
            body: params,
            timeout: Config.timeout,
            header: [
                {
                    name: 'Content-Type',
                    value: 'application/json',
                },
            ],
        })
        return res
    }
}
// 登录
export const loginAccount = loginReq<tLoginAccountReq, tLoginAccountRes>(LoginAccount)
// 注册
export const register = loginReq<tRegisterReq, tRegisterRes>(Register)
// 修改密码
export const changepwd = loginReq<tChangepwdReq, tChangepwdRes>(Changepwd)
// 发送验证码
export const sendcode = loginReq<tSendcodeReq, tSendcodeRes>(Sendcode)
// 后台登录
export const loginConsole = loginReq<tLoginConsoleReq, tLoginConsoleRes>(LoginConsole)
