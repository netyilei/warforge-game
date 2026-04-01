

// srs-center -> srs-layer-node -> srs-(user|device|gs)-node
export namespace SrsDefine {
	export enum NodeType {
		Layer = 0,
		Device 		= 0x01,
		User 		= 0x02,
		GameServer 	= 0x04,
	}


	export type LayerOtherConfig = {
		httpHost:string,
		httpPort:number,

		nodeWSHost:string,
		nodeWSPort:number,
	}

	// user & device
	export type NodeOtherConfig = {
		deviceWSHost:string,
		deviceWSPort:number,
		userWSHost:string,
		userWSPort:number,
	}

	export namespace Redis {
		// hmap key - srs node name
		export const tableSrsNodeMap = "t_srs_node_map"
		export type tSrsNodeMap = {
			layer:string,
			layerConfig:LayerOtherConfig,
			otherConfig:any,
		}

		// hmap key - userID, value - srs node name
		export const tableUserSrsNode = "t_srs_node_user_map"
		export function ftableUserSrsNodeReverse(nodeName:string) {
			return "t_srs_node_user_reverse:" + nodeName
		}

		// hmap key - deviceID, value - srs node name
		export const tableDeviceSrsNode = "t_srs_node_device_map"
		export function ftableDeviceSrsNodeReverse(nodeName:string) {
			return "t_srs_node_device_reverse:" + nodeName
		}
		// hmap key - deviceID, deviceH - srs node accept handler
		export const tableDeviceServerH = "t_srs_node_device_h"

		// hmap key - srs node name value - 1
		export function ftableLayerMap(layerName:string) {
			return "t_srs_layer_map:" + layerName
		}
		// hmap key - layer name value- LayerOtherConfig
		export const tableLayer = "t_srs_node_layer"
		
	}

	export namespace Mongo {
		export const dbLayer = "tds-layer"
		export const tableGSSrsNode = "t_srs_node_gs_map"
		export type tGSSrsNode = {
			name:string,
			gameID:number,
			layer:string,
			nodeName:string,
		}
	}

	export namespace Http {
		export namespace Layer {
			export const pathSendToUser = "/notify/senduser"
			export type tSendToUserReq = {
				userID:number,
				msg:{
					name:string,
					data:any,
				}
			}
			export type tSendToUserRes = {
				code:"success" | "not exist" | "error"
				error?:string,
			}
	
			export const pathDCNChange = "/notify/dcn"
			export type tDCNChangedReq = {
				filterUserIDs?:number[],
				dkey:string,
				data:any,
			}

			export const pathSendToDevice = "/notify/senddevice"
			export type tSendToDeviceReq = {
				deviceID:string,
				msg:{
					name:string,
					data:any,
				}
			}
	
			export type tSendToDeviceRes = {
				code:"success" | "not exist" | "error"
				error?:string,
			}


			export const pathSelectSrsNode = "/select/srsnode"
			export type tSelectSrsNodeReq = {
				type?:SrsDefine.NodeType
			}
			export type tSelectSrsNodeRes = {
				host:string,
			}

			export const pathCallGS = "/callgs"
			export type tCallGSReq = {
				name:string,
				method:string,
				params:any[],
			}
			export type tCallGSRes = {
				code:"success" | "not exist" | "error"
				data?:any,
				error?:string,
			}
		}
	}

}