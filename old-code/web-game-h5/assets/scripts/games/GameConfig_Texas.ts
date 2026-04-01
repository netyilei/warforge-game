


export namespace GameConfig_Texas {
	export let config:tGameConfig = {
		game_name:"德州扑克",
		lobby_setting:{
			water:true, 
			
			user_count:[8],
			user_count_title:"人数",
			user_count_default:8,

			ju_count:[
				
			],

			ju_count_title:"局数",
			base_score:[1,2,3,5],
			base_score_title:"底分",

			spend_money_type:"房卡",

			extension:[
				{
					key : "hu_kind",
					type : "normal",
					title : "玩法",
					names : ["底注","双大盲","抓位"],
					group : 0,
					defaults : [1]
				},
				{
					key : "hu_kind",
					type : "mutex",
					title : "牌型",
					names : ["长牌","短牌"],
					group : 1,
					defaults : [1]
				},
				{
					key : "hu_kind",
					type : "int",
					title : "操作超时",
					names : [],
					group : 3,
					defaults : [30]
				},
				{
					key : "hu_kind",
					type : "int",
					title : "持续时长",
					names : [],
					group : 4,
					defaults : [30]
				},
				{
					key : "hu_kind",
					type : "int",
					title : "持续时长",
					names : [],
					group : 4,
					defaults : [30]
				},
				{
					key : "hu_kind",
					type : "int",
					title : "底注",
					names : [],
					group : 5,
					defaults : [1]
				},
				{
					key : "hu_kind",
					type : "int",
					title : "小盲",
					names : [],
					group : 6,
					defaults : [2]
				},
				{
					key : "hu_kind",
					type : "int",
					title : "最小买入",
					names : [],
					group : 7,
					defaults : [100]
				},
				{
					key : "hu_kind",
					type : "int",
					title : "最大买入",
					names : [],
					group : 8,
					defaults : [2000]
				},
			],
		}
	}
	export let gameID = 101
}
