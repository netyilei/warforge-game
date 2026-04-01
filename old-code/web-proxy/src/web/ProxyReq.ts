import Http, { ConnectMethod } from './Http'
import { Config } from '../Config'
import { ProxyReqDefine } from 'pp-base-define/ProxyReqDefine'

function proxyReq<Req_, Res_>(method: string) {
    return async (params: Req_) => {
        params['ak'] = sessionStorage.getItem('ak')
        let res: Res_ = <Res_>await Http.instance.connect({
            domain: Config.adminUrl,
            path: method,
            method: ConnectMethod.POST,
            body: params,
            timeout: 1000 * 30,
            header: [
                {
                    name: 'Content-Type',
                    value: 'application/json',
                },
            ],
        })
        if (res['errCode'] == 99) {
            sessionStorage.removeItem('account')
            sessionStorage.removeItem('ak')
            location.href = '/#/account/login'
            return res
        }

        return res
    }
}

// ==================== 用户相关API ====================

// 获取用户展示信息（登录后展示用：邀请码 leaderTag、推广关系 relation）
export const userGetdisplay = proxyReq<ProxyReqDefine.tUserGetdisplayReq, ProxyReqDefine.tUserGetdisplayRes>(ProxyReqDefine.UserGetdisplay)

// 获取用户列表（代理只能查看自己的下级）
export const userGetusers = proxyReq<ProxyReqDefine.tUserGetusersReq, ProxyReqDefine.tUserGetusersRes>(ProxyReqDefine.UserGetusers)

// 根据道具数量获取用户列表（代理只能查看自己的下级）
export const userGetuserswithvalue = proxyReq<ProxyReqDefine.tUserGetuserswithvalueReq, ProxyReqDefine.tUserGetuserswithvalueRes>(ProxyReqDefine.UserGetuserswithvalue)

// 获取用户流水记录（代理只能查看自己的下级流水）
export const userGetserials = proxyReq<ProxyReqDefine.tUserGetserialsReq, ProxyReqDefine.tUserGetserialsRes>(ProxyReqDefine.UserGetserials)
