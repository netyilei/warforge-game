import VMultiLangLabel from "./VMultiLangLabel"

const { ccclass, property, menu } = cc._decorator


@ccclass
export default class VMultiLangManager extends cc.Component implements kcore.IMultiLangManager {
	@property(cc.TextAsset)
	langCSV:cc.TextAsset = null
	@property()
	defaultKey = "zh_CN"

	private static instance_:VMultiLangManager = null
	static get instance() {
		return VMultiLangManager.instance_
	}

	private langs_:{
		key:string,
		zh_CN:string,
		en_US:string,
		zh_TW:string
	}[]
	onLoad() {
		window["kcore"] = window["kcore"] || <any>{}
		window["kcore"].lang = this

		VMultiLangManager.instance_ = this

		let lines = this.langCSV.text.split("\n").map(v=>v.trim()).filter(v=>v.length > 0)
		let headers = lines[0].split(",").map(v=>v.trim())
		this.langs_ = []
		for(let i = 1; i < lines.length; i++) {
			let cols = lines[i].split(",").map(v=>v.trim())
			let langEntry:{
				key:string,
				zh_CN:string,
				en_US:string,
				zh_TW:string
			} = {
				key:cols[0],
				zh_CN:this.transferValue(cols[1]),
				en_US:this.transferValue(cols[2]),
				zh_TW:this.transferValue(cols[3]),
			}
			this.langs_.push(langEntry)
		}
		this.langs_.sort((a,b)=>{
			return b.zh_CN.length - a.zh_CN.length
		})
	}

	protected transferValue(value:string) {
		return value.replace(/#/g,"\n").replace(/\|/g,",")
	}
	protected onDestroy(): void {
		if (VMultiLangManager.instance_ == this) {
			VMultiLangManager.instance_ = null
		}
	}

	private labels_:VMultiLangLabel[] = []
	addLabel(label:VMultiLangLabel) {
		this.labels_.push(label)
		this.updateLabel(label)
	}

	removeLabel(label:VMultiLangLabel) {
		let index = this.labels_.indexOf(label)
		if(index !== -1) {
			this.labels_.splice(index,1)
		}
	}
	updateLabel(label:VMultiLangLabel) {
		if(!this.langKey) {
			return false 
		}
		
		let originalStr = label.lbl.string
		if(!originalStr || originalStr.length === 0) {
			return false
		}
		
		// 第一步：尝试完全匹配
		for(let lang of this.langs_) {
			let defaultStr = lang[this.defaultKey]
			if(defaultStr && originalStr === defaultStr) {
				let targetStr = lang[this.langKey]
				if(targetStr) {
					label.lbl.string = targetStr
					return true 
				}
			}
		}
		
		// 第二步：正则匹配和替换（用于模板字符串）
		// langs_已经按照zh_CN长度降序排列，优先匹配长的文本片段
		let resultStr = originalStr
		let hasReplaced = false
		
		for(let lang of this.langs_) {
			let defaultStr = lang[this.defaultKey]
			let targetStr = lang[this.langKey]
			
			// 跳过空字符串和占位符
			if(!defaultStr || !targetStr || targetStr === '[TO_TRANSLATE]' || targetStr === '[TRANSLATION_FAILED]') {
				continue
			}
			
			// 检查是否包含需要翻译的文本片段
			if(resultStr.indexOf(defaultStr) !== -1) {
				// 使用正则表达式全局替换所有匹配项
				// 使用 \b 单词边界可能不适用于中文，所以直接替换
				let regex = new RegExp(this.escapeRegExp(defaultStr), 'g')
				resultStr = resultStr.replace(regex, targetStr)
				hasReplaced = true
			}
		}
		
		if(hasReplaced) {
			label.lbl.string = resultStr
			return true
		}
		
		return false 
	}
	
	/**
	 * 转义正则表达式特殊字符
	 */
	private escapeRegExp(str: string): string {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	}


	get(key:string) {
		for(let lang of this.langs_) {
			if(lang.key == key) {
				return lang[this.langKey] || lang[this.defaultKey]
			}
		}
		return key
	}

	private langKey_:string
	get langKey() {
		return this.langKey_
	}
	set langKey(v) {
		this.langKey_ = v
		for(let lbl of this.labels_) {
			this.updateLabel(lbl)
		}
	}
}