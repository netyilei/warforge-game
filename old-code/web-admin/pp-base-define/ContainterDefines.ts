

export namespace ContainerDefines {
	export class Set<T> {
		private datas_:T[] = []
		push(data:T) {
			if(this.datas_.indexOf(data) >= 0) {
				return this
			}
			this.datas_.push(data)
			return this
		}
		get datas() {
			return this.datas_
		}
		get length() {
			return this.datas_.length
		}
		clear() {
			this.datas_.splice(0)
		}
		remove(data:T) {
			let idx = this.datas_.indexOf(data)
			if(idx >= 0) {
				this.datas_.splice(idx,1)
			}
			return this
		}
		contains(data:T) {
			let idx = this.datas_.indexOf(data)
			return idx >= 0
		}
	}
}