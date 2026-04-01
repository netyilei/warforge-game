<template>
  <div>
    <CTabs v-model="activeTab">
      <CNav variant="tabs">
        <CNavItem>
          <CNavLink :active="activeTab === 0" @click="activeTab = 0">
            库存列表
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink :active="activeTab === 1" @click="activeTab = 1">
            库存记录
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink :active="activeTab === 2" @click="activeTab = 2">
            充值记录
          </CNavLink>
        </CNavItem>
      </CNav>
      <CTabContent>
        <!-- 库存列表 -->
        <CTabPane :visible="activeTab === 0">
          <div class="mt-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="d-flex gap-2">
                <CFormInput
                  v-model.number="filterStoreID"
                  type="number"
                  placeholder="库存ID"
                  style="width: 150px;"
                />
                <ItemSelect 
                  v-model="filterItemID" 
                  placeholder="全部道具"
                  placeholder-value=""
                  style="width: 150px;"
                />
                <CButton color="primary" @click="loadStores">
                  <CIcon icon="cil-magnifying-glass" class="me-1" />
                  搜索
                </CButton>
              </div>
              <CButton color="success" @click="showCreateModal = true">
                <CIcon icon="cil-plus" class="me-1" />
                创建库存
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
                    <CTableHeaderCell>库存ID</CTableHeaderCell>
                    <CTableHeaderCell>名称</CTableHeaderCell>
                    <CTableHeaderCell>描述</CTableHeaderCell>
                    <CTableHeaderCell>道具ID</CTableHeaderCell>
                    <CTableHeaderCell>数量</CTableHeaderCell>
                    <CTableHeaderCell>状态</CTableHeaderCell>
                    <CTableHeaderCell>创建时间</CTableHeaderCell>
                    <CTableHeaderCell>操作</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow v-for="store in stores" :key="store.storeID">
                    <CTableDataCell>{{ store.storeID }}</CTableDataCell>
                    <CTableDataCell>{{ store.name }}</CTableDataCell>
                    <CTableDataCell>{{ store.desc }}</CTableDataCell>
                    <CTableDataCell>{{ store.itemID }}</CTableDataCell>
                    <CTableDataCell>{{ store.count }}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge :color="store.enabled ? 'success' : 'secondary'">
                        {{ store.enabled ? '启用' : '禁用' }}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{{ store.date }}</CTableDataCell>
                    <CTableDataCell>
                      <CButtonGroup role="group">
                        <CButton
                          color="primary"
                          size="sm"
                          @click="viewStore(store)"
                        >
                          查看
                        </CButton>
                        <CButton
                          :color="store.enabled ? 'warning' : 'success'"
                          size="sm"
                          @click="toggleStoreEnabled(store)"
                        >
                          {{ store.enabled ? '禁用' : '启用' }}
                        </CButton>
                        <CButton
                          color="info"
                          size="sm"
                          @click="showAddStoreModal(store)"
                        >
                          添加库存
                        </CButton>
                      </CButtonGroup>
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
              <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="text-muted small">
                  共 {{ storeCount }} 条记录
                </div>
                <CPagination v-if="storeCount > pageSize">
                  <CPaginationItem
                    :disabled="storePage === 0"
                    @click="storePage = 0; loadStores()"
                  >
                    首页
                  </CPaginationItem>
                  <CPaginationItem
                    :disabled="storePage === 0"
                    @click="storePage--; loadStores()"
                  >
                    上一页
                  </CPaginationItem>
                  <CPaginationItem active>
                    {{ storePage + 1 }} / {{ Math.ceil(storeCount / pageSize) }}
                  </CPaginationItem>
                  <CPaginationItem
                    :disabled="storePage >= Math.ceil(storeCount / pageSize) - 1"
                    @click="storePage++; loadStores()"
                  >
                    下一页
                  </CPaginationItem>
                  <CPaginationItem
                    :disabled="storePage >= Math.ceil(storeCount / pageSize) - 1"
                    @click="storePage = Math.ceil(storeCount / pageSize) - 1; loadStores()"
                  >
                    末页
                  </CPaginationItem>
                </CPagination>
              </div>
            </div>
          </div>
        </CTabPane>

        <!-- 库存记录 -->
        <CTabPane :visible="activeTab === 1">
          <div class="mt-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="d-flex gap-2">
                <CFormInput
                  v-model.number="recordFilter.storeID"
                  type="number"
                  placeholder="库存ID"
                  style="width: 150px;"
                />
                <CFormInput
                  v-model="recordFilter.itemID"
                  placeholder="道具ID"
                  style="width: 150px;"
                />
                <CFormInput
                  v-model="recordFilter.reason"
                  placeholder="原因"
                  style="width: 150px;"
                />
                <CButton color="primary" @click="loadStoreRecords">
                  <CIcon icon="cil-magnifying-glass" class="me-1" />
                  搜索
                </CButton>
              </div>
            </div>

            <div v-if="recordLoading" class="text-center py-4">
              <CSpinner />
              <div class="mt-2">加载中...</div>
            </div>
            <div v-else>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>记录号</CTableHeaderCell>
                    <CTableHeaderCell>库存ID</CTableHeaderCell>
                    <CTableHeaderCell>道具ID</CTableHeaderCell>
                    <CTableHeaderCell>数量</CTableHeaderCell>
                    <CTableHeaderCell>原因</CTableHeaderCell>
                    <CTableHeaderCell>操作人</CTableHeaderCell>
                    <CTableHeaderCell>时间</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow v-for="record in storeRecords" :key="record.no">
                    <CTableDataCell>{{ record.no }}</CTableDataCell>
                    <CTableDataCell>{{ record.storeID }}</CTableDataCell>
                    <CTableDataCell>{{ record.itemID }}</CTableDataCell>
                    <CTableDataCell>{{ record.count }}</CTableDataCell>
                    <CTableDataCell>{{ record.reason }}</CTableDataCell>
                    <CTableDataCell>{{ record.gmUserID }}</CTableDataCell>
                    <CTableDataCell>{{ record.date }}</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
              <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="text-muted small">
                  共 {{ storeRecordCount }} 条记录
                </div>
                <CPagination v-if="storeRecordCount > pageSize">
                  <CPaginationItem
                    :disabled="storeRecordPage === 0"
                    @click="storeRecordPage = 0; loadStoreRecords()"
                  >
                    首页
                  </CPaginationItem>
                  <CPaginationItem
                    :disabled="storeRecordPage === 0"
                    @click="storeRecordPage--; loadStoreRecords()"
                  >
                    上一页
                  </CPaginationItem>
                  <CPaginationItem active>
                    {{ storeRecordPage + 1 }} / {{ Math.ceil(storeRecordCount / pageSize) }}
                  </CPaginationItem>
                  <CPaginationItem
                    :disabled="storeRecordPage >= Math.ceil(storeRecordCount / pageSize) - 1"
                    @click="storeRecordPage++; loadStoreRecords()"
                  >
                    下一页
                  </CPaginationItem>
                  <CPaginationItem
                    :disabled="storeRecordPage >= Math.ceil(storeRecordCount / pageSize) - 1"
                    @click="storeRecordPage = Math.ceil(storeRecordCount / pageSize) - 1; loadStoreRecords()"
                  >
                    末页
                  </CPaginationItem>
                </CPagination>
              </div>
            </div>
          </div>
        </CTabPane>

        <!-- 充值记录 -->
        <CTabPane :visible="activeTab === 2">
          <div class="mt-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="d-flex gap-2">
                <CFormInput
                  v-model.number="chargeRecordFilter.robotUserID"
                  type="number"
                  placeholder="机器人用户ID"
                  style="width: 150px;"
                />
                <CFormInput
                  v-model.number="chargeRecordFilter.storeID"
                  type="number"
                  placeholder="库存ID"
                  style="width: 150px;"
                />
                <CFormInput
                  v-model="chargeRecordFilter.itemID"
                  placeholder="道具ID"
                  style="width: 150px;"
                />
                <CFormInput
                  v-model="chargeRecordFilter.reason"
                  placeholder="原因"
                  style="width: 150px;"
                />
                <CButton color="primary" @click="loadChargeRecords">
                  <CIcon icon="cil-magnifying-glass" class="me-1" />
                  搜索
                </CButton>
              </div>
            </div>

            <div v-if="chargeRecordLoading" class="text-center py-4">
              <CSpinner />
              <div class="mt-2">加载中...</div>
            </div>
            <div v-else>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>记录号</CTableHeaderCell>
                    <CTableHeaderCell>机器人用户ID</CTableHeaderCell>
                    <CTableHeaderCell>库存ID</CTableHeaderCell>
                    <CTableHeaderCell>道具ID</CTableHeaderCell>
                    <CTableHeaderCell>充值前</CTableHeaderCell>
                    <CTableHeaderCell>充值数量</CTableHeaderCell>
                    <CTableHeaderCell>充值后</CTableHeaderCell>
                    <CTableHeaderCell>原因</CTableHeaderCell>
                    <CTableHeaderCell>时间</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow v-for="record in chargeRecords" :key="record.no">
                    <CTableDataCell>{{ record.no }}</CTableDataCell>
                    <CTableDataCell>{{ record.robotUserID }}</CTableDataCell>
                    <CTableDataCell>{{ record.storeID }}</CTableDataCell>
                    <CTableDataCell>{{ record.itemID }}</CTableDataCell>
                    <CTableDataCell>{{ record.fromCount }}</CTableDataCell>
                    <CTableDataCell>{{ record.count }}</CTableDataCell>
                    <CTableDataCell>{{ record.lastCount }}</CTableDataCell>
                    <CTableDataCell>{{ record.reason }}</CTableDataCell>
                    <CTableDataCell>{{ record.date }}</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
              <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="text-muted small">
                  共 {{ chargeRecordCount }} 条记录
                </div>
                <CPagination v-if="chargeRecordCount > pageSize">
                  <CPaginationItem
                    :disabled="chargeRecordPage === 0"
                    @click="chargeRecordPage = 0; loadChargeRecords()"
                  >
                    首页
                  </CPaginationItem>
                  <CPaginationItem
                    :disabled="chargeRecordPage === 0"
                    @click="chargeRecordPage--; loadChargeRecords()"
                  >
                    上一页
                  </CPaginationItem>
                  <CPaginationItem active>
                    {{ chargeRecordPage + 1 }} / {{ Math.ceil(chargeRecordCount / pageSize) }}
                  </CPaginationItem>
                  <CPaginationItem
                    :disabled="chargeRecordPage >= Math.ceil(chargeRecordCount / pageSize) - 1"
                    @click="chargeRecordPage++; loadChargeRecords()"
                  >
                    下一页
                  </CPaginationItem>
                  <CPaginationItem
                    :disabled="chargeRecordPage >= Math.ceil(chargeRecordCount / pageSize) - 1"
                    @click="chargeRecordPage = Math.ceil(chargeRecordCount / pageSize) - 1; loadChargeRecords()"
                  >
                    末页
                  </CPaginationItem>
                </CPagination>
              </div>
            </div>
          </div>
        </CTabPane>
      </CTabContent>
    </CTabs>

    <!-- 创建库存 Modal -->
    <CModal :visible="showCreateModal" @close="showCreateModal = false">
      <CModalHeader>
        <CModalTitle>创建库存</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <div class="mb-3">
            <CFormLabel>名称 <span class="text-danger">*</span></CFormLabel>
            <CFormInput v-model="createForm.name" placeholder="输入库存名称" />
          </div>
          <div class="mb-3">
            <CFormLabel>描述</CFormLabel>
            <CFormInput v-model="createForm.desc" placeholder="输入库存描述" />
          </div>
          <div class="mb-3">
            <CFormLabel>道具ID <span class="text-danger">*</span></CFormLabel>
            <ItemSelect 
              v-model="createForm.itemID" 
              placeholder="请选择道具"
              placeholder-value=""
            />
          </div>
          <div class="mb-3">
            <CFormLabel>启用状态</CFormLabel>
            <CFormSwitch
              v-model="createForm.enabled"
              label="启用"
            />
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showCreateModal = false">取消</CButton>
        <CButton color="primary" @click="createStore" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-1" />
          创建
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- 添加库存 Modal -->
    <CModal :visible="showAddStoreModalVisible" @close="showAddStoreModalVisible = false">
      <CModalHeader>
        <CModalTitle>添加库存</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <div class="mb-3">
            <CFormLabel>库存ID</CFormLabel>
            <CFormInput
              v-model.number="addStoreForm.storeID"
              type="number"
              disabled
            />
          </div>
          <div class="mb-3">
            <CFormLabel>数量 <span class="text-danger">*</span></CFormLabel>
            <CFormInput
              v-model="addStoreForm.count"
              placeholder="输入数量"
            />
          </div>
          <div class="mb-3">
            <CFormLabel>原因 <span class="text-danger">*</span></CFormLabel>
            <CFormInput
              v-model="addStoreForm.reason"
              placeholder="输入添加原因"
            />
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showAddStoreModalVisible = false">取消</CButton>
        <CButton color="primary" @click="addStore" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-1" />
          添加
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- 查看库存详情 Modal -->
    <CModal :visible="showViewModal" @close="showViewModal = false" size="lg">
      <CModalHeader>
        <CModalTitle>库存详情</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div v-if="selectedStore">
          <CRow>
            <CCol :md="6">
              <strong>库存ID:</strong> {{ selectedStore.storeID }}
            </CCol>
            <CCol :md="6">
              <strong>名称:</strong> {{ selectedStore.name }}
            </CCol>
            <CCol :md="6">
              <strong>描述:</strong> {{ selectedStore.desc }}
            </CCol>
            <CCol :md="6">
              <strong>道具ID:</strong> {{ selectedStore.itemID }}
            </CCol>
            <CCol :md="6">
              <strong>数量:</strong> {{ selectedStore.count }}
            </CCol>
            <CCol :md="6">
              <strong>状态:</strong>
              <CBadge :color="selectedStore.enabled ? 'success' : 'secondary'">
                {{ selectedStore.enabled ? '启用' : '禁用' }}
              </CBadge>
            </CCol>
            <CCol :md="6">
              <strong>创建时间:</strong> {{ selectedStore.date }}
            </CCol>
          </CRow>
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showViewModal = false">关闭</CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Toast } from '@/composables/useToast'
import {
  robotExtGetchargestore,
  robotExtCreatestore,
  robotExtSetstoreenabled,
  robotExtAddchargestore,
  robotExtGetchargestorerecord,
  robotExtGetrobotchargerecord
} from '@/web/AdminReq'
import { RobotExtDefine } from 'pp-base-define/RobotExtDefine'
import ItemSelect from '@/components/ItemSelect.vue'

const activeTab = ref(0)
const loading = ref(false)
const saving = ref(false)
const recordLoading = ref(false)
const chargeRecordLoading = ref(false)
const stores = ref<RobotExtDefine.tChargeStore[]>([])
const storeCount = ref(0)
const storePage = ref(0)
const pageSize = ref(20)
const filterStoreID = ref<number | undefined>(undefined)
const filterItemID = ref('')

const storeRecords = ref<RobotExtDefine.tChargeStoreRecord[]>([])
const storeRecordCount = ref(0)
const storeRecordPage = ref(0)
const recordFilter = ref({
  storeID: undefined as number | undefined,
  itemID: '' as string,
  reason: ''
})

const chargeRecords = ref<RobotExtDefine.tChargeRecord[]>([])
const chargeRecordCount = ref(0)
const chargeRecordPage = ref(0)
const chargeRecordFilter = ref({
  robotUserID: undefined as number | undefined,
  storeID: undefined as number | undefined,
  itemID: '' as string,
  reason: ''
})

const showCreateModal = ref(false)
const showAddStoreModalVisible = ref(false)
const showViewModal = ref(false)
const selectedStore = ref<RobotExtDefine.tChargeStore | null>(null)

const createForm = ref({
  name: '',
  desc: '',
  itemID: '',
  enabled: true
})

const addStoreForm = ref({
  storeID: 0,
  count: '',
  reason: ''
})


const loadStores = async () => {
  loading.value = true
  try {
    const response = await robotExtGetchargestore({
      storeID: filterStoreID.value,
      itemID: filterItemID.value || undefined,
      page: storePage.value,
      limit: pageSize.value
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '加载失败')
      return
    }
    stores.value = response.datas || []
    storeCount.value = response.count || 0
  } catch (error) {
    console.error('Load stores error:', error)
    Toast.error('网络错误')
  } finally {
    loading.value = false
  }
}

const loadStoreRecords = async () => {
  recordLoading.value = true
  try {
    const response = await robotExtGetchargestorerecord({
      storeID: recordFilter.value.storeID,
      itemID: recordFilter.value.itemID || undefined,
      reason: recordFilter.value.reason || undefined,
      page: storeRecordPage.value,
      limit: pageSize.value
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '加载失败')
      return
    }
    storeRecords.value = response.datas || []
    storeRecordCount.value = response.count || 0
  } catch (error) {
    console.error('Load store records error:', error)
    Toast.error('网络错误')
  } finally {
    recordLoading.value = false
  }
}

const loadChargeRecords = async () => {
  chargeRecordLoading.value = true
  try {
    const response = await robotExtGetrobotchargerecord({
      robotUserID: chargeRecordFilter.value.robotUserID,
      storeID: chargeRecordFilter.value.storeID,
      itemID: chargeRecordFilter.value.itemID || undefined,
      reason: chargeRecordFilter.value.reason || undefined,
      page: chargeRecordPage.value,
      limit: pageSize.value
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '加载失败')
      return
    }
    chargeRecords.value = response.datas || []
    chargeRecordCount.value = response.count || 0
  } catch (error) {
    console.error('Load charge records error:', error)
    Toast.error('网络错误')
  } finally {
    chargeRecordLoading.value = false
  }
}

const createStore = async () => {
  if (!createForm.value.name || !createForm.value.itemID) {
    Toast.error('请填写必填项')
    return
  }
  saving.value = true
  try {
    const response = await robotExtCreatestore({
      enabled: createForm.value.enabled,
      name: createForm.value.name,
      desc: createForm.value.desc,
      itemID: createForm.value.itemID
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '创建失败')
      return
    }
    Toast.success('创建成功')
    showCreateModal.value = false
    createForm.value = { name: '', desc: '', itemID: '', enabled: true }
    loadStores()
  } catch (error) {
    console.error('Create store error:', error)
    Toast.error('网络错误')
  } finally {
    saving.value = false
  }
}

const toggleStoreEnabled = async (store: RobotExtDefine.tChargeStore) => {
  saving.value = true
  try {
    const response = await robotExtSetstoreenabled({
      storeID: store.storeID,
      enabled: !store.enabled
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '操作失败')
      return
    }
    Toast.success('操作成功')
    loadStores()
  } catch (error) {
    console.error('Toggle store enabled error:', error)
    Toast.error('网络错误')
  } finally {
    saving.value = false
  }
}

const showAddStoreModal = (store: RobotExtDefine.tChargeStore) => {
  selectedStore.value = store
  addStoreForm.value = {
    storeID: store.storeID,
    count: '',
    reason: ''
  }
  showAddStoreModalVisible.value = true
}

const addStore = async () => {
  if (!addStoreForm.value.count || !addStoreForm.value.reason) {
    Toast.error('请填写必填项')
    return
  }
  saving.value = true
  try {
    const response = await robotExtAddchargestore({
      storeID: addStoreForm.value.storeID,
      count: addStoreForm.value.count,
      reason: addStoreForm.value.reason
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '添加失败')
      return
    }
    Toast.success('添加成功')
    showAddStoreModalVisible.value = false
    loadStores()
  } catch (error) {
    console.error('Add store error:', error)
    Toast.error('网络错误')
  } finally {
    saving.value = false
  }
}

const viewStore = (store: RobotExtDefine.tChargeStore) => {
  selectedStore.value = store
  showViewModal.value = true
}

// 监听标签切换，自动加载对应标签的数据
watch(activeTab, (newTab) => {
  if (newTab === 0) {
    // 库存列表
    loadStores()
  } else if (newTab === 1) {
    // 库存记录
    loadStoreRecords()
  } else if (newTab === 2) {
    // 充值记录
    loadChargeRecords()
  }
})

onMounted(() => {
  // 页面加载时，如果默认是第一个标签，则加载第一个标签的数据
  if (activeTab.value === 0) {
    loadStores()
  }
})
</script>
