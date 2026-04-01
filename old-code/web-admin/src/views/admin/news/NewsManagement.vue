<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>新闻管理</strong>
                        <CButton color="success" size="sm" @click="addNews">
                            <CIcon icon="cil-plus" class="me-1" />
                            创建新闻
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <!-- 搜索条件 -->
                    <CRow class="mb-3">
                        <CCol :md="3">
                            <CFormLabel>标题</CFormLabel>
                            <CFormInput
                                v-model="filter.title"
                                placeholder="输入标题"
                            />
                        </CCol>
                        <CCol :md="3">
                            <CFormLabel>类型</CFormLabel>
                            <select class="form-select" v-model.number="filter.type">
                                <option :value="undefined">全部</option>
                                <option :value="NewsDefine.NewsType.Announce">公告</option>
                                <option :value="NewsDefine.NewsType.Match">赛事</option>
                                <option :value="NewsDefine.NewsType.News">资讯</option>
                            </select>
                        </CCol>
                        <CCol :md="3">
                            <CFormLabel>作者</CFormLabel>
                            <CFormInput
                                v-model="filter.author"
                                placeholder="输入作者"
                            />
                        </CCol>
                        <CCol :md="3" class="d-flex align-items-end">
                            <CButton color="primary" @click="handleSearch" class="me-2">
                                <CIcon icon="cil-magnifying-glass" class="me-1" />
                                搜索
                            </CButton>
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
                        <!-- 新闻列表 -->
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>新闻ID</CTableHeaderCell>
                                    <CTableHeaderCell>标题</CTableHeaderCell>
                                    <CTableHeaderCell>类型</CTableHeaderCell>
                                    <CTableHeaderCell>作者</CTableHeaderCell>
                                    <CTableHeaderCell>可见性</CTableHeaderCell>
                                    <CTableHeaderCell>发布时间</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="news in newsList" :key="news.newsID">
                                    <CTableDataCell>{{ news.newsID }}</CTableDataCell>
                                    <CTableDataCell>{{ news.title }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CBadge :color="getTypeColor(news.type)">
                                            {{ getTypeName(news.type) }}
                                        </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell>{{ news.author }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CBadge :color="news.visible ? 'success' : 'secondary'">
                                            {{ news.visible ? '可见' : '隐藏' }}
                                        </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell>{{ news.profileDate || news.date }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CButtonGroup role="group">
                                            <CButton color="info" size="sm" @click="editNews(news)">
                                                编辑
                                            </CButton>
                                            <CButton 
                                                :color="news.visible ? 'warning' : 'success'" 
                                                size="sm" 
                                                @click="toggleVisible(news)"
                                            >
                                                {{ news.visible ? '隐藏' : '显示' }}
                                            </CButton>
                                            <CButton color="danger" size="sm" @click="deleteNews(news.newsID)">
                                                删除
                                            </CButton>
                                        </CButtonGroup>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!newsList || newsList.length === 0">
                                    <CTableDataCell colspan="7" class="text-center text-muted py-4">
                                        暂无新闻数据
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

    <!-- 创建/编辑新闻 Modal -->
    <CModal :visible="showNewsModal" @close="closeNewsModal" size="xl">
        <CModalHeader>
            <CModalTitle>{{ editingNews ? '编辑新闻' : '创建新闻' }}</CModalTitle>
        </CModalHeader>
        <CModalBody>
            <CForm>
                <CRow>
                    <CCol :md="6">
                        <div class="mb-3">
                            <CFormLabel>新闻类型 <span class="text-danger">*</span></CFormLabel>
                            <select class="form-select" v-model.number="newsForm.type">
                                <option :value="NewsDefine.NewsType.Announce">公告</option>
                                <option :value="NewsDefine.NewsType.Match">赛事</option>
                                <option :value="NewsDefine.NewsType.News">资讯</option>
                            </select>
                        </div>
                    </CCol>
                    <CCol :md="6">
                        <div class="mb-3">
                            <CFormLabel>作者 <span class="text-danger">*</span></CFormLabel>
                            <CFormInput
                                v-model="newsForm.author"
                                placeholder="请输入作者"
                            />
                        </div>
                    </CCol>
                </CRow>
                <CRow>
                    <CCol :md="12">
                        <div class="mb-3">
                            <CFormLabel>标题 <span class="text-danger">*</span></CFormLabel>
                            <CFormInput
                                v-model="newsForm.title"
                                placeholder="请输入标题"
                            />
                        </div>
                    </CCol>
                </CRow>
                <CRow>
                    <CCol :md="6">
                        <div class="mb-3">
                            <CFormLabel>列表标题</CFormLabel>
                            <CFormInput
                                v-model="newsForm.listTitle"
                                placeholder="请输入列表标题（可选）"
                            />
                        </div>
                    </CCol>
                    <CCol :md="6">
                        <div class="mb-3">
                            <CFormLabel>可见性</CFormLabel>
                            <CFormCheck
                                type="checkbox"
                                label="可见"
                                v-model="newsForm.visible"
                            />
                        </div>
                    </CCol>
                </CRow>
                <CRow>
                    <CCol :md="12">
                        <div class="mb-3">
                            <CFormLabel>列表摘要 <span class="text-danger">*</span></CFormLabel>
                            <CFormTextarea
                                v-model="newsForm.listAbstract"
                                placeholder="请输入列表摘要"
                                rows="3"
                            />
                        </div>
                    </CCol>
                </CRow>
                <CRow>
                    <CCol :md="12">
                        <div class="mb-3">
                            <CFormLabel>列表图片</CFormLabel>
                            <ImageUpload
                                v-model="newsForm.listImageUrl"
                                placeholder="选择或上传列表图片"
                            />
                        </div>
                    </CCol>
                </CRow>
                <CRow>
                    <CCol :md="12">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <CFormLabel>正文内容 <span class="text-danger">*</span></CFormLabel>
                                <CButton color="primary" size="sm" @click="addContentItem">
                                    <CIcon icon="cil-plus" class="me-1" />
                                    添加内容
                                </CButton>
                            </div>
                            <div v-for="(content, index) in newsForm.contents" :key="index" class="mb-3 p-3 border rounded">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <strong>内容项 #{{ index + 1 }}</strong>
                                    <CButton color="danger" size="sm" @click="removeContentItem(index)">
                                        <CIcon icon="cil-trash" />
                                        删除
                                    </CButton>
                                </div>
                                <div class="mb-2">
                                    <CFormLabel>文本内容</CFormLabel>
                                    <CFormTextarea
                                        v-model="content.text"
                                        placeholder="请输入文本内容"
                                        rows="3"
                                    />
                                </div>
                                <div class="mb-2">
                                    <CFormLabel>图片URL</CFormLabel>
                                    <ImageUpload
                                        v-model="content.imgUrl"
                                        placeholder="选择或上传图片"
                                    />
                                </div>
                                <div class="mb-2" v-if="content.jump">
                                    <CFormLabel>跳转设置</CFormLabel>
                                    <CRow>
                                        <CCol :md="3">
                                            <CFormInput
                                                type="number"
                                                v-model.number="content.jump.gameID"
                                                placeholder="游戏ID"
                                            />
                                        </CCol>
                                        <CCol :md="3">
                                            <CFormInput
                                                type="number"
                                                v-model.number="content.jump.matchID"
                                                placeholder="比赛ID"
                                            />
                                        </CCol>
                                        <CCol :md="3">
                                            <CFormInput
                                                type="number"
                                                v-model.number="content.jump.groupID"
                                                placeholder="匹配ID"
                                            />
                                        </CCol>
                                        <CCol :md="3">
                                            <CFormInput
                                                v-model="content.jump.webUrl"
                                                placeholder="网页URL"
                                            />
                                        </CCol>
                                    </CRow>
                                </div>
                            </div>
                            <div v-if="!newsForm.contents || newsForm.contents.length === 0" class="text-center text-muted py-4 border rounded">
                                暂无内容，点击"添加内容"添加
                            </div>
                        </div>
                    </CCol>
                </CRow>
            </CForm>
        </CModalBody>
        <CModalFooter>
            <CButton color="secondary" @click="closeNewsModal">取消</CButton>
            <CButton color="primary" @click="saveNews" :disabled="saving">
                {{ saving ? '保存中...' : '保存' }}
            </CButton>
        </CModalFooter>
    </CModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
    newsGetnews,
    newsCreatenews,
    newsUpdatenewsdata,
    newsSetvisible,
    newsDeletenews,
} from '@/web/AdminReq'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import { NewsDefine } from 'pp-base-define/NewsDefine'
import { Toast } from '@/composables/useToast'
import { showConfirm } from '@/utils/message'
import { CSmartPagination } from '@coreui/vue-pro'
import ImageUpload from '@/components/ImageUpload.vue'

type NewsListItem = NewsDefine.tData

const loading = ref(false)
const saving = ref(false)
const newsList = ref<NewsListItem[]>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = ref(20)

const filter = ref({
    title: '' as string | undefined,
    type: undefined as NewsDefine.NewsType | undefined,
    author: '' as string | undefined,
})

const totalPages = computed(() => {
    return Math.ceil(totalCount.value / pageSize.value)
})

// Modal states
const showNewsModal = ref(false)
const editingNews = ref<NewsListItem | null>(null)

// News form
const newsForm = ref<Partial<NewsDefine.tData>>({
    newsID: '',
    type: NewsDefine.NewsType.News,
    title: '',
    listTitle: '',
    listAbstract: '',
    author: '',
    visible: true,
    listImageUrl: '',
    contents: [],
    gmUserID: 0,
    profileTimestamp: 0,
    profileDate: '',
    timestamp: 0,
    date: '',
})

// Load news
const loadNews = async () => {
    loading.value = true
    try {
        const params: AdminReqDefine.tNewsGetnewsReq = {
            page: currentPage.value,
            limit: pageSize.value,
        }

        if (filter.value.title && filter.value.title.trim()) {
            params.title = filter.value.title.trim()
        }

        if (filter.value.type !== undefined && filter.value.type !== null) {
            params.type = filter.value.type
        }

        if (filter.value.author && filter.value.author.trim()) {
            params.author = filter.value.author.trim()
        }

        const response = await newsGetnews(params)

        if (response.errCode) {
            Toast.error(response.errMsg || '加载新闻列表失败')
            newsList.value = []
            totalCount.value = 0
            return
        }

        newsList.value = response.datas || []
        totalCount.value = response.count || 0
    } catch (error) {
        console.error('Load news error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// Search
const handleSearch = () => {
    currentPage.value = 0
    loadNews()
}

// Clear search
const clearSearch = () => {
    filter.value = {
        title: '',
        type: undefined,
        author: '',
    }
    currentPage.value = 0
    loadNews()
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
                loadNews()
            }
        }
    }
}

const handlePageChange = (page: number) => {
    const newPage = page - 1
    if (newPage !== currentPage.value && newPage >= 0 && newPage < totalPages.value) {
        currentPage.value = newPage
        loadNews()
    }
}

// Type helpers
const getTypeName = (type: NewsDefine.NewsType): string => {
    const typeMap: Record<NewsDefine.NewsType, string> = {
        [NewsDefine.NewsType.Announce]: '公告',
        [NewsDefine.NewsType.Match]: '赛事',
        [NewsDefine.NewsType.News]: '资讯',
    }
    return typeMap[type] || '未知'
}

const getTypeColor = (type: NewsDefine.NewsType): string => {
    const colorMap: Record<NewsDefine.NewsType, string> = {
        [NewsDefine.NewsType.Announce]: 'warning',
        [NewsDefine.NewsType.Match]: 'success',
        [NewsDefine.NewsType.News]: 'info',
    }
    return colorMap[type] || 'secondary'
}

// Create news
const addNews = () => {
    editingNews.value = null
    newsForm.value = {
        newsID: '',
        type: NewsDefine.NewsType.News,
        title: '',
        listTitle: '',
        listAbstract: '',
        author: '',
        visible: true,
        listImageUrl: '',
        contents: [],
        gmUserID: 0,
        profileTimestamp: Date.now(),
        profileDate: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
    }
    showNewsModal.value = true
}

// Edit news
const editNews = (news: NewsListItem) => {
    editingNews.value = news
    newsForm.value = {
        ...news,
        contents: news.contents ? news.contents.map(content => ({
            ...content,
            jump: content.jump || {
                gameID: undefined,
                matchID: undefined,
                groupID: undefined,
                webUrl: undefined,
            },
        })) : [],
    }
    showNewsModal.value = true
}

// Save news
const saveNews = async () => {
    if (!newsForm.value.title) {
        Toast.error('请输入标题')
        return
    }
    if (!newsForm.value.listAbstract) {
        Toast.error('请输入列表摘要')
        return
    }
    if (!newsForm.value.author) {
        Toast.error('请输入作者')
        return
    }
    if (!newsForm.value.contents || newsForm.value.contents.length === 0) {
        Toast.error('请至少添加一个内容项')
        return
    }

    saving.value = true
    try {
        const data: NewsDefine.tData = {
            newsID: editingNews.value?.newsID || '',
            type: newsForm.value.type!,
            title: newsForm.value.title!,
            listTitle: newsForm.value.listTitle,
            listAbstract: newsForm.value.listAbstract!,
            author: newsForm.value.author!,
            visible: newsForm.value.visible ?? true,
            listImageUrl: newsForm.value.listImageUrl || '',
            contents: newsForm.value.contents.filter(c => c.text || c.imgUrl),
            gmUserID: newsForm.value.gmUserID || 0,
            profileTimestamp: newsForm.value.profileTimestamp || Date.now(),
            profileDate: newsForm.value.profileDate || new Date().toISOString().split('T')[0],
            timestamp: editingNews.value?.timestamp || Date.now(),
            date: editingNews.value?.date || new Date().toISOString().split('T')[0],
        }

        if (editingNews.value) {
            const response = await newsUpdatenewsdata({ data })
            if (response.errCode) {
                Toast.error(response.errMsg || '更新新闻失败')
                return
            }
            Toast.success('更新成功')
        } else {
            const response = await newsCreatenews({ data })
            if (response.errCode) {
                Toast.error(response.errMsg || '创建新闻失败')
                return
            }
            Toast.success('创建成功')
        }
        closeNewsModal()
        loadNews()
    } catch (error) {
        console.error('Save news error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Close news modal
const closeNewsModal = () => {
    showNewsModal.value = false
    editingNews.value = null
}

// Toggle visible
const toggleVisible = async (news: NewsListItem) => {
    const newVisible = !news.visible
    try {
        const response = await newsSetvisible({
            newsID: news.newsID,
            visible: newVisible,
        })
        if (response.errCode) {
            Toast.error(response.errMsg || '设置可见性失败')
            return
        }
        Toast.success(newVisible ? '已设置为可见' : '已设置为隐藏')
        loadNews()
    } catch (error) {
        console.error('Toggle visible error:', error)
        Toast.error('网络错误，请稍后重试')
    }
}

// Delete news
const deleteNews = async (newsID: string) => {
    const confirmed = await showConfirm(`确定要删除新闻 ${newsID} 吗？此操作不可恢复。`, { type: 'danger' })
    if (!confirmed) {
        return
    }

    try {
        const response = await newsDeletenews({ newsID })
        if (response.errCode) {
            Toast.error(response.errMsg || '删除失败')
            return
        }
        Toast.success('删除成功')
        loadNews()
    } catch (error) {
        console.error('Delete news error:', error)
        Toast.error('网络错误，请稍后重试')
    }
}

// Add content item
const addContentItem = () => {
    if (!newsForm.value.contents) {
        newsForm.value.contents = []
    }
    newsForm.value.contents.push({
        text: '',
        imgUrl: '',
        jump: {
            gameID: undefined,
            matchID: undefined,
            groupID: undefined,
            webUrl: undefined,
        },
    })
}

// Remove content item
const removeContentItem = (index: number) => {
    if (newsForm.value.contents) {
        newsForm.value.contents.splice(index, 1)
    }
}

// Load on mount
import { onMounted } from 'vue'
onMounted(() => {
    loadNews()
})
</script>
