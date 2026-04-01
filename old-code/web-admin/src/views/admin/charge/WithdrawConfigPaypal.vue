<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>提现配置 - PayPal</strong>
                        <div class="d-flex align-items-center gap-2">
                            <CFormCheck label="含已禁用" v-model="withDisabled" @update:modelValue="loadList" />
                            <CButton color="success" size="sm" @click="add">添加</CButton>
                        </div>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <div v-if="loading" class="text-center py-4"><CSpinner /> 加载中...</div>
                    <div v-else>
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>类型ID</CTableHeaderCell>
                                    <CTableHeaderCell>启用</CTableHeaderCell>
                                    <CTableHeaderCell>PayPal ID</CTableHeaderCell>
                                    <CTableHeaderCell>单位</CTableHeaderCell>
                                    <CTableHeaderCell>比例</CTableHeaderCell>
                                    <CTableHeaderCell>道具ID</CTableHeaderCell>
                                    <CTableHeaderCell>最小/最大金额</CTableHeaderCell>
                                    <CTableHeaderCell>手续费</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="row in list" :key="row.typeID">
                                    <CTableDataCell>{{ row.typeID }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CFormSwitch v-model="row.enabled" @change="toggleEnabled(row)" />
                                    </CTableDataCell>
                                    <CTableDataCell>{{ row.paypalID }}</CTableDataCell>
                                    <CTableDataCell>{{ row.unit }}</CTableDataCell>
                                    <CTableDataCell>{{ row.rate }}</CTableDataCell>
                                    <CTableDataCell>{{ row.itemID }}</CTableDataCell>
                                    <CTableDataCell>{{ row.minAmount }} / {{ row.maxAmount }}</CTableDataCell>
                                    <CTableDataCell>{{ row.fixedFee ? row.feeAmount : row.feePercent + '%' }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CButton color="primary" size="sm" @click="edit(row)">编辑</CButton>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!list.length">
                                    <CTableDataCell colspan="9" class="text-center text-muted py-4">暂无数据</CTableDataCell>
                                </CTableRow>
                            </CTableBody>
                        </CTable>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="text-muted">共 {{ totalCount }} 条，第 {{ currentPage + 1 }} / {{ totalPages || 1 }} 页</span>
                            <CPagination v-if="totalPages > 0" v-model="currentPage" :pages="totalPages" align="end" @update:modelValue="loadList" />
                        </div>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>
        <CModal :visible="showModal" @close="showModal = false" size="lg">
            <CModalHeader>
                <CModalTitle>{{ isCreate ? '新增' : '编辑' }}PayPal 提现配置</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <CRow>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>类型ID</CFormLabel>
                                <CFormInput v-model.number="form.typeID" type="number" :disabled="!isCreate" />
                            </div>
                        </CCol>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>启用</CFormLabel>
                                <div><CFormSwitch v-model="form.enabled" /></div>
                            </div>
                        </CCol>
                    </CRow>
                    <CRow>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>PayPal 配置</CFormLabel>
                                <select class="form-select" v-model.number="form.paypalID">
                                    <option :value="0">请选择 PayPal 配置</option>
                                    <option v-for="p in paypalList" :key="p.paypalID" :value="p.paypalID">
                                        {{ p.displayName || p.name }}（ID: {{ p.paypalID }}）
                                    </option>
                                </select>
                                <div v-if="paypalListLoading" class="small text-muted mt-1">加载中...</div>
                            </div>
                        </CCol>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>货币单位</CFormLabel>
                                <CFormInput v-model="form.unit" placeholder="USD / EUR / GBP / CNY" />
                            </div>
                        </CCol>
                    </CRow>
                    <CRow>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>兑换比例</CFormLabel>
                                <CFormInput v-model.number="form.rate" type="number" step="0.01" />
                            </div>
                        </CCol>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>道具ID</CFormLabel>
                                <ItemSelect v-model="form.itemID" placeholder="选择道具" placeholder-value="" />
                            </div>
                        </CCol>
                    </CRow>
                    <CRow>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>最小提现金额</CFormLabel>
                                <CFormInput v-model="form.minAmount" type="text" placeholder="如 100" />
                            </div>
                        </CCol>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>最大提现金额</CFormLabel>
                                <CFormInput v-model="form.maxAmount" type="text" placeholder="如 10000" />
                            </div>
                        </CCol>
                    </CRow>
                    <CRow>
                        <CCol :md="4">
                            <div class="mb-3">
                                <CFormLabel>固定手续费</CFormLabel>
                                <div><CFormSwitch v-model="form.fixedFee" /></div>
                            </div>
                        </CCol>
                        <CCol v-if="form.fixedFee" :md="4">
                            <div class="mb-3">
                                <CFormLabel>手续费金额</CFormLabel>
                                <CFormInput v-model="form.feeAmount" type="text" placeholder="固定金额" />
                            </div>
                        </CCol>
                        <CCol v-else :md="4">
                            <div class="mb-3">
                                <FormSlider v-model="form.feePercent" label="手续费%" value-suffix="%" value-type="number" :min="0" :max="100" :step="0.01" />
                            </div>
                        </CCol>
                    </CRow>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="showModal = false">取消</CButton>
                <CButton color="primary" @click="save" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</CButton>
            </CModalFooter>
        </CModal>
    </CRow>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { chargeGetpaypalinfos, chargeGetwithdrawconfig_paypal, chargeUpdatewithdrawconfig_paypal, chargeSetwithdrawconfigenabled_paypal } from '@/web/AdminReq'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import type { ChargeDefine } from 'pp-base-define/ChargeDefine'
import { Toast } from '@/composables/useToast'
import ItemSelect from '@/components/ItemSelect.vue'
import FormSlider from '@/components/FormSlider.vue'

const loading = ref(false)
const saving = ref(false)
const list = ref<ChargeDefine.tWithdrawPaypalConfig[]>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = 20
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))
const withDisabled = ref(false)
const showModal = ref(false)
const isCreate = ref(true)
const paypalList = ref<AdminReqDefine.tChargeGetpaypalinfosRes['datas']>([])
const paypalListLoading = ref(false)

const defaultForm = (): ChargeDefine.tWithdrawPaypalConfig => ({
    typeID: 0,
    enabled: true,
    paypalID: 0,
    unit: '',
    rate: 0,
    itemID: '',
    minAmount: '',
    maxAmount: '',
    fixedFee: false,
    feeAmount: '',
    feePercent: 0,
})

const form = ref<ChargeDefine.tWithdrawPaypalConfig>(defaultForm())

const loadPaypalList = async () => {
    paypalListLoading.value = true
    try {
        const res = await chargeGetpaypalinfos({ page: 0, limit: 500 })
        if (!res.errCode && res.datas) paypalList.value = res.datas
    } finally {
        paypalListLoading.value = false
    }
}

const loadList = async () => {
    loading.value = true
    try {
        const res = await chargeGetwithdrawconfig_paypal({ withDisabled: withDisabled.value, page: currentPage.value, limit: pageSize })
        if (res.errCode) {
            Toast.error(res.errMsg || '加载失败')
            return
        }
        list.value = res.datas || []
        totalCount.value = res.count || 0
    } finally {
        loading.value = false
    }
}

const add = () => {
    isCreate.value = true
    form.value = defaultForm()
    loadPaypalList()
    showModal.value = true
}

const edit = (row: ChargeDefine.tWithdrawPaypalConfig) => {
    isCreate.value = false
    form.value = { ...row }
    loadPaypalList()
    showModal.value = true
}

const save = async () => {
    saving.value = true
    try {
        const res = await chargeUpdatewithdrawconfig_paypal({ create: isCreate.value, data: { ...form.value } })
        if (res.errCode) {
            Toast.error(res.errMsg || '保存失败')
            return
        }
        Toast.success('保存成功')
        showModal.value = false
        loadList()
    } finally {
        saving.value = false
    }
}

const toggleEnabled = async (row: ChargeDefine.tWithdrawPaypalConfig) => {
    const res = await chargeSetwithdrawconfigenabled_paypal({ typeID: row.typeID, enabled: row.enabled })
    if (res.errCode) Toast.error(res.errMsg || '操作失败')
    else loadList()
}

onMounted(() => {
    loadList()
})
</script>
