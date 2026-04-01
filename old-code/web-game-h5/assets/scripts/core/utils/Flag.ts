


export class rcFlag implements kcore.IFlag {
	constructor(n?:number) {
		this.n = n || 0
	}

	private n_:number = 0
	get n() {
		return this.n_
	}
	set n(v) {
		this.n_ = v
	}

	contains(v:number) {
		return (this.n & v) ==  v
	}
	compare(v:number) {
		return (this.n & v) >  v
	}
	check(v:number) {
		return this.n & v
	}
	add(v:number) {
		return (this.n |= v)
	}
}

export namespace rcFlag {
	/**
	 * @returns (a & b) == b
	 */
	export function contains(a:number,b:number) {
		return (a & b) == b
	}
	/**
	 * @returns (a & b) > 0
	 */
	export function compare(a:number,b:number) {
		return (a & b) > 0
	}
}