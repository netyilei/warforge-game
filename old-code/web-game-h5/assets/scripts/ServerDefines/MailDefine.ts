
export namespace MailDefine {

    export const enum MailType {
        None = 0, 
        System = 1, // 系统邮件
        Invite = 2, // 邀请邮件
        Req = 3, // 请求邮件
        Club = 4, // 俱乐部邮件
    }

    export const enum extState {
        None = 0,   // 未处理
        Agree = 1,  // 同意
        Reject = 2, // 拒绝
        Cancel = 3, // 取消
    }

    export type tMail = {
        mailID: string,
        fromUserID: number, // 0=系统
        toUserID: number,
        type: MailType,
        title: string,
        content: string,
        sendTime: number,
        sendDate: string,
        expireTime?: number,
        isRead: boolean,
        isReceived: boolean,
        isDel: boolean,

        // 附件
        attachs?: tMailAttach[],
        
        seqID?: number,//系统邮件id
    }

    export type tMailAttach = {
        itemID?: string,
        club?:{
            clubID:number,
            valueIndex:number,
        },
        count: number,
        title?: string,
        content?: string,
        url?: string,
    }
}