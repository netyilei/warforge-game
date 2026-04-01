<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>匹配管理</strong>
                        <CButton color="success" size="sm" @click="addGroup">
                            <CIcon icon="cil-plus" class="me-1" />
                            创建匹配
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <div v-if="loading" class="text-center py-4">
                        <CSpinner />
                        <div class="mt-2">加载中...</div>
                    </div>
                    <div v-else>
                        <!-- 匹配列表 -->
                        <CTable hover responsive>
                            <CTableHead>
                                <CTableRow>
                                    <CTableHeaderCell>匹配ID</CTableHeaderCell>
                                    <CTableHeaderCell>游戏ID</CTableHeaderCell>
                                    <CTableHeaderCell>排序</CTableHeaderCell>
                                    <CTableHeaderCell>道具ID</CTableHeaderCell>
                                    <CTableHeaderCell>道具数量范围</CTableHeaderCell>
                                    <CTableHeaderCell>显示内容</CTableHeaderCell>
                                    <CTableHeaderCell>操作</CTableHeaderCell>
                                </CTableRow>
                            </CTableHead>
                            <CTableBody>
                                <CTableRow v-for="group in groups" :key="group.groupID">
                                    <CTableDataCell>{{ group.groupID }}</CTableDataCell>
                                    <CTableDataCell>{{ group.gameID }}</CTableDataCell>
                                    <CTableDataCell>{{ group.pri }}</CTableDataCell>
                                    <CTableDataCell>{{ group.itemID }}</CTableDataCell>
                                    <CTableDataCell>
                                        [{{ group.minItemCount }}, {{ group.maxItemCount }})
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <div v-if="group.display">
                                            <small class="text-muted">{{ group.display.type }}</small><br>
                                            {{ group.display.content }}
                                        </div>
                                    </CTableDataCell>
                                    <CTableDataCell>
                                        <CButtonGroup role="group">
                                            <CButton color="primary" size="sm" @click="editGroup(group)">
                                                编辑
                                            </CButton>
                                            <CButton color="info" size="sm" @click="editGroupWater(group)">
                                                抽水配置
                                            </CButton>
                                            <CButton color="danger" size="sm" @click="deleteGroup(group.groupID)">
                                                删除
                                            </CButton>
                                        </CButtonGroup>
                                    </CTableDataCell>
                                </CTableRow>
                                <CTableRow v-if="!groups || groups.length === 0">
                                    <CTableDataCell colspan="7" class="text-center text-muted py-4">
                                        暂无匹配数据
                                    </CTableDataCell>
                                </CTableRow>
                            </CTableBody>
                        </CTable>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>

        <!-- 创建/编辑匹配 Modal -->
        <CModal :visible="showGroupModal" @close="closeGroupModal" size="xl">
            <CModalHeader>
                <CModalTitle>{{ editingGroup?.groupID ? '编辑匹配' : '创建匹配' }}</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CRow>
                    <CCol :xs="6">
                        <CCard class="mb-4">
                            <CCardHeader>
                                <strong>基础信息</strong>
                            </CCardHeader>
                            <CCardBody>
                                <CForm>
                                    <div class="mb-3">
                                        <CFormLabel>游戏ID</CFormLabel>
                                        <GameIDSelect
                                            v-model="groupForm.gameID"
                                            placeholder="请选择游戏"
                                            :placeholder-value="0"
                                            :disabled="!!editingGroup?.groupID"
                                            @update:model-value="onGameIDChange"
                                        />
                                    </div>
                                    <div class="mb-3">
                                        <CFormLabel>排序</CFormLabel>
                                        <CFormInput
                                            type="number"
                                            v-model.number="groupForm.pri"
                                            placeholder="请输入排序值"
                                        />
                                    </div>
                                    <div class="mb-3">
                                        <CFormLabel>道具ID</CFormLabel>
                                        <ItemSelect 
                                            v-model="groupForm.itemID" 
                                            placeholder="请选择道具"
                                            placeholder-value=""
                                        />
                                    </div>
                                    <div class="mb-3">
                                        <CFormLabel>最小道具数量</CFormLabel>
                                        <CFormInput
                                            type="number"
                                            v-model.number="groupForm.minItemCount"
                                            placeholder="最小数量"
                                        />
                                    </div>
                                    <div class="mb-3">
                                        <CFormLabel>最大道具数量</CFormLabel>
                                        <CFormInput
                                            type="number"
                                            v-model.number="groupForm.maxItemCount"
                                            placeholder="最大数量"
                                        />
                                    </div>
                                    <div class="mb-3">
                                        <CFormLabel>显示类型</CFormLabel>
                                        <CFormInput
                                            v-model="groupForm.display.type"
                                            placeholder="请输入显示类型"
                                        />
                                    </div>
                                    <div class="mb-3">
                                        <CFormLabel>图标</CFormLabel>
                                        <ImageUpload
                                            v-model="groupForm.display.iconUrl"
                                            placeholder="选择或上传图标"
                                        />
                                    </div>
                                    <div class="mb-3">
                                        <CFormLabel>显示内容</CFormLabel>
                                        <CFormTextarea
                                            v-model="groupForm.display.content"
                                            placeholder="请输入显示内容"
                                            rows="3"
                                        ></CFormTextarea>
                                    </div>
                                </CForm>
                            </CCardBody>
                        </CCard>
                    </CCol>
                    <CCol :xs="6" v-if="gameConfig">
                        <!-- 基础设置 -->
                        <CCard class="mb-4" v-if="gameConfig">
                            <CCardHeader>
                                <strong>基础设置</strong>
                            </CCardHeader>
                            <CCardBody>
                                <div class="mb-3">
                                    <CFormLabel>{{ gameConfig.lobby_setting.base_score_title }}</CFormLabel>
                                    <select class="form-select" v-model.number="gameDataForm.baseScore">
                                        <option
                                            v-for="(item, index) in gameConfig.lobby_setting.base_score"
                                            :key="index"
                                            :value="item"
                                        >
                                            {{ `${item}分` }}
                                        </option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <CFormLabel>{{ gameConfig.lobby_setting.user_count_title }}</CFormLabel>
                                    <select class="form-select" v-model.number="gameDataForm.userCount">
                                        <option
                                            v-for="(item, index) in gameConfig.lobby_setting.user_count"
                                            :key="index"
                                            :value="item"
                                        >
                                            {{ `${item}人` }}
                                        </option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <CFormLabel>支付类型</CFormLabel>
                                    <select class="form-select" v-model.number="gameDataForm.payType">
                                        <option :value="RoomDefine.PayType.Item">道具</option>
                                        <option :value="RoomDefine.PayType.Club">俱乐部货币</option>
                                    </select>
                                </div>
                                <div class="mb-3" v-if="gameDataForm.payType === RoomDefine.PayType.Item">
                                    <CFormLabel>选择道具</CFormLabel>
                                    <ItemSelect
                                        v-model="gameDataForm.payValue"
                                        placeholder="请选择道具"
                                        placeholder-value=""
                                    />
                                </div>
                                <div class="mb-3" v-if="gameDataForm.payType === RoomDefine.PayType.Club">
                                    <CFormLabel>选择货币</CFormLabel>
                                    <select class="form-select" v-model.number="gameDataForm.payValue">
                                        <option v-for="(item, index) in valueIndexList" :key="index" :value="item.value">
                                            {{ item.label }}
                                        </option>
                                    </select>
                                </div>
                            </CCardBody>
                        </CCard>

                        <!-- 玩法设置 -->
                        <CCard class="mb-4" v-if="gameConfig">
                            <CCardHeader>
                                <strong>玩法设置</strong>
                            </CCardHeader>
                            <CCardBody>
                                <div class="mb-3">
                                    <FormSlider
                                        v-model="gameDataForm.winnerRate"
                                        label="抽水"
                                        value-suffix="%"
                                        value-type="number"
                                        :min="0"
                                        :max="100"
                                        :step="0.01"
                                    />
                                </div>
                                <div
                                    class="mb-3"
                                    v-for="(option, index) in gameConfig.lobby_setting.extension"
                                    :key="index"
                                >
                                    <CFormLabel>{{ option.title }}</CFormLabel>
                                    <!-- 多选 -->
                                    <CRow v-if="option.type == 'normal'">
                                        <CCol sm="auto" v-for="(name, i) in option.names" :key="i">
                                            <CFormCheck
                                                v-model="gameDataForm.sets[option.group][i]"
                                                type="checkbox"
                                                :id="`extension_${index}_${i}`"
                                                :name="`extension_${index}`"
                                                :label="`${name}`"
                                            />
                                        </CCol>
                                    </CRow>
                                    <!-- 单选 -->
                                    <select
                                        class="form-select"
                                        v-if="option.type == 'mutex'"
                                        v-model.number="gameDataForm.sets[option.group]"
                                    >
                                        <option v-for="(name, i) in option.names" :key="i" :value="i">
                                            {{ `${name}` }}
                                        </option>
                                    </select>
                                    <!-- 整数输入 -->
                                    <CFormInput
                                        v-if="option.type == 'int'"
                                        v-model.number="gameDataForm.sets[option.group]"
                                        type="number"
                                        placeholder=""
                                    />
                                    <!-- 时间输入 -->
                                    <CTable striped v-if="option.type == 'time'">
                                        <CTableHead>
                                            <CTableRow>
                                                <CTableHeaderCell scope="col">小时</CTableHeaderCell>
                                                <CTableHeaderCell scope="col">分钟</CTableHeaderCell>
                                                <CTableHeaderCell scope="col">秒</CTableHeaderCell>
                                            </CTableRow>
                                        </CTableHead>
                                        <CTableBody>
                                            <CTableRow>
                                                <CTableDataCell>
                                                    <CFormInput v-model.number="durationRef[option.group].h" type="number" placeholder="" />
                                                </CTableDataCell>
                                                <CTableDataCell>
                                                    <CFormInput v-model.number="durationRef[option.group].m" type="number" placeholder="" />
                                                </CTableDataCell>
                                                <CTableDataCell>
                                                    <CFormInput v-model.number="durationRef[option.group].s" type="number" placeholder="" />
                                                </CTableDataCell>
                                            </CTableRow>
                                        </CTableBody>
                                    </CTable>
                                </div>
                            </CCardBody>
                        </CCard>
                    </CCol>
                </CRow>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeGroupModal">取消</CButton>
                <CButton color="primary" @click="saveGroup" :disabled="saving">
                    {{ saving ? '保存中...' : '保存' }}
                </CButton>
            </CModalFooter>
        </CModal>

        <!-- 编辑抽水配置 Modal -->
        <CModal :visible="showWaterModal" @close="closeWaterModal" size="lg">
            <CModalHeader>
                <CModalTitle>编辑匹配抽水配置 (匹配ID: {{ editingGroupID }})</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <CForm>
                                        <CRow class="mb-3">
                                            <CCol :md="6">
                                                <CFormLabel>抽水类型</CFormLabel>
                                                <select class="form-select" v-model.number="waterForm.type">
                                                    <option :value="RewardDefine.GameWaterType.None">无</option>
                                                    <option :value="RewardDefine.GameWaterType.Ju">局</option>
                                                    <option :value="RewardDefine.GameWaterType.Round">轮</option>
                                                </select>
                                            </CCol>
                                            <CCol :md="6">
                                                <CFormLabel>抽水目标</CFormLabel>
                                                <select class="form-select" v-model.number="waterForm.target">
                                                    <option :value="RewardDefine.GameWaterTarget.Everyone">所有人</option>
                                                    <option :value="RewardDefine.GameWaterTarget.Winner">赢家</option>
                                                </select>
                                            </CCol>
                                        </CRow>
                    <CRow class="mb-3">
                        <CCol :md="6">
                            <FormSlider v-model="waterForm.percent" label="抽水百分比" value-suffix="%" value-type="number" :min="0" :max="100" :step="0.01" />
                        </CCol>
                        <CCol :md="6">
                            <CFormLabel>最小抽水值</CFormLabel>
                            <CFormInput
                                v-model="waterForm.minValue"
                                placeholder="请输入最小抽水值"
                            />
                        </CCol>
                    </CRow>
                    <CRow class="mb-3">
                        <CCol :md="6">
                            <CFormLabel>最大抽水值</CFormLabel>
                            <CFormInput
                                v-model="waterForm.maxValue"
                                placeholder="请输入最大抽水值"
                            />
                        </CCol>
                    </CRow>
                </CForm>
            </CModalBody>
            <CModalFooter>
                <CButton color="secondary" @click="closeWaterModal">取消</CButton>
                <CButton color="primary" @click="saveGroupWater" :disabled="saving">
                    {{ saving ? '保存中...' : '保存' }}
                </CButton>
            </CModalFooter>
        </CModal>
    </CRow>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import {
    mgrGetgroups,
    mgrCreategroup,
    mgrUpdategroup,
    mgrUpdategroupWater,
    mgrDelgroup,
} from '@/web/AdminReq'
import type { GroupDefine } from 'pp-base-define/GroupDefine'
import {RewardDefine as RewardDefineNS } from 'pp-base-define/RewardDefine'
import { RoomDefine } from 'pp-base-define/RoomDefine'
import { ClubDefine } from 'pp-base-define/ClubDefine'
import { GameSet } from 'pp-base-define/GameSet'
import { GameID } from 'pp-base-define/GameIDDefine'
import { GameConfig_Texas } from '@/games/GameConfig_Texas'
import { Toast } from '@/composables/useToast'
import { showConfirm } from '@/utils/message'
import ItemSelect from '@/components/ItemSelect.vue'
import GameIDSelect from '@/components/GameIDSelect.vue'
import FormSlider from '@/components/FormSlider.vue'
import ImageUpload from '@/components/ImageUpload.vue'

// Reactive data
const loading = ref(false)
const saving = ref(false)
const groups = ref<GroupDefine.tData[]>([])
const waters = ref<RewardDefineNS.tGroupWater[]>([])
const showGroupModal = ref(false)
const showWaterModal = ref(false)
const editingGroup = ref<GroupDefine.tData | null>(null)
const editingGroupID = ref<number>(0)

// Group form data
const groupForm = ref<GroupDefine.tData>({
    groupID: 0,
    gameID: 0,
    pri: 0,
    gameData: {
        gameID: 0,
        bSets: [],
        iSets: [],
    },
    display: {
        type: '',
        iconUrl: '',
        content: '',
    },
    itemID: '',
    minItemCount: 0,
    maxItemCount: 0,
    timestamp: 0,
    date: '',
})

// Water form data
const waterForm = ref<RewardDefineNS.tGroupWater>({
    groupID: 0,
    type: RewardDefineNS.GameWaterType.None,
    target: RewardDefineNS.GameWaterTarget.Everyone,
    percent: 0,
    minValue: '0',
    maxValue: '0',
})

// Game config
const gameConfig = ref<any>(null)

// Game data form
const gameDataForm = ref<{
    gameID: number
    userCount: number
    baseScore: number
    sets: any[]
    payType: RoomDefine.PayType
    payValue: string | number
    winnerRate: number
}>({
    gameID: 0,
    userCount: 8,
    baseScore: 1,
    sets: [],
    payType: RoomDefine.PayType.Item,
    payValue: '',
    winnerRate: 0,
})

// Duration ref for time inputs
const durationRef = ref<Record<number, { h: number; m: number; s: number }>>({})

// Value index list for club payment
const valueIndexList = computed(() => {
    const list: { label: string; value: number }[] = []
    for (const key in ClubDefine.ValueIndex) {
        if (isNaN(Number(key))) {
            list.push({
                label: key,
                value: ClubDefine.ValueIndex[key as keyof typeof ClubDefine.ValueIndex],
            })
        }
    }
    return list
})

// Convert time to seconds
const convertTimeToSeconds = (obj: { h: number; m: number; s: number }): number => {
    return obj.h * 3600 + obj.m * 60 + obj.s
}

// Set duration from seconds
const setDurationFromSeconds = (seconds: number, group: number) => {
    const hours = Math.floor(seconds / 3600)
    const remainingSecondsAfterHours = seconds % 3600
    const minutes = Math.floor(remainingSecondsAfterHours / 60)
    const secs = remainingSecondsAfterHours % 60
    durationRef.value[group] = {
        h: hours,
        m: minutes,
        s: secs,
    }
}

// Watch duration changes for time inputs
watch(durationRef, () => {
    if (!gameConfig.value) return
    gameConfig.value.lobby_setting.extension.forEach((option: any) => {
        if (option.type === 'time' && durationRef.value[option.group]) {
            gameDataForm.value.sets[option.group] = convertTimeToSeconds(durationRef.value[option.group])
        }
    })
}, { deep: true })

// On game ID change
const onGameIDChange = async () => {
    await nextTick()
    const gameID = groupForm.value.gameID
    
    // Load game config
    if (gameID === GameID.Texas) {
        gameConfig.value = GameConfig_Texas
    } else {
        gameConfig.value = null
        return
    }

    if (!gameConfig.value) return

    const setting = gameConfig.value.lobby_setting

    // Set default values
    gameDataForm.value.userCount = setting.user_count_default
    gameDataForm.value.baseScore = setting.base_score[0]
    gameDataForm.value.payType = RoomDefine.PayType.Item
    gameDataForm.value.payValue = ''
    gameDataForm.value.winnerRate = 0

    // Initialize sets
    gameDataForm.value.sets = []
    setting.extension.forEach((option: any) => {
        if (option.type === 'normal') {
            // Multi-select: array of booleans
            gameDataForm.value.sets[option.group] = []
            option.names.forEach((_: string, index: number) => {
                const hasDefault = option.defaults.includes(index + 1)
                gameDataForm.value.sets[option.group][index] = hasDefault
            })
        } else if (option.type === 'mutex') {
            // Single select: number
            gameDataForm.value.sets[option.group] = option.defaults.length ? option.defaults[0] - 1 : 0
        } else if (option.type === 'int') {
            // Integer input: number
            gameDataForm.value.sets[option.group] = option.defaults[0] || 0
        } else if (option.type === 'time') {
            // Time input: seconds
            const defaultSeconds = option.defaults[0] || 30
            gameDataForm.value.sets[option.group] = defaultSeconds
            setDurationFromSeconds(defaultSeconds, option.group)
        }
    })

    // If editing, load from existing gameData
    if (editingGroup.value) {
        loadGameDataFromGroup(editingGroup.value)
    }
}

// Load game data from group
const loadGameDataFromGroup = (group: GroupDefine.tData) => {
    if (!group.gameData || !gameConfig.value) return

    const gameSet = GameSet.createWithData(group.gameData)
    
    // Load basic settings
    gameDataForm.value.userCount = gameSet.getUserCount()
    gameDataForm.value.baseScore = gameSet.getScore()
    gameDataForm.value.winnerRate = gameSet.getWinnerRate()

    // Load pay type
    const payType = RoomDefine.getPayType(gameSet.getPayType())
    const payIndex = RoomDefine.getPayIndex(gameSet.getPayType())
    gameDataForm.value.payType = payType
    gameDataForm.value.payValue = payType === RoomDefine.PayType.Item ? String(payIndex) : payIndex

    // Load extension settings
    const setting = gameConfig.value.lobby_setting
    setting.extension.forEach((option: any) => {
        if (option.type === 'normal') {
            // Multi-select: check each rule
            gameDataForm.value.sets[option.group] = []
            option.names.forEach((_: string, index: number) => {
                const hasRule = gameSet.checkRule(option.group, 1 << index)
                gameDataForm.value.sets[option.group][index] = hasRule
            })
        } else if (option.type === 'mutex') {
            // Single select: find which option is selected
            const iSetValue = group.gameData.iSets[option.group] || 0
            // For mutex, the value is stored as 1 << selectedIndex
            let selectedIndex = 0
            for (let i = 0; i < option.names.length; i++) {
                if ((iSetValue & (1 << i)) !== 0) {
                    selectedIndex = i
                    break
                }
            }
            gameDataForm.value.sets[option.group] = selectedIndex
        } else if (option.type === 'int') {
            // Integer input: direct value
            gameDataForm.value.sets[option.group] = group.gameData.iSets[option.group] || 0
        } else if (option.type === 'time') {
            // Time input: seconds
            const seconds = group.gameData.iSets[option.group] || 30
            gameDataForm.value.sets[option.group] = seconds
            setDurationFromSeconds(seconds, option.group)
        }
    })
}

// Expose RewardDefine and RoomDefine for template
const RewardDefine = RewardDefineNS

// Load groups
const loadGroups = async () => {
    loading.value = true
    try {
        const response = await mgrGetgroups({})

        if (response.errCode) {
            Toast.error(response.errMsg || '加载匹配列表失败')
            return
        }

        groups.value = response.groups || []
        waters.value = response.waters || []
    } catch (error) {
        console.error('Load groups error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// Add group
const addGroup = () => {
    editingGroup.value = null
    gameConfig.value = null
    gameDataForm.value = {
        gameID: 0,
        userCount: 8,
        baseScore: 1,
        sets: [],
        payType: RoomDefine.PayType.Item,
        payValue: '',
        winnerRate: 0,
    }
    durationRef.value = {}
    groupForm.value = {
        groupID: 0,
        gameID: 0,
        pri: 0,
        gameData: {
            gameID: 0,
            bSets: [],
            iSets: [],
        },
        display: {
            type: '',
            iconUrl: '',
            content: '',
        },
        itemID: '',
        minItemCount: 0,
        maxItemCount: 0,
        timestamp: 0,
        date: '',
    }
    showGroupModal.value = true
}

// Edit group
const editGroup = async (group: GroupDefine.tData) => {
    editingGroup.value = group
    groupForm.value = {
        ...group,
        gameData: {
            ...group.gameData,
        },
        display: {
            ...group.display,
        },
    }
    showGroupModal.value = true
    // Load game config and data
    await nextTick()
    // Set gameID first to trigger config loading
    if (group.gameID) {
        await onGameIDChange()
    }
}

// Close group modal
const closeGroupModal = () => {
    showGroupModal.value = false
    editingGroup.value = null
    gameConfig.value = null
    gameDataForm.value = {
        gameID: 0,
        userCount: 8,
        baseScore: 1,
        sets: [],
        payType: RoomDefine.PayType.Item,
        payValue: '',
        winnerRate: 0,
    }
    durationRef.value = {}
}

// Save group
const saveGroup = async () => {
    // Validate required fields
    if (!groupForm.value.gameID) {
        Toast.warning('请选择游戏')
        return
    }
    if (!groupForm.value.itemID) {
        Toast.warning('请选择道具ID')
        return
    }
    if (!groupForm.value.pri) {
        Toast.warning('请输入排序')
        return
    }
    if (!groupForm.value.display.type) {
        Toast.warning('请输入显示类型')
        return
    }
    if (!groupForm.value.display.iconUrl) {
        Toast.warning('请输入图标URL')
        return
    }
    if (!groupForm.value.display.content) {
        Toast.warning('请输入显示内容')
        return
    }

    // Generate gameData using GameSet
    if (!gameConfig.value) {
        Toast.warning('游戏配置未加载')
        return
    }

    const gameSet = new GameSet(groupForm.value.gameID)
    
    // Set basic settings
    gameSet.setUserCount(gameDataForm.value.userCount)
    gameSet.setScore(gameDataForm.value.baseScore)
    gameSet.setWinnerRate(gameDataForm.value.winnerRate)
    gameSet.setPayType(RoomDefine.makePayType(gameDataForm.value.payType, gameDataForm.value.payValue))

    // Set extension settings
    const setting = gameConfig.value.lobby_setting
    setting.extension.forEach((option: any) => {
        const value = gameDataForm.value.sets[option.group]
        
        if (option.type === 'normal') {
            // Multi-select: add rules for checked options
            if (Array.isArray(value)) {
                value.forEach((checked: boolean, index: number) => {
                    if (checked) {
                        gameSet.addRule(option.group, 1 << index)
                    }
                })
            }
        } else if (option.type === 'mutex') {
            // Single select: set rule as 1 << selectedIndex
            if (typeof value === 'number') {
                if (option.group < 2) {
                    gameSet.addRule(option.group, 1 << value)
                } else {
                    gameSet.addRule(option.group, value)
                }
            }
        } else if (option.type === 'int') {
            // Integer input: direct value
            if (typeof value === 'number') {
                gameSet.addRule(option.group, value)
            }
        } else if (option.type === 'time') {
            // Time input: seconds
            if (typeof value === 'number') {
                gameSet.addRule(option.group, value)
            }
        }
    })

    // Set gameData
    groupForm.value.gameData = gameSet.gameData

    saving.value = true
    try {
        if (editingGroup.value) {
            // Update
            const response = await mgrUpdategroup({
                groupData: groupForm.value
            })

            if (response.errCode) {
                Toast.error(response.errMsg || '保存失败')
                return
            }

            Toast.success('更新成功')
            closeGroupModal()
            await loadGroups()
        } else {
            // Create - water config can be set separately after creation
            const response = await mgrCreategroup({
                groupData: groupForm.value,
                // water is optional, can be set later using mgrUpdategroupWater
            })

            if (response.errCode) {
                Toast.error(response.errMsg || '保存失败')
                return
            }

            // If water was created, update local waters array
            if (response.water) {
                const index = waters.value.findIndex(w => w.groupID === response.water.groupID)
                if (index >= 0) {
                    waters.value[index] = response.water
                } else {
                    waters.value.push(response.water)
                }
            }

            Toast.success('创建成功')
            closeGroupModal()
            await loadGroups()
        }
    } catch (error) {
        console.error('Save group error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Edit group water
const editGroupWater = (group: GroupDefine.tData) => {
    editingGroupID.value = group.groupID
    const existingWater = waters.value.find(w => w.groupID === group.groupID)
    if (existingWater) {
        waterForm.value = {
            ...existingWater,
        }
    } else {
        waterForm.value = {
            groupID: group.groupID,
            type: RewardDefineNS.GameWaterType.None,
            target: RewardDefineNS.GameWaterTarget.Everyone,
            percent: 0,
            minValue: '0',
            maxValue: '0',
        }
    }
    showWaterModal.value = true
}

// Close water modal
const closeWaterModal = () => {
    showWaterModal.value = false
    editingGroupID.value = 0
}

// Save group water
const saveGroupWater = async () => {
    saving.value = true
    try {
        const response = await mgrUpdategroupWater({
            water: waterForm.value
        })

        if (response.errCode) {
            Toast.error(response.errMsg || '保存抽水配置失败')
            return
        }

        Toast.success('抽水配置保存成功')
        closeWaterModal()
        await loadGroups()
    } catch (error) {
        console.error('Save group water error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Delete group
const deleteGroup = async (groupID: number) => {
    const confirmed = await showConfirm(`确定要删除匹配 ${groupID} 吗？此操作不可恢复。`, { type: 'danger' })
    if (!confirmed) {
        return
    }

    try {
        const response = await mgrDelgroup({
            groupID: groupID
        })

        if (response.errCode) {
            Toast.error(response.errMsg || '删除失败')
            return
        }

        Toast.success('删除成功')
        await loadGroups()
    } catch (error) {
        console.error('Delete group error:', error)
        Toast.error('网络错误，请稍后重试')
    }
}

// Load groups when component is mounted
onMounted(() => {
    loadGroups()
})
</script>

