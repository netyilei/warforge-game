<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>奖池管理</strong>
                        <div class="d-flex gap-2">
                            <CFormInput v-model.number="filterGroupID" type="number" placeholder="匹配ID"
                                class="d-inline-block" style="width:100px" />
                            <CFormInput v-model.number="filterMatchID" type="number" placeholder="比赛ID"
                                class="d-inline-block" style="width:100px" />
                            <CFormCheck label="含已禁用" v-model="withDisabled" @update:modelValue="loadList" />
                            <CButton color="primary" size="sm" @click="loadList">搜索</CButton>
                            <CButton color="success" size="sm" @click="openCreate('user')">新建-用户</CButton>
                            <CButton color="success" size="sm" @click="openCreate('group')">新建-匹配</CButton>
                            <CButton color="success" size="sm" @click="openCreate('match')">新建-比赛</CButton>
                        </div>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <div v-if="loading" class="text-center py-4">
                        <CSpinner /> 加载中...
                    </div>
                    <div v-else>
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>奖池 ID</CTableHeaderCell>
                                    <CTableHeaderCell>用户 ID</CTableHeaderCell>
                                    <CTableHeaderCell>房间 ID</CTableHeaderCell>
                                    <CTableHeaderCell>匹配 ID</CTableHeaderCell>
                                    <CTableHeaderCell>比赛 ID</CTableHeaderCell>
                                    <CTableHeaderCell>启用</CTableHeaderCell>
                                    <CTableHeaderCell>目标类型</CTableHeaderCell>
                                    <CTableHeaderCell>场景类型</CTableHeaderCell>
                                    <CTableHeaderCell>道具</CTableHeaderCell>
                                    <CTableHeaderCell>优先级</CTableHeaderCell>
                                    <CTableHeaderCell>奖池/总奖池</CTableHeaderCell>
                                    <CTableHeaderCell>触发几率</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="row in list" :key="row.potID">
                                    <CTableDataCell>{{ row.potID }}</CTableDataCell>
                                    <CTableDataCell>{{ row.userID ?? '-' }}</CTableDataCell>
                                    <CTableDataCell>{{ row.roomID ?? '-' }}</CTableDataCell>
                                    <CTableDataCell>{{ row.groupID ?? '-' }}</CTableDataCell>
                                    <CTableDataCell>{{ row.matchID ?? '-' }}</CTableDataCell>
                                    <CTableDataCell>
                                        <CFormSwitch
                                            :model-value="row.enabled"
                                            @update:model-value="(val: boolean) => setPotEnabled(row, val)"
                                        />
                                    </CTableDataCell>
                                    <CTableDataCell>{{ targetTypeName(row.targetType) }}</CTableDataCell>
                                    <CTableDataCell>{{ sceneTypeName(row.sceneType) }}</CTableDataCell>
                                    <CTableDataCell>{{ row.itemID || '-' }}</CTableDataCell>
                                    <CTableDataCell>{{ row.pri }}</CTableDataCell>
                                    <CTableDataCell>{{ row.currentCount ?? '-' }} / {{ row.totalCount ?? '-' }}
                                    </CTableDataCell>
                                    <CTableDataCell>{{ (row.rates?.percent ?? 0).toFixed(1) }}%</CTableDataCell>
                                    <CTableDataCell>
                                        <CButton color="primary" size="sm" class="me-1" @click="openEdit(row)">编辑
                                        </CButton>
                                        <CButton color="success" size="sm" @click="openAddPot(row)">增加奖池</CButton>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!list.length">
                                    <CTableDataCell colspan="13" class="text-center text-muted py-4">暂无数据
                                    </CTableDataCell>
                                </CTableRow>
                            </CTableBody>
                        </CTable>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="text-muted">共 {{ totalCount }} 条，第 {{ currentPage + 1 }} / {{ totalPages || 1
                                }} 页</span>
                            <CPagination v-if="totalPages > 0" v-model="currentPage" :pages="totalPages" align="end"
                                @update:modelValue="loadList" />
                        </div>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>
        <CModal :visible="showEditModal" @close="showEditModal = false" size="lg">
            <CModalHeader>
                <CModalTitle>编辑奖池 {{ editForm.potID }}</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>道具ID</CFormLabel>
                        <ItemSelect v-model="editForm.itemID" placeholder="道具" placeholder-value="" />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>数量控制 / 执行数量 / 当前数量</CFormLabel>
                        <CRow>
                            <CCol :md="4"><CFormSwitch v-model="editForm.countControl" /></CCol>
                            <CCol :md="4"><CFormInput v-model="editForm.totalCount" placeholder="执行数量" /></CCol>
                            <CCol :md="4"><CFormInput v-model="editForm.currentCount" placeholder="当前数量" /></CCol>
                        </CRow>
                    </div>
                    <div class="mb-3">
                        <CFormLabel>启用</CFormLabel>
                        <CFormSwitch v-model="editForm.enabled" />
                    </div>
                    <CRow>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>优先级</CFormLabel>
                                <CFormInput v-model.number="editForm.pri" type="number" />
                            </div>
                        </CCol>
                    </CRow>
                    <div class="mb-3">
                        <CFormLabel>触发几率 / 权重</CFormLabel>
                        <FormSlider v-model="editForm.rates.percent" label="触发几率" value-suffix="%"
                            value-type="number" :min="0" :max="100" :step="0.1" />
                    </div>


                    <div class="mb-3">

                        <CRow>

                            <CCol :md="3">
                                <div class="mb-3">
                                    <CFormLabel>最小牌权重</CFormLabel>
                                    <CFormInput v-model.number="editForm.rates.minValueCardPower" type="number" />
                                </div>
                            </CCol>
                            <CCol :md="3">
                                <div class="mb-3">
                                    <CFormLabel>次小牌权重</CFormLabel>
                                    <CFormInput v-model.number="editForm.rates.min2ValueCardPower" type="number" />
                                </div>
                            </CCol>
                            <CCol :md="3">
                                <div class="mb-3">
                                    <CFormLabel>普通牌权重</CFormLabel>
                                    <CFormInput v-model.number="editForm.rates.normalValueCardPower" type="number" />
                                </div>
                            </CCol>
                            <CCol :md="3">
                                <div class="mb-3">
                                    <CFormLabel>最大牌权重</CFormLabel>
                                    <CFormInput v-model.number="editForm.rates.maxValueCardPower" type="number" />
                                </div>
                            </CCol>
                        </CRow>
                    </div>
                    <CRow>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>观测启用</CFormLabel>
                                <CFormSwitch v-model="editForm.observeEnabled" />
                            </div>
                        </CCol>
                        <CCol :md="6">
                            <div class="mb-3">
                                <CFormLabel>观测类型</CFormLabel>
                                <select class="form-select" v-model.number="editForm.observeType">
                                    <option :value="0">平衡期望/充值</option>
                                    <option :value="1">平衡期望/提现</option>
                                    <option :value="2">平衡期望/赢</option>
                                    <option :value="3">平衡期望/输</option>
                                </select>
                            </div>
                        </CCol>
                    </CRow>
                    <div class="mb-3">
                        <FormSlider v-model="editForm.observePercent" label="观测百分比" value-suffix="%" value-type="number"
                            :min="0" :max="100" :step="0.01" />
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="showEditModal = false">取消</CButton>
                <CButton color="primary" @click="saveEdit" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</CButton>
            </CModalFooter>
        </CModal>
        <CModal :visible="showAddPotModal" @close="showAddPotModal = false" size="sm" backdrop="static">
            <CModalHeader>
                <CModalTitle>增加奖池 (奖池 ID: {{ addPotForm.potID }})</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>增加数量 <span class="text-danger">*</span></CFormLabel>
                        <CFormInput v-model="addPotForm.count" type="text" placeholder="请输入增加的数量" />
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="showAddPotModal = false">取消</CButton>
                <CButton color="primary" @click="saveAddPot" :disabled="saving || !addPotForm.count">确定</CButton>
            </CModalFooter>
        </CModal>
        <CModal :visible="showCreateModal" @close="showCreateModal = false" size="lg">
            <CModalHeader>
                <CModalTitle>创建奖池 - {{ showCreateType === 'user' ? '用户' : showCreateType === 'group' ? '匹配' : '比赛' }}
                </CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                    <div class="mb-3">
                        <CFormLabel>用户ID（选填）</CFormLabel>
                        <CFormInput v-model.number="createUserID" type="number" placeholder="留空表示全局" />
                    </div>
                    <div v-if="showCreateType === 'group'" class="mb-3">
                        <CFormLabel>匹配 <span class="text-danger">*</span></CFormLabel>
                        <select class="form-select" v-model.number="createGroupID" :disabled="loadingGroupList">
                            <option :value="0">请选择匹配</option>
                            <option v-for="g in groupListForPot" :key="g.groupID" :value="g.groupID">
                                {{ g.groupID }} - {{ g.display?.content || `游戏${g.gameID}` }}
                            </option>
                        </select>
                        <div v-if="loadingGroupList" class="text-muted small mt-1">加载匹配列表中...</div>
                        <div v-else-if="groupListForPot.length === 0" class="text-muted small mt-1">暂无匹配数据</div>
                    </div>
                    <div v-if="showCreateType === 'match'" class="mb-3">
                        <CFormLabel>比赛 <span class="text-danger">*</span></CFormLabel>
                        <select class="form-select" v-model.number="createMatchID" :disabled="loadingMatchList">
                            <option :value="0">请选择比赛</option>
                            <option v-for="m in matchListForPot" :key="m.data?.matchID" :value="m.data?.matchID">
                                {{ m.data?.matchID }} - {{ m.display?.list?.title || '未命名' }}
                            </option>
                        </select>
                        <div v-if="loadingMatchList" class="text-muted small mt-1">加载比赛列表中...</div>
                        <div v-else-if="matchListForPot.length === 0" class="text-muted small mt-1">暂无比赛数据</div>
                    </div>
                    <div v-if="showCreateType === 'user'" class="mb-3">
                        <CFormLabel>场景类型</CFormLabel>
                        <select class="form-select" v-model.number="createSceneType">
                            <option v-for="(v, k) in sceneTypeOpts" :key="k" :value="Number(k)">{{ v }}</option>
                        </select>
                    </div>
                    <div v-if="showCreateType === 'user'" class="mb-3">
                        <CFormLabel>全局比赛</CFormLabel>
                        <CFormSwitch v-model="createGlobalMatch" />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>道具ID</CFormLabel>
                        <ItemSelect v-model="createConfig.itemID" placeholder="道具" placeholder-value="" />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>数量控制 / 执行数量</CFormLabel>
                        <CRow>
                            <CCol :md="6">
                                <CFormSwitch v-model="createConfig.countControl" />
                            </CCol>
                            <CCol :md="6">
                                <CFormInput v-model="createConfig.totalCount" placeholder="totalCount" />
                            </CCol>
                        </CRow>
                    </div>
                    <div class="mb-3">
                        <CFormLabel>优先级</CFormLabel>
                        <CFormInput v-model.number="createConfig.pri" type="number" />
                    </div>
                    <div class="mb-3">
                        <CFormLabel>触发几率 / 权重</CFormLabel>
                        <FormSlider v-model="createConfig.rates.percent" label="触发几率" value-suffix="%"
                            value-type="number" :min="0" :max="100" :step="0.1" />
                    </div>
                    <div class="mb-3">
                        <CRow>
                            <CCol :md="3">
                                <div class="mb-3">
                                    <CFormLabel>最小牌权重</CFormLabel>
                                    <CFormInput v-model.number="createConfig.rates.minValueCardPower" type="number" />
                                </div>
                            </CCol>
                            <CCol :md="3">
                                <div class="mb-3">
                                    <CFormLabel>次小牌权重</CFormLabel>
                                    <CFormInput v-model.number="createConfig.rates.min2ValueCardPower" type="number" />
                                </div>
                            </CCol>
                            <CCol :md="3">
                                <div class="mb-3">
                                    <CFormLabel>普通牌权重</CFormLabel>
                                    <CFormInput v-model.number="createConfig.rates.normalValueCardPower"
                                        type="number" />
                                </div>
                            </CCol>
                            <CCol :md="3">
                                <div class="mb-3">
                                    <CFormLabel>最大牌权重</CFormLabel>
                                    <CFormInput v-model.number="createConfig.rates.maxValueCardPower" type="number" />
                                </div>
                            </CCol>
                        </CRow>
                    </div>
                    <div class="mb-3">
                        <CFormLabel>观测启用 / 类型 / 百分比</CFormLabel>
                        <CRow>
                            <CCol :md="4">
                                <CFormSwitch v-model="createConfig.observeEnabled" />
                            </CCol>
                            <CCol :md="4">
                                <select class="form-select" v-model.number="createConfig.observeType">
                                    <option :value="0">平衡期望/充值</option>
                                    <option :value="1">平衡期望/提现</option>
                                    <option :value="2">平衡期望/赢</option>
                                    <option :value="3">平衡期望/输</option>
                                </select>
                            </CCol>
                            <CCol :md="4">
                                <FormSlider v-model="createConfig.observePercent" label="观测百分比" value-suffix="%"
                                    value-type="number" :min="0" :max="100" :step="0.01" />
                            </CCol>
                        </CRow>
                    </div>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="showCreateModal = false">取消</CButton>
                <CButton color="primary" @click="saveCreate" :disabled="saving">{{ saving ? '保存中...' : '创建' }}</CButton>
            </CModalFooter>
        </CModal>
    </CRow>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
    potGetpotlist,
    potCreateforuser,
    potCreateforgroup,
    potCreateformatch,
    potUpdatepotconfig,
    potSetpotenabled,
    potAddtotalvalue,
    mgrGetgroups,
    matchGetmatchlist,
} from '@/web/AdminReq'
import { RewardDefine } from 'pp-base-define/RewardDefine'
import { MatchDefine } from 'pp-base-define/MatchDefine'
import { GroupDefine } from 'pp-base-define/GroupDefine'
import { Toast } from '@/composables/useToast'
import ItemSelect from '@/components/ItemSelect.vue'
import FormSlider from '@/components/FormSlider.vue'

const loading = ref(false)
const saving = ref(false)
const list = ref<RewardDefine.tPot[]>([])
const totalCount = ref(0)
const currentPage = ref(0)
const pageSize = 20
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))
const filterGroupID = ref<number | ''>('')
const filterMatchID = ref<number | ''>('')
const withDisabled = ref(false)
const showEditModal = ref(false)
const showCreateModal = ref(false)
const showCreateType = ref<'user' | 'group' | 'match'>('user')
const createUserID = ref<number | ''>('')
const createGroupID = ref(0)
const createMatchID = ref(0)
// 新建奖池时使用的匹配/比赛列表（接口拉取）
const groupListForPot = ref<GroupDefine.tData[]>([])
const matchListForPot = ref<{ data: MatchDefine.tData; display?: MatchDefine.tDisplay; reward?: MatchDefine.tReward; water?: MatchDefine.tWater }[]>([])
const loadingGroupList = ref(false)
const loadingMatchList = ref(false)
// 增加奖池弹窗
const showAddPotModal = ref(false)
const addPotForm = ref({ potID: 0, count: '' })
const createSceneType = ref(RewardDefine.PotSceneType.Global)
const createGlobalMatch = ref(false)

const sceneTypeOpts: Record<number, string> = {
    [RewardDefine.PotSceneType.Global]: '全局',
    [RewardDefine.PotSceneType.Room]: '房间',
    [RewardDefine.PotSceneType.Custom]: '好友房',
    [RewardDefine.PotSceneType.Group]: '匹配',
    [RewardDefine.PotSceneType.Match]: '比赛',
}

const sceneTypeName = (t: RewardDefine.PotSceneType) => sceneTypeOpts[t] ?? String(t)

const targetTypeOpts: Record<RewardDefine.PotTargetType, string> = {
    [RewardDefine.PotTargetType.All]: '全部用户',
    [RewardDefine.PotTargetType.User]: '指定用户',
}
const targetTypeName = (t: RewardDefine.PotTargetType) => targetTypeOpts[t] ?? String(t)

const defaultRates = (): RewardDefine.tPotExtConfig['rates'] => ({
    percent: 0,
    minValueCardPower: 0,
    min2ValueCardPower: 0,
    normalValueCardPower: 0,
    maxValueCardPower: 0,
})

const editForm = ref<RewardDefine.tPot & { rates: RewardDefine.tPotExtConfig['rates'] }>({
    potID: 0,
    enabled: true,
    targetType: RewardDefine.PotTargetType.All,
    sceneType: RewardDefine.PotSceneType.Global,
    globalMatch: false,
    itemID: '',
    countControl: false,
    totalCount: '',
    currentCount: '0',
    pri: 0,
    rates: defaultRates(),
    observeEnabled: false,
    observeType: RewardDefine.OBPercentType.ExceptionCharge,
    observePercent: 0,
})

const createConfig = ref<RewardDefine.tPotExtConfig>({
    itemID: '',
    countControl: false,
    totalCount: '',
    currentCount: '0',
    enabled: true,
    pri: 0,
    rates: defaultRates(),
    observeEnabled: false,
    observeType: RewardDefine.OBPercentType.ExceptionCharge,
    observePercent: 0,
})

const loadList = async () => {
    loading.value = true
    try {
        const res = await potGetpotlist({
            page: currentPage.value,
            limit: pageSize,
            groupID: filterGroupID.value === '' ? undefined : filterGroupID.value,
            matchID: filterMatchID.value === '' ? undefined : filterMatchID.value,
            withDisabled: withDisabled.value,
        })
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

const openEdit = (row: RewardDefine.tPot) => {
    editForm.value = {
        ...row,
        rates: { ...defaultRates(), ...row.rates },
    }
    showEditModal.value = true
}

const saveEdit = async () => {
    saving.value = true
    try {
        const res = await potUpdatepotconfig({
            potID: editForm.value.potID,
            config: {
                itemID: editForm.value.itemID,
                countControl: editForm.value.countControl,
                totalCount: editForm.value.totalCount,
                currentCount: editForm.value.currentCount,
                enabled: editForm.value.enabled,
                pri: editForm.value.pri,
                rates: editForm.value.rates,
                observeEnabled: editForm.value.observeEnabled,
                observeType: editForm.value.observeType,
                observePercent: editForm.value.observePercent,
            },
        })
        if (res.errCode) {
            Toast.error(res.errMsg || '保存失败')
            return
        }
        Toast.success('保存成功')
        showEditModal.value = false
        loadList()
    } finally {
        saving.value = false
    }
}

const setPotEnabled = async (row: RewardDefine.tPot, enabled: boolean) => {
    const res = await potSetpotenabled({ potID: row.potID, enabled })
    if (res.errCode) {
        Toast.error(res.errMsg || '操作失败')
        return
    }
    row.enabled = enabled
    Toast.success(enabled ? '已启用' : '已禁用')
}

const openAddPot = (row: RewardDefine.tPot) => {
    addPotForm.value = { potID: row.potID, count: '' }
    showAddPotModal.value = true
}

const saveAddPot = async () => {
    if (!addPotForm.value.count || addPotForm.value.count.trim() === '') {
        Toast.error('请输入增加数量')
        return
    }
    saving.value = true
    try {
        const res = await potAddtotalvalue({
            potID: addPotForm.value.potID,
            count: addPotForm.value.count.trim(),
        })
        if (res.errCode) {
            Toast.error(res.errMsg || '增加奖池失败')
            return
        }
        Toast.success('增加奖池成功')
        showAddPotModal.value = false
        loadList()
    } finally {
        saving.value = false
    }
}

// 新建-匹配：拉取匹配列表（mgrGetgroups）
const loadGroupListForPot = async () => {
    loadingGroupList.value = true
    groupListForPot.value = []
    try {
        const res = await mgrGetgroups({})
        if (!res.errCode && res.groups) {
            groupListForPot.value = res.groups
        }
    } catch (e) {
        console.error('Load group list for pot error:', e)
    } finally {
        loadingGroupList.value = false
    }
}

// 新建-比赛：拉取比赛列表（matchGetmatchlist，报名中/进行中）
const loadMatchListForPot = async () => {
    loadingMatchList.value = true
    matchListForPot.value = []
    try {
        const res = await matchGetmatchlist({
            statuss: [MatchDefine.MatchStatus.Signup, MatchDefine.MatchStatus.Running],
            page: 0,
            limit: 500,
        })
        if (!res.errCode && res.datas) {
            matchListForPot.value = res.datas
        }
    } catch (e) {
        console.error('Load match list for pot error:', e)
    } finally {
        loadingMatchList.value = false
    }
}

const openCreate = (type: 'user' | 'group' | 'match') => {
    showCreateType.value = type
    createUserID.value = ''
    createGroupID.value = 0
    createMatchID.value = 0
    createSceneType.value = RewardDefine.PotSceneType.Global
    createGlobalMatch.value = false
    createConfig.value = {
        itemID: '',
        countControl: false,
        totalCount: '',
        currentCount: '0',
        enabled: true,
        pri: 0,
        rates: defaultRates(),
        observeEnabled: false,
        observeType: RewardDefine.OBPercentType.ExceptionCharge,
        observePercent: 0,
    }
    if (type === 'group') {
        loadGroupListForPot()
    } else if (type === 'match') {
        loadMatchListForPot()
    }
    showCreateModal.value = true
}

const saveCreate = async () => {
    if (showCreateType.value === 'group' && !createGroupID.value) {
        Toast.error('请选择匹配')
        return
    }
    if (showCreateType.value === 'match' && !createMatchID.value) {
        Toast.error('请选择比赛')
        return
    }
    saving.value = true
    try {
        if (showCreateType.value === 'user') {
            const res = await potCreateforuser({
                userID: createUserID.value === '' ? undefined : createUserID.value,
                sceneType: createSceneType.value,
                globalMatch: createGlobalMatch.value,
                config: createConfig.value,
            })
            if (res.errCode) {
                Toast.error(res.errMsg || '创建失败')
                return
            }
        } else if (showCreateType.value === 'group') {
            const res = await potCreateforgroup({
                userID: createUserID.value === '' ? undefined : createUserID.value,
                groupID: createGroupID.value,
                config: createConfig.value,
            })
            if (res.errCode) {
                Toast.error(res.errMsg || '创建失败')
                return
            }
        } else {
            const res = await potCreateformatch({
                userID: createUserID.value === '' ? undefined : createUserID.value,
                matchID: createMatchID.value,
                config: createConfig.value,
            })
            if (res.errCode) {
                Toast.error(res.errMsg || '创建失败')
                return
            }
        }
        Toast.success('创建成功')
        showCreateModal.value = false
        loadList()
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadList()
})
</script>
