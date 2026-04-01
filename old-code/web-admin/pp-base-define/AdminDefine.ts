

export namespace AdminDefine {
	export enum Auth {
		Group,
		Club,
	}
	export type tAdmin = {
		userID:number,
		auths:Auth[],
	}
}