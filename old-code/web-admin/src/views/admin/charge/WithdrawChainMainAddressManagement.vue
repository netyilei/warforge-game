<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>提现主地址管理</strong>
                        <div class="d-flex align-items-center gap-2">
                            <CFormCheck label="含已禁用" v-model="withDisabled" @update:modelValue="loadList" />
                            <CButton color="success" size="sm" @click="add">
                                <CIcon icon="cil-plus" class="me-1" />
                                添加
                            </CButton>
                        </div>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <CRow class="mb-3">
                        <CCol :md="4">
                            <select class="form-select" v-model="filterChainID">
                                <option :value="undefined">全部链</option>
                                <option v-for="chain in chainList" :key="chain.chainID" :value="chain.chainID">
                                    {{ chain.displayName || chain.name }}（ID: {{ chain.chainID }}）
                                </option>
                            </select>
                        </CCol>
                        <CCol :md="2">
                            <CButton color="primary" @click="onSearch">搜索</CButton>
                        </CCol>
                    </CRow>
                    <div v-if="loading" class="text-center py-4"><CSpinner /> 加载中...</div>
                    <div v-else>
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>编号</CTableHeaderCell>
                                    <CTableHeaderCell>链</CTableHeaderCell>
                                    <CTableHeaderCell>地址</CTableHeaderCell>
                                    <CTableHeaderCell>优先级</CTableHeaderCell>
                                    <CTableHeaderCell>备注</CTableHeaderCell>
                                    <CTableHeaderCell>启用</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="row in list" :key="row.no">
                                    <CTableDataCell>{{ row.no }}</CTableDataCell>
                                    <CTableDataCell>
                                        <span>{{ getChainName(row.chainID) }}</span>
                                        <span class="text-muted ms-1 small">（{{ row.chainID }}）</span>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <span class="font-monospace small">{{ row.address || '-' }}</span>
                                    </CTableDataCell>
                                    <CTableDataCell>{{ row.pri }}</CTableDataCell>
                                    <CTableDataCell>{{ row.comment || '-' }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CFormSwitch :model-value="row.enabled" @update:modelValue="(v: boolean) => toggleEnabled(row, v)" />
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <CButton color="primary" size="sm" @click="edit(row)">编辑</CButton>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!list.length">
                                    <CTableDataCell colspan="7" class="text-center text-muted py-4">暂无数据</CTableDataCell>
                                </CTableRow>
                            </CTableBody>
                        </CTable>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="text-muted">共 {{ list.length }} 条</span>
                        </div>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>

        <CModal :visible="showModal" @close="showModal = false" size="lg">
            <CModalHeader>
                <CModalTitle>{{ isCreate ? '新增' : '编辑' }}提现主地址</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <CRow>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>所属链 <span class="text-danger">*</span></CFormLabel>
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
                                <CFormLabel>优先级</CFormLabel>
                                <CFormInput v-model.number="form.pri" type="number" placeholder="数值越大优先级越高" />
                            </div>
                        </CCol>
                    </CRow>
                    <CRow>
                        <CCol :md="12">
                            <div class="mb-3">
                                <CFormLabel>地址 <span class="text-muted">（可选，留空由服务端自动生成）</span></CFormLabel>
                                <CFormInput v-model="form.address" placeholder="留空则由服务端自动生成" />
                            </div>
                        </CCol>
                    </CRow>
                    <CRow>
                        <CCol :md="12">
                            <div class="mb-3">
                                <CFormLabel>备注</CFormLabel>
                                <CFormInput v-model="form.comment" placeholder="备注（可选）" />
                            </div>
                        </CCol>
                    </CRow>
                    <CRow v-if="!isCreate">
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>启用</CFormLabel>
                                <div><CFormSwitch v-model="form.enabled" /></div>
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
import { ref, onMounted } from 'vue'
import {
    chargeGetchaininfos,
    chargeGetwithdrawchainmainaddress,
    chargeUpdatewithdrawchainmainaddress,
    chargeSetwithdrawchainmainaddressenabled,
} from '@/web/AdminReq'
import { CIcon } from '@coreui/icons-vue'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import type { ChargeDefine } from 'pp-base-define/ChargeDefine'
import { Toast } from '@/composables/useToast'

const loading = ref(false)
const saving = ref(false)
const list = ref<ChargeDefine.tWithdrawChainMainAddress[]>([])
const withDisabled = ref(false)
const filterChainID = ref<number | undefined>(undefined)
const showModal = ref(false)
const isCreate = ref(true)
const chainList = ref<AdminReqDefine.tChargeGetchaininfosRes['datas']>([])
const chainListLoading = ref(false)

const defaultForm = (): ChargeDefine.tWithdrawChainMainAddress => ({
    no: 0,
    chainID: 0,
    address: '',
    comment: '',
    enabled: true,
    pri: 0,
})

const form = ref<ChargeDefine.tWithdrawChainMainAddress>(defaultForm())

const getChainName = (chainID: number) => {
    const chain = chainList.value.find((c) => c.chainID === chainID)
    return chain ? (chain.displayName || chain.name) : `链${chainID}`
}

const loadChainList = async () => {
    if (chainList.value.length > 0) return
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
        const res = await chargeGetwithdrawchainmainaddress({
            chainID: filterChainID.value,
            withDisabled: withDisabled.value,
            page: 0,
            limit: 500,
        })
        if (res.errCode) {
            Toast.error(res.errMsg || '加载失败')
            return
        }
        list.value = res.datas || []
    } finally {
        loading.value = false
    }
}

const onSearch = () => {
    loadList()
}

const add = () => {
    isCreate.value = true
    form.value = defaultForm()
    loadChainList()
    showModal.value = true
}

const edit = (row: ChargeDefine.tWithdrawChainMainAddress) => {
    isCreate.value = false
    form.value = { ...row }
    loadChainList()
    showModal.value = true
}

const save = async () => {
    if (!form.value.chainID) {
        Toast.error('请选择所属链')
        return
    }
    saving.value = true
    try {
        const data: ChargeDefine.tWithdrawChainMainAddress = { ...form.value }
        if (isCreate.value && !data.address) {
            data.address = ''
        }
        const res = await chargeUpdatewithdrawchainmainaddress({ create: isCreate.value, data })
        if (res.errCode) {
            Toast.error(res.errMsg || '保存失败')
            return
        }
        Toast.success(isCreate.value ? '添加成功' : '保存成功')
        showModal.value = false
        loadList()
    } finally {
        saving.value = false
    }
}

const toggleEnabled = async (row: ChargeDefine.tWithdrawChainMainAddress, enabled: boolean) => {
    const res = await chargeSetwithdrawchainmainaddressenabled({ no: row.no, enabled })
    if (res.errCode) {
        Toast.error(res.errMsg || '操作失败')
        return
    }
    row.enabled = enabled
    Toast.success(enabled ? '已启用' : '已禁用')
}

onMounted(async () => {
    await loadChainList()
    loadList()
})
</script>
