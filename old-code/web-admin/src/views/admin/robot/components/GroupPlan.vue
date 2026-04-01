<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex gap-2">
        <CFormInput
          v-model.number="filterPlanID"
          type="number"
          placeholder="计划ID"
          style="width: 150px;"
          @keyup.enter="loadPlans"
        />
        <CFormInput
          v-model.number="filterGroupID"
          type="number"
          placeholder="匹配ID"
          style="width: 150px;"
          @keyup.enter="loadPlans"
        />
        <CFormSwitch
          v-model="filterWithDisabled"
          label="包含禁用"
          class="ms-2"
        />
        <CButton color="primary" @click="loadPlans">
          <CIcon icon="cil-magnifying-glass" class="me-1" />
          搜索
        </CButton>
      </div>
      <CButton color="success" @click="showCreateModal = true">
        <CIcon icon="cil-plus" class="me-1" />
        创建计划
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
            <CTableHeaderCell>计划ID</CTableHeaderCell>
            <CTableHeaderCell>名称</CTableHeaderCell>
            <CTableHeaderCell>匹配ID</CTableHeaderCell>
            <CTableHeaderCell>执行权重</CTableHeaderCell>
            <CTableHeaderCell>独占</CTableHeaderCell>
            <CTableHeaderCell>性格</CTableHeaderCell>
            <CTableHeaderCell>策略</CTableHeaderCell>
            <CTableHeaderCell>局数</CTableHeaderCell>
            <CTableHeaderCell>房间数</CTableHeaderCell>
            <CTableHeaderCell>分数</CTableHeaderCell>
            <CTableHeaderCell>状态</CTableHeaderCell>
            <CTableHeaderCell>操作</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          <CTableRow v-for="plan in plans" :key="plan.planID">
            <CTableDataCell>{{ plan.planID }}</CTableDataCell>
            <CTableDataCell>{{ plan.name }}</CTableDataCell>
            <CTableDataCell>{{ plan.groupID }}</CTableDataCell>
            <CTableDataCell>{{ plan.power }}</CTableDataCell>
            <CTableDataCell>
              <CBadge :color="plan.monopoly ? 'warning' : 'secondary'">
                {{ plan.monopoly ? '是' : '否' }}
              </CBadge>
            </CTableDataCell>
            <CTableDataCell>{{ getPersonalityName(plan.personality) }}</CTableDataCell>
            <CTableDataCell>{{ getStrategyName(plan.strategy) }}</CTableDataCell>
            <CTableDataCell>
              <span v-if="plan.strategyData">
                {{ plan.strategyData.curJuCount ?? 0 }}/{{ plan.strategyData.juLimitCount ?? 0 }}
              </span>
              <span v-else class="text-muted">0/0</span>
            </CTableDataCell>
            <CTableDataCell>
              <span v-if="plan.strategyData">
                {{ plan.strategyData.curRoomCount ?? 0 }}/{{ plan.strategyData.roomLimitCount ?? 0 }}
              </span>
              <span v-else class="text-muted">0/0</span>
            </CTableDataCell>
            <CTableDataCell>
              <span v-if="plan.strategyData && ((plan.strategyData as any).curValue !== undefined || (plan.strategyData as any).limitValue !== undefined)">
                <template v-if="plan.strategy !== RobotDefine.RuntimeStrategy.Target">
                  <!-- 非Target策略：如果没有curValue，视为0 -->
                  <template v-if="(plan.strategyData as any).limitValue !== undefined">
                    {{ (plan.strategyData as any).curValue ?? 0 }}/{{ (plan.strategyData as any).limitValue }}
                  </template>
                  <template v-else>
                    {{ (plan.strategyData as any).curValue ?? '-' }}
                  </template>
                </template>
                <template v-else>
                  <!-- Target策略：保持原有逻辑 -->
                  <template v-if="(plan.strategyData as any).curValue !== undefined && (plan.strategyData as any).limitValue !== undefined">
                    {{ (plan.strategyData as any).curValue }}/{{ (plan.strategyData as any).limitValue }}
                  </template>
                  <template v-else-if="(plan.strategyData as any).limitValue !== undefined">
                    {{ (plan.strategyData as any).limitValue }}
                  </template>
                  <template v-else>
                    {{ (plan.strategyData as any).curValue ?? '-' }}
                  </template>
                </template>
              </span>
              <span v-else class="text-muted">-</span>
            </CTableDataCell>
            <CTableDataCell>
              <CBadge :color="plan.enabled ? 'success' : 'secondary'">
                {{ plan.enabled ? '启用' : '禁用' }}
              </CBadge>
            </CTableDataCell>
            <CTableDataCell>
              <CButtonGroup role="group">
                <CButton
                  color="primary"
                  size="sm"
                  @click="viewPlan(plan)"
                >
                  查看
                </CButton>
                <CButton
                  :color="plan.enabled ? 'warning' : 'success'"
                  size="sm"
                  @click="togglePlanEnabled(plan)"
                >
                  {{ plan.enabled ? '禁用' : '启用' }}
                </CButton>
                <CButton
                  color="info"
                  size="sm"
                  @click="editPlanPower(plan)"
                >
                  修改权重
                </CButton>
                <CButton
                  color="info"
                  size="sm"
                  @click="editPlanStore(plan)"
                >
                  修改库存
                </CButton>
              </CButtonGroup>
            </CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div class="text-muted small">
          共 {{ planCount }} 条记录
        </div>
        <CPagination v-if="planCount > pageSize">
          <CPaginationItem
            :disabled="planPage === 0"
            @click="planPage = 0; loadPlans()"
          >
            首页
          </CPaginationItem>
          <CPaginationItem
            :disabled="planPage === 0"
            @click="planPage--; loadPlans()"
          >
            上一页
          </CPaginationItem>
          <CPaginationItem active>
            {{ planPage + 1 }} / {{ Math.ceil(planCount / pageSize) }}
          </CPaginationItem>
          <CPaginationItem
            :disabled="planPage >= Math.ceil(planCount / pageSize) - 1"
            @click="planPage++; loadPlans()"
          >
            下一页
          </CPaginationItem>
          <CPaginationItem
            :disabled="planPage >= Math.ceil(planCount / pageSize) - 1"
            @click="planPage = Math.ceil(planCount / pageSize) - 1; loadPlans()"
          >
            末页
          </CPaginationItem>
        </CPagination>
      </div>
    </div>

    <!-- 创建/编辑计划 Modal -->
    <CModal :visible="showEditModal" @close="closeEditModal" size="lg">
      <CModalHeader>
        <CModalTitle>{{ isEditing ? '编辑计划' : '创建计划' }}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <div class="mb-3">
            <CFormLabel>名称 <span class="text-danger">*</span></CFormLabel>
            <CFormInput v-model="editForm.name" placeholder="输入计划名称" />
          </div>
          <div class="mb-3">
            <CFormLabel>描述</CFormLabel>
            <CFormInput v-model="editForm.desc" placeholder="输入计划描述" />
          </div>
          <div class="mb-3">
            <CFormLabel>匹配ID <span class="text-danger">*</span></CFormLabel>
            <GroupSelect 
              v-model="editForm.groupID" 
              placeholder="请选择匹配"
              :placeholder-value="undefined"
            />
          </div>
          <div class="mb-3">
            <CFormLabel>机器人数量 <span class="text-danger">*</span></CFormLabel>
            <CFormInput
              v-model.number="editForm.robotCount"
              type="number"
              placeholder="输入机器人数量"
            />
          </div>
          <div class="mb-3">
            <CFormLabel>执行权重 <span class="text-danger">*</span></CFormLabel>
            <CFormInput
              v-model.number="editForm.power"
              type="number"
              placeholder="输入执行权重"
            />
          </div>
          <div class="mb-3">
            <CFormLabel>独占</CFormLabel>
            <CFormSwitch
              v-model="editForm.monopoly"
              label="是否独占"
            />
          </div>
          <div class="mb-3">
            <CFormLabel>性格 <span class="text-danger">*</span></CFormLabel>
            <select class="form-select" v-model.number="editForm.personality">
              <option :value="undefined">请选择性格</option>
              <option :value="0">保守</option>
              <option :value="1">稳健</option>
              <option :value="2">激进</option>
              <option :value="3">非常激进</option>
            </select>
          </div>
          <div class="mb-3">
            <CFormLabel>策略 <span class="text-danger">*</span></CFormLabel>
            <select class="form-select" v-model.number="editForm.strategy">
              <option :value="undefined">请选择策略</option>
              <option :value="0">Normal</option>
              <option :value="1">Kill</option>
              <option :value="2">Bonus</option>
              <option :value="3">Target</option>
            </select>
          </div>

          <!-- 策略数据配置 -->
          <div v-if="editForm.strategy !== undefined" class="mb-3">
            <h6 class="mb-3">策略配置</h6>
            
            <!-- 基础配置（所有策略都有） -->
            <CRow class="mb-3">
              <CCol :md="6">
                <CFormLabel>总局数控制</CFormLabel>
                <CFormInput
                  v-model.number="strategyDataForm.juLimitCount"
                  type="number"
                  placeholder="输入总局数限制"
                  min="0"
                />
              </CCol>
              <CCol :md="6">
                <CFormLabel>总房间数控制</CFormLabel>
                <CFormInput
                  v-model.number="strategyDataForm.roomLimitCount"
                  type="number"
                  placeholder="输入总房间数限制"
                  min="0"
                />
              </CCol>
            </CRow>
            <CRow class="mb-3">
              <CCol :md="6">
                <CFormLabel>玩家少于多少坐下</CFormLabel>
                <CFormInput
                  v-model.number="strategyDataForm.lessThanPlayerSitdown"
                  type="number"
                  placeholder="0表示直接坐下"
                  min="0"
                />
              </CCol>
              <CCol :md="6">
                <CFormLabel>玩家大于多少站起</CFormLabel>
                <CFormInput
                  v-model.number="strategyDataForm.greateThanPlayerStandup"
                  type="number"
                  placeholder="输入站起阈值"
                  min="0"
                />
              </CCol>
            </CRow>

            <!-- Kill策略特有配置 -->
            <div v-if="editForm.strategy === RobotDefine.RuntimeStrategy.Kill" class="mb-3">
              <CFormLabel>目标分数</CFormLabel>
              <CFormInput
                v-model="strategyDataForm.limitValue"
                placeholder="输入目标分数"
              />
            </div>

            <!-- Bonus策略特有配置 -->
            <div v-if="editForm.strategy === RobotDefine.RuntimeStrategy.Bonus" class="mb-3">
              <CFormLabel>目标分数</CFormLabel>
              <CFormInput
                v-model="strategyDataForm.limitValue"
                placeholder="输入目标分数"
              />
            </div>

            <!-- Target策略特有配置 -->
            <div v-if="editForm.strategy === RobotDefine.RuntimeStrategy.Target" class="mb-3">
              <CFormLabel>目标分数</CFormLabel>
              <CFormInput
                v-model="strategyDataForm.limitValue"
                placeholder="输入目标分数"
              />
              <div class="mt-2">
                <CFormLabel>目标用户</CFormLabel>
                <UserSelect
                  v-model="targetUserIDsArray"
                />
              </div>
            </div>
          </div>

          <div class="mb-3">
            <CFormLabel>需求道具ID</CFormLabel>
            <ItemSelect 
              v-model="editForm.itemNeeded!.itemID" 
              placeholder="请选择道具"
              :placeholder-value="0"
              :return-number="true"
            />
          </div>
          <div class="mb-3">
            <CFormLabel>触发充值数量</CFormLabel>
            <CFormInput
              v-model="editForm.itemNeeded!.count"
              placeholder="输入触发充值数量"
            />
          </div>
          <div class="mb-3">
            <CFormLabel>自动充值数量(1~1.2倍随机)</CFormLabel>
            <CFormInput
              v-model="editForm.chargeMinCount"
              placeholder="自动充值数量，1~1.2倍随机"
            />
          </div>
          <div class="mb-3">
            <CFormLabel>库存ID</CFormLabel>
            <StoreSelect 
              v-model="editForm.storeID" 
              placeholder="请选择库存"
              :placeholder-value="0"
            />
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="closeEditModal">取消</CButton>
        <CButton color="primary" @click="savePlan" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-1" />
          保存
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- 修改权重 Modal -->
    <CModal :visible="showPowerModal" @close="showPowerModal = false">
      <CModalHeader>
        <CModalTitle>修改权重</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <div class="mb-3">
            <CFormLabel>执行权重</CFormLabel>
            <CFormInput
              v-model.number="powerForm.power"
              type="number"
              placeholder="输入执行权重"
            />
          </div>
          <div class="mb-3">
            <CFormLabel>独占</CFormLabel>
            <CFormSwitch
              v-model="powerForm.monopoly"
              label="是否独占"
            />
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showPowerModal = false">取消</CButton>
        <CButton color="primary" @click="savePower" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-1" />
          保存
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- 修改库存 Modal -->
    <CModal :visible="showStoreModal" @close="showStoreModal = false">
      <CModalHeader>
        <CModalTitle>修改库存</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm>
          <div class="mb-3">
            <CFormLabel>库存ID</CFormLabel>
            <StoreSelect 
              v-model="storeForm.storeID" 
              placeholder="请选择库存"
              :placeholder-value="0"
            />
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" @click="showStoreModal = false">取消</CButton>
        <CButton color="primary" @click="saveStore" :disabled="saving">
          <CSpinner v-if="saving" size="sm" class="me-1" />
          保存
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- 查看计划详情 Modal（全量数据） -->
    <CModal :visible="showViewModal" @close="showViewModal = false" size="lg">
      <CModalHeader>
        <CModalTitle>计划详情</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div v-if="selectedPlan">
          <CRow>
            <CCol :md="6"><strong>计划ID:</strong> {{ selectedPlan.planID }}</CCol>
            <CCol :md="6"><strong>名称:</strong> {{ selectedPlan.name }}</CCol>
            <CCol :md="6"><strong>描述:</strong> {{ selectedPlan.desc }}</CCol>
            <CCol :md="6"><strong>匹配ID:</strong> {{ selectedPlan.groupID }}</CCol>
            <CCol :md="6"><strong>机器人数量:</strong> {{ selectedPlan.runtimeRobotCount }} / {{ selectedPlan.robotCount }}</CCol>
            <CCol :md="6"><strong>执行权重:</strong> {{ selectedPlan.power }}</CCol>
            <CCol :md="6"><strong>独占:</strong> {{ selectedPlan.monopoly ? '是' : '否' }}</CCol>
            <CCol :md="6"><strong>状态:</strong> {{ selectedPlan.enabled ? '启用' : '禁用' }}</CCol>
            <CCol :md="6"><strong>性格:</strong> {{ getPersonalityName(selectedPlan.personality) }}</CCol>
            <CCol :md="6"><strong>策略:</strong> {{ getStrategyName(selectedPlan.strategy) }}</CCol>
            <CCol :md="6"><strong>库存ID:</strong> {{ selectedPlan.storeID }}</CCol>
            <CCol :md="6"><strong>时间/日期:</strong> {{ selectedPlan.timestamp }} / {{ selectedPlan.date }}</CCol>
            <CCol :md="6"><strong>目标数值:</strong> {{ selectedPlan.targetValue }}</CCol>
            <CCol :md="6"><strong>当前数值:</strong> {{ selectedPlan.curValue }}</CCol>
          </CRow>
          <hr />
          <div class="mb-2"><strong>需求道具 (itemNeeded):</strong></div>
          <CRow class="mb-2">
            <CCol :md="6"><strong>道具ID:</strong> {{ selectedPlan.itemNeeded?.itemID }}</CCol>
            <CCol :md="6"><strong>触发充值数量 (count):</strong> {{ selectedPlan.itemNeeded?.count }}</CCol>
            <CCol :md="6"><strong>浮动需求:</strong> {{ selectedPlan.itemNeeded?.floating ? '是' : '否' }}</CCol>
            <CCol :md="6"><strong>浮动数量:</strong> {{ selectedPlan.itemNeeded?.floatingCount ?? '-' }}</CCol>
          </CRow>
          <CRow class="mb-2">
            <CCol :md="6"><strong>自动充值数量 (chargeMinCount):</strong> {{ selectedPlan.chargeMinCount }}</CCol>
          </CRow>
          <div v-if="selectedPlan.strategyData" class="mt-2">
            <strong>策略数据 (strategyData):</strong>
            <pre class="strategy-data-display small bg-light p-2 rounded">{{ JSON.stringify(selectedPlan.strategyData, null, 2) }}</pre>
          </div>
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
  robotExtGetgrouplan,
  robotExtCreategrouplan,
  robotExtUpdategrouplanenabled,
  robotExtChangegrouplanpower,
  robotExtChangegrouplanstoreid
} from '@/web/AdminReq'
import { RobotExtDefine } from 'pp-base-define/RobotExtDefine'
import { RobotDefine } from 'pp-base-define/RobotDefine'
import ItemSelect from '@/components/ItemSelect.vue'
import StoreSelect from '@/components/StoreSelect.vue'
import GroupSelect from '@/components/GroupSelect.vue'
import UserSelect from '@/components/UserSelect.vue'

// 获取性格显示名称（统一格式）
const getPersonalityName = (personality: RobotDefine.Personality | null | undefined): string => {
  if (personality === null || personality === undefined) {
    return '-'
  }
  const nameMap: Record<RobotDefine.Personality, string> = {
    [RobotDefine.Personality.Level0]: '保守',
    [RobotDefine.Personality.Level1]: '稳健',
    [RobotDefine.Personality.Level2]: '激进',
    [RobotDefine.Personality.Level3]: '非常激进',
  }
  return nameMap[personality] || `Level${personality}`
}

// 获取策略显示名称
const getStrategyName = (strategy: RobotDefine.RuntimeStrategy | null | undefined): string => {
  if (strategy === null || strategy === undefined) {
    return '-'
  }
  const nameMap: Record<RobotDefine.RuntimeStrategy, string> = {
    [RobotDefine.RuntimeStrategy.Normal]: 'Normal',
    [RobotDefine.RuntimeStrategy.Kill]: 'Kill',
    [RobotDefine.RuntimeStrategy.Bonus]: 'Bonus',
    [RobotDefine.RuntimeStrategy.Target]: 'Target',
  }
  return nameMap[strategy] || `Strategy${strategy}`
}

// 检查是否有策略数据
const hasStrategyData = (strategyData: RobotDefine.tStrategyData_Base | undefined | null): boolean => {
  if (!strategyData) return false
  return !!(
    strategyData.juLimitCount !== undefined ||
    strategyData.curJuCount !== undefined ||
    strategyData.roomLimitCount !== undefined ||
    strategyData.curRoomCount !== undefined ||
    strategyData.lessThanPlayerSitdown !== undefined ||
    strategyData.greateThanPlayerStandup !== undefined ||
    (strategyData as any).limitValue ||
    (strategyData as RobotDefine.tStrategyData_Target)?.targetUserIDs
  )
}

const loading = ref(false)
const saving = ref(false)
const plans = ref<RobotExtDefine.tGroupPlan[]>([])
const planCount = ref(0)
const planPage = ref(0)
const pageSize = ref(20)
const filterPlanID = ref<number | undefined>(undefined)
const filterGroupID = ref<number | undefined>(undefined)
const filterWithDisabled = ref(false)

const showEditModal = ref(false)
const showCreateModal = ref(false)
const showPowerModal = ref(false)
const showStoreModal = ref(false)
const showViewModal = ref(false)
const isEditing = ref(false)
const selectedPlan = ref<RobotExtDefine.tGroupPlan | null>(null)

const editForm = ref<Partial<RobotExtDefine.tGroupPlan>>({
  name: '',
  desc: '',
  groupID: undefined,
  robotCount: 0,
  power: 0,
  monopoly: false,
  personality: RobotDefine.Personality.Level0,
  strategy: RobotDefine.RuntimeStrategy.Normal,
  strategyData: {},
  itemNeeded: {
    itemID: 0,
    count: '',
    floating: false
  },
  chargeMinCount: '',
  storeID: 0
})

const powerForm = ref({
  planID: 0,
  power: 0,
  monopoly: false
})

const storeForm = ref({
  planID: 0,
  storeID: 0
})

// 策略数据表单
const strategyDataForm = ref<Partial<RobotDefine.tStrategyData_Base & RobotDefine.tStrategyData_Kill & RobotDefine.tStrategyData_Bonus & RobotDefine.tStrategyData_Target>>({
  juLimitCount: undefined,
  roomLimitCount: undefined,
  lessThanPlayerSitdown: undefined,
  greateThanPlayerStandup: undefined,
  limitValue: undefined,
  targetUserIDs: undefined
})

// 目标用户ID数组（用于UserSelect组件）
const targetUserIDsArray = ref<number[]>([])

const loadPlans = async () => {
  loading.value = true
  try {
    const response = await robotExtGetgrouplan({
      planID: filterPlanID.value,
      groupID: filterGroupID.value,
      withDisabled: filterWithDisabled.value,
      page: planPage.value,
      limit: pageSize.value
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '加载失败')
      return
    }
    plans.value = response.datas || []
    planCount.value = response.count || 0
  } catch (error) {
    console.error('Load plans error:', error)
    Toast.error('网络错误')
  } finally {
    loading.value = false
  }
}

// 重置策略数据表单
const resetStrategyDataForm = () => {
  strategyDataForm.value = {
    juLimitCount: undefined,
    roomLimitCount: undefined,
    lessThanPlayerSitdown: undefined,
    greateThanPlayerStandup: undefined,
    limitValue: undefined,
    targetUserIDs: undefined
  }
  targetUserIDsArray.value = []
}

// 从 strategyData 加载到表单
const loadStrategyDataToForm = (strategyData: RobotDefine.tStrategyData_Base | undefined) => {
  if (!strategyData) {
    resetStrategyDataForm()
    return
  }
  
  strategyDataForm.value = {
    juLimitCount: strategyData.juLimitCount,
    roomLimitCount: strategyData.roomLimitCount,
    lessThanPlayerSitdown: strategyData.lessThanPlayerSitdown,
    greateThanPlayerStandup: strategyData.greateThanPlayerStandup,
    limitValue: (strategyData as any).limitValue,
    targetUserIDs: (strategyData as RobotDefine.tStrategyData_Target)?.targetUserIDs
  }
  
  // 处理目标用户ID列表
  if ((strategyData as RobotDefine.tStrategyData_Target)?.targetUserIDs) {
    targetUserIDsArray.value = [...(strategyData as RobotDefine.tStrategyData_Target).targetUserIDs!]
  } else {
    targetUserIDsArray.value = []
  }
}

// 从表单构建 strategyData
const buildStrategyData = (): RobotDefine.tStrategyData_Base => {
  const base: RobotDefine.tStrategyData_Base = {}
  
  // 基础字段
  if (strategyDataForm.value.juLimitCount !== undefined && strategyDataForm.value.juLimitCount !== null) {
    base.juLimitCount = strategyDataForm.value.juLimitCount
  }
  if (strategyDataForm.value.roomLimitCount !== undefined && strategyDataForm.value.roomLimitCount !== null) {
    base.roomLimitCount = strategyDataForm.value.roomLimitCount
  }
  if (strategyDataForm.value.lessThanPlayerSitdown !== undefined && strategyDataForm.value.lessThanPlayerSitdown !== null) {
    base.lessThanPlayerSitdown = strategyDataForm.value.lessThanPlayerSitdown
  }
  if (strategyDataForm.value.greateThanPlayerStandup !== undefined && strategyDataForm.value.greateThanPlayerStandup !== null) {
    base.greateThanPlayerStandup = strategyDataForm.value.greateThanPlayerStandup
  }
  
  // 根据策略类型添加特有字段
  if (editForm.value.strategy === RobotDefine.RuntimeStrategy.Kill) {
    const killData = base as RobotDefine.tStrategyData_Kill
    if (strategyDataForm.value.limitValue) {
      killData.limitValue = strategyDataForm.value.limitValue
    }
    return killData
  } else if (editForm.value.strategy === RobotDefine.RuntimeStrategy.Bonus) {
    const bonusData = base as RobotDefine.tStrategyData_Bonus
    if (strategyDataForm.value.limitValue) {
      bonusData.limitValue = strategyDataForm.value.limitValue
    }
    return bonusData
  } else if (editForm.value.strategy === RobotDefine.RuntimeStrategy.Target) {
    const targetData = base as RobotDefine.tStrategyData_Target
    if (strategyDataForm.value.limitValue) {
      targetData.limitValue = strategyDataForm.value.limitValue
    }
    // 处理目标用户ID列表
    if (targetUserIDsArray.value && targetUserIDsArray.value.length > 0) {
      targetData.targetUserIDs = [...targetUserIDsArray.value]
    }
    targetData.curValues = [] // 运行时数据，不需要编辑
    return targetData
  }
  
  return base
}

const closeEditModal = () => {
  showEditModal.value = false
  isEditing.value = false
  editForm.value = {
    name: '',
    desc: '',
    groupID: undefined,
    robotCount: 0,
    power: 0,
    monopoly: false,
    personality: RobotDefine.Personality.Level0,
    strategy: RobotDefine.RuntimeStrategy.Normal,
    strategyData: {},
    itemNeeded: {
      itemID: 0,
      count: '',
      floating: false
    },
    chargeMinCount: '',
    storeID: 0
  }
  resetStrategyDataForm()
}

const savePlan = async () => {
  if (!editForm.value.name || editForm.value.groupID === undefined) {
    Toast.error('请填写必填项')
    return
  }
  saving.value = true
  try {
    // 构建 strategyData
    const strategyData = buildStrategyData()
    
    // 合并到 editForm
    const planToSave = {
      ...editForm.value,
      strategyData: strategyData
    } as RobotExtDefine.tGroupPlan
    
    const response = await robotExtCreategrouplan({
      plan: planToSave
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '保存失败')
      return
    }
    Toast.success(isEditing.value ? '保存成功' : '创建成功')
    closeEditModal()
    loadPlans()
  } catch (error) {
    console.error('Save plan error:', error)
    Toast.error('网络错误')
  } finally {
    saving.value = false
  }
}

const togglePlanEnabled = async (plan: RobotExtDefine.tGroupPlan) => {
  saving.value = true
  try {
    const response = await robotExtUpdategrouplanenabled({
      planID: plan.planID,
      enabled: !plan.enabled
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '操作失败')
      return
    }
    Toast.success('操作成功')
    loadPlans()
  } catch (error) {
    console.error('Toggle plan enabled error:', error)
    Toast.error('网络错误')
  } finally {
    saving.value = false
  }
}

const editPlanPower = (plan: RobotExtDefine.tGroupPlan) => {
  selectedPlan.value = plan
  powerForm.value = {
    planID: plan.planID,
    power: plan.power,
    monopoly: plan.monopoly
  }
  showPowerModal.value = true
}

const savePower = async () => {
  saving.value = true
  try {
    const response = await robotExtChangegrouplanpower({
      planID: powerForm.value.planID,
      power: powerForm.value.power,
      monopoly: powerForm.value.monopoly
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '保存失败')
      return
    }
    Toast.success('保存成功')
    showPowerModal.value = false
    loadPlans()
  } catch (error) {
    console.error('Save power error:', error)
    Toast.error('网络错误')
  } finally {
    saving.value = false
  }
}

const editPlanStore = (plan: RobotExtDefine.tGroupPlan) => {
  selectedPlan.value = plan
  storeForm.value = {
    planID: plan.planID,
    storeID: plan.storeID
  }
  showStoreModal.value = true
}

const saveStore = async () => {
  saving.value = true
  try {
    const response = await robotExtChangegrouplanstoreid({
      planID: storeForm.value.planID,
      storeID: storeForm.value.storeID
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '保存失败')
      return
    }
    Toast.success('保存成功')
    showStoreModal.value = false
    loadPlans()
  } catch (error) {
    console.error('Save store error:', error)
    Toast.error('网络错误')
  } finally {
    saving.value = false
  }
}

const viewPlan = (plan: RobotExtDefine.tGroupPlan) => {
  selectedPlan.value = plan
  showViewModal.value = true
}

// 监听策略变化，重置策略数据表单
watch(() => editForm.value.strategy, (newStrategy, oldStrategy) => {
  if (newStrategy !== oldStrategy) {
    // 策略改变时，重置策略数据表单（保留基础字段）
    const baseData = {
      juLimitCount: strategyDataForm.value.juLimitCount,
      roomLimitCount: strategyDataForm.value.roomLimitCount,
      lessThanPlayerSitdown: strategyDataForm.value.lessThanPlayerSitdown,
      greateThanPlayerStandup: strategyDataForm.value.greateThanPlayerStandup
    }
    strategyDataForm.value = {
      ...baseData,
      limitValue: undefined,
      targetUserIDs: undefined
    }
    targetUserIDsArray.value = []
  }
})

watch(showCreateModal, (val) => {
  if (val) {
    isEditing.value = false
    editForm.value = {
      name: '',
      desc: '',
      groupID: undefined,
      robotCount: 0,
      power: 0,
      monopoly: false,
      personality: RobotDefine.Personality.Level0,
      strategy: RobotDefine.RuntimeStrategy.Normal,
      strategyData: {},
      itemNeeded: {
        itemID: 0,
        count: '',
        floating: false
      },
      chargeMinCount: '',
      storeID: 0
    }
    resetStrategyDataForm()
    showEditModal.value = true
    showCreateModal.value = false
  }
})



onMounted(() => {
  loadPlans()
})
</script>

<style scoped>
.strategy-data-display {
  max-width: 300px;
}

.strategy-data-display .small {
  display: block;
  margin-bottom: 0.25rem;
  line-height: 1.4;
  word-break: break-word;
}
</style>

