<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>道具配置</strong>
                        <div>
                            <CButton color="info" size="sm" class="me-2" @click="refreshConfig">
                                <CIcon icon="cil-reload" class="me-1" />
                                刷新配置
                            </CButton>
                            <CButton color="success" size="sm" @click="addItem">
                                <CIcon icon="cil-plus" class="me-1" />
                                添加道具
                            </CButton>
                        </div>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <!-- 需要刷新提示 -->
                    <CAlert v-if="needRefresh" color="warning" class="mb-3">
                        <strong>提示：</strong>服务器配置需要刷新，请点击"刷新配置"按钮更新服务器配置。
                    </CAlert>

                    <!-- 搜索框 -->
                    <CRow class="mb-3">
                        <CCol :md="4">
                            <CFormInput
                                v-model="searchItemID"
                                placeholder="输入道具ID进行筛选（留空显示全部）"
                                @keyup.enter="handleSearch"
                            />
                        </CCol>
                        <CCol :md="2">
                            <CButton color="primary" @click="handleSearch">
                                <CIcon icon="cil-magnifying-glass" class="me-1" />
                                搜索
                            </CButton>
                        </CCol>
                        <CCol :md="2">
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
                        <!-- 道具列表 -->
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>ID</CTableHeaderCell>
                                    <CTableHeaderCell>名称</CTableHeaderCell>
                                    <CTableHeaderCell>描述</CTableHeaderCell>
                                    <CTableHeaderCell>类型</CTableHeaderCell>
                                    <CTableHeaderCell>可堆叠</CTableHeaderCell>
                                    <CTableHeaderCell>过期时间(秒)</CTableHeaderCell>
                                    <CTableHeaderCell>过期可堆叠</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="item in itemList" :key="item.id">
                                    <CTableDataCell>{{ item.id }}</CTableDataCell>
                                    <CTableDataCell>{{ item.name }}</CTableDataCell>
                                    <CTableDataCell>{{ item.desc }}</CTableDataCell>
                                    <CTableDataCell>{{ getTypeName(item.type) }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CBadge :color="item.overlapped ? 'success' : 'danger'">
                                            {{ item.overlapped ? '是' : '否' }}
                                        </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell>{{ item.expireTime || '-' }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CBadge :color="item.expireOverlapped ? 'success' : 'danger'">
                                            {{ item.expireOverlapped ? '是' : '否' }}
                                        </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <CButtonGroup role="group">
                                            <CButton color="primary" size="sm" @click="editItem(item)">
                                                编辑
                                            </CButton>
                                            <CButton color="danger" size="sm" @click="deleteItem(item.id)">
                                                删除
                                            </CButton>
                                        </CButtonGroup>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!itemList || itemList.length === 0">
                                    <CTableDataCell colspan="8" class="text-center text-muted py-4">
                                        暂无道具配置
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
                            />
                        </div>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>

        <!-- 编辑/添加模态框 -->
        <CModal :visible="showModal" @close="closeModal" size="lg">
            <CModalHeader>
                <CModalTitle>{{ editingItem?.id ? '编辑道具' : '添加道具' }}</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>道具ID <span class="text-danger">*</span></CFormLabel>
                        <CFormInput
                            v-model="formData.id"
                            placeholder="请输入道具ID"
                            :disabled="!!editingItem?.id"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>道具名称 <span class="text-danger">*</span></CFormLabel>
                        <CFormInput
                            v-model="formData.name"
                            placeholder="请输入道具名称"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>道具描述</CFormLabel>
                        <CFormTextarea
                            v-model="formData.desc"
                            placeholder="请输入道具描述"
                            rows="3"
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>道具类型 <span class="text-danger">*</span></CFormLabel>
                        <select class="form-select" v-model.number="formData.type">
                            <option :value="ItemDefine.Type.Normal">普通道具</option>
                            <option :value="ItemDefine.Type.Title">称号</option>
                            <option :value="ItemDefine.Type.Ticket">门票</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <CFormLabel>是否可堆叠 <span class="text-danger">*</span></CFormLabel>
                        <CFormSwitch
                            v-model="formData.overlapped"
                            :label="formData.overlapped ? '可堆叠' : '不可堆叠'"
                        />
                    </div>
                    <div v-if="formData.overlapped" class="mb-3">
                        <CFormLabel>过期时间(秒)</CFormLabel>
                        <CFormInput
                            type="number"
                            v-model.number="formData.expireTime"
                            placeholder="过期时间（秒）"
                            min="0"
                        />
                    </div>
                    <div v-if="formData.overlapped" class="mb-3">
                        <CFormLabel>过期时间可堆叠</CFormLabel>
                        <CFormSwitch
                            v-model="formData.expireOverlapped"
                            :label="formData.expireOverlapped ? '可堆叠' : '不可堆叠'"
                        />
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeModal">取消</CButton>
                <CButton color="primary" @click="saveItem" :disabled="saving">
                    {{ saving ? '保存中...' : '保存' }}
                </CButton>
            </CModalFooter>
        </CModal>
    </CRow>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { configItemGet, configItemCreate, configItemUpdate, configItemDel, configItemRefresh } from '@/web/AdminReq'
import { ItemDefine } from 'pp-base-define/ItemDefine'
import { showError, showSuccess, showWarning, showConfirm } from '@/utils/message'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const itemList = ref<ItemDefine.tConfig[]>([])
const showModal = ref(false)
const editingItem = ref<ItemDefine.tConfig | null>(null)
const currentPage = ref(0)
const pageSize = ref(20)
const totalCount = ref(0)
const needRefresh = ref(false)
const searchItemID = ref('')

// 表单数据
const formData = ref<ItemDefine.tConfig>({
    id: '',
    name: '',
    desc: '',
    type: ItemDefine.Type.Normal,
    overlapped: true,
    expireTime: 0,
    expireOverlapped: false,
})

// 计算总页数
const totalPages = computed(() => {
    return Math.ceil(totalCount.value / pageSize.value)
})

// 获取类型名称
const getTypeName = (type: ItemDefine.Type): string => {
    const typeMap = {
        [ItemDefine.Type.Normal]: '普通道具',
        [ItemDefine.Type.Title]: '称号',
        [ItemDefine.Type.Ticket]: '门票',
    }
    return typeMap[type] || '未知'
}

// 加载道具列表
const loadItems = async () => {
    loading.value = true
    try {
        const params: any = {
            page: currentPage.value,
            limit: pageSize.value,
        }

        // 如果有搜索条件，添加 itemIDs 参数（格式为数组）
        if (searchItemID.value.trim()) {
            params.itemIDs = [searchItemID.value.trim()]
        }

        const response = await configItemGet(params)

        if (response.errCode) {
            showError(response.errMsg || '加载道具列表失败')
            return
        }

        itemList.value = response.datas || []
        totalCount.value = response.count || 0

        // 保存 needRefresh 状态，用于显示警告提示
        needRefresh.value = response.needRefresh || false
    } catch (error) {
        console.error('Load items error:', error)
        showError('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// 搜索
const handleSearch = () => {
    currentPage.value = 0 // 重置到第一页
    loadItems()
}

// 清除搜索
const clearSearch = () => {
    searchItemID.value = ''
    currentPage.value = 0
    loadItems()
}

// 刷新配置
const refreshConfig = async () => {
    try {
        const response = await configItemRefresh({})

        if (response.errCode) {
            showError(response.errMsg || '刷新配置失败')
            return
        }

        showSuccess('配置刷新成功')
        await loadItems()
    } catch (error) {
        console.error('Refresh config error:', error)
        showError('网络错误，请稍后重试')
    }
}

// 添加道具
const addItem = () => {
    editingItem.value = null
    formData.value = {
        id: '',
        name: '',
        desc: '',
        type: ItemDefine.Type.Normal,
        overlapped: true,
        expireTime: 0,
        expireOverlapped: false,
    }
    showModal.value = true
}

// 编辑道具
const editItem = (item: ItemDefine.tConfig) => {
    editingItem.value = item
    formData.value = {
        id: item.id,
        name: item.name,
        desc: item.desc,
        type: item.type,
        overlapped: item.overlapped,
        expireTime: item.expireTime || 0,
        expireOverlapped: item.expireOverlapped || false,
    }
    showModal.value = true
}

// 关闭模态框
const closeModal = () => {
    showModal.value = false
    editingItem.value = null
}

// 保存道具
const saveItem = async () => {
    // 验证必填字段
    if (!formData.value.id) {
        showWarning('请输入道具ID')
        return
    }
    if (!formData.value.name) {
        showWarning('请输入道具名称')
        return
    }

    saving.value = true
    try {
        const itemData = { ...formData.value }
        
        // 如果不可堆叠，过期时间相关字段不起作用
        if (!itemData.overlapped) {
            itemData.expireTime = 0
            itemData.expireOverlapped = false
        }

        let response
        if (editingItem.value) {
            // 更新
            response = await configItemUpdate({
                item: itemData,
            })
        } else {
            // 创建
            response = await configItemCreate({
                item: itemData,
            })
        }

        if (response.errCode) {
            showError(response.errMsg || '保存失败')
            return
        }

        showSuccess(editingItem.value ? '更新成功' : '创建成功')
        closeModal()
        await loadItems()
    } catch (error) {
        console.error('Save item error:', error)
        showError('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// 删除道具
const deleteItem = async (itemId: string) => {
    const confirmed = await showConfirm(`确定要删除道具 ${itemId} 吗？此操作不可恢复。`, { type: 'danger' })
    if (!confirmed) {
        return
    }

    try {
        const response = await configItemDel({
            itemID: itemId,
        })

        if (response.errCode) {
            showError(response.errMsg || '删除失败')
            return
        }

        showSuccess('删除成功')
        await loadItems()
    } catch (error) {
        console.error('Delete item error:', error)
        showError('网络错误，请稍后重试')
    }
}

// 分页变化
const handlePageChange = (page: number) => {
    currentPage.value = page
    loadItems()
}

// 组件挂载时加载数据
onMounted(() => {
    loadItems()
})
</script>

