import Foldout from "../../core/ui/Foldout";
import { UIBase } from "../../core/ui/UIBase";
import { ButtonCheckBox } from "../../widget/ButtonCheckBox";


const { ccclass, property, menu } = cc._decorator


let langs = [
	// "zh_CN",
	"en_US",
	"zh_TW",
]
@ccclass
@menu('cpp/lobby/SettingLayer')
export default class SettingLayer extends UIBase {
	@property(ButtonCheckBox)
	checkEffect:ButtonCheckBox = null
	@property(ButtonCheckBox)
	checkBG:ButtonCheckBox = null
	@property(Foldout)
	foldoutLang:Foldout = null

	onPush(...params: any[]): void {
		this.checkEffect.isChecked = kcore.audio.effectEnabled
		this.checkEffect.setFunc((isChecked)=>{
			kcore.audio.effectEnabled = isChecked
		})

		this.checkBG.isChecked = kcore.audio.musicEnabled
		this.checkBG.setFunc((isChecked)=>{
			kcore.audio.musicEnabled = isChecked
		})

		// let idx = kcore.storage.getValue("lang") || 0
		let idx = langs.indexOf(kcore.storage.getValue("langKey")) || 0
		// this.foldoutLang.setup(["简体中文","English","繁體中文"],idx,(idx,content)=>{
		// 	kcore.storage.setValue("lang",idx)
		// 	kcore.storage.setValue("langKey",langs[idx])
		// 	kcore.lang && (kcore.lang.langKey = langs[idx])
		// 	// vtodo: 语言切换
		// 	kcore.tip.push("提示","语言设置已更改，重启应用后生效",1,()=>{
		// 		cc.game.restart()
		// 	})
		// })
		this.foldoutLang.setup(["English","繁體中文"],idx,(idx,content)=>{
			kcore.storage.setValue("lang",idx)
			kcore.storage.setValue("langKey",langs[idx])
			kcore.lang && (kcore.lang.langKey = langs[idx])
			// vtodo: 语言切换
			kcore.tip.push("提示","语言设置已更改，重启应用后生效",1,()=>{
				cc.game.restart()
			})
		})
	}
}