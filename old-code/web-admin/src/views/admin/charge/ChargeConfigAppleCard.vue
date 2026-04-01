<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>充值配置 - Apple Card</strong>
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
                                    <CTableHeaderCell>名称</CTableHeaderCell>
                                    <CTableHeaderCell>显示名</CTableHeaderCell>
                                    <CTableHeaderCell>比例</CTableHeaderCell>
                                    <CTableHeaderCell>道具ID</CTableHeaderCell>
                                    <CTableHeaderCell>单位</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="row in list" :key="row.typeID">
                                    <CTableDataCell>{{ row.typeID }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CFormSwitch :model-value="row.enabled" @update:modelValue="(v: boolean) => toggleEnabled(row, v)" />
                                    </CTableDataCell>
                                    <CTableDataCell>{{ row.name }}</CTableDataCell>
                                    <CTableDataCell>{{ row.displayName }}</CTableDataCell>
                                    <CTableDataCell>{{ row.rate }}</CTableDataCell>
                                    <CTableDataCell>{{ row.itemID }}</CTableDataCell>
                                    <CTableDataCell>{{ row.unit || '-' }}</CTableDataCell>
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
                <CModalTitle>{{ isCreate ? '新增' : '编辑' }}Apple Card 充值配置</CModalTitle>
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
                                <CFormLabel>名称</CFormLabel>
                                <CFormInput v-model="form.name" placeholder="内部标识" />
                            </div>
                        </CCol>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>显示名</CFormLabel>
                                <CFormInput v-model="form.displayName" placeholder="显示给用户看的名称" />
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
                                <CFormLabel>货币单位</CFormLabel>
                                <CFormInput v-model="form.unit" placeholder="如 USD" />
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
                                <FormSlider v-model="form.feePercent" label="手续费%" value-suffix="%" value-type="number" :min="0" :max="100" :step="0.01" />
                            </div>
                        </CCol>
                    </CRow>
                    <CRow>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>固定手续费金额</CFormLabel>
                                <CFormInput v-model.number="form.feeFixedAmount" type="number" step="0.01" placeholder="可选" />
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
import { chargeGetchargeconfig_applecard, chargeUpdatechargeconfig_applecard, chargeSetchargeconfigenabled_applecard } from '@/web/AdminReq'
import type { ChargeDefine } from 'pp-base-define/ChargeDefine'
import { Toast } from '@/composables/useToast'
import ItemSelect from '@/components/ItemSelect.vue'
import FormSlider from '@/components/FormSlider.vue'

type AppleCardConfig = ChargeDefine.tChargeAppleCardConfig

const loading = ref(false)
const saving = ref(false)
const list = ref<AppleCardConfig[]>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = 20
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))
const withDisabled = ref(false)
const showModal = ref(false)
const isCreate = ref(true)

const defaultForm = (): ChargeDefine.tChargeAppleCardConfig => ({
    typeID: 0,
    name: '',
    displayName: '',
    enabled: true,
    unit: '',
    rate: 0,
    itemID: '',
    minAmount: undefined,
    maxAmount: undefined,
    feePercent: undefined,
    feeFixedAmount: undefined,
})
const form = ref<ChargeDefine.tChargeAppleCardConfig>(defaultForm())

const loadList = async () => {
    loading.value = true
    try {
        const res = await chargeGetchargeconfig_applecard({ withDisabled: withDisabled.value, page: currentPage.value, limit: pageSize })
        if (res.errCode) {
            Toast.error(res.errMsg || '加载失败')
            return
        }
        list.value = (res.datas || []) as AppleCardConfig[]
        totalCount.value = res.count || 0
    } finally {
        loading.value = false
    }
}

const add = () => {
    isCreate.value = true
    form.value = defaultForm()
    showModal.value = true
}

const edit = (row: AppleCardConfig) => {
    isCreate.value = false
    form.value = { ...row }
    showModal.value = true
}

const save = async () => {
    saving.value = true
    try {
        const data = { ...form.value }
        if (isCreate.value) delete (data as Record<string, unknown>).typeID
        const res = await chargeUpdatechargeconfig_applecard({ create: isCreate.value, data })
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

const toggleEnabled = async (row: AppleCardConfig, enabled: boolean) => {
    if (row.typeID == null) return
    const res = await chargeSetchargeconfigenabled_applecard({ typeID: row.typeID, enabled })
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
