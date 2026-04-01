import { baseService } from "kdweb-core/lib/service/base";
import { NewsDefine } from "../../pp-base-define/NewsDefine";
import { UserDefine } from "../../pp-base-define/UserDefine";
import { UserUtils } from "../../src/UserUtils";
import { IDUtils } from "../../src/IDUtils";
import { kdutils } from "kdweb-core/lib/utils";
import { TimeDate } from "../../src/TimeDate";
import { Module_News } from "../../pp-base-define/DM_News";
import { Module_Banner } from "../../pp-base-define/DM_MailDefine";



export namespace GMNewsService {
	export async function createNews(userID:number,params:{
		data:NewsDefine.tData,	// 资讯数据
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.News)) {
			return baseService.errJson(1,"权限不足")
		}
		let data = params.data
		data.listTitle = data.listTitle || data.title
		data.newsID = await IDUtils.getNewsID()
		data.gmUserID = userID
		data.visible = !!data.visible
		data.timestamp = kdutils.getMillionSecond()
		data.date = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		data.profileTimestamp = data.profileTimestamp || data.timestamp
		data.profileDate = data.profileDate || TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss",data.profileTimestamp)
		data.author = data.author || "GM"
		data.type = data.type || NewsDefine.NewsType.News
		await Module_News.insert(data)
		return {
			newsID:data.newsID,
		}
	}

	export async function getNews(userID:number,params:{
		newsIDs?:string[],
		type?:NewsDefine.NewsType,
		withInvisible?:boolean,
		gmUserID?:number,
		author?:string,
		title?:string,
		abstract?:string,
		content?:string,
		page:number,limit:number,
	}) {
		let index:any = {}
		if(params.newsIDs) {
			index.newsID = {$in:params.newsIDs}
		}
		if(params.type != null) {
			index.type = params.type
		}
		if(params.gmUserID != null) {
			index.gmUserID = params.gmUserID
		}
		if(params.author) {
			index.author = {$regex:params.author}
		}
		if(params.title) {
			index.title = {$regex:params.title}
		}
		if(params.abstract) {
			index.abstract = {$regex:params.abstract}
		}
		if(params.content) {
			index["contents.text"] = {$regex:params.content}
		}
		if(!params.withInvisible) {
			index.visible = true
		}
		let count = await Module_News.getCount(index)
		let datas = await Module_News.getOption(index,{
			sort:{timestamp:-1},
			skip:params.page * params.limit,
			limit:params.limit,
		})
		return {
			count:count,
			datas:datas,
		}
	}

	export async function updateNewsData(userID:number,params:{
		data:NewsDefine.tData,	// 资讯数据
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.News)) {
			return baseService.errJson(1,"权限不足")
		}
		await Module_News.update(params.data)
		return {}
	}

	export async function setVisible(userID:number,params:{
		newsID:string,
		visible:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.News)) {
			return baseService.errJson(1,"权限不足")
		}
		await Module_News.updateOrigin({newsID:params.newsID},{
			$set:{
				visible:!!params.visible,
			}
		})
	}

	export async function deleteNews(userID:number,params:{
		newsID:string,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.News)) {
			return baseService.errJson(1,"权限不足")
		}
		let news = await Module_News.getMain(params.newsID)
		if(!news) {
			return baseService.errJson(1,"资讯不存在")
		}
		await Module_News.del({newsID:params.newsID})
		return {}
	}

	export async function getBanners(userID:number,params:{
		withInvisible?:boolean,

		page:number,limit:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.News)) {
			return baseService.errJson(1,"权限不足")
		}
		let index:any = {}
		if(!params.withInvisible) {
			index.visible = true
		}
		let count = await Module_Banner.getCount(index)
		let datas = await Module_Banner.getOption(index,{
			sort:{timestamp:-1},
			skip:params.page * params.limit,
			limit:params.limit,
		})
		return {
			datas:datas,
			count:count,
		}
	}

	export async function createBanner(userID:number,params:{
		banner:NewsDefine.tBanner,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.News)) {
			return baseService.errJson(1,"权限不足")
		}
		params.banner.bannerID = await IDUtils.getBannerID()
		params.banner.visible = !!params.banner.visible
		params.banner.timestamp = kdutils.getMillionSecond()
		params.banner.date = TimeDate.getFmtMoment("YYYY-MM-DD HH:mm:ss")
		await Module_Banner.insert(params.banner)
		return {
			bannerID:params.banner.bannerID,
		}
	}

	export async function updateBanner(userID:number,params:{
		banner:NewsDefine.tBanner,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.News)) {
			return baseService.errJson(1,"权限不足")
		}
		await Module_Banner.update(params.banner)
		return {}
	}
	
	export async function setBannerVisible(userID:number,params:{
		bannerID:number,
		visible:boolean,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.News)) {
			return baseService.errJson(1,"权限不足")
		}
		await Module_Banner.updateOrigin({bannerID:params.bannerID},{
			$set:{
				visible:!!params.visible,
			}
		})
		return {}
	}

	export async function deleteBanner(userID:number,params:{
		bannerID:number,
	}) {
		if(!await UserUtils.checkUserConsoleRole(userID,UserDefine.RoleType.News)) {
			return baseService.errJson(1,"权限不足")
		}
		await Module_Banner.del({bannerID:params.bannerID})
		return {}
	}
}