<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>用户管理</strong>
                        <CButton color="primary" size="sm" @click="loadUsers">
                            <CIcon icon="cil-reload" class="me-1" />
                            刷新
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <!-- 筛选条件 -->
                    <CRow class="mb-3">
                        <CCol :md="3">
                            <CFormLabel>查询方式</CFormLabel>
                            <select class="form-select" v-model="queryMode">
                                <option value="normal">普通查询</option>
                                <option value="byItem">按道具数量查询</option>
                            </select>
                        </CCol>
                        <CCol :md="3" v-if="queryMode === 'byItem'">
                            <CFormLabel>道具ID</CFormLabel>
                            <CFormInput
                                v-model="itemFilter.itemID"
                                placeholder="请输入道具ID"
                            />
                        </CCol>
                        <CCol :md="3" v-if="queryMode === 'byItem'">
                            <CFormLabel>最小数量</CFormLabel>
                            <CFormInput
                                type="number"
                                v-model.number="itemFilter.minValue"
                                placeholder="最小数量（可选）"
                            />
                        </CCol>
                        <CCol :md="3" v-if="queryMode === 'byItem'">
                            <CFormLabel>排序方式</CFormLabel>
                            <select class="form-select" v-model="itemFilter.sort">
                                <option value="asc">升序</option>
                                <option value="desc">降序</option>
                            </select>
                        </CCol>
                        <CCol :md="3" class="d-flex align-items-end">
                            <CButton color="primary" @click="handleSearch" class="me-2">
                                <CIcon icon="cil-magnifying-glass" class="me-1" />
                                搜索
                            </CButton>
                            <CButton color="secondary" @click="clearSearch">
                                清除
                            </CButton>
                        </CCol>
                    </CRow>

                    <div v-if="loading" class="text-center py-4">
                        <CSpinner />
                        <div class="mt-2">加载中...</div>
                    </div>
                    <div v-else>
                        <!-- 用户列表 -->
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>用户ID</CTableHeaderCell>
                                    <CTableHeaderCell>昵称</CTableHeaderCell>
                                    <CTableHeaderCell>账号</CTableHeaderCell>
                                    <CTableHeaderCell>登录渠道</CTableHeaderCell>
                                    <CTableHeaderCell>金币余额</CTableHeaderCell>
                                    <CTableHeaderCell>期望值</CTableHeaderCell>
                                    <CTableHeaderCell>累计返利</CTableHeaderCell>
                                    <CTableHeaderCell>总充值</CTableHeaderCell>
                                    <CTableHeaderCell>总提现</CTableHeaderCell>
                                    <CTableHeaderCell>注册时间</CTableHeaderCell>
                                    <CTableHeaderCell v-if="queryMode === 'byItem'">道具数量</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="user in userList" :key="user.userID" :class="{ 'balance-exception-highlight': isExceptionValuePositive(user) }">
                                    <CTableDataCell>{{ user.userID }}</CTableDataCell>
                                    <CTableDataCell>{{ user.loginData.nickName || '-' }}</CTableDataCell>
                                    <CTableDataCell>
                                        <span v-for="(channel, index) in user.loginChannels" :key="index" class="me-1">
                                                {{ channel.account || '-' }}
                                        </span>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <span v-for="(channel, index) in user.loginChannels" :key="index" class="me-1">
                                            <CBadge :color="getChannelColor(channel.type)">
                                                {{ getChannelName(channel.type) }}
                                            </CBadge>
                                        </span>
                                    </CTableDataCell>
                                    <CTableDataCell>{{ getGoldBalance(user) }}</CTableDataCell>
                                    <CTableDataCell>{{ getExceptionField(user) }} / {{ getBalanceField(user, 'exceptionValue') }}</CTableDataCell>
                                    <CTableDataCell>{{ getBalanceField(user, 'rewardValue') }}</CTableDataCell>
                                    <CTableDataCell>{{ getBalanceField(user, 'totalCharge') }}</CTableDataCell>
                                    <CTableDataCell>{{ getBalanceField(user, 'totalWithdraw') }}</CTableDataCell>
                                    <CTableDataCell>{{ user.loginData.regDate }}</CTableDataCell>
                                    <CTableDataCell v-if="queryMode === 'byItem'">
                                        <span v-if="'bagData' in user && user.bagData">
                                            {{ user.bagData.count }} ({{ user.bagData.countNum }})
                                        </span>
                                        <span v-else class="text-muted">-</span>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <CButton color="primary" size="sm" @click="goToUserSerial(user.userID)">
                                            查看流水
                                        </CButton>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!userList || userList.length === 0">
                                    <CTableDataCell :colspan="queryMode === 'byItem' ? 11 : 10" class="text-center text-muted py-4">
                                        暂无用户数据
                                    </CTableDataCell>
                                </CTableRow>
                            </CTableBody>
                        </CTable>

                        <!-- 分页 -->
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div class="text-muted">
                                共 {{ totalCount }} 条记录，第 {{ currentPage + 1 }} / {{ totalPages }} 页
                            </div>
                            <CPagination
                                v-model="currentPage"
                                :pages="totalPages"
                                @update:modelValue="handlePageChange"
                                align="center"
                                class="mt-3"
                            />
                        </div>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>
    </CRow>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { userGetusers, userGetuserswithvalue } from '@/web/ProxyReq'
import { UserDefine } from 'pp-base-define/UserDefine'
import Decimal from 'decimal.js'
import { ItemID } from 'pp-base-define/ItemDefine'
import type { ProxyReqDefine } from 'pp-base-define/ProxyReqDefine'
import { Toast } from '@/composables/useToast'

const router = useRouter()

// Reactive data
const loading = ref(false)
const userList = ref<(ProxyReqDefine.tUserGetusersRes['users'][0] | ProxyReqDefine.tUserGetuserswithvalueRes['users'][0])[]>([])
const currentPage = ref(0)
const pageSize = ref(20)
const totalCount = ref(0)
const queryMode = ref<'normal' | 'byItem'>('normal')
const itemFilter = ref({
    itemID: '',
    minValue: undefined as number | undefined,
    sort: 'desc' as 'asc' | 'desc',
})

// Computed total pages
const totalPages = computed(() => {
    return Math.ceil(totalCount.value / pageSize.value)
})

// Get channel name
const getChannelName = (type: UserDefine.LoginChannel): string => {
    const channelMap: Record<UserDefine.LoginChannel, string> = {
        [UserDefine.LoginChannel.Guest]: '游客',
        [UserDefine.LoginChannel.Account]: '账号',
        [UserDefine.LoginChannel.Email]: '邮箱',
        [UserDefine.LoginChannel.Phone]: '手机号',
        [UserDefine.LoginChannel.Web3]: 'Web3',
        [UserDefine.LoginChannel.Wechat]: '微信',
    }
    return channelMap[type] || '未知'
}

// 从 Bag 中取 itemID === ItemID.Gold 的数量，无 bag 或无 Gold 视为 0
const getGoldBalance = (user: (ProxyReqDefine.tUserGetusersRes['users'][0] | ProxyReqDefine.tUserGetuserswithvalueRes['users'][0])): string | number => {
    if (!user?.bag?.items?.length) return 0
    const gold = user.bag.items.find((item: { id: string }) => item.id === ItemID.Gold)
    return gold?.count ?? 0
}

type BalanceField = 'exceptionValue' | 'rewardValue' | 'totalCharge' | 'totalWithdraw'
// 从 balance 中取字段，无 balance 或缺少字段显示 0
const getBalanceField = (user: (ProxyReqDefine.tUserGetusersRes['users'][0] | ProxyReqDefine.tUserGetuserswithvalueRes['users'][0]), field: BalanceField): string => {
    const val = user?.balance?.[field]
    if (val === undefined || val === null) return '0'
    return String(val)
}
// balance 的 win + lose（Decimal 计算），无数据或缺字段按 0
const getExceptionField = (user: (ProxyReqDefine.tUserGetusersRes['users'][0] | ProxyReqDefine.tUserGetuserswithvalueRes['users'][0])): string => {
    const b = user?.balance
    if (!b) return '0'
    const win = b.win !== undefined && b.win !== null ? String(b.win) : '0'
    const lose = b.lose !== undefined && b.lose !== null ? String(b.lose) : '0'
    return new Decimal(win).plus(lose).toString()
}
// win + lose > 0 时高亮该行
const isExceptionValuePositive = (user: (ProxyReqDefine.tUserGetusersRes['users'][0] | ProxyReqDefine.tUserGetuserswithvalueRes['users'][0])): boolean => {
    const b = user?.balance
    if (!b) return false
    const win = b.win !== undefined && b.win !== null ? String(b.win) : '0'
    const lose = b.lose !== undefined && b.lose !== null ? String(b.lose) : '0'
    return new Decimal(win).plus(lose).gt(0)
}

// Get channel color
const getChannelColor = (type: UserDefine.LoginChannel): string => {
    const colorMap: Record<UserDefine.LoginChannel, string> = {
        [UserDefine.LoginChannel.Guest]: 'secondary',
        [UserDefine.LoginChannel.Account]: 'primary',
        [UserDefine.LoginChannel.Email]: 'info',
        [UserDefine.LoginChannel.Phone]: 'success',
        [UserDefine.LoginChannel.Web3]: 'warning',
        [UserDefine.LoginChannel.Wechat]: 'danger',
    }
    return colorMap[type] || 'secondary'
}

// Load users
const loadUsers = async () => {
    loading.value = true
    try {
        if (queryMode.value === 'byItem') {
            if (!itemFilter.value.itemID) {
                Toast.warning('请输入道具ID')
                return
            }
            
            const params: ProxyReqDefine.tUserGetuserswithvalueReq = {
                itemID: itemFilter.value.itemID,
                minValue: itemFilter.value.minValue,
                sort: itemFilter.value.sort,
                page: currentPage.value,
                limit: pageSize.value,
            }

            const response = await userGetuserswithvalue(params)

            if (response.errCode) {
                Toast.error(response.errMsg || '加载用户列表失败')
                return
            }

            userList.value = response.users || []
            totalCount.value = response.count || 0
        } else {
            const params: ProxyReqDefine.tUserGetusersReq = {
                page: currentPage.value,
                limit: pageSize.value,
            }

            const response = await userGetusers(params)

            if (response.errCode) {
                Toast.error(response.errMsg || '加载用户列表失败')
                return
            }

            userList.value = response.users || []
            totalCount.value = response.count || 0
        }
    } catch (error) {
        console.error('Load users error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// Handle page change
const handlePageChange = (page: number) => {
    currentPage.value = page
    loadUsers()
}

// Handle search
const handleSearch = () => {
    currentPage.value = 0
    loadUsers()
}

// 跳转到用户流水页并带上 userID
const goToUserSerial = (userID: number) => {
    router.push({ path: '/admin/users/serial', query: { userID: String(userID) } })
}

// Clear search
const clearSearch = () => {
    queryMode.value = 'normal'
    itemFilter.value = {
        itemID: '',
        minValue: undefined,
        sort: 'desc',
    }
    currentPage.value = 0
    loadUsers()
}

// Load users when component is mounted
onMounted(() => {
    loadUsers()
})
</script>

<style scoped>
:deep(.balance-exception-highlight) {
    background-color: rgba(220, 53, 69, 0.3) !important;
}
:deep(.balance-exception-highlight:hover) {
    background-color: rgba(220, 53, 69, 0.4) !important;
}
:deep(.balance-exception-highlight td) {
    background-color: rgba(220, 53, 69, 0.3) !important;
}
:deep(.balance-exception-highlight:hover td) {
    background-color: rgba(220, 53, 69, 0.4) !important;
}
</style>
