<template>
  <CRow>
    <CCol xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center">
            <strong>注册审核</strong>
            <div>
              <CButton color="primary" size="sm" class="me-2" @click="loadData" :disabled="loading">
                <CIcon icon="cil-reload" class="me-1" />
                刷新
              </CButton>
            </div>
          </div>
        </CCardHeader>
        <CCardBody>
          <CRow class="g-3 align-items-end mb-3">
            <CCol md="4">
              <CFormLabel>账号</CFormLabel>
              <CFormInput v-model="filters.account" placeholder="支持模糊查询" />
            </CCol>
            <CCol md="4">
              <CFormLabel>状态</CFormLabel>
              <CFormSelect v-model="filters.status">
                <option value="all">全部</option>
                <option value="pending">未操作</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </CFormSelect>
            </CCol>
            <CCol md="4" class="d-flex gap-2">
              <CButton color="primary" @click="applyFilters" :disabled="loading">
                查询
              </CButton>
              <CButton color="secondary" variant="outline" @click="resetFilters" :disabled="loading">
                重置
              </CButton>
            </CCol>
          </CRow>

          <div v-if="loading" class="text-center py-4">
            <CSpinner />
          </div>

          <div v-else>
            <CTable hover responsive class="mb-3">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>单号</CTableHeaderCell>
                  <CTableHeaderCell>账号</CTableHeaderCell>
                  <CTableHeaderCell>UserID</CTableHeaderCell>
                  <CTableHeaderCell>昵称</CTableHeaderCell>
                  <CTableHeaderCell>手机号</CTableHeaderCell>
                  <CTableHeaderCell>操作状态</CTableHeaderCell>
                  <CTableHeaderCell>结果</CTableHeaderCell>
                  <CTableHeaderCell>操作人</CTableHeaderCell>
                  <CTableHeaderCell>时间</CTableHeaderCell>
                  <CTableHeaderCell style="width: 260px;">操作</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <CTableRow v-for="row in datas" :key="row.no">
                  <CTableDataCell>{{ row.no }}</CTableDataCell>
                  <CTableDataCell>{{ row.account }}</CTableDataCell>
                  <CTableDataCell>{{ row.userID }}</CTableDataCell>
                  <CTableDataCell>{{ row.loginData.nickName }}</CTableDataCell>
                  <CTableDataCell>{{ row.loginData.phoneNumber }}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge :color="row.oper ? 'info' : 'warning'">
                      {{ row.oper ? '已操作' : '未操作' }}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge v-if="!row.oper" color="secondary">-</CBadge>
                    <CBadge v-else :color="row.confirm ? 'success' : 'danger'">
                      {{ row.confirm ? '通过' : '拒绝' }}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>{{ row.gmUserID || '-' }}</CTableDataCell>
                  <CTableDataCell>{{ row.date || '-' }}</CTableDataCell>
                  <CTableDataCell>
                    <CButtonGroup>
                      <CButton color="primary" variant="outline" size="sm" @click="openDetail(row)">
                        查看
                      </CButton>
                      <CButton color="success" size="sm" :disabled="row.oper || saving" @click="confirmAudit(row, true)">
                        通过
                      </CButton>
                      <CButton color="danger" size="sm" :disabled="row.oper || saving" @click="confirmAudit(row, false)">
                        拒绝
                      </CButton>
                    </CButtonGroup>
                  </CTableDataCell>
                </CTableRow>
                <CTableRow v-if="datas.length === 0">
                  <CTableDataCell colspan="8" class="text-center text-muted py-4">
                    暂无数据
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>

            <div class="d-flex justify-content-end">
              <CSmartPagination
                :activePage="page + 1"
                :pages="Math.max(1, Math.ceil(total / limit))"
                @update:activePage="onPageChange"
              />
            </div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>

    <!-- 详情 Modal -->
    <CModal :visible="showDetail" @close="closeDetail" size="lg">
      <CModalHeader>
        <CModalTitle>审核详情</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div v-if="detailRow" class="mb-3">
          <div class="mb-1"><strong>账号：</strong>{{ detailRow.account }}</div>
          <div class="mb-1"><strong>UserID：</strong>{{ detailRow.userID }}</div>
          <div class="mb-1"><strong>单号：</strong>{{ detailRow.no }}</div>
          <div class="mb-1"><strong>上传Token：</strong>{{ detailRow.uploadToken }}</div>
        </div>

        <div v-if="detailLoading" class="text-center py-4">
          <CSpinner />
        </div>

        <div v-else>
          <CAlert v-if="detailError" color="danger" class="mb-3">{{ detailError }}</CAlert>

          <div v-if="uploadText" class="mb-3">
            <CFormLabel>上传数据（JSON）</CFormLabel>
            <CFormTextarea rows="10" v-model="uploadText" readonly />
          </div>

          <div v-if="uploadImageSrc" class="mb-3">
            <CFormLabel>上传图片</CFormLabel>
            <div class="border rounded p-2 bg-body">
              <img :src="uploadImageSrc" style="max-width: 100%; height: auto;" />
            </div>
          </div>

          <div v-if="!uploadText && !uploadImageSrc" class="text-muted">
            未获取到上传数据
          </div>
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="closeDetail">关闭</CButton>
      </CModalFooter>
    </CModal>
  </CRow>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Toast } from '@/composables/useToast'
import { userAuditConfirmregisteraudit, userAuditGetregisteraudits, userAuditGetregisterauditupload } from '@/web/AdminReq'
import type { UserDefine } from 'pp-base-define/UserDefine'

type Row = UserDefine.tRegisterAudit

const loading = ref(false)
const saving = ref(false)

const datas = ref<Row[]>([])
const total = ref(0)
const page = ref(0)
const limit = ref(20)

const filters = ref({
  account: '',
  status: 'pending' as 'all' | 'pending' | 'approved' | 'rejected',
})

const queryParams = computed(() => {
  const status = filters.value.status
  const p: any = {
    account: filters.value.account?.trim() || undefined,
    page: page.value,
    limit: limit.value,
  }
  if (status === 'pending') {
    p.oper = false
  } else if (status === 'approved') {
    p.oper = true
    p.confirm = true
  } else if (status === 'rejected') {
    p.oper = true
    p.confirm = false
  }
  return p
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await userAuditGetregisteraudits(queryParams.value)
    if (res.errCode) {
      Toast.error(res.errMsg || '获取注册审核列表失败')
      return
    }
    datas.value = res.datas || []
    total.value = res.count || 0
  } catch (e) {
    console.error(e)
    Toast.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

const applyFilters = async () => {
  page.value = 0
  await loadData()
}

const resetFilters = async () => {
  filters.value.account = ''
  filters.value.status = 'pending'
  page.value = 0
  await loadData()
}

const onPageChange = async (p: number) => {
  page.value = Math.max(0, p - 1)
  await loadData()
}

// 详情/上传数据
const showDetail = ref(false)
const detailRow = ref<Row | null>(null)
const detailLoading = ref(false)
const detailError = ref('')
const uploadText = ref('')
const uploadImageSrc = ref('')

const closeDetail = () => {
  showDetail.value = false
  detailRow.value = null
  detailLoading.value = false
  detailError.value = ''
  uploadText.value = ''
  uploadImageSrc.value = ''
}

const guessDataUrl = (base64: string) => {
  // 如果后端已经返回 dataURL，直接用
  if (base64.startsWith('data:')) return base64
  // 简单启发式：默认 png
  return `data:image/png;base64,${base64}`
}

const openDetail = async (row: Row) => {
  showDetail.value = true
  detailRow.value = row
  detailLoading.value = true
  detailError.value = ''
  uploadText.value = ''
  uploadImageSrc.value = ''

  try {
    const res = await userAuditGetregisterauditupload({ no: row.no })
    if (res.errCode) {
      detailError.value = res.errMsg || '获取上传数据失败'
      return
    }
    const base64Data = (res.base64Data || '').trim()
    if (!base64Data) return

    // base64Data 可能是 JSON 字符串的 base64，也可能是图片的 base64，也可能是直接 JSON 字符串
    try {
      // 尝试当成 JSON 字符串
      const maybeJson = base64Data.startsWith('{') ? base64Data : ''
      if (maybeJson) {
        uploadText.value = JSON.stringify(JSON.parse(maybeJson), null, 2)
        return
      }
    } catch {
      // ignore
    }

    // 尝试 base64 解码成文本，再解析 JSON
    try {
      const decoded = atob(base64Data)
      const obj = JSON.parse(decoded)
      uploadText.value = JSON.stringify(obj, null, 2)
      return
    } catch {
      // ignore
    }

    // 当成图片 base64
    uploadImageSrc.value = guessDataUrl(base64Data)
  } catch (e) {
    console.error(e)
    detailError.value = '网络错误，请稍后重试'
  } finally {
    detailLoading.value = false
  }
}

const confirmAudit = async (row: Row, confirm: boolean) => {
  if (row.oper) return
  saving.value = true
  try {
    const res = await userAuditConfirmregisteraudit({ no: row.no, confirm })
    if (res.errCode) {
      Toast.error(res.errMsg || '操作失败')
      return
    }
    Toast.success(confirm ? '已通过' : '已拒绝')
    await loadData()
  } catch (e) {
    console.error(e)
    Toast.error('网络错误，请稍后重试')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadData()
})
</script>

