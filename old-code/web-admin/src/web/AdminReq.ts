import Http, { ConnectMethod } from './Http'
import { Config } from '../Config'
import { AdminReqDefine } from 'pp-base-define/AdminReqDefine'

function adminReq<Req_, Res_>(method: string) {
    return async (params: Req_) => {
        //@ts-ignore
        params['ak'] = sessionStorage.getItem('ak')
        let res: Res_ = <Res_>await Http.instance.connect({
            domain: Config.adminUrl,
            path: method,
            method: ConnectMethod.POST,
            body: params,
            timeout: 1000 * 30,
            header: [
                {
                    name: 'Content-Type',
                    value: 'application/json',
                },
            ],
        })
        //@ts-ignore
        if (res['errCode'] == 99) {
            sessionStorage.removeItem('account')
            sessionStorage.removeItem('ak')
            sessionStorage.removeItem('roleTarget')
            location.href = '/#/account/login'
            return res
        }

        return res
    }
}

// ==================== 配置相关API ====================

// 全局配置
export const configGetglobal = adminReq<AdminReqDefine.tConfigGetglobalReq, AdminReqDefine.tConfigGetglobalRes>(AdminReqDefine.ConfigGetglobal)
export const configSetglobal = adminReq<AdminReqDefine.tConfigSetglobalReq, AdminReqDefine.tConfigSetglobalRes>(AdminReqDefine.ConfigSetglobal)

// 登录配置
export const configGetlogin = adminReq<AdminReqDefine.tConfigGetloginReq, AdminReqDefine.tConfigGetloginRes>(AdminReqDefine.ConfigGetlogin)
export const configSetlogin = adminReq<AdminReqDefine.tConfigSetloginReq, AdminReqDefine.tConfigSetloginRes>(AdminReqDefine.ConfigSetlogin)

// Item配置
export const configItemGet = adminReq<AdminReqDefine.tConfigItemGetReq, AdminReqDefine.tConfigItemGetRes>(AdminReqDefine.ConfigItemGet)
export const configItemDel = adminReq<AdminReqDefine.tConfigItemDelReq, AdminReqDefine.tConfigItemDelRes>(AdminReqDefine.ConfigItemDel)
export const configItemUpdate = adminReq<AdminReqDefine.tConfigItemUpdateReq, AdminReqDefine.tConfigItemUpdateRes>(AdminReqDefine.ConfigItemUpdate)
export const configItemCreate = adminReq<AdminReqDefine.tConfigItemCreateReq, AdminReqDefine.tConfigItemCreateRes>(AdminReqDefine.ConfigItemCreate)
export const configItemRefresh = adminReq<AdminReqDefine.tConfigItemRefreshReq, AdminReqDefine.tConfigItemRefreshRes>(AdminReqDefine.ConfigItemRefresh)

// 水位配置
export const configSetfriendwater = adminReq<AdminReqDefine.tConfigSetfriendwaterReq, AdminReqDefine.tConfigSetfriendwaterRes>(AdminReqDefine.ConfigSetfriendwater)
export const configGetfriendwater = adminReq<AdminReqDefine.tConfigGetfriendwaterReq, AdminReqDefine.tConfigGetfriendwaterRes>(AdminReqDefine.ConfigGetfriendwater)
export const configSetdefaultgroupwater = adminReq<AdminReqDefine.tConfigSetdefaultgroupwaterReq, AdminReqDefine.tConfigSetdefaultgroupwaterRes>(AdminReqDefine.ConfigSetdefaultgroupwater)
export const configGetdefaultgroupwater = adminReq<AdminReqDefine.tConfigGetdefaultgroupwaterReq, AdminReqDefine.tConfigGetdefaultgroupwaterRes>(AdminReqDefine.ConfigGetdefaultgroupwater)
export const configSetdefaultmatchwater = adminReq<AdminReqDefine.tConfigSetdefaultmatchwaterReq, AdminReqDefine.tConfigSetdefaultmatchwaterRes>(AdminReqDefine.ConfigSetdefaultmatchwater)
export const configGetdefaultmatchwater = adminReq<AdminReqDefine.tConfigGetdefaultmatchwaterReq, AdminReqDefine.tConfigGetdefaultmatchwaterRes>(AdminReqDefine.ConfigGetdefaultmatchwater)

// 充值奖励配置
export const configSetglobalchargereward = adminReq<AdminReqDefine.tConfigSetglobalchargerewardReq, AdminReqDefine.tConfigSetglobalchargerewardRes>(AdminReqDefine.ConfigSetglobalchargereward)
export const configGetglobalchargereward = adminReq<AdminReqDefine.tConfigGetglobalchargerewardReq, AdminReqDefine.tConfigGetglobalchargerewardRes>(AdminReqDefine.ConfigGetglobalchargereward)

export const configSetproxycharge = adminReq<AdminReqDefine.tConfigSetproxychargeReq, AdminReqDefine.tConfigSetproxychargeRes>(AdminReqDefine.ConfigSetproxycharge)

// ==================== 管理相关API ====================

// 匹配管理
export const mgrGetgroups = adminReq<AdminReqDefine.tMgrGetgroupsReq, AdminReqDefine.tMgrGetgroupsRes>(AdminReqDefine.MgrGetgroups)
export const mgrCreategroup = adminReq<AdminReqDefine.tMgrCreategroupReq, AdminReqDefine.tMgrCreategroupRes>(AdminReqDefine.MgrCreategroup)
export const mgrUpdategroup = adminReq<AdminReqDefine.tMgrUpdategroupReq, AdminReqDefine.tMgrUpdategroupRes>(AdminReqDefine.MgrUpdategroup)
export const mgrUpdategroupWater = adminReq<AdminReqDefine.tMgrUpdategroupWaterReq, AdminReqDefine.tMgrUpdategroupWaterRes>(AdminReqDefine.MgrUpdategroupWater)
export const mgrDelgroup = adminReq<AdminReqDefine.tMgrDelgroupReq, AdminReqDefine.tMgrDelgroupRes>(AdminReqDefine.MgrDelgroup)

// 房间管理
export const mgrGetallrooms = adminReq<AdminReqDefine.tMgrGetallroomsReq, AdminReqDefine.tMgrGetallroomsRes>(AdminReqDefine.MgrGetallrooms)
export const mgrJiesanroom = adminReq<AdminReqDefine.tMgrJiesanroomReq, AdminReqDefine.tMgrJiesanroomRes>(AdminReqDefine.MgrJiesanroom)

// 邮件管理
export const mgrSendsystemmail = adminReq<AdminReqDefine.tMgrSendsystemmailReq, AdminReqDefine.tMgrSendsystemmailRes>(AdminReqDefine.MgrSendsystemmail)
export const mgrSendusermail = adminReq<AdminReqDefine.tMgrSendusermailReq, AdminReqDefine.tMgrSendusermailRes>(AdminReqDefine.MgrSendusermail)

// ==================== 比赛相关API ====================

// 比赛管理
export const matchGetmatchlist = adminReq<AdminReqDefine.tMatchGetmatchlistReq, AdminReqDefine.tMatchGetmatchlistRes>(AdminReqDefine.MatchGetmatchlist)
export const matchCreatematch = adminReq<AdminReqDefine.tMatchCreatematchReq, AdminReqDefine.tMatchCreatematchRes>(AdminReqDefine.MatchCreatematch)
export const matchDelmatch = adminReq<AdminReqDefine.tMatchDelmatchReq, AdminReqDefine.tMatchDelmatchRes>(AdminReqDefine.MatchDelmatch)
export const matchUpdatedisplay = adminReq<AdminReqDefine.tMatchUpdatedisplayReq, AdminReqDefine.tMatchUpdatedisplayRes>(AdminReqDefine.MatchUpdatedisplay)
export const matchUpdatedata = adminReq<AdminReqDefine.tMatchUpdatedataReq, AdminReqDefine.tMatchUpdatedataRes>(AdminReqDefine.MatchUpdatedata)
export const matchUpdatereward = adminReq<AdminReqDefine.tMatchUpdaterewardReq, AdminReqDefine.tMatchUpdaterewardRes>(AdminReqDefine.MatchUpdatereward)
export const matchUpdatewater = adminReq<AdminReqDefine.tMatchUpdatewaterReq, AdminReqDefine.tMatchUpdatewaterRes>(AdminReqDefine.MatchUpdatewater)
export const matchGetuserruntimes = adminReq<AdminReqDefine.tMatchGetuserruntimesReq, AdminReqDefine.tMatchGetuserruntimesRes>(AdminReqDefine.MatchGetuserruntimes)
export const matchGetrank = adminReq<AdminReqDefine.tMatchGetrankReq, AdminReqDefine.tMatchGetrankRes>(AdminReqDefine.MatchGetrank)
export const matchGetsignuprecord = adminReq<AdminReqDefine.tMatchGetsignuprecordReq, AdminReqDefine.tMatchGetsignuprecordRes>(AdminReqDefine.MatchGetsignuprecord)
export const matchGetexecuterroominfos = adminReq<AdminReqDefine.tMatchGetexecuterroominfosReq, AdminReqDefine.tMatchGetexecuterroominfosRes>(AdminReqDefine.MatchGetexecuterroominfos)

// ==================== 用户相关API ====================

// 用户管理
export const userGetusers = adminReq<AdminReqDefine.tUserGetusersReq, AdminReqDefine.tUserGetusersRes>(AdminReqDefine.UserGetusers)
export const userGetuserbags = adminReq<AdminReqDefine.tUserGetuserbagsReq, AdminReqDefine.tUserGetuserbagsRes>(AdminReqDefine.UserGetuserbags)
export const userGetuserlocked = adminReq<AdminReqDefine.tUserGetuserlockedReq, AdminReqDefine.tUserGetuserlockedRes>(AdminReqDefine.UserGetuserlocked)
export const userCreatelockitem = adminReq<AdminReqDefine.tUserCreatelockitemReq, AdminReqDefine.tUserCreatelockitemRes>(AdminReqDefine.UserCreatelockitem)
export const userAdduseritem = adminReq<AdminReqDefine.tUserAdduseritemReq, AdminReqDefine.tUserAdduseritemRes>(AdminReqDefine.UserAdduseritem)
export const userAdduserclubvalue = adminReq<AdminReqDefine.tUserAdduserclubvalueReq, AdminReqDefine.tUserAdduserclubvalueRes>(AdminReqDefine.UserAdduserclubvalue)
export const userUnlock = adminReq<AdminReqDefine.tUserUnlockReq, AdminReqDefine.tUserUnlockRes>(AdminReqDefine.UserUnlock)
export const userGetuserswithvalue = adminReq<AdminReqDefine.tUserGetuserswithvalueReq, AdminReqDefine.tUserGetuserswithvalueRes>(AdminReqDefine.UserGetuserswithvalue)
export const userGetserials = adminReq<AdminReqDefine.tUserGetserialsReq, AdminReqDefine.tUserGetserialsRes>(AdminReqDefine.UserGetserials)
export const userChangelogintarget = adminReq<AdminReqDefine.tUserChangelogintargetReq, AdminReqDefine.tUserChangelogintargetRes>(AdminReqDefine.UserChangelogintarget)
export const userChangetargetrole = adminReq<AdminReqDefine.tUserChangetargetroleReq, AdminReqDefine.tUserChangetargetroleRes>(AdminReqDefine.UserChangetargetrole)
export const userCreateaccount = adminReq<AdminReqDefine.tUserCreateaccountReq, AdminReqDefine.tUserCreateaccountRes>(AdminReqDefine.UserCreateaccount)
export const userChangepwd = adminReq<AdminReqDefine.tUserChangepwdReq, AdminReqDefine.tUserChangepwdRes>(AdminReqDefine.UserChangepwd)
export const userSetuserdisabled = adminReq<AdminReqDefine.tUserSetuserdisabledReq, AdminReqDefine.tUserSetuserdisabledRes>(AdminReqDefine.UserSetuserdisabled)
export const userSetuserlockwithdraw = adminReq<AdminReqDefine.tUserSetuserlockwithdrawReq, AdminReqDefine.tUserSetuserlockwithdrawRes>(AdminReqDefine.UserSetuserlockwithdraw)

// 用户筛选
export const userFilterGetnormalusers = adminReq<AdminReqDefine.tUserFilterGetnormalusersReq, AdminReqDefine.tUserFilterGetnormalusersRes>(AdminReqDefine.UserFilterGetnormalusers)
export const userFilterGetproxyusers = adminReq<AdminReqDefine.tUserFilterGetproxyusersReq, AdminReqDefine.tUserFilterGetproxyusersRes>(AdminReqDefine.UserFilterGetproxyusers)
export const userFilterGetadminusers = adminReq<AdminReqDefine.tUserFilterGetadminusersReq, AdminReqDefine.tUserFilterGetadminusersRes>(AdminReqDefine.UserFilterGetadminusers)
export const userFilterGetrobotusers = adminReq<AdminReqDefine.tUserFilterGetrobotusersReq, AdminReqDefine.tUserFilterGetrobotusersRes>(AdminReqDefine.UserFilterGetrobotusers)

// 注册审核（需要 RegisterAudit 权限）
export const userAuditGetregisteraudits = adminReq<AdminReqDefine.tUserAuditGetregisterauditsReq, AdminReqDefine.tUserAuditGetregisterauditsRes>(AdminReqDefine.UserAuditGetregisteraudits)
export const userAuditConfirmregisteraudit = adminReq<AdminReqDefine.tUserAuditConfirmregisterauditReq, AdminReqDefine.tUserAuditConfirmregisterauditRes>(AdminReqDefine.UserAuditConfirmregisteraudit)
export const userAuditGetregisterauditupload = adminReq<AdminReqDefine.tUserAuditGetregisteraudituploadReq, AdminReqDefine.tUserAuditGetregisteraudituploadRes>(AdminReqDefine.UserAuditGetregisterauditupload)

// ==================== 机器人相关API ====================

// 机器人全局控制
export const robotExtGetglobalcontrol = adminReq<AdminReqDefine.tRobotExtGetglobalcontrolReq, AdminReqDefine.tRobotExtGetglobalcontrolRes>(AdminReqDefine.RobotExtGetglobalcontrol)
export const robotExtSetglobalcontrol = adminReq<AdminReqDefine.tRobotExtSetglobalcontrolReq, AdminReqDefine.tRobotExtSetglobalcontrolRes>(AdminReqDefine.RobotExtSetglobalcontrol)

// 机器人充值商店
export const robotExtGetchargestore = adminReq<AdminReqDefine.tRobotExtGetchargestoreReq, AdminReqDefine.tRobotExtGetchargestoreRes>(AdminReqDefine.RobotExtGetchargestore)
export const robotExtGetchargestorerecord = adminReq<AdminReqDefine.tRobotExtGetchargestorerecordReq, AdminReqDefine.tRobotExtGetchargestorerecordRes>(AdminReqDefine.RobotExtGetchargestorerecord)
export const robotExtGetrobotchargerecord = adminReq<AdminReqDefine.tRobotExtGetrobotchargerecordReq, AdminReqDefine.tRobotExtGetrobotchargerecordRes>(AdminReqDefine.RobotExtGetrobotchargerecord)
export const robotExtCreatestore = adminReq<AdminReqDefine.tRobotExtCreatestoreReq, AdminReqDefine.tRobotExtCreatestoreRes>(AdminReqDefine.RobotExtCreatestore)
export const robotExtSetstoreenabled = adminReq<AdminReqDefine.tRobotExtSetstoreenabledReq, AdminReqDefine.tRobotExtSetstoreenabledRes>(AdminReqDefine.RobotExtSetstoreenabled)
export const robotExtAddchargestore = adminReq<AdminReqDefine.tRobotExtAddchargestoreReq, AdminReqDefine.tRobotExtAddchargestoreRes>(AdminReqDefine.RobotExtAddchargestore)

// 机器人性格配置扩展
export const robotExtGetpersonalityconfigs = adminReq<AdminReqDefine.tRobotExtGetpersonalityconfigsReq, AdminReqDefine.tRobotExtGetpersonalityconfigsRes>(AdminReqDefine.RobotExtGetpersonalityconfigs)
export const robotExtSetpersonalityconfig = adminReq<AdminReqDefine.tRobotExtSetpersonalityconfigReq, AdminReqDefine.tRobotExtSetpersonalityconfigRes>(AdminReqDefine.RobotExtSetpersonalityconfig)
export const robotExtDeletepersonalityconfig = adminReq<AdminReqDefine.tRobotExtDeletepersonalityconfigReq, AdminReqDefine.tRobotExtDeletepersonalityconfigRes>(AdminReqDefine.RobotExtDeletepersonalityconfig)

// 机器人匹配计划
export const robotExtGetgrouplan = adminReq<AdminReqDefine.tRobotExtGetgrouplanReq, AdminReqDefine.tRobotExtGetgrouplanRes>(AdminReqDefine.RobotExtGetgrouplan)
export const robotExtCreategrouplan = adminReq<AdminReqDefine.tRobotExtCreategrouplanReq, AdminReqDefine.tRobotExtCreategrouplanRes>(AdminReqDefine.RobotExtCreategrouplan)
export const robotExtUpdategrouplanenabled = adminReq<AdminReqDefine.tRobotExtUpdategrouplanenabledReq, AdminReqDefine.tRobotExtUpdategrouplanenabledRes>(AdminReqDefine.RobotExtUpdategrouplanenabled)
export const robotExtChangegrouplanpower = adminReq<AdminReqDefine.tRobotExtChangegrouplanpowerReq, AdminReqDefine.tRobotExtChangegrouplanpowerRes>(AdminReqDefine.RobotExtChangegrouplanpower)
export const robotExtChangegrouplanstoreid = adminReq<AdminReqDefine.tRobotExtChangegrouplanstoreidReq, AdminReqDefine.tRobotExtChangegrouplanstoreidRes>(AdminReqDefine.RobotExtChangegrouplanstoreid)

// 机器人匹配计划
export const robotExtGetmatchplan = adminReq<AdminReqDefine.tRobotExtGetmatchplanReq, AdminReqDefine.tRobotExtGetmatchplanRes>(AdminReqDefine.RobotExtGetmatchplan)
export const robotExtCreatematchplan = adminReq<AdminReqDefine.tRobotExtCreatematchplanReq, AdminReqDefine.tRobotExtCreatematchplanRes>(AdminReqDefine.RobotExtCreatematchplan)
export const robotExtUpdatematchplanenabled = adminReq<AdminReqDefine.tRobotExtUpdatematchplanenabledReq, AdminReqDefine.tRobotExtUpdatematchplanenabledRes>(AdminReqDefine.RobotExtUpdatematchplanenabled)
export const robotExtChangematchplanstoreid = adminReq<AdminReqDefine.tRobotExtChangematchplanstoreidReq, AdminReqDefine.tRobotExtChangematchplanstoreidRes>(AdminReqDefine.RobotExtChangematchplanstoreid)
export const robotExtCreaterobot = adminReq<AdminReqDefine.tRobotExtCreaterobotReq, AdminReqDefine.tRobotExtCreaterobotRes>(AdminReqDefine.RobotExtCreaterobot)

// 机器人面板
export const robotPanelGet = adminReq<AdminReqDefine.tRobotPanelGetReq, AdminReqDefine.tRobotPanelGetRes>(AdminReqDefine.RobotPanelGet)
export const robotPanelGetserials = adminReq<AdminReqDefine.tRobotPanelGetserialsReq, AdminReqDefine.tRobotPanelGetserialsRes>(AdminReqDefine.RobotPanelGetserials)
export const robotPanelAggserial = adminReq<AdminReqDefine.tRobotPanelAggserialReq, AdminReqDefine.tRobotPanelAggserialRes>(AdminReqDefine.RobotPanelAggserial)
export const robotPanelGetrobots = adminReq<AdminReqDefine.tRobotPanelGetrobotsReq, AdminReqDefine.tRobotPanelGetrobotsRes>(AdminReqDefine.RobotPanelGetrobots)

// ==================== 新闻相关API ====================

// 新闻管理
export const newsGetnews = adminReq<AdminReqDefine.tNewsGetnewsReq, AdminReqDefine.tNewsGetnewsRes>(AdminReqDefine.NewsGetnews)
export const newsCreatenews = adminReq<AdminReqDefine.tNewsCreatenewsReq, AdminReqDefine.tNewsCreatenewsRes>(AdminReqDefine.NewsCreatenews)
export const newsUpdatenewsdata = adminReq<AdminReqDefine.tNewsUpdatenewsdataReq, AdminReqDefine.tNewsUpdatenewsdataRes>(AdminReqDefine.NewsUpdatenewsdata)
export const newsSetvisible = adminReq<AdminReqDefine.tNewsSetvisibleReq, AdminReqDefine.tNewsSetvisibleRes>(AdminReqDefine.NewsSetvisible)
export const newsDeletenews = adminReq<AdminReqDefine.tNewsDeletenewsReq, AdminReqDefine.tNewsDeletenewsRes>(AdminReqDefine.NewsDeletenews)

// 横幅管理
export const newsGetbanners = adminReq<AdminReqDefine.tNewsGetbannersReq, AdminReqDefine.tNewsGetbannersRes>(AdminReqDefine.NewsGetbanners)
export const newsCreatebanner = adminReq<AdminReqDefine.tNewsCreatebannerReq, AdminReqDefine.tNewsCreatebannerRes>(AdminReqDefine.NewsCreatebanner)
export const newsUpdatebanner = adminReq<AdminReqDefine.tNewsUpdatebannerReq, AdminReqDefine.tNewsUpdatebannerRes>(AdminReqDefine.NewsUpdatebanner)
export const newsSetbannervisible = adminReq<AdminReqDefine.tNewsSetbannervisibleReq, AdminReqDefine.tNewsSetbannervisibleRes>(AdminReqDefine.NewsSetbannervisible)
export const newsDeletebanner = adminReq<AdminReqDefine.tNewsDeletebannerReq, AdminReqDefine.tNewsDeletebannerRes>(AdminReqDefine.NewsDeletebanner)

// ==================== 上传相关API ====================

// 媒体上传
export const uploadmediaStart = adminReq<AdminReqDefine.tUploadmediaStartReq, AdminReqDefine.tUploadmediaStartRes>(AdminReqDefine.UploadmediaStart)
export const uploadmediaUpload = adminReq<AdminReqDefine.tUploadmediaUploadReq, AdminReqDefine.tUploadmediaUploadRes>(AdminReqDefine.UploadmediaUpload)
export const uploadmediaEnd = adminReq<AdminReqDefine.tUploadmediaEndReq, AdminReqDefine.tUploadmediaEndRes>(AdminReqDefine.UploadmediaEnd)

// ==================== 充值/提现管理 ====================

// 链信息
export const chargeGetchaininfos = adminReq<AdminReqDefine.tChargeGetchaininfosReq, AdminReqDefine.tChargeGetchaininfosRes>(AdminReqDefine.ChargeGetchaininfos)
export const chargeUpdatechaininfo = adminReq<AdminReqDefine.tChargeUpdatechaininfoReq, AdminReqDefine.tChargeUpdatechaininfoRes>(AdminReqDefine.ChargeUpdatechaininfo)

// 银行信息
export const chargeGetbankinfos = adminReq<AdminReqDefine.tChargeGetbankinfosReq, AdminReqDefine.tChargeGetbankinfosRes>(AdminReqDefine.ChargeGetbankinfos)
export const chargeUpdatebankinfo = adminReq<AdminReqDefine.tChargeUpdatebankinfoReq, AdminReqDefine.tChargeUpdatebankinfoRes>(AdminReqDefine.ChargeUpdatebankinfo)

// 支行信息
export const chargeGetbankbranchinfos = adminReq<AdminReqDefine.tChargeGetbankbranchinfosReq, AdminReqDefine.tChargeGetbankbranchinfosRes>(AdminReqDefine.ChargeGetbankbranchinfos)
export const chargeUpdatebankbranchinfo = adminReq<AdminReqDefine.tChargeUpdatebankbranchinfoReq, AdminReqDefine.tChargeUpdatebankbranchinfoRes>(AdminReqDefine.ChargeUpdatebankbranchinfo)

// PayPal信息
export const chargeGetpaypalinfos = adminReq<AdminReqDefine.tChargeGetpaypalinfosReq, AdminReqDefine.tChargeGetpaypalinfosRes>(AdminReqDefine.ChargeGetpaypalinfos)
export const chargeUpdatepaypalinfo = adminReq<AdminReqDefine.tChargeUpdatepaypalinfoReq, AdminReqDefine.tChargeUpdatepaypalinfoRes>(AdminReqDefine.ChargeUpdatepaypalinfo)

// 充值配置 - 银行
export const chargeGetchargeconfig_bank = adminReq<AdminReqDefine.tChargeGetchargeconfig_bankReq, AdminReqDefine.tChargeGetchargeconfig_bankRes>(AdminReqDefine.ChargeGetchargeconfig_bank)
export const chargeUpdatechargeconfig_bank = adminReq<AdminReqDefine.tChargeUpdatechargeconfig_bankReq, AdminReqDefine.tChargeUpdatechargeconfig_bankRes>(AdminReqDefine.ChargeUpdatechargeconfig_bank)
export const chargeSetchargeconfigenabled_bank = adminReq<AdminReqDefine.tChargeSetchargeconfigenabled_bankReq, AdminReqDefine.tChargeSetchargeconfigenabled_bankRes>(AdminReqDefine.ChargeSetchargeconfigenabled_bank)

// 充值配置 - 区块链
export const chargeGetchargeconfig_blockchain = adminReq<AdminReqDefine.tChargeGetchargeconfig_blockchainReq, AdminReqDefine.tChargeGetchargeconfig_blockchainRes>(AdminReqDefine.ChargeGetchargeconfig_blockchain)
export const chargeUpdatechargeconfig_blockchain = adminReq<AdminReqDefine.tChargeUpdatechargeconfig_blockchainReq, AdminReqDefine.tChargeUpdatechargeconfig_blockchainRes>(AdminReqDefine.ChargeUpdatechargeconfig_blockchain)
export const chargeSetchargeconfigenabled_blockchain = adminReq<AdminReqDefine.tChargeSetchargeconfigenabled_blockchainReq, AdminReqDefine.tChargeSetchargeconfigenabled_blockchainRes>(AdminReqDefine.ChargeSetchargeconfigenabled_blockchain)

// 充值配置 - PayPal
export const chargeGetchargeconfig_paypal = adminReq<AdminReqDefine.tChargeGetchargeconfig_paypalReq, AdminReqDefine.tChargeGetchargeconfig_paypalRes>(AdminReqDefine.ChargeGetchargeconfig_paypal)
export const chargeUpdatechargeconfig_paypal = adminReq<AdminReqDefine.tChargeUpdatechargeconfig_paypalReq, AdminReqDefine.tChargeUpdatechargeconfig_paypalRes>(AdminReqDefine.ChargeUpdatechargeconfig_paypal)
export const chargeSetchargeconfigenabled_paypal = adminReq<AdminReqDefine.tChargeSetchargeconfigenabled_paypalReq, AdminReqDefine.tChargeSetchargeconfigenabled_paypalRes>(AdminReqDefine.ChargeSetchargeconfigenabled_paypal)

// 充值配置 - Apple Card
export const chargeGetchargeconfig_applecard = adminReq<AdminReqDefine.tChargeGetchargeconfig_applecardReq, AdminReqDefine.tChargeGetchargeconfig_applecardRes>(AdminReqDefine.ChargeGetchargeconfig_applecard)
export const chargeUpdatechargeconfig_applecard = adminReq<AdminReqDefine.tChargeUpdatechargeconfig_applecardReq, AdminReqDefine.tChargeUpdatechargeconfig_applecardRes>(AdminReqDefine.ChargeUpdatechargeconfig_applecard)
export const chargeSetchargeconfigenabled_applecard = adminReq<AdminReqDefine.tChargeSetchargeconfigenabled_applecardReq, AdminReqDefine.tChargeSetchargeconfigenabled_applecardRes>(AdminReqDefine.ChargeSetchargeconfigenabled_applecard)

// 提现配置 - 银行
export const chargeGetwithdrawconfig_bank = adminReq<AdminReqDefine.tChargeGetwithdrawconfig_bankReq, AdminReqDefine.tChargeGetwithdrawconfig_bankRes>(AdminReqDefine.ChargeGetwithdrawconfig_bank)
export const chargeUpdatewithdrawconfig_bank = adminReq<AdminReqDefine.tChargeUpdatewithdrawconfig_bankReq, AdminReqDefine.tChargeUpdatewithdrawconfig_bankRes>(AdminReqDefine.ChargeUpdatewithdrawconfig_bank)
export const chargeSetwithdrawconfigenabled_bank = adminReq<AdminReqDefine.tChargeSetwithdrawconfigenabled_bankReq, AdminReqDefine.tChargeSetwithdrawconfigenabled_bankRes>(AdminReqDefine.ChargeSetwithdrawconfigenabled_bank)

// 提现配置 - 区块链
export const chargeGetwithdrawconfig_blockchain = adminReq<AdminReqDefine.tChargeGetwithdrawconfig_blockchainReq, AdminReqDefine.tChargeGetwithdrawconfig_blockchainRes>(AdminReqDefine.ChargeGetwithdrawconfig_blockchain)
export const chargeUpdatewithdrawconfig_blockchain = adminReq<AdminReqDefine.tChargeUpdatewithdrawconfig_blockchainReq, AdminReqDefine.tChargeUpdatewithdrawconfig_blockchainRes>(AdminReqDefine.ChargeUpdatewithdrawconfig_blockchain)
export const chargeSetwithdrawconfigenabled_blockchain = adminReq<AdminReqDefine.tChargeSetwithdrawconfigenabled_blockchainReq, AdminReqDefine.tChargeSetwithdrawconfigenabled_blockchainRes>(AdminReqDefine.ChargeSetwithdrawconfigenabled_blockchain)

// 提现配置 - PayPal
export const chargeGetwithdrawconfig_paypal = adminReq<AdminReqDefine.tChargeGetwithdrawconfig_paypalReq, AdminReqDefine.tChargeGetwithdrawconfig_paypalRes>(AdminReqDefine.ChargeGetwithdrawconfig_paypal)
export const chargeUpdatewithdrawconfig_paypal = adminReq<AdminReqDefine.tChargeUpdatewithdrawconfig_paypalReq, AdminReqDefine.tChargeUpdatewithdrawconfig_paypalRes>(AdminReqDefine.ChargeUpdatewithdrawconfig_paypal)
export const chargeSetwithdrawconfigenabled_paypal = adminReq<AdminReqDefine.tChargeSetwithdrawconfigenabled_paypalReq, AdminReqDefine.tChargeSetwithdrawconfigenabled_paypalRes>(AdminReqDefine.ChargeSetwithdrawconfigenabled_paypal)

// 充值/提现审核
export const chargeConfirmGetchargeorders = adminReq<AdminReqDefine.tChargeConfirmGetchargeordersReq, AdminReqDefine.tChargeConfirmGetchargeordersRes>(AdminReqDefine.ChargeConfirmGetchargeorders)
export const chargeConfirmGetchargeupload = adminReq<AdminReqDefine.tChargeConfirmGetchargeuploadReq, AdminReqDefine.tChargeConfirmGetchargeuploadRes>(AdminReqDefine.ChargeConfirmGetchargeupload)
export const chargeConfirmConfirmchargeorder = adminReq<AdminReqDefine.tChargeConfirmConfirmchargeorderReq, AdminReqDefine.tChargeConfirmConfirmchargeorderRes>(AdminReqDefine.ChargeConfirmConfirmchargeorder)
export const chargeConfirmGetwithdraworders = adminReq<AdminReqDefine.tChargeConfirmGetwithdrawordersReq, AdminReqDefine.tChargeConfirmGetwithdrawordersRes>(AdminReqDefine.ChargeConfirmGetwithdraworders)
export const chargeConfirmConfirmwithdraworder = adminReq<AdminReqDefine.tChargeConfirmConfirmwithdraworderReq, AdminReqDefine.tChargeConfirmConfirmwithdraworderRes>(AdminReqDefine.ChargeConfirmConfirmwithdraworder)

export const chargeGetwithdrawchainmainaddress = adminReq<AdminReqDefine.tChargeGetwithdrawchainmainaddressReq, AdminReqDefine.tChargeGetwithdrawchainmainaddressRes>(AdminReqDefine.ChargeGetwithdrawchainmainaddress)
export const chargeUpdatewithdrawchainmainaddress = adminReq<AdminReqDefine.tChargeUpdatewithdrawchainmainaddressReq, AdminReqDefine.tChargeUpdatewithdrawchainmainaddressRes>(AdminReqDefine.ChargeUpdatewithdrawchainmainaddress)
export const chargeSetwithdrawchainmainaddressenabled = adminReq<AdminReqDefine.tChargeSetwithdrawchainmainaddressenabledReq, AdminReqDefine.tChargeSetwithdrawchainmainaddressenabledRes>(AdminReqDefine.ChargeSetwithdrawchainmainaddressenabled)

// 奖池管理
export const potGetpotlist = adminReq<AdminReqDefine.tPotGetpotlistReq, AdminReqDefine.tPotGetpotlistRes>(AdminReqDefine.PotGetpotlist)
export const potCreateforuser = adminReq<AdminReqDefine.tPotCreateforuserReq, AdminReqDefine.tPotCreateforuserRes>(AdminReqDefine.PotCreateforuser)
export const potCreateforgroup = adminReq<AdminReqDefine.tPotCreateforgroupReq, AdminReqDefine.tPotCreateforgroupRes>(AdminReqDefine.PotCreateforgroup)
export const potCreateformatch = adminReq<AdminReqDefine.tPotCreateformatchReq, AdminReqDefine.tPotCreateformatchRes>(AdminReqDefine.PotCreateformatch)
export const potUpdatepotconfig = adminReq<AdminReqDefine.tPotUpdatepotconfigReq, AdminReqDefine.tPotUpdatepotconfigRes>(AdminReqDefine.PotUpdatepotconfig)
export const potSetpotenabled = adminReq<AdminReqDefine.tPotSetpotenabledReq, AdminReqDefine.tPotSetpotenabledRes>(AdminReqDefine.PotSetpotenabled)
export const potAddtotalvalue = adminReq<AdminReqDefine.tPotAddtotalvalueReq, AdminReqDefine.tPotAddtotalvalueRes>(AdminReqDefine.PotAddtotalvalue)
export const potTestpot = adminReq<AdminReqDefine.tPotTestpotReq, AdminReqDefine.tPotTestpotRes>(AdminReqDefine.PotTestpot)