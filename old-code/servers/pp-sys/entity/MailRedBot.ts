import { DBDefine } from "../../pp-base-define/DBDefine";
import { SrsRpcMethods } from "../../pp-base-define/SrsRpcMethods";
import { SrsDCN } from "../../pp-base-define/SrsUserMsg";
import { DB } from "../../src/db";
import { Rpc } from "../rpc";

let db = DB.get()
export namespace MailRedBot {
    
    export async function sendUsers(userIDs:number[],key:string,nt:any) {
        Rpc.center.callAll(SrsRpcMethods.LayerCenter.dcnFilterChanged,userIDs,key,nt)
    }
	export async function updateMailRed(userID:number) {
        let index = {
            toUserID:userID,
            isRead:false,
            isDel:false,
        }
        let count = await db.getCount(DBDefine.tableUserMail,index)
        if(!count){
            count = 0
        }
        await sendUsers([userID],SrsDCN.UserRedDot,{mail:count});
    }
}