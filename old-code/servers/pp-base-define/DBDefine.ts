

export namespace DBDefine {
	export const db = "pp"
	
	export let dbLogin = "login"
	export let tableUserLoginData = "t_login_data"
	export let tablePromoteRelation = "t_promote_relation"
	export let tableUserChainCharge = "t_user_chain_charge_config"
	
	export let dbRecord = "record"
	export let tableLoginRecord = "t_login_record"

	export let dbKey = "kv"

	export let dbAccount = "account"
	export let tableSerial = "t_serial"
	export let tableSerialClub = "t_serial_club"
	export let tableClubMemberRecord = "t_serial_club_member"
	export let tableRewardPlan = "t_reward_plan"

	export let tableUserMail = "t_user_mail"
	export let tableSystemMail = "t_system_mail"
	export let tableUserMailSystemSeq = "t_user_mail_system_seq"

	export let dbRoom = "room"
	export let tableRoom = "t_room"
	export let tableRoomRealtime = "t_room_realtime"
	export let tableRoomRecord = "t_room_record"
	export let tableRoomRobotSupport = "t_room_robot_support"
	export let tableBill = "t_bill"
	export let tableRoundBill = "t_bill_round"
	export let tableFupan = "t_fupan"
	export let tableSerialRoom = "t_serial_room"
	export let tableExtValueEarn = "t_ext_value_earn"
	export let tableGameStepRecord = "t_game_step_record"
	export let rTableGameStepRecord = "t_game_step_record"
	export let tableRoomUserScores = "t_room_user_scores"

	export let dbClub = "club"
	export let tableClubData = "t_club_data"
	export let tableClubUserAccount = "t_club_user_account"
	export let tableClubRoomTemplate = "t_club_template"
	export let tableClubMember = "t_club_member"
	export let tableClubRelation = "t_club_relation"
	export let tableClubDeskCost = "t_club_desk_cost"
	export let tableClubSetting = "t_club_setting"
	export let tableClubReq = "t_club_join_req"
	export let tableClubInvite = "t_club_join_invite"
	export let tableClubRewardPlan = "t_club_reward_plan"
	export let rTableGlobalReward = "t_reward_global_id"

	export let dbGroup = "group"
	export let tableGroupData = "t_group_data"

	export let dbMatch = "match"
	export let tableMatchData = "t_match_data"
	export let tableMatchAward = "t_match_award"
	export let tableMatchBlindLevel = "t_match_blind_level"
	export let tableMatchJoinRecord = "t_match_join_record"
	export let tableMatchRank = "t_match_rank"

	export let dbGM = "gm"
	export let tableGMAdminUsers = "t_gm_account"

	export let tableUserPlayAction = "t_user_play_action"
	export let tableChainRequest = "t_chain_request"
	export let tableCollectTask = "t_collect_task"
	export let tableAddressBook = "t_chain_address_book"
	export let tableWithdrawReq = "t_withdraw_request"
	export let rTableWithdrawConfig = "t_withdraw_config"
	export let tableChainChargePSNotify = "t_chain_charge_ps_notify"
	export let tableChainChargeRecord = "t_chain_charge_record"
	export let tableChainWithdrawRecord = "t_chain_withdraw_record"



	export let tableRobotRuntime = "t_robot_runtime"
	export let tableRobotPersonlityGameConfig = "t_robot_personality"
	export let rTableIsRobot = "t_robot_is"
	export let rTableRobotEnvConfig = "t_robot_env_config"
	export let tableRobotStrategyConfig = "t_robot_strategy"
	export let tableRobotStrategyTask = "t_robot_strategy_task"
	export let tableRobotStrategyTaskRecord = "t_robot_strategy_task_record"
	export let tableRobotGameSerial = "t_robot_game_serial"
	export let tableRobotStoreValue = "t_robot_store_value"
	export let tableRobotUseStoreValueRecord = "t_robot_store_value_use_record"


	export let tableConfigItems = "t_config_items"
	export let tableConfigTasks = "t_config_tasks"
	export let rTableConfigLobby = "t_config_lobby"
	export let keyConfigItemCsv = "item-csv"
	export let keyConfigItemNeedRefresh = "item-need-refresh"
	export let keyConfigLottery = "lottery"
	export let keyConfigLotteryControl = "lottery-control"
	export let keyConfigCheckin = "checkin"
	export let tableUserLotteryRealtime = "t_user_lottery_realtimes"
	export let tableUserActionRealtime = "t_user_action_realtimes"
	export let tableUserCheckin = "t_user_checkin"
	export let tableUserLotteryRewardCache = "t_user_lottery_reward_cache"

	export let tableProcessAction = "t_process_action"
	export let tableProcessActionHistory = "t_process_action_history"

	export let rTableLooper = "t_looper"
	//redis
	export let redisTableMatchProcessCache = "t_match_process_cache"
	export let redisTableMatchRank = "t_match_rank"
}