import { CustomerDefine } from "./CustomerDefine"
import { UserDefine } from "./UserDefine"

/**
 * 客服系统接口定义
 * 用于定义 pp-chat-service 服务中的所有 HTTP API 接口
 */
export namespace ChatReqDefine {
    export type ResBase = {
        errCode?: number,
        errMsg?: string,
    }

    // 管理员接口（需要 Console 权限）

    // 获取房间列表
    // 客服管理员可以查看所有房间，普通客服只能查看自己负责的房间
    export const AdminGetrooms = "/admin/getrooms"
    export type tAdminGetroomsReq = {
        page: number,
        limit: number,
    }
    export type tAdminGetroomsRes = ResBase & {
        count: number,
        datas: CustomerDefine.tRoom[],
        loginDatas: UserDefine.tLoginData[],
    }

    // 获取未被接入客服的聊天房间列表
    // 返回 fromUserID 为空的房间列表，表示用户还未被客服接入
    export const AdminGetnofromrooms = "/admin/getnofromrooms"
    export type tAdminGetnofromroomsReq = {
        limit?: number,
    }
    export type tAdminGetnofromroomsRes = ResBase & {
        count: number,
        datas: CustomerDefine.tRoom[],
        loginDatas: UserDefine.tLoginData[],
    }

    // 接入房间
    // 当 fromUserID 为空时，表示用户未被接入客服，需要客服去接入。客服调用此接口将房间接入到自己名下
    export const AdminStartroom = "/admin/startroom"
    export type tAdminStartroomReq = {
        roomID: number,
    }
    export type tAdminStartroomRes = ResBase & {}

    // 更换/转接客服
    // 将指定房间转接给新的客服
    export const AdminChangecustomer = "/admin/changecustomer"
    export type tAdminChangecustomerReq = {
        roomID: number,
        userID: number,
    }
    export type tAdminChangecustomerRes = ResBase & {}

    // 获取可转接的客服列表
    // 返回所有具有客服权限的用户列表，用于转接房间时选择目标客服
    export const AdminGetchangeenabledcustomers = "/admin/getchangeenabledcustomers"
    export type tAdminGetchangeenabledcustomersReq = {}
    export type tAdminGetchangeenabledcustomersRes = ResBase & {
        datas: {
            userID: number,
            role: UserDefine.tLoginRole,
            loginData: UserDefine.tLoginData | undefined,
        }[],
    }

    // 获取聊天记录
    // 获取指定房间的聊天记录，支持按消息ID分页
    export const AdminGetchats = "/admin/getchats"
    export type tAdminGetchatsReq = {
        roomID: number,
        msgID?: number,
        page: number,
        limit: number,
    }
    export type tAdminGetchatsRes = ResBase & {
        count: number,
        datas: CustomerDefine.tChat[],
    }

    // 检测某个用户是否是客服
    // 检查指定用户是否具有客服权限（CustomerChat 或 CustomerChatManager）
    export const AdminIscustomerid = "/admin/iscustomerid"
    export type tAdminIscustomeridReq = {
        userID: number,
    }
    export type tAdminIscustomeridRes = ResBase & {
        b: boolean,
    }

    // 用户接口（需要 App 权限）

    // 发起聊天
    // 用户发起客服聊天，如果已有房间则返回现有房间，否则创建新房间
    export const UserStartchat = "/user/startchat"
    export type tUserStartchatReq = {}
    export type tUserStartchatRes = ResBase & {
        room: CustomerDefine.tRoom,
    }

    // 获取房间列表
    // 获取用户相关的所有房间（作为 fromUserID 或 toUserID）
    export const UserGetrooms = "/user/getrooms"
    export type tUserGetroomsReq = {
        page: number,
        limit: number,
    }
    export type tUserGetroomsRes = ResBase & {
        count: number,
        datas: CustomerDefine.tRoom[],
    }

    // 获取房间信息
    // 获取指定房间的详细信息
    export const UserGetroom = "/user/getroom"
    export type tUserGetroomReq = {
        roomID: number,
    }
    export type tUserGetroomRes = ResBase & {
        room: CustomerDefine.tRoom | null,
    }

    // 获取聊天记录
    // 获取指定房间的聊天记录，支持按消息ID分页
    export const UserGetchats = "/user/getchats"
    export type tUserGetchatsReq = {
        roomID: number,
        msgID?: number,
        page: number,
        limit: number,
    }
    export type tUserGetchatsRes = ResBase & {
        count: number,
        datas: CustomerDefine.tChat[],
    }

    // 内部接口（需要 Console 权限）

    // 发送消息给用户
    // 内部服务接口，用于向指定用户发送 WebSocket 消息
    export const InternalSendtouser = "/sendtouser"
    export type tInternalSendtouserReq = {
        userID: number,
        msgName: string,
        jsonObj: Record<string, unknown>,
    }
    export type tInternalSendtouserRes = ResBase & {
        b: boolean,
    }
}
