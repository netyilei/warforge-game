
// origin define
declare type tGameConfigExtension = {
	key?:string,
	type?:string,
	title?:string,
	names?:string[],
	group?:number,
	lineMaxCount?:number,
	defaults?:number[],

	user_count?:number,
}
declare type tGameConfigLobbySetting = {
	user_count:number[],
	user_count_title:string,
	user_count_default:number,

	water?:boolean,

	ju_count:{
		type:string,
		count:number[],
		spend:number[],
		user_count:number,
	}[],

	ju_count_title:string,
	base_score:number[],
	base_score_title:string,

	spend_money_type:string,

	extension:tGameConfigExtension[],
}
declare type tGameConfig = {
	game_name:string
	lobby_setting:tGameConfigLobbySetting
}

// parsed define:
declare type tParsedGameConfigLobbySetting = {
	user_count:number,
	user_count_title:string,
	user_count_default:number,

	water?:boolean,
	
	ju_count:{
		type:string,
		count:number[],
		spend:number[],
		user_count:number,
	},

	ju_count_title:string,
	base_score:number[],
	base_score_title:string,

	spend_money_type:string,

	extension:Map<number,tGameConfigExtension>,
}

declare type tParsedGameConfig = {
	game_name?:string
	lobby_setting?:tParsedGameConfigLobbySetting
}
