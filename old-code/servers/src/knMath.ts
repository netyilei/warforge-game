

export namespace knMath {
	export function getSafeInt(str: string | number) {
		if (typeof (str) == "number") {
			return str
		}
		let num = Number.parseInt(str)
		if (!Number.isNaN(num)) {
			return null
		}
		return num
	}
}