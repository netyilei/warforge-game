<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>支行信息</strong>
                        <CButton color="success" size="sm" @click="add">
                            <CIcon icon="cil-plus" class="me-1" />
                            添加
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <CRow class="mb-3">
                        <CCol :md="3">
                            <CFormInput v-model="filterBankIDs" placeholder="银行ID，逗号分隔" />
                        </CCol>
                        <CCol :md="3">
                            <CFormInput v-model="filterBranchIDs" placeholder="支行ID，逗号分隔" />
                        </CCol>
                        <CCol :md="2">
                            <CButton color="primary" @click="loadList">搜索</CButton>
                        </CCol>
                    </CRow>
                    <div v-if="loading" class="text-center py-4"><CSpinner /> 加载中...</div>
                    <div v-else>
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>支行ID</CTableHeaderCell>
                                    <CTableHeaderCell>银行ID</CTableHeaderCell>
                                    <CTableHeaderCell>名称</CTableHeaderCell>
                                    <CTableHeaderCell>显示名</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="row in list" :key="row.branchID">
                                    <CTableDataCell>{{ row.branchID }}</CTableDataCell>
                                    <CTableDataCell>{{ row.bankID }}</CTableDataCell>
                                    <CTableDataCell>{{ row.name }}</CTableDataCell>
                                    <CTableDataCell>{{ row.displayName }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CButton color="primary" size="sm" @click="edit(row)">编辑</CButton>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!list.length">
                                    <CTableDataCell colspan="5" class="text-center text-muted py-4">暂无数据</CTableDataCell>
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
        <CModal :visible="showModal" @close="closeModal" size="lg">
            <CModalHeader>
                <CModalTitle>{{ editing ? '编辑' : '新增' }}支行信息</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>支行ID <span v-if="!editing" class="text-muted">（新增时必填）</span></CFormLabel>
                        <CFormInput v-model.number="form.branchID" type="number" :disabled="!!editing" placeholder="新增时填写新支行ID" />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>所属银行 <span v-if="!editing" class="text-muted">（必选）</span></CFormLabel>
                        <select
                            v-if="!editing"
                            class="form-select"
                            v-model.number="form.bankID"
                        >
                            <option :value="0">请选择银行</option>
                            <option v-for="bank in bankList" :key="bank.bankID" :value="bank.bankID">
                                {{ bank.displayName || bank.name }}（ID: {{ bank.bankID }}）
                            </option>
                        </select>
                        <CFormInput v-else v-model.number="form.bankID" type="number" disabled />
                        <div v-if="!editing && bankListLoading" class="small text-muted mt-1">加载银行列表中...</div>
                    </div>
                    <div class="mb-3">
                        <CFormLabel>名称</CFormLabel>
                        <CFormInput v-model="form.name" placeholder="名称" />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>显示名</CFormLabel>
                        <CFormInput v-model="form.displayName" placeholder="显示名" />
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeModal">取消</CButton>
                <CButton color="primary" @click="save" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</CButton>
            </CModalFooter>
        </CModal>
    </CRow>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { chargeGetbankinfos, chargeGetbankbranchinfos, chargeUpdatebankbranchinfo } from '@/web/AdminReq'
import { CIcon } from '@coreui/icons-vue'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import { Toast } from '@/composables/useToast'

const loading = ref(false)
const saving = ref(false)
const list = ref<AdminReqDefine.tChargeGetbankbranchinfosRes['datas']>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = 20
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))
const filterBankIDs = ref('')
const filterBranchIDs = ref('')
const showModal = ref(false)
const editing = ref<typeof list.value[0] | null>(null)
const form = ref({ branchID: 0, bankID: 0, name: '', displayName: '' })
const bankList = ref<AdminReqDefine.tChargeGetbankinfosRes['datas']>([])
const bankListLoading = ref(false)

const loadList = async () => {
    loading.value = true
    try {
        const bankIDs = filterBankIDs.value.trim() ? filterBankIDs.value.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n)) : undefined
        const bankBranchIDs = filterBranchIDs.value.trim() ? filterBranchIDs.value.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n)) : undefined
        const res = await chargeGetbankbranchinfos({ page: currentPage.value, limit: pageSize, bankIDs, bankBranchIDs })
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

const loadBankList = async () => {
    bankListLoading.value = true
    try {
        const res = await chargeGetbankinfos({ page: 0, limit: 500 })
        if (res.errCode) {
            Toast.error(res.errMsg || '加载银行列表失败')
            return
        }
        bankList.value = res.datas || []
    } finally {
        bankListLoading.value = false
    }
}

const add = () => {
    editing.value = null
    form.value = { branchID: 0, bankID: 0, name: '', displayName: '' }
    showModal.value = true
    loadBankList()
}

const edit = (row: typeof list.value[0]) => {
    editing.value = row
    form.value = { branchID: row.branchID, bankID: row.bankID, name: row.name || '', displayName: row.displayName || '' }
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
    editing.value = null
}

const save = async () => {
    saving.value = true
    try {
        const res = await chargeUpdatebankbranchinfo({ data: { ...form.value } })
        if (res.errCode) {
            Toast.error(res.errMsg || '保存失败')
            return
        }
        Toast.success(editing.value ? '保存成功' : '添加成功')
        closeModal()
        loadList()
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadList()
})
</script>
