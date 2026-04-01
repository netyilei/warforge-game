<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>抽水配置</strong>
                        <CButton color="primary" size="sm" @click="loadAllConfigs">
                            <CIcon icon="cil-reload" class="me-1" />
                            重新加载
                        </CButton>
                    </div>
                </CCardHeader>
                <CCardBody>
                    <div v-if="loading" class="text-center py-4">
                        <CSpinner />
                        <div class="mt-2">加载中...</div>
                    </div>
                    <CTabs v-else v-model="activeTab">
                        <!-- 好友抽水配置 -->
                        <CNav variant="tabs">
                            <CNavItem>
                                <CNavLink :active="activeTab === 0" @click="activeTab = 0">
                                    好友抽水配置
                                </CNavLink>
                            </CNavItem>
                            <CNavItem>
                                <CNavLink :active="activeTab === 1" @click="activeTab = 1">
                                    默认匹配抽水配置
                                </CNavLink>
                            </CNavItem>
                            <CNavItem>
                                <CNavLink :active="activeTab === 2" @click="activeTab = 2">
                                    默认比赛抽水配置
                                </CNavLink>
                            </CNavItem>
                        </CNav>
                        <CTabContent>
                            <CTabPane :visible="activeTab === 0">
                                <div class="mt-3">
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <h5 class="mb-0">好友抽水配置</h5>
                                        <CButton color="success" size="sm" @click="addFriendWaterItem">
                                            <CIcon icon="cil-plus" class="me-1" />
                                            添加配置项
                                        </CButton>
                                    </div>

                                    <div v-if="!friendWater.items || friendWater.items.length === 0"
                                        class="text-center text-muted py-3 border rounded">
                                        暂无配置项，请点击"添加配置项"按钮添加
                                    </div>

                                    <div v-for="(item, index) in friendWater.items" :key="index"
                                        class="border rounded p-3 mb-3">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <strong>配置项 #{{ index + 1 }}</strong>
                                            <CButton color="danger" size="sm" @click="removeFriendWaterItem(index)">
                                                <CIcon icon="cil-trash" class="me-1" />
                                                删除
                                            </CButton>
                                        </div>

                                        <CRow class="mb-3">
                                            <CCol :md="6">
                                                <CFormLabel>道具ID</CFormLabel>
                                                <ItemSelect 
                                                    v-model="item.itemID" 
                                                    placeholder="请选择道具"
                                                    placeholder-value=""
                                                />
                                            </CCol>
                                            <CCol :md="6">
                                                <CFormLabel>抽水类型</CFormLabel>
                                                <select class="form-select" v-model.number="item.type">
                                                    <option :value="RewardDefine.GameWaterType.None">无</option>
                                                    <option :value="RewardDefine.GameWaterType.Ju">局</option>
                                                    <option :value="RewardDefine.GameWaterType.Round">轮</option>
                                                </select>
                                            </CCol>
                                        </CRow>
                                        <CRow class="mb-3">
                                            <CCol :md="6">
                                                <CFormLabel>抽水目标</CFormLabel>
                                                <select class="form-select" v-model.number="item.target">
                                                    <option :value="RewardDefine.GameWaterTarget.Everyone">所有人</option>
                                                    <option :value="RewardDefine.GameWaterTarget.Winner">赢家</option>
                                                </select>
                                            </CCol>
                                            <CCol :md="6">
                                                <FormSlider v-model="item.percent" label="抽水百分比" value-suffix="%" value-type="number" :min="0" :max="100" :step="0.01" />
                                            </CCol>
                                        </CRow>
                                        <CRow class="mb-3">
                                            <CCol :md="6">
                                                <CFormLabel>最小抽水值</CFormLabel>
                                                <CFormInput v-model="item.minValue" placeholder="请输入最小抽水值" />
                                            </CCol>
                                            <CCol :md="6">
                                                <CFormLabel>最大抽水值</CFormLabel>
                                                <CFormInput v-model="item.maxValue" placeholder="请输入最大抽水值" />
                                            </CCol>
                                        </CRow>
                                    </div>

                                    <div class="mt-4">
                                        <CButtonGroup role="group">
                                            <CButton color="warning" @click="resetFriendWater">
                                                重置
                                            </CButton>
                                            <CButton color="success" @click="saveFriendWater" :disabled="saving">
                                                {{ saving ? '保存中...' : '保存配置' }}
                                            </CButton>
                                        </CButtonGroup>
                                    </div>
                                </div>
                            </CTabPane>

                            <!-- 默认匹配抽水配置 -->
                            <CTabPane :visible="activeTab === 1">
                                <div class="mt-3">
                                    <h5 class="mb-3">默认匹配抽水配置</h5>

                                    <CForm>
                                        <CRow class="mb-3">
                                            <CCol :md="6">
                                                <CFormLabel>抽水类型</CFormLabel>
                                                <select class="form-select" v-model.number="groupWater.type">
                                                    <option :value="RewardDefine.GameWaterType.None">无</option>
                                                    <option :value="RewardDefine.GameWaterType.Ju">局</option>
                                                    <option :value="RewardDefine.GameWaterType.Round">轮</option>
                                                </select>
                                            </CCol>
                                            <CCol :md="6">
                                                <CFormLabel>抽水目标</CFormLabel>
                                                <select class="form-select" v-model.number="groupWater.target">
                                                    <option :value="RewardDefine.GameWaterTarget.Everyone">所有人</option>
                                                    <option :value="RewardDefine.GameWaterTarget.Winner">赢家</option>
                                                </select>
                                            </CCol>
                                        </CRow>
                                        <CRow class="mb-3">
                                            <CCol :md="6">
                                                <FormSlider v-model="groupWater.percent" label="抽水百分比" value-suffix="%" value-type="number" :min="0" :max="100" :step="0.01" />
                                            </CCol>
                                            <CCol :md="6">
                                                <CFormLabel>最小抽水值</CFormLabel>
                                                <CFormInput v-model="groupWater.minValue" placeholder="请输入最小抽水值" />
                                            </CCol>
                                        </CRow>
                                        <CRow class="mb-3">
                                            <CCol :md="6">
                                                <CFormLabel>最大抽水值</CFormLabel>
                                                <CFormInput v-model="groupWater.maxValue" placeholder="请输入最大抽水值" />
                                            </CCol>
                                        </CRow>
                                    </CForm>

                                    <div class="mt-4">
                                        <CButtonGroup role="group">
                                            <CButton color="warning" @click="resetGroupWater">
                                                重置
                                            </CButton>
                                            <CButton color="success" @click="saveGroupWater" :disabled="saving">
                                                {{ saving ? '保存中...' : '保存配置' }}
                                            </CButton>
                                        </CButtonGroup>
                                    </div>
                                </div>
                            </CTabPane>

                            <!-- 默认比赛抽水配置 -->
                            <CTabPane :visible="activeTab === 2">
                                <div class="mt-3">
                                    <h5 class="mb-3">默认比赛抽水配置</h5>

                                    <CForm>
                                        <CRow class="mb-3">
                                            <CCol :md="6">
                                                <CFormLabel>抽水类型</CFormLabel>
                                                <select class="form-select" v-model.number="matchWater.type">
                                                    <option :value="RewardDefine.GameWaterType.None">无</option>
                                                    <option :value="RewardDefine.GameWaterType.Ju">局</option>
                                                    <option :value="RewardDefine.GameWaterType.Round">轮</option>
                                                </select>
                                            </CCol>
                                            <CCol :md="6">
                                                <CFormLabel>抽水目标</CFormLabel>
                                                <select class="form-select" v-model.number="matchWater.target">
                                                    <option :value="RewardDefine.GameWaterTarget.Everyone">所有人</option>
                                                    <option :value="RewardDefine.GameWaterTarget.Winner">赢家</option>
                                                </select>
                                            </CCol>
                                        </CRow>
                                        <CRow class="mb-3">
                                            <CCol :md="6">
                                                <FormSlider v-model="matchWater.percent" label="抽水百分比" value-suffix="%" value-type="number" :min="0" :max="100" :step="0.01" />
                                            </CCol>
                                            <CCol :md="6">
                                                <CFormLabel>最小抽水值</CFormLabel>
                                                <CFormInput v-model="matchWater.minValue" placeholder="请输入最小抽水值" />
                                            </CCol>
                                        </CRow>
                                        <CRow class="mb-3">
                                            <CCol :md="6">
                                                <CFormLabel>最大抽水值</CFormLabel>
                                                <CFormInput v-model="matchWater.maxValue" placeholder="请输入最大抽水值" />
                                            </CCol>
                                        </CRow>
                                    </CForm>

                                    <div class="mt-4">
                                        <CButtonGroup role="group">
                                            <CButton color="warning" @click="resetMatchWater">
                                                重置
                                            </CButton>
                                            <CButton color="success" @click="saveMatchWater" :disabled="saving">
                                                {{ saving ? '保存中...' : '保存配置' }}
                                            </CButton>
                                        </CButtonGroup>
                                    </div>
                                </div>
                            </CTabPane>
                        </CTabContent>
                    </CTabs>
                </CCardBody>
            </CCard>
        </CCol>
    </CRow>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
    configGetfriendwater,
    configSetfriendwater,
    configGetdefaultgroupwater,
    configSetdefaultgroupwater,
    configGetdefaultmatchwater,
    configSetdefaultmatchwater,
} from '@/web/AdminReq'
import { RewardDefine } from 'pp-base-define/RewardDefine'
import { showError, showSuccess, showWarning } from '@/utils/message'
import { Toast } from '@/composables/useToast'
import ItemSelect from '@/components/ItemSelect.vue'
import FormSlider from '@/components/FormSlider.vue'

// Reactive data
const loading = ref(false)
const saving = ref(false)
const activeTab = ref(0)

// Friend water configuration
const friendWater = ref<RewardDefine.tFriendWater>({
    items: []
})

// Group water configuration
const groupWater = ref<RewardDefine.tGroupWater>({
    groupID: 0, // Default group ID
    type: RewardDefine.GameWaterType.None,
    target: RewardDefine.GameWaterTarget.Everyone,
    percent: 0,
    minValue: '0',
    maxValue: '0',
})

// Match water configuration
const matchWater = ref<RewardDefine.tMatchWater>({
    type: RewardDefine.GameWaterType.None,
    target: RewardDefine.GameWaterTarget.Everyone,
    percent: 0,
    minValue: '0',
    maxValue: '0',
})

// Load all configurations
const loadAllConfigs = async () => {
    loading.value = true
    try {
        await Promise.all([
            loadFriendWater(),
            loadGroupWater(),
            loadMatchWater(),
        ])
        Toast.success('配置加载成功')
    } catch (error) {
        console.error('Load configs error:', error)
        showError('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// Load friend water configuration
const loadFriendWater = async () => {
    try {
        const response = await configGetfriendwater({})

        if (response.errCode) {
            showError(response.errMsg || '加载好友抽水配置失败')
            return
        }

        if (response.water) {
            friendWater.value = response.water
            if (!friendWater.value.items) {
                friendWater.value.items = []
            }
        } else {
            friendWater.value = { items: [] }
        }
    } catch (error) {
        console.error('Load friend water error:', error)
        showError('网络错误')
    }
}

// Load group water configuration
const loadGroupWater = async () => {
    try {
        const response = await configGetdefaultgroupwater({})

        if (response.errCode) {
            showError(response.errMsg || '加载默认匹配抽水配置失败')
            return
        }

        if (response.water) {
            groupWater.value = response.water
        } else {
            groupWater.value = {
                groupID: 0,
                type: RewardDefine.GameWaterType.None,
                target: RewardDefine.GameWaterTarget.Everyone,
                percent: 0,
                minValue: '0',
                maxValue: '0',
            }
        }
    } catch (error) {
        console.error('Load group water error:', error)
        showError('网络错误')
    }
}

// Load match water configuration
const loadMatchWater = async () => {
    try {
        const response = await configGetdefaultmatchwater({})

        if (response.errCode) {
            showError(response.errMsg || '加载默认比赛抽水配置失败')
            return
        }

        if (response.water) {
            matchWater.value = response.water
        } else {
            matchWater.value = {
                type: RewardDefine.GameWaterType.None,
                target: RewardDefine.GameWaterTarget.Everyone,
                percent: 0,
                minValue: '0',
                maxValue: '0',
            }
        }
    } catch (error) {
        console.error('Load match water error:', error)
        showError('网络错误')
    }
}

// Save friend water configuration
const saveFriendWater = async () => {
    saving.value = true
    try {
        const response = await configSetfriendwater({
            water: friendWater.value
        })

        if (response.errCode) {
            showError(response.errMsg || '保存好友抽水配置失败')
            return
        }
        showSuccess('好友抽水配置保存成功')
    } catch (error) {
        console.error('Save friend water error:', error)
        showError('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Save group water configuration
const saveGroupWater = async () => {
    saving.value = true
    try {
        const response = await configSetdefaultgroupwater({
            water: groupWater.value
        })

        if (response.errCode) {
            showError(response.errMsg || '保存默认匹配抽水配置失败')
            return
        }
        showSuccess('默认匹配抽水配置保存成功')
    } catch (error) {
        console.error('Save group water error:', error)
        showError('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Save match water configuration
const saveMatchWater = async () => {
    saving.value = true
    try {
        const response = await configSetdefaultmatchwater({
            water: matchWater.value
        })

        if (response.errCode) {
            showError(response.errMsg || '保存默认比赛抽水配置失败')
            return
        }
        showSuccess('默认比赛抽水配置保存成功')
    } catch (error) {
        console.error('Save match water error:', error)
        showError('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Reset friend water configuration
const resetFriendWater = () => {
    friendWater.value = { items: [] }
    showWarning('配置已重置，请保存以应用更改')
}

// Reset group water configuration
const resetGroupWater = () => {
    groupWater.value = {
        groupID: 0,
        type: RewardDefine.GameWaterType.None,
        target: RewardDefine.GameWaterTarget.Everyone,
        percent: 0,
        minValue: '0',
        maxValue: '0',
    }
    showWarning('配置已重置，请保存以应用更改')
}

// Reset match water configuration
const resetMatchWater = () => {
    matchWater.value = {
        type: RewardDefine.GameWaterType.None,
        target: RewardDefine.GameWaterTarget.Everyone,
        percent: 0,
        minValue: '0',
        maxValue: '0',
    }
    showWarning('配置已重置，请保存以应用更改')
}

// Add friend water item
const addFriendWaterItem = () => {
    if (!friendWater.value.items) {
        friendWater.value.items = []
    }

    friendWater.value.items.push({
        itemID: '',
        type: RewardDefine.GameWaterType.None,
        target: RewardDefine.GameWaterTarget.Everyone,
        percent: 0,
        minValue: '0',
        maxValue: '0',
    })
}

// Remove friend water item
const removeFriendWaterItem = (index: number) => {
    if (friendWater.value.items && friendWater.value.items.length > index) {
        friendWater.value.items.splice(index, 1)
    }
}

// Load configurations when component is mounted
onMounted(() => {
    loadAllConfigs()
})
</script>
