
export namespace VersionDefine {
	/**
	 * 
	 * @param ver1 
	 * @param ver2 
	 * @returns < -1 ; = 0 ; > 1
	 */
	export function vercmp(ver1:string,ver2:string) {
		let a1 = ver1.split(".")
		let a2 = ver2.split(".")
		if(a1.length != a2.length) {
			return a1.length < a2.length ? -1 : 1
		}
		for(let i = 0 ; i < a1.length ; i ++) {
			let n1 = Number.parseInt(a1[i])
			let n2 = Number.parseInt(a2[i])
			if(Number.isNaN(n1)) {
				n1 = 0
			}
			if(Number.isNaN(n2)) {
				n2 = 0
			}
			if(n1 != n2) {
				return n1 < n2 ? -1 : 1
			}
		}
		return 0
	}
}