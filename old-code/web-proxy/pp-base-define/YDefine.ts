

export namespace YDefine {
	/**
	 * [from,to)
	 * count = to - from
	 * 
	 * top: custom value
	 */
	export type Cursor = {
		h?:string,
		max?:number,
		top?:number,

		from:number,
		count:number,
	}

	export type Data = {
		datas:any[],
		cursor:Cursor,
	}
}