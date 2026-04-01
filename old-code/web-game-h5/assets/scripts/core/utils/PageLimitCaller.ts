import { ListViewEx, LVSetupFunction } from "../ui/ListViewEx"

type Section = {
	from:number,
	count:number,
	loading?:boolean,
	success?:boolean,
}

type PageRequest = {
	page:number,
	limit:number,
}

type PageResponse = {
	count:number,
	datas:any[],
}
export class PageLimitCaller<T> {
	constructor() {}

	private datas_:T[] = []
	get datas() {
		return this.datas_
	}
	set datas(v) {
		this.datas_ = v
	}
	
	private sections_:Section[] = []
	get sections() {
		return this.sections_
	}
	set sections(v) {
		this.sections_ = v
	}

	private loadStep_:number = 20
	get loadStep() {
		return this.loadStep_
	}
	set loadStep(v) {
		this.loadStep_ = v
	}

	private top_:number = null
	get top() {
		return this.top_
	}
	set top(v) {
		this.top_ = v
	}

	private maxCount_:number = 0
	get maxCount() {
		return this.maxCount_
	}

	private funcLoadCursor_:(req:PageRequest)=>Promise<PageResponse> = null 
	get funcLoadCursor() {
		return this.funcLoadCursor_
	}
	set funcLoadCursor(v) {
		this.funcLoadCursor_ = v
	}

	private funcSectionDone_:(success:boolean,from:number,count:number)=>any = null
	get funcSectionDone() {
		return this.funcSectionDone_
	}
	set funcSectionDone(v) {
		this.funcSectionDone_ = v
	}

	private serials_ = 0
	clear() {
		this.serials_ ++ 
		// this.funcLoadCursor = null 
		// this.funcSectionDone = null 
		this.datas_.splice(0)
		this.sections_.splice(0)
	}
	
	clearAll() {
		this.serials_ ++ 
		this.funcLoadCursor = null 
		this.funcSectionDone = null 
		this.datas_.splice(0)
		this.sections_.splice(0)
	}

	getSection(index:number) {
		for(let sec of this.sections) {
			if(index >= sec.from && index < sec.from + sec.count) {
				return sec 
			}
		}
		return null 
	}

	private _createSection(index:number) {
		let from = Math.floor(index / this.loadStep) * this.loadStep
		let sec:Section = {
			from:from,
			count:this.loadStep,
		}
		return sec 
	}

	needLoad(index:number) {
		if(this.maxCount > 0) {
			let sec = this._createSection(index)
			if(sec.from >= this.maxCount) {
				return false 
			}
		}
		for(let sec of this.sections) {
			if(index >= sec.from && index < sec.from + sec.count) {
				return sec.loading == false
			}
		}
		return true 
	}

	load(index:number) {
		let sec = this.getSection(index)
		if(sec) {
			if(sec.success || sec.loading) {
				return false
			}
		}
		if(sec == null) {
			sec = this._createSection(index)
			if(this.maxCount > 0) {
				if(sec.from >= this.maxCount) {
					return false 
				}
			}
			this.sections.push(sec)
			this.sections.sort((a,b)=>a.from-b.from)
		}
		this._loadSection(sec)
		return true 
	}

	loadNextSection() {
		if(this.sections.length == 0) {
			return this.load(0)
		}
		let sec = this.sections[this.sections.length - 1]
		if(sec.count < this.loadStep) {
			return false 
		}
		let idx = sec.from + sec.count
		return this.load(idx)
	}

	private _loadSection(sec:Section) {
		if(this.funcLoadCursor == null) {
			if(this.funcSectionDone) {
				this.funcSectionDone(false,sec.from,sec.count)
			}
			return 
		}
		let serials = this.serials_
		let cursor:PageRequest = {
			page:Math.floor(sec.from / sec.count),
			limit:sec.count,
		}
		sec.loading = true 
		let self = this 
		this.funcLoadCursor(cursor)
		.then(function(res:PageResponse) {
			if(serials != self.serials_) {
				kcore.log.info("[PageLimitCaller] load cancelled")
				return 
			}
			sec.loading = false 
			if(!res || res.datas == null) {
				sec.success = false 
				return 
			}
			if(!self.funcLoadCursor) {
				return 
			}
			sec.success = true 
			self.maxCount_ = res.count
			let realCount = res.datas.length
			for(let i = sec.from ; i < sec.from + realCount ; i ++) {
				self.datas_[i] = res.datas[i - sec.from]
			}
			sec.count = realCount
			if(sec.count > 0 || self.maxCount_ == 0) {
				if(self.funcSectionDone) {
					self.funcSectionDone(true,sec.from,sec.count)
				}
			}
		})
	}

	private listViewEx_:ListViewEx = null 
	get listViewEx() {
		return this.listViewEx_
	}
	set listViewEx(v) {
		this.listViewEx_ = v
	}
	static createListViewEx<DataType>(opt:{
		loadStep?:number,loadNow?:boolean,
		view:cc.ScrollView,itemPrefab:cc.Prefab | (()=>cc.Node),
		func:(idx:number,data:DataType,node:cc.Node)=>any,
		funcClear?:(node:cc.Node)=>any,
		funcLoadCursor:(req:PageRequest)=>Promise<PageResponse>,
	}) {
		let caller = new PageLimitCaller<DataType>()
		caller.loadStep = opt.loadStep ? opt.loadStep : 20
		caller.funcLoadCursor = opt.funcLoadCursor
		caller.funcSectionDone = (success:boolean,from:number,count:number)=>{
			caller.listViewEx.itemCount = caller.maxCount
		}
		let listViewEx = ListViewEx.create(opt.view,opt.itemPrefab,(idx:number,node:cc.Node,forClean?:boolean)=>{
			if(forClean) {
				opt.funcClear && opt.funcClear(node)
				return false 
			}
			let data = caller.datas[idx]
			if(!data) {
				opt.funcClear && opt.funcClear(node)
				if(idx >= caller.maxCount) {
					return false 
				}
				caller.loadNextSection()
				return false 
			}
			opt.func(idx,data,node)
			return true
		})
		caller.listViewEx = listViewEx
		if(opt.loadNow) {
			caller.load(0)
		}
		return caller
	}
}
