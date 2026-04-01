import { DefaultAudio_CCDefine } from "./DefaultAudio_CCDefine"

const { ccclass, property, menu } = cc._decorator
@ccclass
@menu("game/DefaultAudio_SubDefines")
export default class DefaultAudio_SubDefines extends cc.Component {
	@property(DefaultAudio_CCDefine.ccDefaultAudioThemeDefine)
	commonDefine:DefaultAudio_CCDefine.DefaultAudioThemeDefine = null
	@property([DefaultAudio_CCDefine.ccDefaultAudioThemeDefine])
	themeDefines:DefaultAudio_CCDefine.DefaultAudioThemeDefine[] = []
}