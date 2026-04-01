

export namespace MQDefine {
	export namespace Method {
		/**
		 * [tag:string,data:any,timeout:number]
		 * @param topic 
		 * @returns 
		 */
		export function topic_produce(topic:string) {
			return "kds.mq.topic." + topic + ".produce"
		}
		export function tag_produce(topic:string,tag:string) {
			return "kds.mq.tag." + topic + "." + tag + ".produce"
		}
		/**
		 * [tag:string,timeout:number]
		 * @param topic 
		 * @returns 
		 */
		export function topic_consume(topic:string) {
			return "kds.mq.topic." + topic + ".consume"
		}
		export function tag_consume(topic:string,tag:string) {
			return "kds.mq.tag." + topic + "." + tag + ".consume"
		}
		/**
		 * [tag:string,count:number,timeout:number]
		 * @param topic 
		 * @returns 
		 */
		export function topic_consumeMany(topic:string) {
			return "kds.mq.topic." + topic + ".consumeMany"
		}
		export function tag_consumeMany(topic:string,tag:string) {
			return "kds.mq.tag." + topic + "." + tag + ".consumeMany"
		}
		
		/**
		 * @method 	proxyRpcCall
		 * @param 	[methodName:string,args:any[]]
		 * @returns any
		 */
		export const proxyRpcCall = "kds.mq.proxy.call"
		/**
		 * @method 	proxyRpcCallServer
		 * @param 	[name:string,methodName:string,args:any[]]
		 * @returns any
		 */
		export const proxyRpcCallServer = "kds.mq.proxy.callServer"
	}

	export type MQData = {
		topic:string,
		tag?:string,
		id:string,
		
		data:any,

		timestamp?:number,
	}

	export enum ErrorCode {
		Success 	= 0x00,
		Error 		= 0x01,
		NotReady 	= 0x10,
		IDFaild		= 0x11,
		SignFailed	= 0x20,
		NoQueue		= 0x21,

		Produce 				= 0x100000,
		ProduceParamsInvalid 	= 0x100001,

		Consume 		= 0x200000,
		Consume_Nothing = 0x200001,
	}
}

export namespace MQTopic {
	export let TrackingUserLogin = "Topic_Tracking_UserLogin"
	export type tTrackingUserLogin = {
		userID:number,
		socialID:number,
		new:boolean,
		timestamp:number,
		date:string,
	}
	
	export let TrackingUserAD = "Topic_Tracking_UserAD"
	export type tTrackingUserAD = {
		userID:number,

		from:string,
	}

	export let TrackingUserPlatform = "Topic_Tracking_UserPlatform"
	export type tTrackingUserPlatform = {
		userID:number,
		teaID?:number,
		locationID?:string,
		from:string,
		reason:string,
		itemID:string,
		count:number,
		timestamp:number,
		date:string,
		data:any
	}
	
	export let TrackingReport = "Topic_Tracking_Report"
	export type tTrackingReport = {
		event:string,
		count:number,
		data:any,
		timestamp:number,
		date:string,
	}

	export namespace Inside {
		export let CreateCompany = "Topic_OnCreateCompany"
		export type tOnCreateCompany = {
			companyID:number,
		}

		export let DeleteCompany = "Topic_DeleteCompany" 
		export type tDeleteCompany = {

		}

		export let CreateBMatch = "Topic_CreateBMatch"
		export type tCreateBMatch = {
			companyID:number,

			
		}
	}
}