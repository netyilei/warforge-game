
class _Internal_ToastFunc implements kcore.IToastFunc{
	push:(content?:string,duration?:number)=>void = null
}

export const ToastFunc = new _Internal_ToastFunc