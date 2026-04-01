// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import UserUtils from "../../core/utils/UserUtils";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UserLoader extends cc.Component {
    @property({type:cc.Label})
    nicknameLbl:cc.Label = null
    @property({type:cc.Label})
    userIDLbl:cc.Label = null
    @property({type:cc.Sprite})
    iconSprite:cc.Sprite = null
   
    public async load(userID:number|{
        nickName?: string
		iconUrl?: string
		sex?: number
		userID?: number
    }){
        let data 
        if(typeof(userID) == 'number'){
            data = await UserUtils.instance.load(userID)
        }else{
            data = userID
        }

        if(this.nicknameLbl){
            this.nicknameLbl.string = kcore.api.fixedBytesLen(data.nickName,10,"..")
        }
        if(this.userIDLbl){
            this.userIDLbl.string = data.userID.toString()
        }
        if(this.iconSprite){
            let spf = await UserUtils.instance.getSpriteFrame(data.userID)
            this.iconSprite.spriteFrame = spf
        }
        

    }

    public clean(){
        if(this.nicknameLbl){
            this.nicknameLbl.string = ''
        }
        if(this.userIDLbl){
            this.userIDLbl.string = ''
        }
        if(this.iconSprite){
            this.iconSprite.spriteFrame = null
        }
    }
    

}
