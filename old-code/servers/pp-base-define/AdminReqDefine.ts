import { GlobalConfig } from "./GlobalConfig"
import { ItemDefine } from "./ItemDefine"
import { RewardDefine } from "./RewardDefine"
import { GroupDefine } from "./GroupDefine"
import { RoomDefine } from "./RoomDefine"
import { MailDefine } from "./MailDefine"
import { UserDefine } from "./UserDefine"
import { ClubDefine } from "./ClubDefine"
import { RobotDefine } from "./RobotDefine"
import { RobotExtDefine } from "./RobotExtDefine"
import { LeaderDefine } from "./LeaderDefine"
import { MatchDefine } from "./MatchDefine"
import { NewsDefine } from "./NewsDefine"
import { CustomerDefine } from "./CustomerDefine"
import { ChargeDefine } from "./ChargeDefine"

export namespace AdminReqDefine {
    export type ResBase = {
        errCode?: number,
        errMsg?: string,
    }

    // 全局配置
    // 获取全局配置信息
    export const ConfigGetglobal = "/config/getglobal"
    export type tConfigGetglobalReq = {
    }
    export type tConfigGetglobalRes = ResBase & {
        config: GlobalConfig.tMain,
    }

    // 设置全局配置信息
    export const ConfigSetglobal = "/config/setglobal"
    export type tConfigSetglobalReq = {
        config: GlobalConfig.tMain,
    }
    export type tConfigSetglobalRes = ResBase & {}

    // 登录配置
    // 获取登录配置信息
    export const ConfigGetlogin = "/config/getlogin"
    export type tConfigGetloginReq = {
    }
    export type tConfigGetloginRes = ResBase & {
        config: GlobalConfig.tLogin,
    }

    // 设置登录配置信息
    export const ConfigSetlogin = "/config/setlogin"
    export type tConfigSetloginReq = {
        config: GlobalConfig.tLogin,
    }
    export type tConfigSetloginRes = ResBase & {}

    // item配置
    // 获取物品配置列表
    export const ConfigItemGet = "/config/item/get"
    export type tConfigItemGetReq = {
        itemIDs?: string[],
        page: number,
        limit: number,
    }
    export type tConfigItemGetRes = ResBase & {
        datas: ItemDefine.tConfig[],
        count: number,
        needRefresh: boolean,
    }

    // 删除物品配置
    export const ConfigItemDel = "/config/item/del"
    export type tConfigItemDelReq = {
        itemID: string,
        refreshServer?: boolean,
    }
    export type tConfigItemDelRes = ResBase & {}

    // 更新物品配置
    export const ConfigItemUpdate = "/config/item/update"
    export type tConfigItemUpdateReq = {
        item: ItemDefine.tConfig,
        refreshServer?: boolean,
    }
    export type tConfigItemUpdateRes = ResBase & {}

    // 创建物品配置
    export const ConfigItemCreate = "/config/item/create"
    export type tConfigItemCreateReq = {
        item: ItemDefine.tConfig,
        refreshServer?: boolean,
    }
    export type tConfigItemCreateRes = ResBase & {}

    // 刷新物品缓存
    export const ConfigItemRefresh = "/config/item/refresh"
    export type tConfigItemRefreshReq = {
    }
    export type tConfigItemRefreshRes = ResBase & {}

    // 抽水配置
    // 设置好友抽水配置
    export const ConfigSetfriendwater = "/config/setfriendwater"
    export type tConfigSetfriendwaterReq = {
        water: RewardDefine.tFriendWater,
    }
    export type tConfigSetfriendwaterRes = ResBase & {}

    // 获取好友抽水配置
    export const ConfigGetfriendwater = "/config/getfriendwater"
    export type tConfigGetfriendwaterReq = {
    }
    export type tConfigGetfriendwaterRes = ResBase & {
        water: RewardDefine.tFriendWater,
    }

    // 设置默认匹配抽水配置
    export const ConfigSetdefaultgroupwater = "/config/setdefaultgroupwater"
    export type tConfigSetdefaultgroupwaterReq = {
        water: RewardDefine.tGroupWater,
    }
    export type tConfigSetdefaultgroupwaterRes = ResBase & {}

    // 获取默认匹配抽水配置
    export const ConfigGetdefaultgroupwater = "/config/getdefaultgroupwater"
    export type tConfigGetdefaultgroupwaterReq = {
    }
    export type tConfigGetdefaultgroupwaterRes = ResBase & {
        water: RewardDefine.tGroupWater,
    }

    // 设置默认比赛抽水配置
    export const ConfigSetdefaultmatchwater = "/config/setdefaultmatchwater"
    export type tConfigSetdefaultmatchwaterReq = {
        water: RewardDefine.tMatchWater,
    }
    export type tConfigSetdefaultmatchwaterRes = ResBase & {}

    // 获取默认比赛抽水配置
    export const ConfigGetdefaultmatchwater = "/config/getdefaultmatchwater"
    export type tConfigGetdefaultmatchwaterReq = {
    }
    export type tConfigGetdefaultmatchwaterRes = ResBase & {
        water: RewardDefine.tMatchWater,
    }

    // 充值奖励配置
    // 设置全局充值奖励配置
    export const ConfigSetglobalchargereward = "/config/setglobalchargereward"
    export type tConfigSetglobalchargerewardReq = {
        charge: RewardDefine.tCharge,
    }
    export type tConfigSetglobalchargerewardRes = ResBase & {}

    // 获取全局充值奖励配置
    export const ConfigGetglobalchargereward = "/config/getglobalchargereward"
    export type tConfigGetglobalchargerewardReq = {
    }
    export type tConfigGetglobalchargerewardRes = ResBase & {
        charge: RewardDefine.tCharge,
    }

    // 匹配管理
    // 获取匹配列表
    export const MgrGetgroups = "/mgr/getgroups"
    export type tMgrGetgroupsReq = {
    }
    export type tMgrGetgroupsRes = ResBase & {
        groups: GroupDefine.tData[],
        waters: RewardDefine.tGroupWater[],
    }

    // 创建匹配
    export const MgrCreategroup = "/mgr/creategroup"
    export type tMgrCreategroupReq = {
        groupData: GroupDefine.tData,
        water?: RewardDefine.tGroupWater,
    }
    export type tMgrCreategroupRes = ResBase & {
        groupData: GroupDefine.tData,
        water: RewardDefine.tGroupWater,
    }

    // 更新匹配数据
    export const MgrUpdategroup = "/mgr/updategroup"
    export type tMgrUpdategroupReq = {
        groupData: GroupDefine.tData,
    }
    export type tMgrUpdategroupRes = ResBase & {}

    // 更新匹配抽水配置
    export const MgrUpdategroupWater = "/mgr/updategroupwater"
    export type tMgrUpdategroupWaterReq = {
        water: RewardDefine.tGroupWater,
    }
    export type tMgrUpdategroupWaterRes = ResBase & {}

    // 删除匹配
    export const MgrDelgroup = "/mgr/delgroup"
    export type tMgrDelgroupReq = {
        groupID: number,
    }
    export type tMgrDelgroupRes = ResBase & {}

    // 房间管理
    // 获取所有房间列表
    export const MgrGetallrooms = "/mgr/getallrooms"
    export type tMgrGetallroomsReq = {
        groupID?: number,
        matchID?: number,
        page: number,
        limit: number,
    }
    export type tMgrGetallroomsRes = ResBase & {
        datas: {
            data: RoomDefine.RoomData,
            realtime?: RoomDefine.RoomRealtime,
        }[],
        count: number,
    }

    // 解散房间
    export const MgrJiesanroom = "/mgr/jiesanroom"
    export type tMgrJiesanroomReq = {
        roomID: number,
        removeType: RoomDefine.RemoveType,
    }
    export type tMgrJiesanroomRes = ResBase & {}

    // 邮件管理
    // 发送系统邮件
    export const MgrSendsystemmail = "/mgr/sendsystemmail"
    export type tMgrSendsystemmailReq = {
        title: string,
        content: string,
        reason?: string,
        attachs?: MailDefine.tMailAttach[],
    }
    export type tMgrSendsystemmailRes = ResBase & {}

    // 发送用户邮件
    export const MgrSendusermail = "/mgr/sendusermail"
    export type tMgrSendusermailReq = {
        userID: number,
        title: string,
        content: string,
        attachs?: MailDefine.tMailAttach[],
    }
    export type tMgrSendusermailRes = ResBase & {}

    // 用户管理
    // 获取用户列表
    export const UserGetusers = "/user/getusers"
    export type tUserGetusersReq = {
        userID?: number,
        userIDs?: number[],
        channel?: UserDefine.LoginChannel,
        target?: UserDefine.LoginTarget,
        page: number,
        limit: number,
    }
    export type tUserGetusersRes = ResBase & {
        users: {
            userID: number,
            loginData: UserDefine.tLoginData,
            loginChannels: UserDefine.tLoginChannel[],
            loginRole?: UserDefine.tLoginRole,
            bag?: ItemDefine.tBag,
            balance?: LeaderDefine.tBalance,
        }[],
        count: number,
    }

    // 获取用户背包
    export const UserGetuserbags = "/user/getuserbags"
    export type tUserGetuserbagsReq = {
        userID?: number,
        page: number,
        limit: number,
    }
    export type tUserGetuserbagsRes = ResBase & {
        datas: ItemDefine.tBag[],
        count: number,
    }

    // 获取用户冻结账户
    export const UserGetuserlocked = "/user/getuserlocked"
    export type tUserGetuserlockedReq = {
        userID?: number,
        clubID?: number,
        roomID?: number,
        lockID?: string,
        page: number,
        limit: number,
    }
    export type tUserGetuserlockedRes = ResBase & {
        datas: ItemDefine.tLock[],
        count: number,
    }

    // 创建冻结项目
    export const UserCreatelockitem = "/user/createlockitem"
    export type tUserCreatelockitemReq = {
        userID: number,
        lockID: string,
        itemID?: string,
        clubID?: number,
        valueIndex?: number,
        count: number,
        serialType: ItemDefine.SerialType,
    }
    export type tUserCreatelockitemRes = ResBase & {}

    // 给用户增加物品
    export const UserAdduseritem = "/user/adduseritem"
    export type tUserAdduseritemReq = {
        userID: number,
        itemID: string,
        count: number,
        lockID?: string,
        serialType?: ItemDefine.SerialType,
    }
    export type tUserAdduseritemRes = ResBase & {
        account?: ItemDefine.tBag,
    }

    // 给用户增加俱乐部数值
    export const UserAdduserclubvalue = "/user/adduserclubvalue"
    export type tUserAdduserclubvalueReq = {
        clubID: number,
        userID: number,
        valueIndex: ClubDefine.ValueIndex,
        count: number,
        lockID?: string,
        serialType?: ItemDefine.SerialType,
    }
    export type tUserAdduserclubvalueRes = ResBase & {
        account?: ClubDefine.tUserAccount,
    }

    // 解冻用户账户
    export const UserUnlock = "/user/unlock"
    export type tUserUnlockReq = {
        clubID?: number,
        userID: number,
        lockID: string,
        serialType?: ItemDefine.SerialType,
    }
    export type tUserUnlockRes = ResBase & {}

    // 根据道具数量获取用户列表
    export const UserGetuserswithvalue = "/user/getuserswithvalue"
    export type tUserGetuserswithvalueReq = {
        userID?: number,
        userIDs?: number[],
        itemID: string,
        minValue?: string | number,
        sort: "asc" | "desc",
        page: number,
        limit: number,
    }
    export type tUserGetuserswithvalueRes = ResBase & {
        users: {
            userID: number,
            loginData: UserDefine.tLoginData,
            loginChannels: UserDefine.tLoginChannel[],
            loginRole?: UserDefine.tLoginRole,
            bag?: ItemDefine.tBag,
            bagData?: {
                userID: number,
                itemID: string,
                count: string,
                countNum: number,
            },
            balance?: LeaderDefine.tBalance,
        }[],
        count: number,
    }

    // 获取用户流水记录
    export const UserGetserials = "/user/getserials"
    export type tUserGetserialsReq = {
        userIDs?: number[],
        serialType?: ItemDefine.SerialType,
        setup?: boolean,
        itemID?: string,
        page: number,
        limit: number,
    }
    export type tUserGetserialsRes = ResBase & {
        count: number,
        datas: ItemDefine.tSerial[],
    }

    // 更改用户可以登录的平台 App或者后台
    export const UserChangelogintarget = "/user/changelogintarget"
    export type tUserChangelogintargetReq = {
        userID: number,
        target: UserDefine.LoginTarget,
        b: boolean, // true - 添加 false - 删除
    }
    export type tUserChangelogintargetRes = ResBase & {
        loginRole: UserDefine.tLoginRole,
    }

    // 更改用户在某个登录平台的权限
    export const UserChangetargetrole = "/user/changetargetrole"
    export type tUserChangetargetroleReq = {
        userID: number,
        target: UserDefine.LoginTarget,
        role: UserDefine.RoleType,
        b: boolean, // true - 添加 false - 删除
    }
    export type tUserChangetargetroleRes = ResBase & {
        loginRole: UserDefine.tLoginRole,
    }

    // 创建账户
    export const UserCreateaccount = "/user/createaccount"
    export type tUserCreateaccountReq = {
        account: string,
        pwdMD5: string,
        target: UserDefine.LoginTarget,
    }
    export type tUserCreateaccountRes = ResBase & {
        loginData: UserDefine.tLoginData,
    }

    // 修改密码
    export const UserChangepwd = "/user/changepwd"
    export type tUserChangepwdReq = {
        userID: number,
        pwdMD5: string,
    }
    export type tUserChangepwdRes = ResBase & {}

    // 注册审核
    // 获取注册审核列表
    export const UserAuditGetregisteraudits = "/user/audit/getregisteraudits"
    export type tUserAuditGetregisterauditsReq = {
        account?: string,
        confirm?: boolean,
        oper?: boolean,
        page: number,
        limit: number,
    }
    export type tUserAuditGetregisterauditsRes = ResBase & {
        count: number,
        datas: UserDefine.tRegisterAudit[],
    }

    // 确认注册审核
    export const UserAuditConfirmregisteraudit = "/user/audit/confirmregisteraudit"
    export type tUserAuditConfirmregisterauditReq = {
        no: number,
        confirm: boolean,
    }
    export type tUserAuditConfirmregisterauditRes = ResBase & {
        success: true,
    }

    // 获取注册审核中上传的数据（base64）
    export const UserAuditGetregisterauditupload = "/user/audit/getregisterauditupload"
    export type tUserAuditGetregisteraudituploadReq = {
        no: number,
    }
    export type tUserAuditGetregisteraudituploadRes = ResBase & {
        base64Data: string,
    }

    // 比赛管理
    // 获取比赛列表
    export const MatchGetmatchlist = "/match/getmatchlist"
    export type tMatchGetmatchlistReq = {
        matchIDs?: number[],
        name?: string,
        gameID?: number,
        status?: MatchDefine.MatchStatus,
        statuss?: MatchDefine.MatchStatus[],
        page: number,
        limit: number,
    }
    export type tMatchGetmatchlistRes = ResBase & {
        count: number,
        datas: {
            data: MatchDefine.tData,
            display?: MatchDefine.tDisplay,
            reward?: MatchDefine.tReward,
            water?: MatchDefine.tWater,
        }[],
    }

    // 创建比赛
    export const MatchCreatematch = "/match/creatematch"
    export type tMatchCreatematchReq = {
        data: MatchDefine.tData,
        display: MatchDefine.tDisplay,
        reward: MatchDefine.tReward,
        water?: MatchDefine.tWater,
    }
    export type tMatchCreatematchRes = ResBase & {
        matchID: number,
    }

    // 删除比赛
    export const MatchDelmatch = "/match/delmatch"
    export type tMatchDelmatchReq = {
        matchID: number,
    }
    export type tMatchDelmatchRes = ResBase & {}

    // 更新比赛显示配置
    export const MatchUpdatedisplay = "/match/updatedisplay"
    export type tMatchUpdatedisplayReq = {
        display: MatchDefine.tDisplay,
    }
    export type tMatchUpdatedisplayRes = ResBase & {}

    // 更新比赛基础数据
    export const MatchUpdatedata = "/match/updatedata"
    export type tMatchUpdatedataReq = {
        data: MatchDefine.tData,
    }
    export type tMatchUpdatedataRes = ResBase & {
        data: MatchDefine.tData,
    }

    // 更新比赛奖励配置
    export const MatchUpdatereward = "/match/updatereward"
    export type tMatchUpdaterewardReq = {
        reward: MatchDefine.tReward,
    }
    export type tMatchUpdaterewardRes = ResBase & {}

    // 更新比赛抽水配置
    export const MatchUpdatewater = "/match/updatewater"
    export type tMatchUpdatewaterReq = {
        water: MatchDefine.tWater,
    }
    export type tMatchUpdatewaterRes = ResBase & {}

    // 获取用户比赛运行时数据
    export const MatchGetuserruntimes = "/match/getuserruntimes"
    export type tMatchGetuserruntimesReq = {
        matchID?: number,
        userID?: number,
        statuss?: MatchDefine.UserMatchStatus[],
        sortScore?: "asc" | "desc",
        page: number,
        limit: number,
    }
    export type tMatchGetuserruntimesRes = ResBase & {
        count: number,
        datas: MatchDefine.tUserRuntime[],
    }

    // 获取比赛排名
    export const MatchGetrank = "/match/getrank"
    export type tMatchGetrankReq = {
        matchID: number,
        page: number,
        limit: number,
    }
    export type tMatchGetrankRes = ResBase & {
        count: number,
        datas: MatchDefine.tUserRank[],
    }

    // 获取比赛报名记录
    export const MatchGetsignuprecord = "/match/getsignuprecord"
    export type tMatchGetsignuprecordReq = {
        matchID?: number,
        userID?: number,
        page: number,
        limit: number,
    }
    export type tMatchGetsignuprecordRes = ResBase & {
        count: number,
        datas: MatchDefine.tUserSignupRecord[],
    }

    // 获取比赛执行器房间信息
    export const MatchGetexecuterroominfos = "/match/getexecuterroominfos"
    export type tMatchGetexecuterroominfosReq = {
        matchID?: number,
        page: number,
        limit: number,
    }
    export type tMatchGetexecuterroominfosRes = ResBase & {
        count: number,
        datas: MatchDefine.tExecuterRoomInfo[],
    }

    // 新闻管理
    // 获取新闻列表
    export const NewsGetnews = "/news/getnews"
    export type tNewsGetnewsReq = {
        newsIDs?: string[],
        type?: NewsDefine.NewsType,
        withInvisible?: boolean,
        gmUserID?: number,
        author?: string,
        title?: string,
        abstract?: string,
        content?: string,
        page: number,
        limit: number,
    }
    export type tNewsGetnewsRes = ResBase & {
        count: number,
        datas: NewsDefine.tData[],
    }

    // 创建新闻
    export const NewsCreatenews = "/news/createnews"
    export type tNewsCreatenewsReq = {
        data: NewsDefine.tData,
    }
    export type tNewsCreatenewsRes = ResBase & {
        newsID: number,
    }

    // 更新新闻数据
    export const NewsUpdatenewsdata = "/news/updatenewsdata"
    export type tNewsUpdatenewsdataReq = {
        data: NewsDefine.tData,
    }
    export type tNewsUpdatenewsdataRes = ResBase & {}

    // 设置新闻可见性
    export const NewsSetvisible = "/news/setvisible"
    export type tNewsSetvisibleReq = {
        newsID: string,
        visible: boolean,
    }
    export type tNewsSetvisibleRes = ResBase & {}

    // 删除新闻
    export const NewsDeletenews = "/news/deletenews"
    export type tNewsDeletenewsReq = {
        newsID: string,
    }
    export type tNewsDeletenewsRes = ResBase & {}

    // 获取横幅列表
    export const NewsGetbanners = "/news/getbanners"
    export type tNewsGetbannersReq = {
        withInvisible?: boolean,
        page: number,
        limit: number,
    }
    export type tNewsGetbannersRes = ResBase & {
        datas: NewsDefine.tBanner[],
        count: number,
    }

    // 创建横幅
    export const NewsCreatebanner = "/news/createbanner"
    export type tNewsCreatebannerReq = {
        banner: NewsDefine.tBanner,
    }
    export type tNewsCreatebannerRes = ResBase & {
        bannerID: number,
    }

    // 更新横幅
    export const NewsUpdatebanner = "/news/updatebanner"
    export type tNewsUpdatebannerReq = {
        banner: NewsDefine.tBanner,
    }
    export type tNewsUpdatebannerRes = ResBase & {}

    // 设置横幅可见性
    export const NewsSetbannervisible = "/news/setbannervisible"
    export type tNewsSetbannervisibleReq = {
        bannerID: number,
        visible: boolean,
    }
    export type tNewsSetbannervisibleRes = ResBase & {}

    // 删除横幅
    export const NewsDeletebanner = "/news/deletebanner"
    export type tNewsDeletebannerReq = {
        bannerID: number,
    }
    export type tNewsDeletebannerRes = ResBase & {}

    // 充值/提现管理 - 链信息
    export const ChargeGetchaininfos = "/charge/getchaininfos"
    export type tChargeGetchaininfosReq = {
        chainIDs?: number[],
        page: number,
        limit: number,
    }
    export type tChargeGetchaininfosRes = ResBase & {
        count: number,
        datas: ChargeDefine.tChainInfo[],
    }

    export const ChargeUpdatechaininfo = "/charge/updatechaininfo"
    export type tChargeUpdatechaininfoReq = {
        data: ChargeDefine.tChainInfo,
    }
    export type tChargeUpdatechaininfoRes = ResBase & {}

    // 充值/提现管理 - 银行信息
    export const ChargeGetbankinfos = "/charge/getbankinfos"
    export type tChargeGetbankinfosReq = {
        bankIDs?: number[],
        page: number,
        limit: number,
    }
    export type tChargeGetbankinfosRes = ResBase & {
        count: number,
        datas: ChargeDefine.tBankInfo[],
    }

    export const ChargeUpdatebankinfo = "/charge/updatebankinfo"
    export type tChargeUpdatebankinfoReq = {
        data: ChargeDefine.tBankInfo,
    }
    export type tChargeUpdatebankinfoRes = ResBase & {}

    export const ChargeGetbankbranchinfos = "/charge/getbankbranchinfos"
    export type tChargeGetbankbranchinfosReq = {
        bankIDs?: number[],
        bankBranchIDs?: number[],
        page: number,
        limit: number,
    }
    export type tChargeGetbankbranchinfosRes = ResBase & {
        count: number,
        datas: ChargeDefine.tBankBranchInfo[],
    }

    export const ChargeUpdatebankbranchinfo = "/charge/updatebankbranchinfo"
    export type tChargeUpdatebankbranchinfoReq = {
        data: ChargeDefine.tBankBranchInfo,
    }
    export type tChargeUpdatebankbranchinfoRes = ResBase & {}

    // 充值/提现管理 - PayPal信息
    export const ChargeGetpaypalinfos = "/charge/getpaypalinfos"
    export type tChargeGetpaypalinfosReq = {
        page: number,
        limit: number,
    }
    export type tChargeGetpaypalinfosRes = ResBase & {
        count: number,
        datas: ChargeDefine.tPaypayInfo[],
    }

    export const ChargeUpdatepaypalinfo = "/charge/updatepaypalinfo"
    export type tChargeUpdatepaypalinfoReq = {
        data: ChargeDefine.tPaypayInfo,
    }
    export type tChargeUpdatepaypalinfoRes = ResBase & {}

    // 充值配置 - 银行
    export const ChargeGetchargeconfig_bank = "/charge/getchargeconfig_bank"
    export type tChargeGetchargeconfig_bankReq = {
        withDisabled?: boolean,
        page: number,
        limit: number,
    }
    export type tChargeGetchargeconfig_bankRes = ResBase & {
        count: number,
        datas: ChargeDefine.tChargeBankConfig[],
    }

    export const ChargeUpdatechargeconfig_bank = "/charge/updatechargeconfig_bank"
    /** 编辑/新增时 data 可不传 typeID，由服务端生成或按主键识别 */
    export type tChargeUpdatechargeconfig_bankReq = {
        create?: boolean,
        data: Omit<ChargeDefine.tChargeBankConfig, 'typeID'> & { typeID?: number },
    }
    export type tChargeUpdatechargeconfig_bankRes = ResBase & {
        data?: ChargeDefine.tChargeBankConfig,
    }

    export const ChargeSetchargeconfigenabled_bank = "/charge/setchargeconfigenabled_bank"
    export type tChargeSetchargeconfigenabled_bankReq = {
        typeID: number,
        enabled: boolean,
    }
    export type tChargeSetchargeconfigenabled_bankRes = ResBase & {
        data: ChargeDefine.tChargeBankConfig,
    }

    // 充值配置 - 区块链
    export const ChargeGetchargeconfig_blockchain = "/charge/getchargeconfig_blockchain"
    export type tChargeGetchargeconfig_blockchainReq = {
        withDisabled?: boolean,
        page: number,
        limit: number,
    }
    export type tChargeGetchargeconfig_blockchainRes = ResBase & {
        count: number,
        datas: ChargeDefine.tChargeBlockchainConfig[],
    }

    export const ChargeUpdatechargeconfig_blockchain = "/charge/updatechargeconfig_blockchain"
    /** 编辑/新增时 data 可不传 typeID，由服务端生成或按主键识别 */
    export type tChargeUpdatechargeconfig_blockchainReq = {
        create?: boolean,
        data: Omit<ChargeDefine.tChargeBlockchainConfig, 'typeID'> & { typeID?: number },
    }
    export type tChargeUpdatechargeconfig_blockchainRes = ResBase & {
        data?: ChargeDefine.tChargeBlockchainConfig,
    }

    export const ChargeSetchargeconfigenabled_blockchain = "/charge/setchargeconfigenabled_blockchain"
    export type tChargeSetchargeconfigenabled_blockchainReq = {
        typeID: number,
        enabled: boolean,
    }
    export type tChargeSetchargeconfigenabled_blockchainRes = ResBase & {
        data: ChargeDefine.tChargeBlockchainConfig,
    }

    // 充值配置 - PayPal
    export const ChargeGetchargeconfig_paypal = "/charge/getchargeconfig_paypal"
    export type tChargeGetchargeconfig_paypalReq = {
        withDisabled?: boolean,
        page: number,
        limit: number,
    }
    export type tChargeGetchargeconfig_paypalRes = ResBase & {
        count: number,
        datas: ChargeDefine.tChargePaypalConfig[],
    }

    export const ChargeUpdatechargeconfig_paypal = "/charge/updatechargeconfig_paypal"
    /** 编辑/新增时 data 可不传 typeID，由服务端生成或按主键识别 */
    export type tChargeUpdatechargeconfig_paypalReq = {
        create?: boolean,
        data: Omit<ChargeDefine.tChargePaypalConfig, 'typeID'> & { typeID?: number },
    }
    export type tChargeUpdatechargeconfig_paypalRes = ResBase & {
        data?: ChargeDefine.tChargePaypalConfig,
    }

    export const ChargeSetchargeconfigenabled_paypal = "/charge/setchargeconfigenabled_paypal"
    export type tChargeSetchargeconfigenabled_paypalReq = {
        typeID: number,
        enabled: boolean,
    }
    export type tChargeSetchargeconfigenabled_paypalRes = ResBase & {
        data: ChargeDefine.tChargePaypalConfig,
    }

    // 充值配置 - Apple Card（与 ChargeDefine.tChargeAppleCardConfig、pp-rpc-gm/start.ts 一致）
    export const ChargeGetchargeconfig_applecard = "/charge/getchargeconfig_applecard"
    export type tChargeGetchargeconfig_applecardReq = {
        withDisabled?: boolean,
        page: number,
        limit: number,
    }
    export type tChargeGetchargeconfig_applecardRes = ResBase & {
        count: number,
        datas: ChargeDefine.tChargeAppleCardConfig[],
    }
    export const ChargeUpdatechargeconfig_applecard = "/charge/updatechargeconfig_applecard"
    /** 编辑/新增时 data 可不传 typeID，由服务端生成或按主键识别 */
    export type tChargeUpdatechargeconfig_applecardReq = {
        create?: boolean,
        data: Omit<ChargeDefine.tChargeAppleCardConfig, 'typeID'> & { typeID?: number },
    }
    export type tChargeUpdatechargeconfig_applecardRes = ResBase & {
        data?: ChargeDefine.tChargeAppleCardConfig,
    }
    export const ChargeSetchargeconfigenabled_applecard = "/charge/setchargeconfigenabled_applecard"
    export type tChargeSetchargeconfigenabled_applecardReq = {
        typeID: number,
        enabled: boolean,
    }
    export type tChargeSetchargeconfigenabled_applecardRes = ResBase & {
        data: ChargeDefine.tChargeAppleCardConfig,
    }

    // 充值/提现审核
    export const ChargeConfirmGetchargeorders = "/charge/confirm/getchargeorders"
    export type tChargeConfirmGetchargeordersReq = {
        payType?: ChargeDefine.PayType,
        statuss?: ChargeDefine.ChargeStatus[],
        page: number,
        limit: number,
    }
    export type tChargeConfirmGetchargeordersRes = ResBase & {
        count: number,
        datas: ChargeDefine.tChargeOrder[],
        balances: LeaderDefine.tBalance[],
    }

    export const ChargeConfirmGetchargeupload = "/charge/confirm/getchargeupload"
    export type tChargeConfirmGetchargeuploadReq = {
        orderID: number,
    }
    export type tChargeConfirmGetchargeuploadRes = ResBase & {
        base64Data: string,
    }

    export const ChargeConfirmConfirmchargeorder = "/charge/confirm/confirmchargeorder"
    export type tChargeConfirmConfirmchargeorderReq = {
        orderID: number,
        confirm: boolean,
        reason?: string,
        confirmAmount?: string,
        confirmItemCount?: string,
    }
    export type tChargeConfirmConfirmchargeorderRes = ResBase & {
        data?: ChargeDefine.tChargeOrder,
    }

    export const ChargeConfirmGetwithdraworders = "/charge/confirm/getwithdraworders"
    export type tChargeConfirmGetwithdrawordersReq = {
        payType?: ChargeDefine.PayType,
        statuss?: ChargeDefine.WithdrawStatus[],
        page: number,
        limit: number,
    }
    export type tChargeConfirmGetwithdrawordersRes = ResBase & {
        count: number,
        datas: ChargeDefine.tWithdrawOrder[],
        balances: LeaderDefine.tBalance[],
    }

    export const ChargeConfirmConfirmwithdraworder = "/charge/confirm/confirmwithdraworder"
    export type tChargeConfirmConfirmwithdraworderReq = {
        orderID: number,
        confirm: boolean,
        reason?: string,
    }
    export type tChargeConfirmConfirmwithdraworderRes = ResBase & {
        data?: ChargeDefine.tWithdrawOrder,
    }

    // 提现配置 - 银行
    export const ChargeGetwithdrawconfig_bank = "/charge/getwithdrawconfig_bank"
    export type tChargeGetwithdrawconfig_bankReq = {
        withDisabled?: boolean,
        page: number,
        limit: number,
    }
    export type tChargeGetwithdrawconfig_bankRes = ResBase & {
        count: number,
        datas: ChargeDefine.tWithdrawBankConfig[],
    }

    export const ChargeUpdatewithdrawconfig_bank = "/charge/updatewithdrawconfig_bank"
    export type tChargeUpdatewithdrawconfig_bankReq = {
        create?: boolean,
        data: ChargeDefine.tWithdrawBankConfig,
    }
    export type tChargeUpdatewithdrawconfig_bankRes = ResBase & {
        data?: ChargeDefine.tWithdrawBankConfig,
    }

    export const ChargeSetwithdrawconfigenabled_bank = "/charge/setwithdrawconfigenabled_bank"
    export type tChargeSetwithdrawconfigenabled_bankReq = {
        typeID: number,
        enabled: boolean,
    }
    export type tChargeSetwithdrawconfigenabled_bankRes = ResBase & {
        data: ChargeDefine.tWithdrawBankConfig,
    }

    // 提现配置 - 区块链
    export const ChargeGetwithdrawconfig_blockchain = "/charge/getwithdrawconfig_blockchain"
    export type tChargeGetwithdrawconfig_blockchainReq = {
        withDisabled?: boolean,
        page: number,
        limit: number,
    }
    export type tChargeGetwithdrawconfig_blockchainRes = ResBase & {
        count: number,
        datas: ChargeDefine.tWithdrawBlockchainConfig[],
    }

    export const ChargeUpdatewithdrawconfig_blockchain = "/charge/updatewithdrawconfig_blockchain"
    export type tChargeUpdatewithdrawconfig_blockchainReq = {
        create?: boolean,
        data: ChargeDefine.tWithdrawBlockchainConfig,
    }
    export type tChargeUpdatewithdrawconfig_blockchainRes = ResBase & {
        data?: ChargeDefine.tWithdrawBlockchainConfig,
    }

    export const ChargeSetwithdrawconfigenabled_blockchain = "/charge/setwithdrawconfigenabled_blockchain"
    export type tChargeSetwithdrawconfigenabled_blockchainReq = {
        typeID: number,
        enabled: boolean,
    }
    export type tChargeSetwithdrawconfigenabled_blockchainRes = ResBase & {
        data: ChargeDefine.tWithdrawBlockchainConfig,
    }

    // 提现配置 - PayPal
    export const ChargeGetwithdrawconfig_paypal = "/charge/getwithdrawconfig_paypal"
    export type tChargeGetwithdrawconfig_paypalReq = {
        withDisabled?: boolean,
        page: number,
        limit: number,
    }
    export type tChargeGetwithdrawconfig_paypalRes = ResBase & {
        count: number,
        datas: ChargeDefine.tWithdrawPaypalConfig[],
    }

    export const ChargeUpdatewithdrawconfig_paypal = "/charge/updatewithdrawconfig_paypal"
    export type tChargeUpdatewithdrawconfig_paypalReq = {
        create?: boolean,
        data: ChargeDefine.tWithdrawPaypalConfig,
    }
    export type tChargeUpdatewithdrawconfig_paypalRes = ResBase & {
        data?: ChargeDefine.tWithdrawPaypalConfig,
    }

    export const ChargeSetwithdrawconfigenabled_paypal = "/charge/setwithdrawconfigenabled_paypal"
    export type tChargeSetwithdrawconfigenabled_paypalReq = {
        typeID: number,
        enabled: boolean,
    }
    export type tChargeSetwithdrawconfigenabled_paypalRes = ResBase & {
        data: ChargeDefine.tWithdrawPaypalConfig,
    }

    // 奖池管理
    export const PotGetpotlist = "/pot/getpotlist"
    export type tPotGetpotlistReq = {
        userIDs?: number[],
        groupID?: number,
        matchID?: number,
        sceneType?: RewardDefine.PotSceneType,
        targetType?: RewardDefine.PotTargetType,
        withDisabled?: boolean,
        page: number,
        limit: number,
    }
    export type tPotGetpotlistRes = ResBase & {
        count: number,
        datas: RewardDefine.tPot[],
    }

    export const PotCreateforuser = "/pot/createforuser"
    export type tPotCreateforuserReq = {
        userID?: number,
        sceneType: RewardDefine.PotSceneType,
        globalMatch: boolean,
        config: RewardDefine.tPotExtConfig,
    }
    export type tPotCreateforuserRes = ResBase & {}

    export const PotCreateforgroup = "/pot/createforgroup"
    export type tPotCreateforgroupReq = {
        userID?: number,
        groupID: number,
        config: RewardDefine.tPotExtConfig,
    }
    export type tPotCreateforgroupRes = ResBase & {}

    export const PotCreateformatch = "/pot/createformatch"
    export type tPotCreateformatchReq = {
        userID?: number,
        matchID: number,
        config: RewardDefine.tPotExtConfig,
    }
    export type tPotCreateformatchRes = ResBase & {}

    export const PotUpdatepotconfig = "/pot/updatepotconfig"
    export type tPotUpdatepotconfigReq = {
        potID: number,
        config: RewardDefine.tPotExtConfig,
    }
    export type tPotUpdatepotconfigRes = ResBase & {}

    export const PotSetpotenabled = "/pot/setpotenabled"
    export type tPotSetpotenabledReq = {
        potID: number,
        enabled: boolean,
    }
    export type tPotSetpotenabledRes = ResBase & {}

    export const PotAddtotalvalue = "/pot/addtotalvalue"
    export type tPotAddtotalvalueReq = {
        potID: number,
        count: string,
    }
    export type tPotAddtotalvalueRes = ResBase & {}

    export const PotTestpot = "/pot/testpot"
    export type tPotTestpotReq = {
        index?: {
            userIDs?: number[],
            groupID?: number,
            matchID?: number,
            roomID?: number,
            observeEnabled?: boolean,
        },
    }
    export type tPotTestpotRes = ResBase & {
        pots: RewardDefine.tPot[],
        pot: RewardDefine.tPot | null,
    }

    // 机器人管理
    // 获取机器人全局开关
    export const RobotExtGetglobalcontrol = "/robot/ext/getglobalcontrol"
    export type tRobotExtGetglobalcontrolReq = {
    }
    export type tRobotExtGetglobalcontrolRes = ResBase & {
        control: RobotExtDefine.tGlobalControl,
    }

    // 设置机器人全局开关
    export const RobotExtSetglobalcontrol = "/robot/ext/setglobalcontrol"
    export type tRobotExtSetglobalcontrolReq = {
        control: RobotExtDefine.tGlobalControl,
    }
    export type tRobotExtSetglobalcontrolRes = ResBase & {}

    // 获取机器人充值库存
    export const RobotExtGetchargestore = "/robot/ext/getchargestore"
    export type tRobotExtGetchargestoreReq = {
        storeID?: number,
        itemID?: string,
        page: number,
        limit: number,
    }
    export type tRobotExtGetchargestoreRes = ResBase & {
        datas: RobotExtDefine.tChargeStore[],
        count: number,
    }

    // 获取机器人充值库存记录
    export const RobotExtGetchargestorerecord = "/robot/ext/getchargestorerecord"
    export type tRobotExtGetchargestorerecordReq = {
        storeID?: number,
        itemID?: string,
        gmUserID?: string,
        reason?: string,
        page: number,
        limit: number,
    }
    export type tRobotExtGetchargestorerecordRes = ResBase & {
        datas: RobotExtDefine.tChargeStoreRecord[],
        count: number,
    }

    // 获取机器人充值记录
    export const RobotExtGetrobotchargerecord = "/robot/ext/getrobotchargerecord"
    export type tRobotExtGetrobotchargerecordReq = {
        robotUserID?: number,
        storeID?: number,
        groupID?: string,
        matchID?: string,
        itemID?: string,
        reason?: string,
        page: number,
        limit: number,
    }
    export type tRobotExtGetrobotchargerecordRes = ResBase & {
        datas: RobotExtDefine.tChargeRecord[],
        count: number,
    }

    // 创建机器人充值库存
    export const RobotExtCreatestore = "/robot/ext/createstore"
    export type tRobotExtCreatestoreReq = {
        enabled: boolean,
        name: string,
        desc: string,
        itemID: string,
    }
    export type tRobotExtCreatestoreRes = ResBase & {
        store: RobotExtDefine.tChargeStore,
    }

    // 设置机器人充值库存启用状态
    export const RobotExtSetstoreenabled = "/robot/ext/setstoreenabled"
    export type tRobotExtSetstoreenabledReq = {
        storeID: number,
        enabled: boolean,
    }
    export type tRobotExtSetstoreenabledRes = ResBase & {
        store: RobotExtDefine.tChargeStore,
    }

    // 为机器人添加充值库存
    export const RobotExtAddchargestore = "/robot/ext/addchargestore"
    export type tRobotExtAddchargestoreReq = {
        storeID: number,
        count: string,
        reason: string,
        data?: Record<string, unknown>,
    }
    export type tRobotExtAddchargestoreRes = ResBase & {
        store: RobotExtDefine.tChargeStore,
    }

    // 获取机器人个性配置列表
    export const RobotExtGetpersonalityconfigs = "/robot/ext/getpersonalityconfigs"
    export type tRobotExtGetpersonalityconfigsReq = {
        gameID?: number,
        personality?: RobotDefine.Personality,
    }
    export type tRobotExtGetpersonalityconfigsRes = ResBase & {
        datas: RobotDefine.tPersonalityGameConfig_Base[],
    }

    // 设置机器人个性配置
    export const RobotExtSetpersonalityconfig = "/robot/ext/setpersonalityconfig"
    export type tRobotExtSetpersonalityconfigReq = {
        config: RobotDefine.tPersonalityGameConfig_Base,
    }
    export type tRobotExtSetpersonalityconfigRes = ResBase & {}

    // 删除机器人个性配置
    export const RobotExtDeletepersonalityconfig = "/robot/ext/deletepersonalityconfig"
    export type tRobotExtDeletepersonalityconfigReq = {
        gameID: number,
        personality: RobotDefine.Personality,
    }
    export type tRobotExtDeletepersonalityconfigRes = ResBase & {}

    // 获取机器人匹配计划（查看页展示全量数据，datas 为完整 tGroupPlan）
    export const RobotExtGetgrouplan = "/robot/ext/getgrouplan"
    export type tRobotExtGetgrouplanReq = {
        planID?: number,
        groupID?: number,
        withDisabled?: boolean,
        page: number,
        limit: number,
    }
    export type tRobotExtGetgrouplanRes = ResBase & {
        datas: RobotExtDefine.tGroupPlan[],
        count: number,
    }

    // 创建机器人匹配计划（plan.itemNeeded.count=触发充值数量，plan.chargeMinCount=自动充值数量(1~1.2倍随机)）
    export const RobotExtCreategrouplan = "/robot/ext/creategrouplan"
    export type tRobotExtCreategrouplanReq = {
        plan: RobotExtDefine.tGroupPlan,
    }
    export type tRobotExtCreategrouplanRes = ResBase & {
        plan: RobotExtDefine.tGroupPlan,
    }

    // 更新机器人匹配计划启用状态
    export const RobotExtUpdategrouplanenabled = "/robot/ext/updategrouplanenabled"
    export type tRobotExtUpdategrouplanenabledReq = {
        planID: number,
        enabled: boolean,
    }
    export type tRobotExtUpdategrouplanenabledRes = ResBase & {
        plan: RobotExtDefine.tGroupPlan,
    }

    // 更改机器人匹配计划权重
    export const RobotExtChangegrouplanpower = "/robot/ext/changegrouplanpower"
    export type tRobotExtChangegrouplanpowerReq = {
        planID: number,
        monopoly?: boolean,
        power?: number,
    }
    export type tRobotExtChangegrouplanpowerRes = ResBase & {
        plan: RobotExtDefine.tGroupPlan,
    }

    // 更改机器人匹配计划充值库存ID
    export const RobotExtChangegrouplanstoreid = "/robot/ext/changegrouplanstoreid"
    export type tRobotExtChangegrouplanstoreidReq = {
        planID: number,
        storeID: number,
    }
    export type tRobotExtChangegrouplanstoreidRes = ResBase & {
        plan: RobotExtDefine.tGroupPlan,
        store: RobotExtDefine.tChargeStore,
    }

    // 获取机器人比赛计划（查看页展示全量数据，datas 为完整 tMatchPlan）
    export const RobotExtGetmatchplan = "/robot/ext/getmatchplan"
    export type tRobotExtGetmatchplanReq = {
        planID?: number,
        matchID?: number,
        withDisabled?: boolean,
        page: number,
        limit: number,
    }
    export type tRobotExtGetmatchplanRes = ResBase & {
        datas: RobotExtDefine.tMatchPlan[],
        count: number,
    }

    // 创建机器人比赛计划（plan.itemNeeded.count=触发充值数量，plan.chargeMinCount=自动充值数量(1~1.2倍随机)）
    export const RobotExtCreatematchplan = "/robot/ext/creatematchplan"
    export type tRobotExtCreatematchplanReq = {
        plan: RobotExtDefine.tMatchPlan,
    }
    export type tRobotExtCreatematchplanRes = ResBase & {
        plan: RobotExtDefine.tMatchPlan,
    }

    // 更新机器人比赛计划启用状态
    export const RobotExtUpdatematchplanenabled = "/robot/ext/updatematchplanenabled"
    export type tRobotExtUpdatematchplanenabledReq = {
        planID: number,
        enabled: boolean,
    }
    export type tRobotExtUpdatematchplanenabledRes = ResBase & {
        plan: RobotExtDefine.tMatchPlan,
    }

    // 更改机器人比赛计划充值库存ID
    export const RobotExtChangematchplanstoreid = "/robot/ext/changematchplanstoreid"
    export type tRobotExtChangematchplanstoreidReq = {
        planID: number,
        storeID: number,
    }
    export type tRobotExtChangematchplanstoreidRes = ResBase & {
        plan: RobotExtDefine.tMatchPlan,
        store: RobotExtDefine.tChargeStore,
    }

    // 机器人面板
    // 获取机器人面板数据
    export const RobotPanelGet = "/robot/panel/get"
    export type tRobotPanelGetReq = {
    }
    export type tRobotPanelGetRes = ResBase & {
        todayTotal: number,
        totalRobotCount: number,
        totalRunningRobotCount: number,
        totalLoadingRobotCount: number,
        stores: {
            _id: string,
            value: number,
            usedValue: number,
        }[],
        totalTaskCount: number,
        totalRunningTaskCount: number,
        totalPausedTaskCount: number,
        taskRobotCounts: {
            _id: number,
            count: number,
        }[],
    }

    // 获取机器人游戏记录
    export const RobotPanelGetserials = "/robot/panel/getserials"
    export type tRobotPanelGetserialsReq = {
        gameID?: number,
        robotUserIDs?: number[],
        group?: boolean,
        groupID?: number,
        match?: boolean,
        matchID?: number,
        itemID?: string,
        win?: boolean,
        startTime?: number,
        endTime?: number,
        page?: number,
        limit?: number,
    }
    export type tRobotPanelGetserialsRes = ResBase & {
        datas: RobotDefine.tRobotGameSerial[],
        count: number,
    }

    // 统计机器人游戏记录
    export const RobotPanelAggserial = "/robot/panel/aggserial"
    export type tRobotPanelAggserialReq = {
        gameID?: number,
        robotUserIDs?: number[],
        group?: boolean,
        groupID?: number,
        match?: boolean,
        matchID?: number,
        itemID?: string,
        win?: boolean,
        startTime?: number,
        endTime?: number,
    }
    export type tRobotPanelAggserialRes = ResBase & {
        total: number,
    }

    // 获取机器人列表
    export const RobotPanelGetrobots = "/robot/panel/getrobots"
    export type tRobotPanelGetrobotsReq = {
        robotUserIDs?: number[],
        status?: RobotDefine.Status,
        taskID?: number,
        page: number,
        limit: number,
    }
    export type tRobotPanelGetrobotsRes = ResBase & {
        datas: RobotDefine.tRuntime[],
        count: number,
        loginDatas: UserDefine.tLoginData[],
    }

    // 媒体上传
    // 启动媒体文件上传
    export const UploadmediaStart = "/uploadmedia/start"
    export type tUploadmediaStartReq = {
        path?: string,
        filename?: string,
        ext: string,
    }
    export type tUploadmediaStartRes = ResBase & {
        filename: string,
    }

    // 上传媒体文件数据
    export const UploadmediaUpload = "/uploadmedia/upload"
    export type tUploadmediaUploadReq = {
        filename: string,
        base64Data: string,
    }
    export type tUploadmediaUploadRes = ResBase & {}

    // 完成媒体文件上传
    export const UploadmediaEnd = "/uploadmedia/end"
    export type tUploadmediaEndReq = {
        filename: string,
    }
    export type tUploadmediaEndRes = ResBase & {
        url: string,
    }
}

// 2026-01-14 补全的接口定义