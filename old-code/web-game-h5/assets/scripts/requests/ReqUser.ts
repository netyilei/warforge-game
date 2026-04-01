import { CoreFunctionals } from "../core/CoreFunctionals";
import { ItemDefine } from "../ServerDefines/ItemDefine";
import { MailDefine } from "../ServerDefines/MailDefine";
import { UserDefine } from "../ServerDefines/UserDefine";

export namespace ReqUser {
    export let getUserBaseInfo = CoreFunctionals.reqAK<tUserBaseInfoReq,tUserBaseInfoRes>("user/baseinfo/get")
    export type tUserBaseInfoReq = {
        userID:number
    }
    export type tUserBaseInfoRes = {
        errCode?:number,
        errMsg?:string,
        data:{
            userID:number,
            nickName:string,
            sex:number,
            iconUrl:string,
        },
    }
    

    export let getUserBaseInfos = CoreFunctionals.reqAK<tUserBaseInfosReq,tUserBaseInfosRes>("user/baseinfos/get")
    export type tUserBaseInfosReq = {
        userIDs:number[]
    }
    export type tUserBaseInfosRes = {
        errCode?:number,
        errMsg?:string,
        data:{
            userID:number,
            nickName:string,
            sex:number,
            iconUrl:string,
        }[],
    }


    export let getUserMailList = CoreFunctionals.reqAK<tUserMailListReq,tUserMailListRes>("user/mail/list")
    export type tUserMailListReq = {
        page:number,
        limit:number
    }
    export type tUserMailListRes = {
        errCode?:number,
        errMsg?:string,
        datas:MailDefine.tMail[],
        count:number,
    }
    export let readUserMail = CoreFunctionals.reqAK<tReadUserMailReq,tReadUserMailRes>("user/mail/read")
    export type tReadUserMailReq = {
        mailID:string,
    }
    export type tReadUserMailRes = {
        errCode?:number,
        errMsg?:string,
        data:MailDefine.tMail,
    }

    export let deleteUserMail = CoreFunctionals.reqAK<tDeleteUserMailReq,tDeleteUserMailRes>("user/mail/delete")
    export type tDeleteUserMailReq = {
        mailID:string,
    }
    export type tDeleteUserMailRes = {
        errCode?:number,
        errMsg?:string,
        success:boolean,
    }

    //TODO 未完成
    export let receiveUserMail = CoreFunctionals.reqAK<tReceiveUserMailReq,tReceiveUserMailRes>("user/mail/receive")
    export type tReceiveUserMailReq = {
        mailID:string,
    }
    export type tReceiveUserMailRes = {
        errCode?:number,
        errMsg?:string,
        items:ItemDefine.tItem[],
    }

    export let getRedDot = CoreFunctionals.reqAK<tGetRedDotReq,tGetRedDotRes>("user/reddot/get")
	export type tGetRedDotReq = {
	}
	export type tGetRedDotRes = {
		errCode?:number,
		errMsg?:string,
		data:UserDefine.UserRedBot
	}

    export let getUserWaterList = CoreFunctionals.reqAK<tGetUserWaterListReq,tGetUserWaterListRes>("user/water/list")
    export type tGetUserWaterListReq = {
        page:number,
        limit:number
    }
    export type tGetUserWaterListRes = {
        errCode?:number,
        errMsg?:string,
        datas:ItemDefine.tSerial[],
        count:number,
    }

    export let getUserPlayAction = CoreFunctionals.reqAK<tGetUserPlayActionReq,tGetUserPlayActionRes>("user/playaction/get")
    export type tGetUserPlayActionReq = {
        userID?:number,
        gameID:number,
    }
    export type tGetUserPlayActionRes = {
        errCode?:number,
        errMsg?:string,

        data:UserDefine.PlayAction,
    }

    export let getSerials = CoreFunctionals.reqAK<tGetSerialsReq,tGetSerialsRes>("user/getserial")
    export type tGetSerialsReq = {
        type?:ItemDefine.SerialType,
        types?:ItemDefine.SerialType[],
        page:number,
        limit:number,
    }
    export type tGetSerialsRes = {
        errCode?:number,
        errMsg?:string,

        count:number,
        datas:ItemDefine.tSerial[],
    }

    export let changeUserInfo = CoreFunctionals.reqAK<tChangeUserInfoReq,tChangeUserInfoRes>("user/changeuserinfo")
    export type tChangeUserInfoReq = {
        name?:string,
        iconUrl?:string,
    }
    export type tChangeUserInfoRes = {
        errCode?:number,
        errMsg?:string,
    }
}