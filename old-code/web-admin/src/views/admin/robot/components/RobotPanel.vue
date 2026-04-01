<template>
  <div>
    <!-- 面板概览 -->
    <CRow class="mb-4">
      <CCol :md="3">
        <CCard>
          <CCardBody>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-muted small">今日总数</div>
                <div class="h4 mb-0">{{ panelData.todayTotal || 0 }}</div>
              </div>
              <CIcon icon="cil-chart-pie" size="3xl" class="text-primary" />
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :md="3">
        <CCard>
          <CCardBody>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-muted small">机器人总数</div>
                <div class="h4 mb-0">{{ panelData.totalRobotCount || 0 }}</div>
              </div>
              <CIcon icon="cil-people" size="3xl" class="text-success" />
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :md="3">
        <CCard>
          <CCardBody>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-muted small">运行中</div>
                <div class="h4 mb-0">{{ panelData.totalRunningRobotCount || 0 }}</div>
              </div>
              <CIcon icon="cil-media-play" size="3xl" class="text-info" />
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :md="3">
        <CCard>
          <CCardBody>
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="text-muted small">加载中</div>
                <div class="h4 mb-0">{{ panelData.totalLoadingRobotCount || 0 }}</div>
              </div>
              <CIcon icon="cil-reload" size="3xl" class="text-warning" />
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <CRow class="mb-4">
      <CCol :md="6">
        <CCard>
          <CCardHeader>
            <strong>任务统计</strong>
          </CCardHeader>
          <CCardBody>
            <div class="mb-2">
              <span class="text-muted">总任务数：</span>
              <strong>{{ panelData.totalTaskCount || 0 }}</strong>
            </div>
            <div class="mb-2">
              <span class="text-muted">运行中任务：</span>
              <strong class="text-info">{{ panelData.totalRunningTaskCount || 0 }}</strong>
            </div>
            <div class="mb-2">
              <span class="text-muted">暂停任务：</span>
              <strong class="text-warning">{{ panelData.totalPausedTaskCount || 0 }}</strong>
            </div>
            <div v-if="panelData.taskRobotCounts && panelData.taskRobotCounts.length > 0" class="mt-3">
              <div class="text-muted small mb-2">任务机器人数量：</div>
              <div v-for="(item, index) in panelData.taskRobotCounts" :key="index" class="mb-1">
                任务 {{ item._id }}: <strong>{{ item.count }}</strong> 个机器人
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol :md="6">
        <CCard>
          <CCardHeader>
            <strong>库存信息</strong>
          </CCardHeader>
          <CCardBody>
            <div v-if="panelData.stores && panelData.stores.length > 0">
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>库存ID</CTableHeaderCell>
                    <CTableHeaderCell>总价值</CTableHeaderCell>
                    <CTableHeaderCell>已使用</CTableHeaderCell>
                    <CTableHeaderCell>剩余</CTableHeaderCell>
                    <CTableHeaderCell>使用率</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow v-for="store in panelData.stores" :key="store._id">
                    <CTableDataCell>{{ store._id }}</CTableDataCell>
                    <CTableDataCell>{{ store.value }}</CTableDataCell>
                    <CTableDataCell>{{ store.usedValue }}</CTableDataCell>
                    <CTableDataCell>{{ store.value - store.usedValue }}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge :color="getUsageColor(store.usedValue / store.value)">
                        {{ ((store.usedValue / store.value) * 100).toFixed(1) }}%
                      </CBadge>
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>
            <div v-else class="text-center text-muted py-3">
              暂无库存数据
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <!-- 机器人列表 -->
    <CCard>
      <CCardHeader>
        <strong>机器人列表</strong>
      </CCardHeader>
      <CCardBody>
        <CRow class="mb-3">
          <CCol :md="4">
            <CFormLabel>机器人用户ID（逗号分隔）</CFormLabel>
            <CFormInput
              v-model="robotUserIDsForRobotInput"
              placeholder="例如: 1001,1002,1003"
            />
          </CCol>
          <CCol :md="3">
            <CFormLabel>状态</CFormLabel>
            <select class="form-select" v-model.number="robotFilter.status">
              <option :value="undefined">全部</option>
              <option :value="RobotDefine.Status.Ready">待命</option>
              <option :value="RobotDefine.Status.Loading">加载中</option>
              <option :value="RobotDefine.Status.Using">使用中</option>
              <option :value="RobotDefine.Status.Rest">等待超时</option>
            </select>
          </CCol>
          <CCol :md="3">
            <CFormLabel>任务ID</CFormLabel>
            <CFormInput
              type="number"
              v-model.number="robotFilter.taskID"
              placeholder="请输入任务ID"
            />
          </CCol>
          <CCol :md="2">
            <CFormLabel>&nbsp;</CFormLabel>
            <CButton color="primary" class="w-100" @click="loadRobots">
              <CIcon icon="cil-magnifying-glass" class="me-1" />
              查询
            </CButton>
          </CCol>
        </CRow>
        <div v-if="loadingRobots" class="text-center py-4">
          <CSpinner />
          <div class="mt-2">加载中...</div>
        </div>
        <div v-else>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>机器人用户ID</CTableHeaderCell>
                <CTableHeaderCell>状态</CTableHeaderCell>
                <CTableHeaderCell>任务ID</CTableHeaderCell>
                <CTableHeaderCell>匹配计划ID</CTableHeaderCell>
                <CTableHeaderCell>比赛计划ID</CTableHeaderCell>
                <CTableHeaderCell>登录时间</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-for="robot in robots" :key="robot.robotUserID">
                <CTableDataCell>{{ robot.robotUserID }}</CTableDataCell>
                <CTableDataCell>
                  <CBadge :color="getStatusColor(robot.status)">
                    {{ getStatusText(robot.status) }}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell>{{ robot.strategyTaskID || '-' }}</CTableDataCell>
                <CTableDataCell>{{ robot.groupPlanID || '-' }}</CTableDataCell>
                <CTableDataCell>{{ robot.matchPlanID || '-' }}</CTableDataCell>
                <CTableDataCell>{{ formatTime(robot.startTimestamp) }}</CTableDataCell>
              </CTableRow>
              <CTableRow v-if="!robots || robots.length === 0">
                <CTableDataCell colspan="6" class="text-center text-muted py-4">
                  暂无机器人数据
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
          <CPagination v-if="robotCount > 0" class="mt-3">
            <CPaginationItem
              :disabled="robotPage === 0"
              @click="robotPage = Math.max(0, robotPage - 1); loadRobots()"
            >
              上一页
            </CPaginationItem>
            <CPaginationItem active>
              第 {{ robotPage + 1 }} 页 / 共 {{ Math.ceil(robotCount / 20) }} 页
            </CPaginationItem>
            <CPaginationItem
              :disabled="robotPage >= Math.ceil(robotCount / 20) - 1"
              @click="robotPage = robotPage + 1; loadRobots()"
            >
              下一页
            </CPaginationItem>
          </CPagination>
        </div>
      </CCardBody>
    </CCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  robotPanelGet,
  robotPanelGetrobots,
} from '@/web/AdminReq'
import type { AdminReqDefine } from 'pp-base-define/AdminReqDefine'
import { RobotDefine } from 'pp-base-define/RobotDefine'
import { Toast } from '@/composables/useToast'

// 面板数据
const panelData = ref<AdminReqDefine.tRobotPanelGetRes>({
  todayTotal: 0,
  totalRobotCount: 0,
  totalRunningRobotCount: 0,
  totalLoadingRobotCount: 0,
  stores: [],
  totalTaskCount: 0,
  totalRunningTaskCount: 0,
  totalPausedTaskCount: 0,
  taskRobotCounts: [],
})

// 机器人列表
const loadingRobots = ref(false)
const robots = ref<RobotDefine.tRuntime[]>([])
const robotCount = ref(0)
const robotPage = ref(0)

const robotFilter = ref<AdminReqDefine.tRobotPanelGetrobotsReq>({
  robotUserIDs: undefined,
  status: undefined,
  taskID: undefined,
  page: 0,
  limit: 20,
})

const robotUserIDsForRobotInput = ref('')

// 加载面板数据
const loadPanelData = async () => {
  try {
    const response = await robotPanelGet({})
    if (response.errCode) {
      Toast.error(response.errMsg || '加载面板数据失败')
      return
    }
    panelData.value = response
  } catch (error) {
    console.error('Load panel data error:', error)
    Toast.error('网络错误，请稍后重试')
  }
}

// 加载机器人列表
const loadRobots = async () => {
  loadingRobots.value = true
  try {
    // 解析机器人用户ID
    let robotUserIDs: number[] | undefined = undefined
    if (robotUserIDsForRobotInput.value.trim()) {
      robotUserIDs = robotUserIDsForRobotInput.value
        .split(',')
        .map(s => s.trim())
        .filter(s => s)
        .map(s => parseInt(s, 10))
        .filter(n => !isNaN(n))
    }

    const params: AdminReqDefine.tRobotPanelGetrobotsReq = {
      robotUserIDs,
      status: robotFilter.value.status,
      taskID: robotFilter.value.taskID,
      page: robotPage.value,
      limit: 20,
    }

    const response = await robotPanelGetrobots(params)
    if (response.errCode) {
      Toast.error(response.errMsg || '加载机器人列表失败')
      return
    }
    robots.value = response.datas || []
    robotCount.value = response.count || 0
  } catch (error) {
    console.error('Load robots error:', error)
    Toast.error('网络错误，请稍后重试')
  } finally {
    loadingRobots.value = false
  }
}

// 工具函数
const formatTime = (timestamp?: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

const getUsageColor = (usage: number) => {
  if (usage >= 0.9) return 'danger'
  if (usage >= 0.7) return 'warning'
  return 'success'
}

const getStatusColor = (status?: RobotDefine.Status) => {
  switch (status) {
    case RobotDefine.Status.Using:
      return 'success'
    case RobotDefine.Status.Loading:
      return 'info'
    case RobotDefine.Status.Rest:
      return 'warning'
    case RobotDefine.Status.Ready:
      return 'secondary'
    default:
      return 'secondary'
  }
}

const getStatusText = (status?: RobotDefine.Status) => {
  switch (status) {
    case RobotDefine.Status.Using:
      return '使用中'
    case RobotDefine.Status.Loading:
      return '加载中'
    case RobotDefine.Status.Rest:
      return '等待超时'
    case RobotDefine.Status.Ready:
      return '待命'
    default:
      return '未知'
  }
}

onMounted(() => {
  loadPanelData()
  loadRobots()
})
</script>

