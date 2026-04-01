<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <strong>充值/提现审核</strong>
                </CCardHeader>
                <CCardBody>
                    <CTabs v-model="activeTab">
                        <CNav variant="tabs">
                            <CNavItem>
                                <CNavLink :active="activeTab === 0" @click="activeTab = 0">充值审核</CNavLink>
                            </CNavItem>
                            <CNavItem>
                                <CNavLink :active="activeTab === 1" @click="activeTab = 1">提现审核</CNavLink>
                            </CNavItem>
                        </CNav>
                        <CTabContent>
                            <!-- 充值审核 -->
                            <CTabPane :visible="activeTab === 0">
                                <CRow class="mb-3">
                                    <CCol :md="3">
                                        <select class="form-select" v-model="chargePayTypeFilter">
                                            <option :value="undefined">全部方式</option>
                                            <option :value="0">区块链</option>
                                            <option :value="1">银行</option>
                                            <option :value="2">PayPal</option>
                                            <option :value="3">苹果卡</option>
                                        </select>
                                    </CCol>
                                    <CCol :md="3">
                                        <select class="form-select" v-model="chargeStatusFilter">
                                            <option :value="undefined">全部状态</option>
                                            <option :value="0">待审核</option>
                                            <option :value="1">成功</option>
                                            <option :value="2">失败</option>
                                            <option :value="3">取消</option>
                                        </select>
                                    </CCol>
                                    <CCol :md="2">
                                        <CButton color="primary" @click="loadChargeList">搜索</CButton>
                                    </CCol>
                                </CRow>
                                <div v-if="chargeLoading" class="text-center py-4"><CSpinner /> 加载中...</div>
                                <div v-else>
                                    <CTable hover responsive>
                                        <CTableHead>
                                            <CTableRow>
                                                <CTableHeaderCell>订单ID</CTableHeaderCell>
                                                <CTableHeaderCell>用户ID</CTableHeaderCell>
                                                <CTableHeaderCell>方式</CTableHeaderCell>
                                                <CTableHeaderCell>金额/数量</CTableHeaderCell>
                                                <CTableHeaderCell>状态</CTableHeaderCell>
                                                <CTableHeaderCell>时间</CTableHeaderCell>
                                                <CTableHeaderCell>操作</CTableHeaderCell>
                                            </CTableRow>
                                        </CTableHead>
                                        <CTableBody>
                                            <CTableRow v-for="row in chargeList" :key="row.orderID">
                                                <CTableDataCell>{{ row.strOrderID || row.orderID }}</CTableDataCell>
                                                <CTableDataCell>{{ row.userID }}</CTableDataCell>
                                                <CTableDataCell>{{ payTypeName(row.payType) }}</CTableDataCell>
                                                <CTableDataCell>{{ row.amount }} {{ row.currencyUnit }} / {{ row.itemCount }} {{ getItemDisplayName(row.itemID) }}</CTableDataCell>
                                                <CTableDataCell>{{ chargeStatusName(row.status) }}</CTableDataCell>
                                                <CTableDataCell>{{ row.date || '-' }}</CTableDataCell>
                                                <CTableDataCell>
                                                    <CButton v-if="row.status === 0" color="info" size="sm" @click="viewChargeUpload(row)">凭证</CButton>
                                                    <CButton v-if="row.status === 0" color="success" size="sm" class="ms-1" @click="confirmCharge(row, true)">通过</CButton>
                                                    <CButton v-if="row.status === 0" color="danger" size="sm" class="ms-1" @click="confirmCharge(row, false)">拒绝</CButton>
                                                </CTableDataCell>
                                            </CTableRow>
                                            <CTableRow v-if="!chargeList.length">
                                                <CTableDataCell colspan="7" class="text-center text-muted py-4">暂无数据</CTableDataCell>
                                            </CTableRow>
                                        </CTableBody>
                                    </CTable>
                                    <div class="d-flex justify-content-between align-items-center mt-3">
                                        <span class="text-muted">共 {{ chargeCount }} 条，第 {{ chargePage + 1 }} / {{ chargeTotalPages || 1 }} 页</span>
                                        <CPagination v-if="chargeTotalPages > 0" v-model="chargePage" :pages="chargeTotalPages" align="end" @update:modelValue="loadChargeList" />
                                    </div>
                                </div>
                            </CTabPane>
                            <!-- 提现审核 -->
                            <CTabPane :visible="activeTab === 1">
                                <CRow class="mb-3">
                                    <CCol :md="3">
                                        <select class="form-select" v-model="withdrawPayTypeFilter">
                                            <option :value="undefined">全部方式</option>
                                            <option :value="0">区块链</option>
                                            <option :value="1">银行</option>
                                            <option :value="2">PayPal</option>
                                        </select>
                                    </CCol>
                                    <CCol :md="3">
                                        <select class="form-select" v-model="withdrawStatusFilter">
                                            <option :value="undefined">全部状态</option>
                                            <option :value="0">待审核</option>
                                            <option :value="1">处理中</option>
                                            <option :value="2">成功</option>
                                            <option :value="3">失败</option>
                                            <option :value="4">拒绝</option>
                                        </select>
                                    </CCol>
                                    <CCol :md="2">
                                        <CButton color="primary" @click="loadWithdrawList">搜索</CButton>
                                    </CCol>
                                </CRow>
                                <div v-if="withdrawLoading" class="text-center py-4"><CSpinner /> 加载中...</div>
                                <div v-else>
                                    <CTable hover responsive>
                                        <CTableHead>
                                            <CTableRow>
                                                <CTableHeaderCell>订单ID</CTableHeaderCell>
                                                <CTableHeaderCell>用户ID</CTableHeaderCell>
                                                <CTableHeaderCell>方式</CTableHeaderCell>
                                                <CTableHeaderCell>数量/到账</CTableHeaderCell>
                                                <CTableHeaderCell>状态</CTableHeaderCell>
                                                <CTableHeaderCell>期望值</CTableHeaderCell>
                                                <CTableHeaderCell>累计返利</CTableHeaderCell>
                                                <CTableHeaderCell>总充值</CTableHeaderCell>
                                                <CTableHeaderCell>总提现</CTableHeaderCell>
                                                <CTableHeaderCell>时间</CTableHeaderCell>
                                                <CTableHeaderCell>操作</CTableHeaderCell>
                                            </CTableRow>
                                        </CTableHead>
                                        <CTableBody>
                                            <CTableRow v-for="row in withdrawList" :key="row.orderID"
                                                :class="{ 'balance-exception-highlight': isWithdrawExceptionValuePositive(row.userID) }">
                                                <CTableDataCell>{{ row.strOrderID || row.orderID }}</CTableDataCell>
                                                <CTableDataCell>{{ row.userID }}</CTableDataCell>
                                                <CTableDataCell>{{ payTypeName(row.payType) }}</CTableDataCell>
                                                <CTableDataCell>{{ row.itemCount }} {{ getItemDisplayName(row.itemID) }} → {{ row.amount }} {{ row.currencyUnit }}</CTableDataCell>
                                                <CTableDataCell>{{ withdrawStatusName(row.status) }}</CTableDataCell>
                                                <CTableDataCell>{{ getWithdrawExceptionField(row.userID) + "/" + getWithdrawBalanceField(row.userID, 'exceptionValue') }}</CTableDataCell>
                                                <CTableDataCell>{{ getWithdrawBalanceField(row.userID, 'rewardValue') }}</CTableDataCell>
                                                <CTableDataCell>{{ getWithdrawBalanceField(row.userID, 'totalCharge') }}</CTableDataCell>
                                                <CTableDataCell>{{ getWithdrawBalanceField(row.userID, 'totalWithdraw') }}</CTableDataCell>
                                                <CTableDataCell>{{ row.date || '-' }}</CTableDataCell>
                                                <CTableDataCell>
                                                    <CButton v-if="row.status === 0" color="success" size="sm" @click="confirmWithdraw(row, true)">通过</CButton>
                                                    <CButton v-if="row.status === 0" color="danger" size="sm" class="ms-1" @click="confirmWithdraw(row, false)">拒绝</CButton>
                                                </CTableDataCell>
                                            </CTableRow>
                                            <CTableRow v-if="!withdrawList.length">
                                                <CTableDataCell colspan="11" class="text-center text-muted py-4">暂无数据</CTableDataCell>
                                            </CTableRow>
                                        </CTableBody>
                                    </CTable>
                                    <div class="d-flex justify-content-between align-items-center mt-3">
                                        <span class="text-muted">共 {{ withdrawCount }} 条，第 {{ withdrawPage + 1 }} / {{ withdrawTotalPages || 1 }} 页</span>
                                        <CPagination v-if="withdrawTotalPages > 0" v-model="withdrawPage" :pages="withdrawTotalPages" align="end" @update:modelValue="loadWithdrawList" />
                                    </div>
                                </div>
                            </CTabPane>
                        </CTabContent>
                    </CTabs>
                </CCardBody>
            </CCard>
        </CCol>
        <CModal :visible="showUploadModal" @close="showUploadModal = false" size="lg">
            <CModalHeader>
                <CModalTitle>充值凭证</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <img v-if="uploadBase64" :src="'data:image/png;base64,' + uploadBase64" style="max-width:100%" />
                <p v-else class="text-muted">无凭证或加载失败</p>
            </CModalBody>
        </CModal>
        <CModal :visible="showConfirmModal" @close="showConfirmModal = false">
            <CModalHeader>
                <CModalTitle>{{ confirmReject ? '拒绝' : '通过' }}</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <div v-if="confirmReject" class="mb-3">
                    <CFormLabel>拒绝原因</CFormLabel>
                    <CFormInput v-model="confirmReason" placeholder="选填" />
                </div>
                <div v-if="!confirmReject && confirmIsCharge" class="mb-3">
                    <CFormLabel>实际到账金额</CFormLabel>
                    <CFormInput v-model="confirmAmount" placeholder="选填" @change="updateSubmitConfirm_Amount"/>
                    <CFormLabel class="mt-2">实际到账道具数量</CFormLabel>
                    <CFormInput v-model="confirmItemCount" placeholder="选填" @change="updateSubmitConfirm_ItemCount"/>
                </div>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="showConfirmModal = false">取消</CButton>
                <CButton :color="confirmReject ? 'danger' : 'primary'" @click="submitConfirm" :disabled="saving">{{ saving ? '提交中...' : '确定' }}</CButton>
            </CModalFooter>
        </CModal>
    </CRow>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    chargeConfirmGetchargeorders,
    chargeConfirmGetchargeupload,
    chargeConfirmConfirmchargeorder,
    chargeConfirmGetwithdraworders,
    chargeConfirmConfirmwithdraworder,
} from '@/web/AdminReq'
import type { ChargeDefine } from 'pp-base-define/ChargeDefine'
import type { LeaderDefine } from 'pp-base-define/LeaderDefine'
import { ItemID } from 'pp-base-define/ItemDefine'
import { Toast } from '@/composables/useToast'
import Decimal from 'decimal.js'

// 根据 ItemID 常量映射为展示名称，未匹配则显示原 itemID
const itemIdNameMap: Record<string, string> = {
    [ItemID.Gold]: '金币',
    [ItemID.Diamond]: '钻石',
    [ItemID.USDT]: 'USDT',
    [ItemID.Score]: '积分',
}
const getItemDisplayName = (itemID: string): string => itemIdNameMap[itemID] ?? itemID

const route = useRoute()
const router = useRouter()
// 从 URL query 恢复 tab，刷新时保持在当前页（充值 0 / 提现 1）
const initialTab = (): number => {
    const t = route.query.tab
    if (t === '1' || t === 'withdraw') return 1
    return 0
}
const activeTab = ref(initialTab())
const chargeLoading = ref(false)
const chargeList = ref<ChargeDefine.tChargeOrder[]>([])
const chargeCount = ref(0)
const chargePage = ref(0)
const chargePageSize = 20
const chargeTotalPages = computed(() => Math.ceil(chargeCount.value / chargePageSize))
const chargeStatusFilter = ref<ChargeDefine.ChargeStatus | undefined>(undefined)
const chargePayTypeFilter = ref<ChargeDefine.PayType | undefined>(undefined)
const withdrawLoading = ref(false)
const withdrawList = ref<ChargeDefine.tWithdrawOrder[]>([])
const withdrawCount = ref(0)
const withdrawPage = ref(0)
const withdrawPageSize = 20
const withdrawTotalPages = computed(() => Math.ceil(withdrawCount.value / withdrawPageSize))
const withdrawStatusFilter = ref<ChargeDefine.WithdrawStatus | undefined>(undefined)
const withdrawPayTypeFilter = ref<ChargeDefine.PayType | undefined>(undefined)
// 提现列表接口返回的 balances，按 userID 建表便于表格展示
const withdrawUserBalanceMap = ref<Record<number, LeaderDefine.tBalance>>({})
const showUploadModal = ref(false)
const uploadBase64 = ref('')
const showConfirmModal = ref(false)
const confirmReject = ref(false)
const confirmReason = ref('')
const confirmAmount = ref('')
const confirmItemCount = ref('')
const confirmRate = ref(0)
const saving = ref(false)
const confirmIsCharge = ref(false)
let confirmOrderID = 0
let confirmCallback: (() => Promise<void>) | null = null

const payTypeName = (t: ChargeDefine.PayType) => {
    switch (t) {
        case 0: return '区块链'
        case 1: return '银行'
        case 2: return 'PayPal'
        case 3: return '苹果卡'
        default: return String(t)
    }
}
const chargeStatusName = (s: ChargeDefine.ChargeStatus) => ['待审核', '成功', '失败', '取消'][s] ?? String(s)
const withdrawStatusName = (s: ChargeDefine.WithdrawStatus) => ['待审核', '处理中', '成功', '失败', '拒绝'][s] ?? String(s)

const loadChargeList = async () => {
    chargeLoading.value = true
    try {
        const statuss = chargeStatusFilter.value !== undefined ? [chargeStatusFilter.value] : undefined
        const payType = chargePayTypeFilter.value
        const res = await chargeConfirmGetchargeorders({ page: chargePage.value, limit: chargePageSize, statuss, payType })
        if (res.errCode) { Toast.error(res.errMsg || '加载失败'); return }
        chargeList.value = res.datas || []
        chargeCount.value = res.count || 0
    } finally { chargeLoading.value = false }
}

const loadWithdrawList = async () => {
    withdrawLoading.value = true
    try {
        const statuss = withdrawStatusFilter.value !== undefined ? [withdrawStatusFilter.value] : undefined
        const payType = withdrawPayTypeFilter.value
        const res = await chargeConfirmGetwithdraworders({ page: withdrawPage.value, limit: withdrawPageSize, statuss, payType })
        if (res.errCode) { Toast.error(res.errMsg || '加载失败'); return }
        withdrawList.value = res.datas || []
        withdrawCount.value = res.count || 0
        withdrawUserBalanceMap.value = {}
        for (const b of res.balances || []) {
            withdrawUserBalanceMap.value[b.userID] = b
        }
    } finally { withdrawLoading.value = false }
}

const getWithdrawBalanceField = (userID: number, key: 'exceptionValue' | 'rewardValue' | 'totalCharge' | 'totalWithdraw'): string => {
    const b = withdrawUserBalanceMap.value[userID]
    const val = b?.[key]
    return val !== undefined && val !== null && val !== '' ? String(val) : '0'
}

const getWithdrawExceptionField = (
    userID:number
): string => {
    const b = withdrawUserBalanceMap.value[userID]
    // let exceptionValue = new Decimal(b?.exceptionValue || 0)
    // let totalCharge = new Decimal(b?.totalCharge || 0)
    let win = new Decimal(b?.win || 0)
    let lose = new Decimal(b?.lose || 0)
    return win.add(lose).toString()
}

const isWithdrawExceptionValuePositive = (userID: number): boolean => {
    const b = withdrawUserBalanceMap.value[userID]
    // let exceptionValue = new Decimal(b?.exceptionValue || 0)
    // let totalCharge = new Decimal(b?.totalCharge || 0)
    let win = new Decimal(b?.win || 0)
    let lose = new Decimal(b?.lose || 0)
    return win.add(lose).greaterThan(0)
}

const viewChargeUpload = async (row: ChargeDefine.tChargeOrder) => {
    try {
        const res = await chargeConfirmGetchargeupload({ orderID: row.orderID })
        uploadBase64.value = res.base64Data || ''
        showUploadModal.value = true
    } catch (e) {
        Toast.error('加载凭证失败')
    }
}

const confirmCharge = (row: ChargeDefine.tChargeOrder, pass: boolean) => {
    confirmOrderID = row.orderID
    confirmIsCharge.value = true
    confirmReject.value = !pass
    confirmReason.value = ''
    confirmAmount.value = row.amount ? String(row.amount) : ''
    confirmItemCount.value = row.itemCount ? String(row.itemCount) : ''
    confirmRate.value = row.rate || 0
    confirmCallback = async () => {
        const res = await chargeConfirmConfirmchargeorder({
            orderID: confirmOrderID,
            confirm: pass,
            reason: confirmReason.value || undefined,
            confirmAmount: confirmAmount.value || undefined,
            confirmItemCount: confirmItemCount.value || undefined,
        })
        if (res.errCode) { Toast.error(res.errMsg || '操作失败'); return }
        Toast.success(pass ? '已通过' : '已拒绝')
        showConfirmModal.value = false
        loadChargeList()
    }
    showConfirmModal.value = true
}

const confirmWithdraw = (row: ChargeDefine.tWithdrawOrder, pass: boolean) => {
    confirmOrderID = row.orderID
    confirmIsCharge.value = false
    confirmReject.value = !pass
    confirmReason.value = ''
    confirmCallback = async () => {
        const res = await chargeConfirmConfirmwithdraworder({
            orderID: confirmOrderID,
            confirm: pass,
            reason: confirmReason.value || undefined,
        })
        if (res.errCode) { Toast.error(res.errMsg || '操作失败'); return }
        Toast.success(pass ? '已通过' : '已拒绝')
        showConfirmModal.value = false
        loadWithdrawList()
    }
    showConfirmModal.value = true
}

const submitConfirm = async () => {
    if (!confirmCallback) return
    saving.value = true
    try {
        await confirmCallback()
    } finally { saving.value = false }
}

const updateSubmitConfirm_Amount = () => {
    if(!confirmIsCharge.value) return
    if(confirmAmount.value === '' || isNaN(Number(confirmAmount.value))) {
        confirmAmount.value = ''
        return
    }
    if(!confirmRate.value || confirmRate.value === 0) return
    const amount = new Decimal(confirmAmount.value)
    const itemCount = amount.mul(confirmRate.value).toDecimalPlaces(2, Decimal.ROUND_DOWN)
    confirmItemCount.value = itemCount.toString()
}

const updateSubmitConfirm_ItemCount = () => {
    if(!confirmIsCharge.value) return
    if(confirmItemCount.value === '' || isNaN(Number(confirmItemCount.value))) {
        confirmItemCount.value = ''
        return
    }
    if(!confirmRate.value || confirmRate.value === 0) return
    const itemCount = new Decimal(confirmItemCount.value)
    const amount = itemCount.div(confirmRate.value).toDecimalPlaces(2, Decimal.ROUND_UP)
    confirmAmount.value = amount.toString()
}

watch(activeTab, (tab) => {
    router.replace({ path: route.path, query: { ...route.query, tab: String(tab) } })
    if (tab === 0) loadChargeList()
    else loadWithdrawList()
})
onMounted(() => {
    if (activeTab.value === 0) loadChargeList()
    else loadWithdrawList()
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
