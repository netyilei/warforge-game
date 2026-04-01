import { ProxyReqDefine } from 'pp-base-define/ProxyReqDefine'
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
// 代理后台登录
export const loginLeaderproxy = loginReq<ProxyReqDefine.tLoginLeaderproxyReq, ProxyReqDefine.tLoginLeaderproxyRes>(ProxyReqDefine.LoginLeaderproxy)
