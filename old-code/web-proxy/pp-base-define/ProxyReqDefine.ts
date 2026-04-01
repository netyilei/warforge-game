import { UserDefine } from "./UserDefine"
import { ItemDefine } from "./ItemDefine"
import { LeaderDefine } from "./LeaderDefine"

export namespace ProxyReqDefine {
    export type ResBase = {
        errCode?: number,
        errMsg?: string,
    }

    // 代理登录
    // 代理后台登录接口
    export const LoginLeaderproxy = "/login/leaderproxy"
    export type tLoginLeaderproxyReq = {
        channel: UserDefine.LoginChannel,
        account?: string,
        pwdMD5?: string,
    }
    export type tLoginLeaderproxyRes = ResBase & {
        ak: string,
        loginData: UserDefine.tLoginData,
        roleTarget: {
            target: UserDefine.LoginTarget,
            roles: UserDefine.RoleType[],
        },
        loginChannel: UserDefine.tLoginChannel,
        customerHost?: string,
        customerWSHost?: string,
    }

    // 用户管理
    // 获取用户展示信息（登录后展示用：邀请码 leaderTag、推广关系 relation）
    export const UserGetdisplay = "/user/getdisplay"
    export type tUserGetdisplayReq = {
    }
    export type tUserGetdisplayRes = ResBase & {
        leaderTag: string,
        relation?: UserDefine.PromoteRelation,
    }

    // 获取用户列表（代理只能查看自己的下级）
    export const UserGetusers = "/user/getusers"
    export type tUserGetusersReq = {
        page: number,
        limit: number,
    }
    export type tUserGetusersRes = ResBase & {
        users: {
            userID: number,
            loginData: UserDefine.tLoginData,
            loginChannels: UserDefine.tLoginChannel[],
            loginRole?: UserDefine.tLoginRole,
            bag?: ItemDefine.tBag,
            balance?: LeaderDefine.tBalance,
        }[],
        count: number,
    }

    // 根据道具数量获取用户列表（代理只能查看自己的下级）
    export const UserGetuserswithvalue = "/user/getuserswithvalue"
    export type tUserGetuserswithvalueReq = {
        itemID: string,
        minValue?: string | number,
        sort: "asc" | "desc",
        page: number,
        limit: number,
    }
    export type tUserGetuserswithvalueRes = ResBase & {
        users: {
            userID: number,
            loginData: UserDefine.tLoginData,
            loginChannels: UserDefine.tLoginChannel[],
            loginRole?: UserDefine.tLoginRole,
            bag?: ItemDefine.tBag,
            bagData?: {
                userID: number,
                itemID: string,
                count: string,
                countNum: number,
            },
            balance?: LeaderDefine.tBalance,
        }[],
        count: number,
    }

    // 获取用户流水记录（代理只能查看自己的下级流水）
    export const UserGetserials = "/user/getserials"
    export type tUserGetserialsReq = {
        userIDs?: number[],
        serialType?: ItemDefine.SerialType,
        setup?: boolean,
        itemID?: string,
        page: number,
        limit: number,
    }
    export type tUserGetserialsRes = ResBase & {
        count: number,
        datas: ItemDefine.tSerial[],
    }
}