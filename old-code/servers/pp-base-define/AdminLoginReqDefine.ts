import { UserDefine } from "./UserDefine"


export type ResBase = {
    errCode?: number,
    errMsg?: string,
}

export const LoginAccount = "/login/account"
export type tLoginAccountReq = {
    channel: UserDefine.LoginChannel,
    channelContent?: string,
    account?: string,
    pwdMD5?: string,
    nickName?: string,
    leaderTag?: string,
}
export type tLoginAccountRes = ResBase & {
    ak: string,
    loginData: UserDefine.tLoginData,
    roleTarget: {
        target: UserDefine.LoginTarget;
        roles: UserDefine.RoleType[];
    }
    loginChannel: UserDefine.tLoginChannel,
    customerHost: string,
    customerWSHost: string,
}

export const Register = "/register"
export type tRegisterReq = {
    account: string,
    pwdMD5: string,
    nickName: string,
    countryCode: string,
    verifyCode: string,
    deviceTag: string,
    channelTag: string,
    leaderTag?: string,	// 推荐码
}
export type tRegisterRes = ResBase & {}


export const Changepwd = "/changepwd"
export type tChangepwdReq = {
    account: string,
    newPwdMD5: string,
    verifyCode: string,
}
export type tChangepwdRes = ResBase & {}


export const Sendcode = "/sendcode"
export type tSendcodeReq = {
    account: string,
    register?: boolean,
}
export type tSendcodeRes = ResBase & {
    code: string,
}

export const LoginConsole = "/login/console"
export type tLoginConsoleReq = {
    channel: UserDefine.LoginChannel,
    account?: string,
    pwdMD5?: string,
}
export type tLoginConsoleRes = ResBase & {
    ak: string;
    loginData: UserDefine.tLoginData;
    roleTarget: {
        target: UserDefine.LoginTarget;
        roles: UserDefine.RoleType[];
    };
    loginChannel: UserDefine.tLoginChannel;
    customerHost: string;
    customerWSHost: string;
}