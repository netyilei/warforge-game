
export namespace UserFlagDefine {
	export const SrsServerTag = "srs-server-tag"
	export const RoomID = "room-id"
	export const GroupID = "user-group-id"
	export const MatchID = "match-id"
	export const MatchGroupType = "match-group-type"
	export const CompanyTest = "company-test"

	export const Mail = "email"
	export const NewMail = "new-mail"
	export const NewOrder = "new-order"

	export const UserGameName = "user-game-name"

	// 玩家最后进入的茶馆ID
	export const LastTea = "user-last-tea"
	// 记录玩家最后进入的茶馆ID
	export const RealLastTea = "user-real-last-tea"

	export const InvisibleSameTypeTea = "user-invisible-st-tea"

	// 玩家红包状态
	export const NewRedUser = "user-new-red-user"
	
	export const ClubID = "user-club-id"

	// 用户信息锁定
	export const LoginDataLocked = "user-lock-login-data"

	export const SocialID = "user-social-id"

	export const LastGameIDs = "user-last-gameids"
	export const FavGameIDs = "user-fav-gameids"

	export const LoginTime = "user-login-time"
	export const OfflineTime = "user-offline-time"

	export const CustomerChatServer = "customer-chat-server"
	export type tGameIDs = {
		gameIDs:number[],
	}

	export const UserMailSystemSeq = "user-mail-system-seq"
}