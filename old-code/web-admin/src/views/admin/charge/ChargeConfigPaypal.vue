<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>充值配置 - PayPal</strong>
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
                                    <CTableHeaderCell>邮箱/模式</CTableHeaderCell>
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
                                    <CTableDataCell>{{ row.paypalAccountInfo?.email }} / {{ row.paypalAccountInfo?.mode }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CButton color="primary" size="sm" @click="edit(row)">编辑</CButton>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!list.length">
                                    <CTableDataCell colspan="8" class="text-center text-muted py-4">暂无数据</CTableDataCell>
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
                <CModalTitle>{{ isCreate ? '新增' : '编辑' }}PayPal 充值配置</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <CRow>
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
                    <hr />
                    <strong>PayPal 账户信息</strong>
                    <CRow>
                        <CCol :md="12">
                            <div class="mb-3">
                                <CFormLabel>收款邮箱</CFormLabel>
                                <CFormInput v-model="form.paypalAccountInfo!.email" placeholder="email" />
                            </div>
                        </CCol>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>商户ID</CFormLabel>
                                <CFormInput v-model="form.paypalAccountInfo!.merchantID" placeholder="merchantID" />
                            </div>
                        </CCol>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>运行模式</CFormLabel>
                                <select class="form-select" v-model="form.paypalAccountInfo!.mode">
                                    <option value="sandbox">sandbox</option>
                                    <option value="live">live</option>
                                </select>
                            </div>
                        </CCol>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>Client ID</CFormLabel>
                                <CFormInput v-model="form.paypalAccountInfo!.clientID" placeholder="clientID" />
                            </div>
                        </CCol>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>Client Secret</CFormLabel>
                                <CFormInput v-model="form.paypalAccountInfo!.clientSecret" type="password" placeholder="clientSecret" />
                            </div>
                        </CCol>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>Webhook ID</CFormLabel>
                                <CFormInput v-model="form.paypalAccountInfo!.webhookID" placeholder="webhookID" />
                            </div>
                        </CCol>
                    </CRow>
                    <CRow>
                        <CCol :md="4">
                            <div class="mb-3">
                                <CFormLabel>最小充值金额</CFormLabel>
                                <CFormInput v-model.number="form.minAmount" type="number" step="0.01" />
                            </div>
                        </CCol>
                        <CCol :md="4">
                            <div class="mb-3">
                                <CFormLabel>最大充值金额</CFormLabel>
                                <CFormInput v-model.number="form.maxAmount" type="number" step="0.01" />
                            </div>
                        </CCol>
                        <CCol :md="4">
                            <div class="mb-3">
                                <FormSlider v-model="form.feePercent" label="手续费" value-suffix="%" value-type="number" :min="0" :max="100" :step="0.01" />
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
import { chargeGetpaypalinfos, chargeGetchargeconfig_paypal, chargeUpdatechargeconfig_paypal, chargeSetchargeconfigenabled_paypal } from '@/web/AdminReq'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import type { ChargeDefine } from 'pp-base-define/ChargeDefine'
import { Toast } from '@/composables/useToast'
import ItemSelect from '@/components/ItemSelect.vue'
import FormSlider from '@/components/FormSlider.vue'

const loading = ref(false)
const saving = ref(false)
const list = ref<ChargeDefine.tChargePaypalConfig[]>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = 20
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))
const withDisabled = ref(false)
const showModal = ref(false)
const isCreate = ref(true)
const paypalList = ref<AdminReqDefine.tChargeGetpaypalinfosRes['datas']>([])
const paypalListLoading = ref(false)

const defaultPaypalAccountInfo = (): ChargeDefine.tChargePaypalConfig['paypalAccountInfo'] => ({
    email: '',
    mode: 'sandbox',
})

const form = ref<ChargeDefine.tChargePaypalConfig>({
    typeID: 0,
    enabled: true,
    paypalID: 0,
    unit: '',
    rate: 0,
    itemID: '',
    paypalAccountInfo: defaultPaypalAccountInfo(),
    minAmount: 0,
    maxAmount: 0,
    feePercent: 0,
})

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
        const res = await chargeGetchargeconfig_paypal({ withDisabled: withDisabled.value, page: currentPage.value, limit: pageSize })
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
    form.value = {
        typeID: 0,
        enabled: true,
        paypalID: 0,
        unit: '',
        rate: 0,
        itemID: '',
        paypalAccountInfo: defaultPaypalAccountInfo(),
        minAmount: 0,
        maxAmount: 0,
        feePercent: 0,
    }
    loadPaypalList()
    showModal.value = true
}

const edit = (row: ChargeDefine.tChargePaypalConfig) => {
    isCreate.value = false
    form.value = {
        ...row,
        paypalAccountInfo: { ...defaultPaypalAccountInfo(), ...row.paypalAccountInfo },
    }
    loadPaypalList()
    showModal.value = true
}

const save = async () => {
    saving.value = true
    try {
        const res = await chargeUpdatechargeconfig_paypal({ create: isCreate.value, data: { ...form.value } })
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

const toggleEnabled = async (row: ChargeDefine.tChargePaypalConfig) => {
    const res = await chargeSetchargeconfigenabled_paypal({ typeID: row.typeID, enabled: row.enabled })
    if (res.errCode) Toast.error(res.errMsg || '操作失败')
    else loadList()
}

onMounted(() => {
    loadList()
})
</script>
