<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>PayPal信息</strong>
                        <CButton color="success" size="sm" @click="add">
                            <CIcon icon="cil-plus" class="me-1" />
                            添加
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <div v-if="loading" class="text-center py-4"><CSpinner /> 加载中...</div>
                    <div v-else>
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>PayPal ID</CTableHeaderCell>
                                    <CTableHeaderCell>名称</CTableHeaderCell>
                                    <CTableHeaderCell>显示名</CTableHeaderCell>
                                    <CTableHeaderCell>图标</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="row in list" :key="row.paypalID">
                                    <CTableDataCell>{{ row.paypalID }}</CTableDataCell>
                                    <CTableDataCell>{{ row.name }}</CTableDataCell>
                                    <CTableDataCell>{{ row.displayName }}</CTableDataCell>
                                    <CTableDataCell><img v-if="row.iconUrl" :src="row.iconUrl" style="max-height:24px" /></CTableDataCell>
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
                <CModalTitle>{{ editing ? '编辑' : '新增' }} PayPal 信息</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>PayPal ID <span v-if="!editing" class="text-muted">（新增时必填）</span></CFormLabel>
                        <CFormInput v-model.number="form.paypalID" type="number" :disabled="!!editing" placeholder="新增时填写新PayPal ID" />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>名称</CFormLabel>
                        <CFormInput v-model="form.name" placeholder="名称" />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>显示名</CFormLabel>
                        <CFormInput v-model="form.displayName" placeholder="显示名" />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>图标URL</CFormLabel>
                        <ImageUpload v-model="form.iconUrl" placeholder="图标" />
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
import { chargeGetpaypalinfos, chargeUpdatepaypalinfo } from '@/web/AdminReq'
import { CIcon } from '@coreui/icons-vue'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import { Toast } from '@/composables/useToast'
import ImageUpload from '@/components/ImageUpload.vue'

const loading = ref(false)
const saving = ref(false)
const list = ref<AdminReqDefine.tChargeGetpaypalinfosRes['datas']>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = 20
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))
const showModal = ref(false)
const editing = ref<typeof list.value[0] | null>(null)
const form = ref({ paypalID: 0, name: '', displayName: '', iconUrl: '' })

const loadList = async () => {
    loading.value = true
    try {
        const res = await chargeGetpaypalinfos({ page: currentPage.value, limit: pageSize })
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
    editing.value = null
    form.value = { paypalID: 0, name: '', displayName: '', iconUrl: '' }
    showModal.value = true
}

const edit = (row: typeof list.value[0]) => {
    editing.value = row
    form.value = { paypalID: row.paypalID, name: row.name || '', displayName: row.displayName || '', iconUrl: row.iconUrl || '' }
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
    editing.value = null
}

const save = async () => {
    saving.value = true
    try {
        const res = await chargeUpdatepaypalinfo({ data: { ...form.value } })
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

onMounted(loadList)
</script>
