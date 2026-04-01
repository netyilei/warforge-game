

export const ccBundleDefine = cc.Class({
	name:"ccHotBundleDefine",
	properties:{
		name: {
			default:""
		},
		midUrl: {
			default:""
		},
		deps: {
			type:[cc.String],
			default:[]
		}
	}
})
export type BundleDefine = {
	name:string,
	midUrl:string,
	deps:string[],
}

export enum BundleStatus {
	Wait,
	Loading,
	Ready,

	Failed,
}
export type BundleCache = {
	name:string,
	bundle:cc.AssetManager.Bundle,

	loadedAssets:{
		name:string,
		asset:cc.Asset,
	}[],

	status:BundleStatus,
	loadByDep:boolean,

	promise:Promise<cc.AssetManager.Bundle>,
	
	progress: {
		totalBytes:number,
		per:number, // 0~1
	}
}

export type BundleMapInfo = {
	name:string,
	assetNames:string[],
	remote:boolean
	root:string,
	deps:string[],
}