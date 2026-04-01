<template>
  <div>
    <CCard>
      <CCardHeader>
        <strong>游戏记录</strong>
      </CCardHeader>
      <CCardBody>
        <div class="d-flex gap-2 mb-3">
          <CFormInput
            v-model.number="filter.robotUserID"
            type="number"
            placeholder="机器人用户ID"
            style="width: 150px;"
          />
          <ItemSelect 
            v-model="filter.itemID" 
            placeholder="全部道具"
            placeholder-value=""
            style="width: 150px;"
          />
          <CFormInput
            v-model="filter.startTime"
            type="datetime-local"
            placeholder="开始时间"
            style="width: 200px;"
          />
          <CFormInput
            v-model="filter.endTime"
            type="datetime-local"
            placeholder="结束时间"
            style="width: 200px;"
          />
          <CButton color="primary" @click="loadRecords">
            <CIcon icon="cil-magnifying-glass" class="me-1" />
            搜索
          </CButton>
        </div>

        <div v-if="loading" class="text-center py-4">
          <CSpinner />
          <div class="mt-2">加载中...</div>
        </div>
        <div v-else>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>流水号</CTableHeaderCell>
                <CTableHeaderCell>机器人用户ID</CTableHeaderCell>
                <CTableHeaderCell>房间ID</CTableHeaderCell>
                <CTableHeaderCell>游戏ID</CTableHeaderCell>
                <CTableHeaderCell>道具ID</CTableHeaderCell>
                <CTableHeaderCell>分数变化</CTableHeaderCell>
                <CTableHeaderCell>时间</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-for="record in records" :key="record.no">
                <CTableDataCell>{{ record.no }}</CTableDataCell>
                <CTableDataCell>{{ record.userID }}</CTableDataCell>
                <CTableDataCell>{{ record.roomID }}</CTableDataCell>
                <CTableDataCell>{{ record.gameID }}</CTableDataCell>
                <CTableDataCell>{{ record.itemID }}</CTableDataCell>
                <CTableDataCell>{{ record.scoreChanged || record.numScoreChanged || '-' }}</CTableDataCell>
                <CTableDataCell>{{ record.date }}</CTableDataCell>
              </CTableRow>
              <CTableRow v-if="records.length === 0">
                <CTableDataCell colspan="7" class="text-center text-muted py-4">
                  暂无数据
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <div class="text-muted small">
              共 {{ recordCount }} 条记录
            </div>
            <CPagination v-if="recordCount > pageSize">
              <CPaginationItem
                :disabled="currentPage === 0"
                @click="currentPage = 0; loadRecords()"
              >
                首页
              </CPaginationItem>
              <CPaginationItem
                :disabled="currentPage === 0"
                @click="currentPage--; loadRecords()"
              >
                上一页
              </CPaginationItem>
              <CPaginationItem active>
                {{ currentPage + 1 }} / {{ Math.ceil(recordCount / pageSize) }}
              </CPaginationItem>
              <CPaginationItem
                :disabled="currentPage >= Math.ceil(recordCount / pageSize) - 1"
                @click="currentPage++; loadRecords()"
              >
                下一页
              </CPaginationItem>
              <CPaginationItem
                :disabled="currentPage >= Math.ceil(recordCount / pageSize) - 1"
                @click="currentPage = Math.ceil(recordCount / pageSize) - 1; loadRecords()"
              >
                末页
              </CPaginationItem>
            </CPagination>
          </div>
        </div>
      </CCardBody>
    </CCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Toast } from '@/composables/useToast'
import { RobotDefine } from 'pp-base-define/RobotDefine'
import ItemSelect from '@/components/ItemSelect.vue'
import { robotPanelGetserials } from '@/web/AdminReq'

const loading = ref(false)
const records = ref<RobotDefine.tRobotGameSerial[]>([])
const recordCount = ref(0)
const currentPage = ref(0)
const pageSize = ref(20)

const filter = ref({
  robotUserID: undefined as number | undefined,
  itemID: '',
  startTime: '',
  endTime: ''
})

const loadRecords = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    }

    if (filter.value.robotUserID !== undefined && filter.value.robotUserID !== null) {
      params.robotUserIDs = [filter.value.robotUserID]
    }

    if (filter.value.itemID && filter.value.itemID !== '') {
      params.itemID = filter.value.itemID
    }

    // 处理时间范围
    if (filter.value.startTime) {
      params.startTime = new Date(filter.value.startTime).getTime()
    }
    if (filter.value.endTime) {
      params.endTime = new Date(filter.value.endTime).getTime()
    }

    const response = await robotPanelGetserials(params)

    if (response.errCode) {
      Toast.error(response.errMsg || '加载流水数据失败')
      records.value = []
      recordCount.value = 0
      return
    }

    records.value = response.datas || []
    recordCount.value = response.count || 0
  } catch (error) {
    console.error('Load records error:', error)
    Toast.error('网络错误')
    records.value = []
    recordCount.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 页面加载时自动执行一次搜索，使用默认参数
  loadRecords()
})
</script>

