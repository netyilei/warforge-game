import { baseService } from "kdweb-core/lib/service/base"
import { DBDefine } from "../../pp-base-define/DBDefine"
import { UserDefine } from "../../pp-base-define/UserDefine"
import { DB } from "../../src/db"
import { Rpc } from "../rpc"
import { ItemDefine } from "../../pp-base-define/ItemDefine"
import { Module_UserLoginData, Module_UserSerial } from "../../pp-base-define/DM_UserDefine"
import { kdasync } from "kdweb-core/lib/tools/async"
import { GlobalUtils } from "../../src/GlobalUtils"
import { kds } from "../../pp-base-define/GlobalMethods"
import { Module_Mail } from "../../pp-base-define/DM_MailDefine"
import { UserUtils } from "../../src/UserUtils"

let db = DB.get()
let redis = DB.getRedis()
export namespace UserService {
    export async function getUserBaseInfo(userID: number, params: {
        userID: number
    }) {
        let userData: UserDefine.tLoginData = await db.getSingle(DBDefine.tableUserLoginData, { userID: params.userID })
        let userBase = {
            userID: userData.userID,
            nickName: userData.nickName,
            iconUrl: userData.iconUrl,
            sex: userData.sex,
        }
        return {
            data: userBase
        }
    }

    export async function getUserBaseInfos(userID: number, params: {
        userIDs: number[]
    }) {
        //查询userIDs的用户
        let userDatas: UserDefine.tLoginData[] = await Module_UserLoginData.get({ userID: { $in: params.userIDs } })
        let userBases = userDatas.map((userData) => {
            return {
                userID: userData.userID,
                nickName: userData.nickName,
                iconUrl: userData.iconUrl,
                sex: userData.sex,   
            }
        })
        return {
            data: userBases
        }
    }

    export async function getMailList(userID: number, params: {
        page:number,
        limit:number
    }){
        if(params.page == 0) {
            await Rpc.center.callException(kds.mail.refreshSystem,userID)
        }
        let index:any = {}
        index.toUserID = userID
        index.isDel = false
        let count = await Module_Mail.getCount(index)
        let datas = await Module_Mail.getOption(index,{
            sort:{
                sendTime:-1
            },
            skip:params.page*params.limit,
            limit:params.limit
        })
        return {
            datas:datas,
            count:count
        }
    }

    export async function readMail(userID: number, params: {
        mailID:number
    }){
        let module = await Module_Mail.searchLockedSingleData(params.mailID)
        if(!module || module.data.toUserID != userID){
            module?.release()
            return baseService.errJson(1,"邮件不存在")
        }
        module.data.isRead = true
        await module.saveAndRelease()
        Rpc.center.call(kds.mail.updateRedDot,userID)
        return {
            data:module.data 
        }
    }

    export async function deleteMail(userID: number, params: {
        mailID:number  
    }){
        let module = await Module_Mail.searchLockedSingleData(params.mailID)
        if(!module || module.data.toUserID != userID){
            module?.release()
            return baseService.errJson(1,"邮件不存在")
        }
        module.data.isDel = true
        await module.saveAndRelease()
        Rpc.center.call(kds.mail.updateRedDot,userID)
        return {
            success:true
        }  
    }

    export async function receiveMail(userID: number, params: {
        mailID:number  
    }){
        let module = await Module_Mail.searchLockedSingleData(params.mailID)
        if(!module || module.data.toUserID != userID){
            module?.release()
            return baseService.errJson(1,"邮件不存在")
        }
        if(!module.data.attachs || module.data.attachs.length == 0){
            module.release()
            return baseService.errJson(1,"邮件无附件")
        }
        if(module.data.isReceived){
            module.release()
            return baseService.errJson(1,"邮件已领取")
        }
        module.data.isReceived = true
        let items:ItemDefine.tItem[] = []
        for(let attach of module.data.attachs){
            if(attach.itemID){
                items.push({
                    id:attach.itemID,
                    count:attach.count.toString(),
                })
            }
        }
        if(items.length > 0){
            await Rpc.center.callException(kds.item.addItems,userID,items,ItemDefine.SerialType.MailAttach,{mailID:params.mailID})
        }
        await module.saveAndRelease()
        return {
            items,
        }
    }

    export async function getRedDot(userID: number, params: {
    }){
        let index = {
            toUserID:userID,
            isRead:false,
            isDel:false,
        }
        let mailCount = await Module_Mail.getCount(index)

        let data:UserDefine.UserRedBot = {
			mail:mailCount,
		}
        return { data }
    }

    export async function getUserWaterList(userID: number, params: {
        page:number,
        limit:number
    }){
        let index = {
			userID:userID,
            isLock:{$eq:null}
		}
		let opt = {
			sort:{
				timestamp:-1
			},
			skip:params.page*params.limit,
			limit:params.limit,
		}
		let count = await Module_UserSerial.getCount(index)
		let datas:ItemDefine.tSerial[] = await Module_UserSerial.getOption(index,opt) 
		return {
			datas:datas,
			count:count
		}
    }

    export async function getUserPlayAction(userID:number,params:{
        userID?:number,
        gameID:number,
    }) {
        return {
            data:await db.getSingle(DBDefine.tableUserPlayAction,{
                userID:params.userID || userID,
                gameID:params.gameID,
            })
        }
    }

    export async function getSerial(userID:number,params:{
        type?:ItemDefine.SerialType,
        types?:ItemDefine.SerialType[],
        page:number,
        limit:number,
    }) {
        let index:any = {
            userID:userID,
            isLock:{$eq:null},
        }
        if(params.type != null) {
            index.type = params.type
        } else if(params.types != null) {
            index.type = {$in:params.types}
        }
        let count = await Module_UserSerial.getCount(index)
        let datas:ItemDefine.tSerial[] = await Module_UserSerial.getOption(index,{
            sort:{
                timestamp:-1,
            },
            skip:params.page * params.limit,
            limit:params.limit,
        })
        return {
            count,
            datas,
        }
    }

    export async function changeUserInfo(userID:number,params:{
        name:string,
        iconUrl:string,
    }) {
        await kdasync.timeout(1000)
        let nickName = String(params.name || "").trim()
        if(nickName.length < 2) {
            return baseService.errJson(1,"昵称长度过短")
        }
        if(nickName.length > 15) {
            return baseService.errJson(1,"昵称长度过长")
        }
        let config = await GlobalUtils.getMain()
        if(config && config.changeNameItemID && config.changeNameItemCount != "0") {
            let b = Rpc.center.callException(kds.item.use,userID,config.changeNameItemID,config.changeNameItemCount,false,ItemDefine.SerialType.ChangeName)
            if(!b) {
                return baseService.errJson(1,"改名道具不足")
            }
        }
        let loginData = await Module_UserLoginData.searchLockedSingleData(userID)
        if(!loginData) {
            return baseService.errJson(1,"用户不存在")
        }
        if(params.name) {
            loginData.data.nickName = params.name
        }
        if(params.iconUrl) {
            loginData.data.iconUrl = params.iconUrl
        }
        await loginData.saveAndRelease()
        await UserUtils.rebuildSearch(loginData.data.userID)
        
        return {
            success:true,
        }
    }
}