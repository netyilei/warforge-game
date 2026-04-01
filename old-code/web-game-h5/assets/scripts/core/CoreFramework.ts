import { CacheManagerBase } from "./asset/CacheManagerBase";
import PrefabManager from "./asset/PrefabManager";
import { GameDefine } from "./game/GameDefineComponent";
import { LogicBase } from "./logic/LogicBase";
import { LogicSrsAction } from "./logic/LogicSrsAction";
import { BlockFactory } from "./ui/BlockFactory";
import { UIClickHelper } from "./ui/ClickHelper";
import { NodeCycle } from "./ui/DestroyOb";
import { Display } from "./ui/Display";
import { LayerTools } from "./ui/LayerTools";
import { ListViewEx } from "./ui/ListViewEx";
import { TipFunc } from "./ui/TipFunc";
import { ToastFunc } from "./ui/ToastFactory";
import { UIActions } from "./ui/UIActions";
import UIManager from "./ui/UIManager";
import { rcAsync } from "./utils/asyncUtils";
import { rcCrypto } from "./utils/CryptoDefault";
import { rcCryptoEmpty } from "./utils/CryptoEmpty";
import { rcEventDispatcher } from "./utils/EventDispatcher";
import { FileUtils } from "./utils/FileUtils";
import { rcFlag } from "./utils/Flag";
import { rcConsole, rcLog } from "./utils/Log";
import { PageLimitCaller } from "./utils/PageLimitCaller";
import { rcData } from "./utils/rcData";
import { rcStorage } from "./utils/Storage";
import { rcApis, rcUtils } from "./utils/Utils";
import { ValueFocusDecorator_FocusSetup } from "./value/ValueFocus";
import VMultiLangLabel from "./vmulti/VMultiLangLabel";
import VMultiLangManager from "./vmulti/VMultiLangManager";
import { DCN } from "./web/DCN";
import { gnet } from "./web/gnet";
import { rcHttp, rcHttpAK } from "./web/http";
import { Tcp, TcpEvent } from "./web/Tcp";

export namespace CoreFramework {
	export function initEnv(rootNode:cc.Node) {
		window["kcore"] = window["kcore"] || <any>{}
		window["krenderer"] = window["krenderer"] || <any>{}
		window["kroom"] = window["kroom"] || <any>{}
		let ui = kcore.ui
		let audio = kcore.audio
		let bundle = kcore.bundle
		window["kcore"] = {
			utils:rcUtils,
			api:rcApis,
			file:FileUtils,
			ui:ui,
			uiactions:UIActions,
			nodeCycle:NodeCycle,
			audio:audio,
			log:rcLog,
			logConfig:{
				withDate:false,
				forceConsole:false,
				dispLog:false,
				dispStackLog:false,
				closeLog:false,
			},
			disp:()=>{
				return new rcEventDispatcher()
			},
			tip:TipFunc,
			award:{push:(param)=>{UIManager.instance.push("AwardLayer",param)}},
			block:BlockFactory,
			toast:ToastFunc,
			prefab:PrefabManager.instance,
			display:Display,
			cache:new CacheManagerBase(rootNode),
			data:rcData,
			bundle:bundle,
			bundleProgressDataPath:"bundle/progress",
			storage:rcStorage,
			ConvertType:{
				LS_to_LS: 0,
				LS_to_PS: 1,
				PS_to_PS: 2,
				PS_to_LS: 3,
				["0"]: "PS_to_LS",
				["1"]: "LS_to_PS",
				["2"]: "PS_to_PS",
				["3"]: "PS_to_LS",
			},
			click:UIClickHelper,
			async:rcAsync,
			http:rcHttp,
			httpAK:rcHttpAK,
			crypto:rcCryptoEmpty, 
			logic:null,
			flag:(n)=>{
				return new rcFlag(n)
			},

			lang:VMultiLangManager.instance,

			SHAKFuncs:{
				req:(path:string,blockContent?:string)=>{
					return async (jsonObj)=>{
						let block = !(kcore.SHAKFuncs.ignoreBlock || kcore.SHAKFuncs.ignoreBlockPathList.includes(path))
						let res = await kcore.httpAK.postJson({
							path,data:jsonObj,ignoreAK:true,
							block:block ? (blockContent || kcore.SHAKFuncs.blockContent) : null,
							blockForceShow:!kcore.SHAKFuncs.blockDelayShow,
						})
						return res ? res.data : null
					}
				},
				reqAK:(path:string,blockContent?:string)=>{
					return async (jsonObj)=>{
						let block = !(kcore.SHAKFuncs.ignoreBlock || kcore.SHAKFuncs.ignoreBlockPathList.includes(path))
						let res = await kcore.httpAK.postJson({
							path,data:jsonObj,ignoreAK:false,
							block:block ? (blockContent || kcore.SHAKFuncs.blockContent) : null,
							blockForceShow:!kcore.SHAKFuncs.blockDelayShow,
						})
						return res ? res.data : null
					}
				},
				reqCustomer:(path:string,blockContent?:string)=>{
					return async (jsonObj)=>{
						let block = !(kcore.SHAKFuncs.ignoreBlock || kcore.SHAKFuncs.ignoreBlockPathList.includes(path))
						let res = await kcore.httpAK.postCustomerJson({
							path,data:jsonObj,ignoreAK:false,
							block:block ? (blockContent || kcore.SHAKFuncs.blockContent) : null,
							blockForceShow:!kcore.SHAKFuncs.blockDelayShow,
						})
						return res ? res.data : null
					}
				},
				blockContent:"正在请求",
				blockDelayShow:false,
				ignoreBlock:false,
				ignoreBlockPathList:[],
			},

			LogicBase,
			LogicSrsAction,
			
			Tcp,
			TcpEvent,

			gnet,

			LayerState:{
				None:0,
				Login:1,
				Lobby:2,
				Game:3,
				Tea:4,
				
				["0"]: "None",
				["1"]: "Login",
				["2"]: "Lobby", 
				["3"]: "Game",
				["4"]: "Tea",
			},
			layer:LayerTools,

			game:GameDefine,

			dcn:DCN,

			club:null,

			ListViewEx:ListViewEx,
			PageLimitCaller:PageLimitCaller,

			VMultiLangLabel:VMultiLangLabel,
		}

		window["UIType"] = {
			Board: 0,
			HalfBoard: 1,
			Normal: 2,
			Normal2: 3,

			Drop: 4,		// static 
			DropAni: 5,		// static 
			ScreenShot: 6,
			Guide: 7,
			Group: 8,		// static 
			Tip: 9,
			Dialog: 10,
			MatchTip: 11,	// static 
			Toast: 12,
			Announce: 13,

			ComAD: 14,
			Block: 15,
			Top: 16,

			TypeEnd: 17,

			["0"]: "Board",
			["1"]: "HalfBoard",
			["2"]: "Normal",
			["3"]: "Normal2",

			["4"]: "Drop",		// static 
			["5"]: "DropAni",		// static 
			["6"]: "ScreenShot",
			["7"]: "Guide",
			["8"]: "Group",		// static 
			["9"]: "Tip",
			["10"]: "Dialog",
			["11"]: "MatchTip",	// static 
			["12"]: "Toast",
			["13"]: "Announce",

			["14"]: "ComAD",
			["15"]: "Block",
			["16"]: "Top",

			["17"]: "TypeEnd",
		}
		window["UINodeEvent"] = {
			OnTop: "_ex_node_event_top_",
		}

		window["krenderer"].RType = {
			Card:0,
			HandCards:1,
			Background:2,
			Timer:3,
			CardBack:4,
			

			["0"]:"Card",
			["1"]:"HandCards",
			["2"]:"Background",
			["3"]:"Timer",
			["4"]:"CardBack",


		}
		window["krenderer"].CardLevel = {
			None:0,
			Small:1,
			Big:2,
			Special:3,
			

			["0"]:"None",
			["1"]:"Small",
			["2"]:"Big",
			["3"]:"Special",

		}
		window["krenderer"].CardEvent = {
			Click:"CardEvent_Click",
			TouchStart:"CardEvent_TouchStart",
			TouchMove:"CardEvent_TouchMove",
			TouchEnd:"CardEvent_TouchEnd",
			DragStart:"CardEvent_DragStart",
			DragMove:"CardEvent_DragMove",
			DragEnd:"CardEvent_DragEnd",
		}
		window["krenderer"].HandCardsEvent = {
			Select:"HandCardsEvent_Select",
		}
		window["krenderer"].AtlasEvent = {
			OnSkinChanged:"AtlasEvent_OnSkinChanged",
		}
		window["krenderer"].AudioLoadMode = {
			Normal:0,
			PreloadBackground:1,
			ForcePreload:2,

			["0"]:"Normal",
			["1"]:"PreloadBackground",
			["2"]:"ForcePreload",
		}
		window["krenderer"].AniStatus = {
			Idle:0,
			Move:1,
			End:2,

			["0"]:"Idle",
			["1"]:"Move",
			["2"]:"End",
		}

		window["krenderer"].AniPlayType = {
			Loop:0,
			Destroy:1,

			["0"]:"Loop",
			["1"]:"Destroy",
		}

	
		window["kroom"].GameLayerAniPos = {
			Board:0,
			Middle:1,
			Top:2,

			["0"]:"Board",
			["1"]:"Middle",
			["2"]:"Top",
		}
		
		window["kroom"].env = {
			bundleName:null,
			gameLayer:null,
		}

		
		window["kbundle"] = {
			StartComponentPrefabName: "bundle_init"
		}
	}
}

