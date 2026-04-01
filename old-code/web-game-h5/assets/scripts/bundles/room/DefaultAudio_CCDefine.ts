const { ccclass, property, menu } = cc._decorator

export namespace DefaultAudio_CCDefine {
	enum AudioLoadMode {
		Normal,				// 播放加载,clip为空
		PreloadBackground,	// 后台加载，加载完成前无法播放
		PreloadForce,		// 强制预加载
	}
	export const ccDefaultAudioClipDefine = cc.Class({
		name:"ccDefaultAudioClipDefine",
		properties:{
			name:{
				default:"name",
			},
			assetName:{
				default:"name",
			},
			clip:{
				type:cc.AudioClip,
				default:null,
			},
			loadMode:{
				type:cc.Enum(AudioLoadMode),
				default:AudioLoadMode.Normal,
			}
		}
	})
	export const ccDefaultAudioThemeDefine = cc.Class({
		name:"ccDefaultAudioThemeDefine",
		properties:{
			theme:{
				default:"default_theme",
			},
			desc:{
				default:"描述"
			},
			basePathInBundle:{
				tooltip:"斜杠/结尾",
				default:"xx/xx"
			},
			clips:{
				type:[ccDefaultAudioClipDefine],
				default:[]
			}
		}
	})
	export type DefaultAudioThemeDefine = krenderer.IAudioThemeDefine
}
