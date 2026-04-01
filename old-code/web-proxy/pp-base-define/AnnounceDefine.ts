
export namespace AnnounceDefine {
	export type tData = {
		annID:number,

		type:AnnType,
		title:string,
		simpleContent:string,
		authors:string,

		smallBgIconUrl:string,
		bigBgIconUrl:string,
		contents:{
			text?:string,
			iconUrl?:string,
		}[],

		timestamp:number,
		date:string,
	}

	export enum AnnType {
		System,		// 公告
		News,		// 资讯
		Match,		// 赛事
	}

	export type tBanner = {
		bannerID:number,
		seq:number,
		iconUrl:string,
		link:{
			matchID?:number,
			annID?:number,
			browserUrl?:string,
		},
		timestamp:number,
		date:string,
	}
}