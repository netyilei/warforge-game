<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>房间管理</strong>
                        <CButton color="primary" size="sm" @click="loadRooms">
                            <CIcon icon="cil-reload" class="me-1" />
                            刷新
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <!-- 筛选条件 -->
                    <CRow class="mb-3">
                        <CCol :md="3">
                            <CFormLabel>匹配ID</CFormLabel>
                            <CFormInput
                                type="number"
                                v-model.number="filterGroupID"
                                placeholder="输入匹配ID（留空显示全部）"
                            />
                        </CCol>
                        <CCol :md="3">
                            <CFormLabel>比赛ID</CFormLabel>
                            <CFormInput
                                type="number"
                                v-model.number="filterMatchID"
                                placeholder="输入比赛ID（留空显示全部）"
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
                        <!-- 房间列表 -->
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>房间ID</CTableHeaderCell>
                                    <CTableHeaderCell>游戏ID</CTableHeaderCell>
                                    <CTableHeaderCell>房间类型</CTableHeaderCell>
                                    <CTableHeaderCell>匹配ID</CTableHeaderCell>
                                    <CTableHeaderCell>比赛ID</CTableHeaderCell>
                                    <CTableHeaderCell>俱乐部ID</CTableHeaderCell>
                                    <CTableHeaderCell>状态</CTableHeaderCell>
                                    <CTableHeaderCell>玩家数</CTableHeaderCell>
                                    <CTableHeaderCell>创建时间</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="item in roomList" :key="item.data.roomID">
                                    <CTableDataCell>{{ item.data.roomID }}</CTableDataCell>
                                    <CTableDataCell>{{ item.data.gameData.gameID }}</CTableDataCell>
                                    <CTableDataCell>{{ getRoomTypeName(item.data.roomType) }}</CTableDataCell>
                                    <CTableDataCell>{{ item.data.groupID || '-' }}</CTableDataCell>
                                    <CTableDataCell>{{ item.data.matchID || '-' }}</CTableDataCell>
                                    <CTableDataCell>{{ item.data.club?.clubID || '-' }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CBadge :color="getStatusColor(item.realtime.status)">
                                            {{ getStatusName(item.realtime.status) }}
                                        </CBadge>
                                    </CTableDataCell>
                                    <CTableDataCell>{{ item.realtime.users?.length || 0 }}</CTableDataCell>
                                    <CTableDataCell>{{ item.data.createDate }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CButton color="danger" size="sm" @click="jiesanRoom(item.data.roomID)">
                                            解散
                                        </CButton>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!roomList || roomList.length === 0">
                                    <CTableDataCell colspan="10" class="text-center text-muted py-4">
                                        暂无房间数据
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
                                class="mt-3"
                            />
                        </div>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>

        <!-- 解散房间 Modal -->
        <CModal :visible="showJiesanModal" @close="closeJiesanModal">
            <CModalHeader>
                <CModalTitle>解散房间</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>房间ID</CFormLabel>
                        <CFormInput
                            :value="editingRoomID"
                            disabled
                        />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>解散类型</CFormLabel>
                        <select class="form-select" v-model.number="jiesanRemoveType">
                            <option :value="RoomDefine.RemoveType.NormalEnd">正常结束</option>
                            <option :value="RoomDefine.RemoveType.Jiesan">解散</option>
                            <option :value="RoomDefine.RemoveType.System">系统</option>
                            <option :value="RoomDefine.RemoveType.Error">错误</option>
                            <option :value="RoomDefine.RemoveType.GM">GM</option>
                            <option :value="RoomDefine.RemoveType.Match">比赛</option>
                            <option :value="RoomDefine.RemoveType.MatchForce">强制比赛</option>
                            <option :value="RoomDefine.RemoveType.MatchCombine">合并比赛</option>
                        </select>
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeJiesanModal">取消</CButton>
                <CButton color="danger" @click="confirmJiesan" :disabled="saving">
                    {{ saving ? '解散中...' : '确认解散' }}
                </CButton>
            </CModalFooter>
        </CModal>
    </CRow>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
    mgrGetallrooms,
    mgrJiesanroom,
} from '@/web/AdminReq'
import type { RoomDefine } from 'pp-base-define/RoomDefine'
import { RoomDefine as RoomDefineNS } from 'pp-base-define/RoomDefine'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import { Toast } from '@/composables/useToast'
import { showConfirm } from '@/utils/message'

// Reactive data
const loading = ref(false)
const saving = ref(false)
const roomList = ref<{ data: RoomDefine.RoomData, realtime: RoomDefine.RoomRealtime }[]>([])
const currentPage = ref(0)
const pageSize = ref(20)
const totalCount = ref(0)
const filterGroupID = ref<number | undefined>(undefined)
const filterMatchID = ref<number | undefined>(undefined)
const showJiesanModal = ref(false)
const editingRoomID = ref<number>(0)
const jiesanRemoveType = ref<RoomDefine.RemoveType>(RoomDefineNS.RemoveType.GM)

// Expose RoomDefine for template
const RoomDefine = RoomDefineNS

// Computed total pages
const totalPages = computed(() => {
    return Math.ceil(totalCount.value / pageSize.value)
})

// Get room type name
const getRoomTypeName = (type: RoomDefine.RoomType): string => {
    const typeMap: Record<RoomDefine.RoomType, string> = {
        [RoomDefineNS.RoomType.Custom]: '自定义',
        [RoomDefineNS.RoomType.Group]: '匹配',
        [RoomDefineNS.RoomType.Club]: '俱乐部',
        [RoomDefineNS.RoomType.Match]: '比赛',
    }
    return typeMap[type] || '未知'
}

// Get status name
const getStatusName = (status: RoomDefine.RoomStatus): string => {
    const statusMap: Record<RoomDefine.RoomStatus, string> = {
        [RoomDefineNS.RoomStatus.None]: '无',
        [RoomDefineNS.RoomStatus.Wait]: '等待',
        [RoomDefineNS.RoomStatus.Start]: '开始',
        [RoomDefineNS.RoomStatus.JuEnd]: '局结束',
        [RoomDefineNS.RoomStatus.End]: '结束',
    }
    return statusMap[status] || '未知'
}

// Get status color
const getStatusColor = (status: RoomDefine.RoomStatus): string => {
    const colorMap: Record<RoomDefine.RoomStatus, string> = {
        [RoomDefineNS.RoomStatus.None]: 'secondary',
        [RoomDefineNS.RoomStatus.Wait]: 'info',
        [RoomDefineNS.RoomStatus.Start]: 'success',
        [RoomDefineNS.RoomStatus.JuEnd]: 'warning',
        [RoomDefineNS.RoomStatus.End]: 'danger',
    }
    return colorMap[status] || 'secondary'
}

// Load rooms
const loadRooms = async () => {
    loading.value = true
    try {
        const params: AdminReqDefine.tMgrGetallroomsReq = {
            page: currentPage.value,
            limit: pageSize.value,
        }
        if (filterGroupID.value !== undefined && filterGroupID.value !== null) {
            params.groupID = filterGroupID.value
        }
        if (filterMatchID.value !== undefined && filterMatchID.value !== null) {
            params.matchID = filterMatchID.value
        }

        const response = await mgrGetallrooms(params)

        if (response.errCode) {
            Toast.error(response.errMsg || '加载房间列表失败')
            return
        }

        roomList.value = response.datas || []
        totalCount.value = response.count || 0
    } catch (error) {
        console.error('Load rooms error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// Handle page change
const handlePageChange = (page: number) => {
    currentPage.value = page
    loadRooms()
}

// Handle search
const handleSearch = () => {
    currentPage.value = 0
    loadRooms()
}

// Clear search
const clearSearch = () => {
    filterGroupID.value = undefined
    filterMatchID.value = undefined
    currentPage.value = 0
    loadRooms()
}

// Jiesan room
const jiesanRoom = (roomID: number) => {
    editingRoomID.value = roomID
    jiesanRemoveType.value = RoomDefineNS.RemoveType.GM
    showJiesanModal.value = true
}

// Close jiesan modal
const closeJiesanModal = () => {
    showJiesanModal.value = false
    editingRoomID.value = 0
}

// Confirm jiesan
const confirmJiesan = async () => {
    const confirmed = await showConfirm(
        `确定要解散房间 ${editingRoomID.value} 吗？解散类型：${getRemoveTypeName(jiesanRemoveType.value)}`,
        { type: 'danger' }
    )
    if (!confirmed) {
        return
    }

    saving.value = true
    try {
        const response = await mgrJiesanroom({
            roomID: editingRoomID.value,
            removeType: jiesanRemoveType.value,
        })

        if (response.errCode) {
            Toast.error(response.errMsg || '解散房间失败')
            return
        }

        Toast.success('房间解散成功')
        closeJiesanModal()
        await loadRooms()
    } catch (error) {
        console.error('Jiesan room error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Get remove type name
const getRemoveTypeName = (type: RoomDefine.RemoveType): string => {
    const typeMap: Record<RoomDefine.RemoveType, string> = {
        [RoomDefineNS.RemoveType.NormalEnd]: '正常结束',
        [RoomDefineNS.RemoveType.Jiesan]: '解散',
        [RoomDefineNS.RemoveType.System]: '系统',
        [RoomDefineNS.RemoveType.Error]: '错误',
        [RoomDefineNS.RemoveType.GM]: 'GM',
        [RoomDefineNS.RemoveType.Match]: '比赛',
        [RoomDefineNS.RemoveType.MatchForce]: '强制比赛',
        [RoomDefineNS.RemoveType.MatchCombine]: '合并比赛',
    }
    return typeMap[type] || '未知'
}

// Load rooms when component is mounted
onMounted(() => {
    loadRooms()
})
</script>

