

export namespace NewsDefine {
	export type tJump = {
		gameID?:number,
		matchID?:number,
		groupID?:number,
		webUrl?:string,
	}
	export enum NewsType {
		Announce,		// 公告
		Match,			// 赛事	
		News,			// 资讯
	}
	export type tData = {
		newsID:number,		// 资讯
		type:NewsType,		// 资讯类型
		title:string,		// 标题
		listTitle?:string,	// 列表标题
		listAbstract:string,// 列表摘要
		author:string,		// 作者
		visible:boolean,	// 是否可见
		listImageUrl:string,	// 列表图片

		contents:{			// 正文内容
			text?:string,
			imgUrl?:string,
			jump?:tJump,	// 点击跳转
		}[],

		gmUserID:number,	// GM用户ID

		profileTimestamp:number,	// 资讯发布时间戳
		profileDate:string,			// 资讯发布时间日期

		timestamp:number,			// 资讯创建时间戳
		date:string,				// 资讯创建时间日期
	}
	
	export type tBanner = {
		bannerID:number,
		visible:boolean,
		seq:number,
		iconUrl:string,
		jump:tJump,

		timestamp:number,
		date:string,
	}
}