<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>横幅管理</strong>
                        <CButton color="success" size="sm" @click="addBanner">
                            <CIcon icon="cil-plus" class="me-1" />
                            创建横幅
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <div v-if="loading" class="text-center py-4">
                        <CSpinner />
                        <div class="mt-2">加载中...</div>
                    </div>
                    <div v-else>
                        <!-- 横幅列表 -->
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>横幅ID</CTableHeaderCell>
                                    <CTableHeaderCell>排序</CTableHeaderCell>
                                    <CTableHeaderCell>图片</CTableHeaderCell>
                                    <CTableHeaderCell>跳转设置</CTableHeaderCell>
                                    <CTableHeaderCell>可见性</CTableHeaderCell>
                                    <CTableHeaderCell>创建时间</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="banner in bannerList" :key="banner.bannerID">
                                    <CTableDataCell>{{ banner.bannerID }}</CTableDataCell>
                                    <CTableDataCell>{{ banner.seq }}</CTableDataCell>
                                    <CTableDataCell>
                                        <img 
                                            v-if="banner.iconUrl" 
                                            :src="banner.iconUrl" 
                                            alt="横幅图片" 
                                            style="max-width: 100px; max-height: 60px; border: 1px solid #ddd; border-radius: 4px;"
                                        />
                                        <span v-else class="text-muted">无图片</span>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <div v-if="banner.jump">
                                            <div v-if="banner.jump.gameID" class="small">游戏ID: {{ banner.jump.gameID }}</div>
                                            <div v-if="banner.jump.matchID" class="small">比赛ID: {{ banner.jump.matchID }}</div>
                                            <div v-if="banner.jump.groupID" class="small">匹配ID: {{ banner.jump.groupID }}</div>
                                            <div v-if="banner.jump.webUrl" class="small">网页: {{ banner.jump.webUrl }}</div>
                                            <div v-if="!banner.jump.gameID && !banner.jump.matchID && !banner.jump.groupID && !banner.jump.webUrl" class="text-muted small">无跳转</div>
                                        </div>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <CBadge :color="banner.visible ? 'success' : 'secondary'">
                                            {{ banner.visible ? '可见' : '隐藏' }}
                                        </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell>{{ banner.date }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CButtonGroup role="group">
                                            <CButton color="info" size="sm" @click="editBanner(banner)">
                                                编辑
                                            </CButton>
                                            <CButton 
                                                :color="banner.visible ? 'warning' : 'success'" 
                                                size="sm" 
                                                @click="toggleVisible(banner)"
                                            >
                                                {{ banner.visible ? '隐藏' : '显示' }}
                                            </CButton>
                                            <CButton color="danger" size="sm" @click="deleteBanner(banner.bannerID)">
                                                删除
                                            </CButton>
                                        </CButtonGroup>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!bannerList || bannerList.length === 0">
                                    <CTableDataCell colspan="7" class="text-center text-muted py-4">
                                        暂无横幅数据
                                    </CTableDataCell>
                                </CTableRow>
                            </CTableBody>
                        </CTable>

                        <!-- 分页 -->
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div class="text-muted">
                                共 {{ totalCount }} 条记录，第 {{ currentPage + 1 }} / {{ totalPages || 1 }} 页
                            </div>
                            <div @click.prevent="handlePaginationClick">
                                <CSmartPagination
                                    v-if="totalPages > 0"
                                    :pages="totalPages"
                                    :active-page="currentPage + 1"
                                    @active-page-change="handlePageChange"
                                />
                            </div>
                        </div>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>
    </CRow>

    <!-- 创建/编辑横幅 Modal -->
    <CModal :visible="showBannerModal" @close="closeBannerModal" size="lg">
        <CModalHeader>
            <CModalTitle>{{ editingBanner ? '编辑横幅' : '创建横幅' }}</CModalTitle>
        </CModalHeader>
        <CModalBody>
            <CForm>
                <CRow>
                    <CCol :md="6">
                        <div class="mb-3">
                            <CFormLabel>排序 <span class="text-danger">*</span></CFormLabel>
                            <CFormInput
                                type="number"
                                v-model.number="bannerForm.seq"
                                placeholder="请输入排序（数字越小越靠前）"
                            />
                        </div>
                    </CCol>
                    <CCol :md="6">
                        <div class="mb-3">
                            <CFormLabel>可见性</CFormLabel>
                            <CFormCheck
                                type="checkbox"
                                label="可见"
                                v-model="bannerForm.visible"
                            />
                        </div>
                    </CCol>
                </CRow>
                <CRow>
                    <CCol :md="12">
                        <div class="mb-3">
                            <CFormLabel>横幅图片 <span class="text-danger">*</span></CFormLabel>
                            <ImageUpload
                                v-model="bannerForm.iconUrl"
                                placeholder="选择或上传横幅图片"
                            />
                        </div>
                    </CCol>
                </CRow>
                <CRow>
                    <CCol :md="12">
                        <div class="mb-3">
                            <CFormLabel>跳转设置</CFormLabel>
                            <CRow>
                                <CCol :md="6">
                                    <CFormInput
                                        type="number"
                                        v-model.number="bannerForm.jump.gameID"
                                        placeholder="游戏ID"
                                    />
                                </CCol>
                                <CCol :md="6">
                                    <CFormInput
                                        type="number"
                                        v-model.number="bannerForm.jump.matchID"
                                        placeholder="比赛ID"
                                    />
                                </CCol>
                            </CRow>
                            <CRow class="mt-2">
                                <CCol :md="6">
                                    <CFormInput
                                        type="number"
                                        v-model.number="bannerForm.jump.groupID"
                                        placeholder="匹配ID"
                                    />
                                </CCol>
                                <CCol :md="6">
                                    <CFormInput
                                        v-model="bannerForm.jump.webUrl"
                                        placeholder="网页URL"
                                    />
                                </CCol>
                            </CRow>
                        </div>
                    </CCol>
                </CRow>
            </CForm>
        </CModalBody>
        <CModalFooter>
            <CButton color="secondary" @click="closeBannerModal">取消</CButton>
            <CButton color="primary" @click="saveBanner" :disabled="saving">
                {{ saving ? '保存中...' : '保存' }}
            </CButton>
        </CModalFooter>
    </CModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
    newsGetbanners,
    newsCreatebanner,
    newsUpdatebanner,
    newsSetbannervisible,
    newsDeletebanner,
} from '@/web/AdminReq'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import { NewsDefine } from 'pp-base-define/NewsDefine'
import { Toast } from '@/composables/useToast'
import { showConfirm } from '@/utils/message'
import { CSmartPagination } from '@coreui/vue-pro'
import ImageUpload from '@/components/ImageUpload.vue'
import { onMounted } from 'vue'

type BannerListItem = NewsDefine.tBanner

const loading = ref(false)
const saving = ref(false)
const bannerList = ref<BannerListItem[]>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = ref(20)

const totalPages = computed(() => {
    return Math.ceil(totalCount.value / pageSize.value)
})

// Modal states
const showBannerModal = ref(false)
const editingBanner = ref<BannerListItem | null>(null)

// Banner form
const bannerForm = ref<Partial<NewsDefine.tBanner>>({
    bannerID: 0,
    visible: true,
    seq: 0,
    iconUrl: '',
    jump: {},
    timestamp: 0,
    date: '',
})

// Load banners
const loadBanners = async () => {
    loading.value = true
    try {
        const params: AdminReqDefine.tNewsGetbannersReq = {
            page: currentPage.value,
            limit: pageSize.value,
        }

        const response = await newsGetbanners(params)

        if (response.errCode) {
            Toast.error(response.errMsg || '加载横幅列表失败')
            bannerList.value = []
            totalCount.value = 0
            return
        }

        bannerList.value = response.datas || []
        totalCount.value = response.count || 0
    } catch (error) {
        console.error('Load banners error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// Pagination
const handlePaginationClick = (event: Event) => {
    const target = event.target as HTMLElement
    const link = target.closest('a')
    if (link) {
        event.preventDefault()
        event.stopPropagation()
        const pageText = link.textContent?.trim()
        if (pageText && /^\d+$/.test(pageText)) {
            const newPage = parseInt(pageText) - 1
            if (newPage !== currentPage.value && newPage >= 0 && newPage < totalPages.value) {
                currentPage.value = newPage
                loadBanners()
            }
        }
    }
}

const handlePageChange = (page: number) => {
    const newPage = page - 1
    if (newPage !== currentPage.value && newPage >= 0 && newPage < totalPages.value) {
        currentPage.value = newPage
        loadBanners()
    }
}

// Create banner
const addBanner = () => {
    editingBanner.value = null
    bannerForm.value = {
        bannerID: 0,
        visible: true,
        seq: 0,
        iconUrl: '',
        jump: {},
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
    }
    showBannerModal.value = true
}

// Edit banner
const editBanner = (banner: BannerListItem) => {
    editingBanner.value = banner
    bannerForm.value = {
        ...banner,
        jump: banner.jump ? { ...banner.jump } : {},
    }
    showBannerModal.value = true
}

// Save banner
const saveBanner = async () => {
    if (!bannerForm.value.iconUrl) {
        Toast.error('请上传横幅图片')
        return
    }

    saving.value = true
    try {
        const banner: NewsDefine.tBanner = {
            bannerID: editingBanner.value?.bannerID || 0,
            visible: bannerForm.value.visible ?? true,
            seq: bannerForm.value.seq || 0,
            iconUrl: bannerForm.value.iconUrl || '',
            jump: bannerForm.value.jump || {},
            timestamp: editingBanner.value?.timestamp || Date.now(),
            date: editingBanner.value?.date || new Date().toISOString().split('T')[0],
        }

        if (editingBanner.value) {
            const response = await newsUpdatebanner({ banner })
            if (response.errCode) {
                Toast.error(response.errMsg || '更新横幅失败')
                return
            }
            Toast.success('更新成功')
        } else {
            const response = await newsCreatebanner({ banner })
            if (response.errCode) {
                Toast.error(response.errMsg || '创建横幅失败')
                return
            }
            Toast.success('创建成功')
        }
        closeBannerModal()
        loadBanners()
    } catch (error) {
        console.error('Save banner error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Close banner modal
const closeBannerModal = () => {
    showBannerModal.value = false
    editingBanner.value = null
}

// Toggle visible
const toggleVisible = async (banner: BannerListItem) => {
    const newVisible = !banner.visible
    try {
        const response = await newsSetbannervisible({
            bannerID: banner.bannerID,
            visible: newVisible,
        })
        if (response.errCode) {
            Toast.error(response.errMsg || '设置可见性失败')
            return
        }
        Toast.success(newVisible ? '已设置为可见' : '已设置为隐藏')
        loadBanners()
    } catch (error) {
        console.error('Toggle visible error:', error)
        Toast.error('网络错误，请稍后重试')
    }
}

// Delete banner
const deleteBanner = async (bannerID: number) => {
    const confirmed = await showConfirm(`确定要删除横幅 ${bannerID} 吗？此操作不可恢复。`, { type: 'danger' })
    if (!confirmed) {
        return
    }

    try {
        const response = await newsDeletebanner({ bannerID })
        if (response.errCode) {
            Toast.error(response.errMsg || '删除失败')
            return
        }
        Toast.success('删除成功')
        loadBanners()
    } catch (error) {
        console.error('Delete banner error:', error)
        Toast.error('网络错误，请稍后重试')
    }
}

// Load on mount
onMounted(() => {
    loadBanners()
})
</script>
