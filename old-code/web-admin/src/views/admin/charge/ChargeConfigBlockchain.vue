<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>充值配置 - 区块链</strong>
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
                                    <CTableHeaderCell>链ID</CTableHeaderCell>
                                    <CTableHeaderCell>名称</CTableHeaderCell>
                                    <CTableHeaderCell>比例</CTableHeaderCell>
                                    <CTableHeaderCell>道具ID</CTableHeaderCell>
                                    <CTableHeaderCell>合约/符号</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="row in list" :key="row.typeID">
                                    <CTableDataCell>{{ row.typeID }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CFormSwitch :model-value="row.enabled" @update:modelValue="(v: boolean) => toggleEnabled(row, v)" />
                                    </CTableDataCell>
                                    <CTableDataCell>{{ row.chainID }}</CTableDataCell>
                                    <CTableDataCell>{{ row.name }}</CTableDataCell>
                                    <CTableDataCell>{{ row.rate }}</CTableDataCell>
                                    <CTableDataCell>{{ row.itemID }}</CTableDataCell>
                                    <CTableDataCell>{{ row.contractAddress || '-' }} / {{ row.symbol }}</CTableDataCell>
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
                <CModalTitle>{{ isCreate ? '新增' : '编辑' }}区块链充值配置</CModalTitle>
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
                                <CFormLabel>所属链</CFormLabel>
                                <select class="form-select" v-model.number="form.chainID">
                                    <option :value="0">请选择链</option>
                                    <option v-for="chain in chainList" :key="chain.chainID" :value="chain.chainID">
                                        {{ chain.displayName || chain.name }}（ID: {{ chain.chainID }}）
                                    </option>
                                </select>
                                <div v-if="chainListLoading" class="small text-muted mt-1">加载中...</div>
                            </div>
                        </CCol>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>显示名</CFormLabel>
                                <CFormInput v-model="form.displayName" placeholder="显示名" />
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
                                <CFormLabel>合约地址（原生链币留空）</CFormLabel>
                                <CFormInput v-model="form.contractAddress" placeholder="合约地址" />
                            </div>
                        </CCol>
                        <CCol :md="3">
                            <div class="mb-3">
                                <CFormLabel>代币符号</CFormLabel>
                                <CFormInput v-model="form.symbol" placeholder="如 ETH" />
                            </div>
                        </CCol>
                        <CCol :md="3">
                            <div class="mb-3">
                                <CFormLabel>小数位</CFormLabel>
                                <CFormInput v-model.number="form.decimals" type="number" />
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
import { chargeGetchaininfos, chargeGetchargeconfig_blockchain, chargeUpdatechargeconfig_blockchain, chargeSetchargeconfigenabled_blockchain } from '@/web/AdminReq'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import type { ChargeDefine } from 'pp-base-define/ChargeDefine'
import { Toast } from '@/composables/useToast'
import ItemSelect from '@/components/ItemSelect.vue'
import FormSlider from '@/components/FormSlider.vue'

const loading = ref(false)
const saving = ref(false)
const list = ref<ChargeDefine.tChargeBlockchainConfig[]>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = 20
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))
const withDisabled = ref(false)
const showModal = ref(false)
const isCreate = ref(true)
const chainList = ref<AdminReqDefine.tChargeGetchaininfosRes['datas']>([])
const chainListLoading = ref(false)

const form = ref<ChargeDefine.tChargeBlockchainConfig>({
    typeID: 0,
    enabled: true,
    chainID: 0,
    name: '',
    displayName: '',
    rate: 0,
    itemID: '',
    contractAddress: '',
    symbol: '',
    decimals: 0,
    minAmount: 0,
    maxAmount: 0,
    feePercent: 0,
})

const loadChainList = async () => {
    chainListLoading.value = true
    try {
        const res = await chargeGetchaininfos({ page: 0, limit: 500 })
        if (!res.errCode && res.datas) chainList.value = res.datas
    } finally {
        chainListLoading.value = false
    }
}

const loadList = async () => {
    loading.value = true
    try {
        const res = await chargeGetchargeconfig_blockchain({ withDisabled: withDisabled.value, page: currentPage.value, limit: pageSize })
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
        chainID: 0,
        name: '',
        displayName: '',
        rate: 0,
        itemID: '',
        contractAddress: '',
        symbol: '',
        decimals: 0,
        minAmount: 0,
        maxAmount: 0,
        feePercent: 0,
    }
    loadChainList()
    showModal.value = true
}

const edit = (row: ChargeDefine.tChargeBlockchainConfig) => {
    isCreate.value = false
    form.value = { ...row, name: row.name || '' }
    loadChainList()
    showModal.value = true
}

const save = async () => {
    saving.value = true
    try {
        const res = await chargeUpdatechargeconfig_blockchain({ create: isCreate.value, data: { ...form.value } })
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

const toggleEnabled = async (row: ChargeDefine.tChargeBlockchainConfig, enabled: boolean) => {
    const res = await chargeSetchargeconfigenabled_blockchain({ typeID: row.typeID, enabled })
    if (res.errCode) {
        Toast.error(res.errMsg || '操作失败')
        return
    }
    row.enabled = enabled
    Toast.success(enabled ? '已启用' : '已禁用')
}

onMounted(() => {
    loadList()
})
</script>
