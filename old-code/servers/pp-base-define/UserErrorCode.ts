

export enum UserErrorCode {
	Success 				= 0x000000,

	// 小于 0x001000 的需要重新登录
	SystemError				= 0x000001,
	AKVerifyError			= 0x000010,
	GetLoginDataFailed		= 0x000011,
	CreateUserInfoFailed	= 0x000012,

	ErrorLogin				= 0x001000,
	Login_WrongPhoneNumber 	= 0x001001,
	Login_WrongPassword		= 0x001002,
	Login_NoAccount			= 0x001003,
	Login_WrongAreaID		= 0x001004,
	Login_WechatAuth		= 0x001050,
	Login_BindFailed		= 0x001060,

	ErrorRegister			= 0x002000,
	Register_Exist			= 0x002001,


	ErrorLobby				= 0x011000,
	Lobby_GetUserInfoFailed = 0x011001,
	Lobby_BindAdFailed		= 0x011002,


	ErrorTea				= 0x012000,

}