import { UserDefine } from "./UserDefine"


export namespace GlobalConfig {
	
	export type tMain = {
		changeNameItemID:string,	// 改名道具ID
		changeNameItemCount:string, // 改名道具数量

		fakeUserCounts:{	// 各游戏假人数量
			gameID:number,	// 101-德州  102-广告1  103-广告2
			count:number,	// 基础数量
			offset:number,	// 随机波动数量
			// finalCount = count + random(0,offset)
		}[],
	}
	

	export type tLogin = {
		limitOnlineCount:number,		// 最大登录的channel数
		loginChannels:{					// 登录方式
			enabled:boolean,			// 是否可用
			type:UserDefine.LoginChannel,
			expireTime:number,				// 超时时间
		}[],


		countries:{
			name:string,	// CHN
			code:string,	// 86
			langs:string[],	// 支持的语言
		}[]
	}
}