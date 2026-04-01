

declare namespace ResourcePoolDefine {
	enum ResType {
		Binary,
		Text,
		Json,
		Img,
		Audio,
		Video,
		Bundle,
	}

	interface ResData {
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

	enum OperType {
		Add,
		Remove,
	}
	interface ResDataRecord {
		spaceName:string,
		name:string,

		data:ResData,
		time:number,
		operType:string,
	}
}