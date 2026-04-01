import Http, { ConnectMethod } from './Http'
import { Config } from '../Config'
import { ChatReqDefine } from 'pp-base-define/ChatReqDefine'

function chatReq<Req_, Res_>(method: string) {
    return async (params: Req_) => {
        //@ts-ignore
        params['ak'] = sessionStorage.getItem('ak')
        let res: Res_ = <Res_>await Http.instance.connect({
            domain: sessionStorage.getItem("customerHost") || "",
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
        return res
    }
}

// ==================== 客服相关API ====================

// 客服管理
export const chatGetrooms = chatReq<ChatReqDefine.tAdminGetroomsReq, ChatReqDefine.tAdminGetroomsRes>(ChatReqDefine.AdminGetrooms)
export const chatGetnofromrooms = chatReq<ChatReqDefine.tAdminGetnofromroomsReq, ChatReqDefine.tAdminGetnofromroomsRes>(ChatReqDefine.AdminGetnofromrooms)
export const chatStartroom = chatReq<ChatReqDefine.tAdminStartroomReq, ChatReqDefine.tAdminStartroomRes>(ChatReqDefine.AdminStartroom)
export const chatChangecustomer = chatReq<ChatReqDefine.tAdminChangecustomerReq, ChatReqDefine.tAdminChangecustomerRes>(ChatReqDefine.AdminChangecustomer)
export const chatGetchats = chatReq<ChatReqDefine.tAdminGetchatsReq, ChatReqDefine.tAdminGetchatsRes>(ChatReqDefine.AdminGetchats)
export const chatGetchangeenabledcustomers = chatReq<ChatReqDefine.tAdminGetchangeenabledcustomersReq, ChatReqDefine.tAdminGetchangeenabledcustomersRes>(ChatReqDefine.AdminGetchangeenabledcustomers)
export const chatAdminIscustomerid = chatReq<ChatReqDefine.tAdminIscustomeridReq, ChatReqDefine.tAdminIscustomeridRes>(ChatReqDefine.AdminIscustomerid)