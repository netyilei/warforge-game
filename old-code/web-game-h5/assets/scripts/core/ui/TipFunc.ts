
class _Internal_TipFunc implements kcore.ITipFunc {
	push:(title?:string,content?:string,btnNum?:number,func?:(b:boolean)=>any)=>UIBaseInterface
}

export const TipFunc = new _Internal_TipFunc