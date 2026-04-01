

export namespace ResourcePoolDefine {
	export enum ResType {
		Binary,
		Text,
		Json,
		Img,
		Audio,
		Video,
		Bundle,
	}

	export type ResData = {
		type:ResType,
		name:string,
		value:string,
		version:string,
		lastTime:number,
		platforms?:{
			target:string,
			version:string,
			time:number,
			assets:string[],
			value:string,
		}[]
	}

	export enum OperType {
		Add,
		Remove,
	}
	export type ResDataRecord = {
		spaceName:string,
		name:string,

		data:ResData,
		time:number,
		operType:string,
	}
}