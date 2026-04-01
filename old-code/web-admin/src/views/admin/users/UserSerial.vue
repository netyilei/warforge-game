<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>用户流水</strong>
                        <CButton color="primary" size="sm" @click="loadSerials">
                            <CIcon icon="cil-reload" class="me-1" />
                            刷新
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <!-- 筛选条件 -->
                    <CRow class="mb-3">
                        <CCol :md="3">
                            <CFormLabel>用户ID</CFormLabel>
                            <CFormInput type="number" v-model.number="filter.userID" placeholder="输入用户ID" />
                        </CCol>
                        <CCol :md="3">
                            <CFormLabel>流水类型</CFormLabel>
                            <select class="form-select" v-model.number="filter.serialType">
                                <option :value="undefined">全部</option>
                                <option :value="ItemDefine.SerialType.System">系统</option>
                                <option :value="ItemDefine.SerialType.GM">GM</option>
                                <option :value="ItemDefine.SerialType.Charge">充值</option>
                                <option :value="ItemDefine.SerialType.Withdraw">提现</option>
                                <option :value="ItemDefine.SerialType.WithdrawFailed">提现失败</option>
                                <option :value="ItemDefine.SerialType.ChangeName">改名</option>
                                <option :value="ItemDefine.SerialType.MailAttach">邮件附件</option>
                                <option :value="ItemDefine.SerialType.GMCharge">GM充值</option>
                                <option :value="ItemDefine.SerialType.GMWithdraw">GM提现</option>
                                <option :value="ItemDefine.SerialType.ChargeRefund">充值退款</option>
                                <option :value="ItemDefine.SerialType.ChargeReward">充值奖励</option>
                                <option :value="ItemDefine.SerialType.Lock">锁定</option>
                                <option :value="ItemDefine.SerialType.Unlock">解锁</option>
                                <option :value="ItemDefine.SerialType.Game">游戏</option>
                                <option :value="ItemDefine.SerialType.Buyin">买入</option>
                                <option :value="ItemDefine.SerialType.GameJu">局内变化</option>
                                <option :value="ItemDefine.SerialType.GameEnd">游戏结束</option>
                                <option :value="ItemDefine.SerialType.GameFee">游戏费用</option>
                                <option :value="ItemDefine.SerialType.Group">匹配</option>
                                <option :value="ItemDefine.SerialType.EnterGroup">进入匹配</option>
                                <option :value="ItemDefine.SerialType.Match">比赛</option>
                                <option :value="ItemDefine.SerialType.MatchSignup">比赛报名</option>
                                <option :value="ItemDefine.SerialType.MatchEnter">进入比赛</option>
                                <option :value="ItemDefine.SerialType.MatchEnd">比赛结束</option>
                                <option :value="ItemDefine.SerialType.MatchRank">比赛排名</option>
                                <option :value="ItemDefine.SerialType.MatchBuyin">比赛买入</option>
                                <option :value="ItemDefine.SerialType.Club">俱乐部</option>
                                <option :value="ItemDefine.SerialType.Give">赠送</option>
                                <option :value="ItemDefine.SerialType.Receive">接收</option>
                                <option :value="ItemDefine.SerialType.GiveFailed">赠送失败</option>
                                <option :value="ItemDefine.SerialType.DeskCost">桌费消耗</option>
                                <option :value="ItemDefine.SerialType.DeskCostEarn">桌费收入</option>
                                <option :value="ItemDefine.SerialType.WaterEarn">抽水收入</option>
                                <option :value="ItemDefine.SerialType.mail">邮件</option>
                                <option :value="ItemDefine.SerialType.Lobby">大厅</option>
                                <option :value="ItemDefine.SerialType.Lobby_Lottery">大厅抽奖</option>
                                <option :value="ItemDefine.SerialType.Lobby_Task">大厅任务</option>
                                <option :value="ItemDefine.SerialType.Lobby_Checkin">大厅签到</option>
                            </select>
                        </CCol>
                        <!-- <CCol :md="3">
                            <CFormLabel>道具ID</CFormLabel>
                            <ItemSelect v-model="filter.itemID" placeholder="全部道具" placeholder-value="" />
                        </CCol> -->
                        <!-- <CCol :md="3">
                            <CFormLabel>设置</CFormLabel>
                            <div class="form-check mt-2">
                                <input class="form-check-input" type="checkbox" v-model="filter.setup"
                                    id="setupCheck" />
                                <label class="form-check-label" for="setupCheck">
                                    仅显示设置流水
                                </label>
                            </div>
                        </CCol> -->
                        <CCol :md="3">
                            <CFormLabel>机器人</CFormLabel>
                            <div class="form-check mt-2">
                                <input class="form-check-input" type="checkbox" v-model="filter.robot"
                                    id="setupCheck" />
                                <label class="form-check-label" for="setupCheck">
                                    显示机器人
                                </label>
                            </div>
                        </CCol>
                    </CRow>
                    <CRow class="mb-3">
                        <CCol :md="12" class="d-flex justify-content-between align-items-center gap-2">
                            <div class="d-flex gap-2">
                                <CButton color="primary" @click="handleSearch">
                                    <CIcon icon="cil-magnifying-glass" class="me-1" />
                                    搜索
                                </CButton>
                                <CButton color="secondary" @click="clearSearch">
                                    清除
                                </CButton>
                            </div>
                            <div class="d-flex align-items-center gap-3">
                                <div class="text-muted small">
                                    共 {{ totalCount }} 条记录，第 {{ currentPage + 1 }} / {{ totalPages || 1 }} 页
                                </div>
                                <div @click.prevent="handlePaginationClick">
                                    <CSmartPagination v-if="totalPages > 0" :pages="totalPages"
                                        :active-page="currentPage + 1" @active-page-change="handlePageChange" />
                                </div>
                            </div>
                        </CCol>
                    </CRow>

                    <div v-if="loading" class="text-center py-4">
                        <CSpinner />
                        <div class="mt-2">加载中...</div>
                    </div>
                    <div v-else>
                        <!-- 流水列表 -->
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>序号</CTableHeaderCell>
                                    <CTableHeaderCell>用户ID</CTableHeaderCell>
                                    <CTableHeaderCell>道具ID</CTableHeaderCell>
                                    <CTableHeaderCell>数量</CTableHeaderCell>
                                    <CTableHeaderCell>剩余</CTableHeaderCell>
                                    <CTableHeaderCell>流水类型</CTableHeaderCell>
                                    <CTableHeaderCell>机器人</CTableHeaderCell>
                                    <CTableHeaderCell>游戏内账户</CTableHeaderCell>
                                    <CTableHeaderCell>锁定ID</CTableHeaderCell>
                                    <CTableHeaderCell>时间</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="serial in serialList" :key="serial.no">
                                    <CTableDataCell>{{ serial.no }}</CTableDataCell>
                                    <CTableDataCell>{{ serial.userID }}</CTableDataCell>
                                    <CTableDataCell>{{ serial.itemID }}</CTableDataCell>
                                    <CTableDataCell>{{ serial.changed }}</CTableDataCell>
                                    <CTableDataCell>{{ serial.last }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CBadge :color="getSerialTypeColor(serial.type)">
                                            {{ getSerialTypeName(serial.type) }}
                                        </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell>{{ serial.isRobot == null ? '-' : serial.isRobot ? '是' : '否' }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CBadge v-if="serial.isLock" color="info">是</CBadge>
                                        <span v-else class="text-muted">否</span>
                                    </CTableDataCell>
                                    <CTableDataCell>{{ serial.lockID }}</CTableDataCell>
                                    <CTableDataCell>{{ formatDate(serial.timestamp) }}</CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!serialList || serialList.length === 0">
                                    <CTableDataCell colspan="8" class="text-center text-muted py-4">
                                        暂无流水数据
                                    </CTableDataCell>
                                </CTableRow>
                            </CTableBody>
                        </CTable>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>
    </CRow>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userGetserials } from '@/web/AdminReq'
import { ItemDefine } from 'pp-base-define/ItemDefine'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import ItemSelect from '@/components/ItemSelect.vue'
import { Toast } from '@/composables/useToast'
import { CSmartPagination } from '@coreui/vue-pro'
const loading = ref(false)
const serialList = ref<ItemDefine.tSerial[]>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = ref(20)

const filter = ref({
    userID: undefined as number | undefined,
    serialType: undefined as ItemDefine.SerialType | undefined,
    setup: false,
    robot: false,
    itemID: '' as string | undefined,
})

const totalPages = ref(0)

// 加载流水数据
const loadSerials = async () => {
    loading.value = true
    try {
        const params: AdminReqDefine.tUserGetserialsReq = {
            page: currentPage.value,
            limit: pageSize.value,
        }

        if (filter.value.userID !== undefined && filter.value.userID !== null) {
            params.userIDs = [filter.value.userID]
        }

        if (filter.value.serialType !== undefined && filter.value.serialType !== null) {
            params.serialType = filter.value.serialType
        }

        if (filter.value.setup) {
            params.setup = true
        }

        if (filter.value.robot) {
            params.robot = true
        }

        if (filter.value.itemID && filter.value.itemID !== '') {
            params.itemID = filter.value.itemID
        }

        const response = await userGetserials(params)

        if (response.errCode) {
            Toast.error(response.errMsg || '加载流水数据失败')
            serialList.value = []
            totalCount.value = 0
            return
        }

        serialList.value = response.datas || []
        totalCount.value = response.count || 0
        totalPages.value = Math.ceil(totalCount.value / pageSize.value)
    } catch (error) {
        console.error('Load serials error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// 搜索
const handleSearch = () => {
    currentPage.value = 0
    loadSerials()
}

// 清除搜索
const clearSearch = () => {
    filter.value = {
        userID: undefined,
        serialType: undefined,
        setup: false,
        robot: false,
        itemID: '',
    }
    currentPage.value = 0
    loadSerials()
}

// 分页点击处理（阻止默认行为）
const handlePaginationClick = (event: Event) => {
    // 阻止链接的默认跳转行为
    const target = event.target as HTMLElement
    const link = target.closest('a')
    if (link) {
        event.preventDefault()
        event.stopPropagation()

        // 尝试从链接的文本内容获取页码
        const pageText = link.textContent?.trim()

        if (pageText && /^\d+$/.test(pageText)) {
            const newPage = parseInt(pageText) - 1
            if (newPage !== currentPage.value && newPage >= 0 && newPage < totalPages.value) {
                currentPage.value = newPage
                loadSerials()
            }
        }
    }
}

// 分页变化处理
const handlePageChange = (page: number) => {
    console.log('分页变化事件触发，新页码:', page, '类型:', typeof page, '当前页码:', currentPage.value)
    // CSmartPagination 传递的页码是从1开始的，需要转换为从0开始
    const newPage = page - 1
    console.log('转换后的页码:', newPage)
    if (newPage !== currentPage.value && newPage >= 0 && newPage < totalPages.value) {
        currentPage.value = newPage
        console.log('更新页码为:', currentPage.value, '开始加载数据')
        loadSerials()
    } else {
        console.log('页码未变化或无效，跳过加载。新页码:', newPage, '当前页码:', currentPage.value, '总页数:', totalPages.value)
    }
}

// 获取流水类型名称
const getSerialTypeName = (type: number | null | undefined): string => {
    console.log(type)
    if (type === null || type === undefined) {
        type = ItemDefine.SerialType.System
    }

    const typeMap: Record<number, string> = {
        [ItemDefine.SerialType.System]: '系统',
        [ItemDefine.SerialType.GM]: 'GM',
        [ItemDefine.SerialType.Charge]: '充值',
        [ItemDefine.SerialType.Withdraw]: '提现',
        [ItemDefine.SerialType.WithdrawFailed]: '提现失败',
        [ItemDefine.SerialType.ChangeName]: '改名',
        [ItemDefine.SerialType.MailAttach]: '邮件附件',
        [ItemDefine.SerialType.GMCharge]: 'GM充值',
        [ItemDefine.SerialType.GMWithdraw]: 'GM提现',
        [ItemDefine.SerialType.ChargeRefund]: '充值退款',
        [ItemDefine.SerialType.ChargeReward]: '充值奖励',
        [ItemDefine.SerialType.Lock]: '锁定',
        [ItemDefine.SerialType.Unlock]: '解锁',
        [ItemDefine.SerialType.Game]: '游戏',
        [ItemDefine.SerialType.Buyin]: '买入',
        [ItemDefine.SerialType.GameJu]: '局内变化',
        [ItemDefine.SerialType.GameEnd]: '游戏结束',
        [ItemDefine.SerialType.GameFee]: '游戏费用',
        [ItemDefine.SerialType.Group]: '匹配',
        [ItemDefine.SerialType.EnterGroup]: '进入匹配',
        [ItemDefine.SerialType.Match]: '比赛',
        [ItemDefine.SerialType.MatchSignup]: '比赛报名',
        [ItemDefine.SerialType.MatchEnter]: '进入比赛',
        [ItemDefine.SerialType.MatchEnd]: '比赛结束',
        [ItemDefine.SerialType.MatchRank]: '比赛排名',
        [ItemDefine.SerialType.MatchBuyin]: '比赛买入',
        [ItemDefine.SerialType.Club]: '俱乐部',
        [ItemDefine.SerialType.Give]: '赠送',
        [ItemDefine.SerialType.Receive]: '接收',
        [ItemDefine.SerialType.GiveFailed]: '赠送失败',
        [ItemDefine.SerialType.DeskCost]: '桌费消耗',
        [ItemDefine.SerialType.DeskCostEarn]: '桌费收入',
        [ItemDefine.SerialType.WaterEarn]: '抽水收入',
        [ItemDefine.SerialType.mail]: '邮件',
        [ItemDefine.SerialType.Lobby]: '大厅',
        [ItemDefine.SerialType.Lobby_Lottery]: '大厅抽奖',
        [ItemDefine.SerialType.Lobby_Task]: '大厅任务',
        [ItemDefine.SerialType.Lobby_Checkin]: '大厅签到',
    }
    return typeMap[type] || `未知(${type})`
}

// 获取流水类型颜色
const getSerialTypeColor = (type: number | null | undefined): string => {
    if (type === null || type === undefined) {
        return 'secondary'
    }

    if (type >= ItemDefine.SerialType.Match && type <= ItemDefine.SerialType.MatchRank) {
        return 'success'
    }
    if (type === ItemDefine.SerialType.Charge) {
        return 'info'
    }
    if (type === ItemDefine.SerialType.Withdraw || type === ItemDefine.SerialType.WithdrawFailed) {
        return 'warning'
    }
    if (type === ItemDefine.SerialType.Lock) {
        return 'danger'
    }
    if (type === ItemDefine.SerialType.Unlock) {
        return 'success'
    }
    return 'secondary'
}

// 格式化日期
const formatDate = (timestamp: number): string => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

onMounted(() => {
    loadSerials()
})
</script>
