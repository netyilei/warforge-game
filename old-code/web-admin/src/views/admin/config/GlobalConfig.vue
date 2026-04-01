<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>全局配置</strong>
                        <CButton color="primary" size="sm" @click="loadConfig">
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
                    <CForm v-else>
                        <!-- 改名道具配置 -->
                        <div class="mb-4">
                            <h5 class="mb-3">改名道具配置</h5>
                            <CRow class="mb-3">
                                <CCol :md="6">
                                    <CFormLabel>改名道具ID</CFormLabel>
                                    <CFormInput v-model="config.changeNameItemID"
                                        placeholder="请输入改名道具ID" />
                                </CCol>
                                <CCol :md="6">
                                    <CFormLabel>改名道具数量</CFormLabel>
                                    <CFormInput v-model="config.changeNameItemCount"
                                        placeholder="请输入改名道具数量" />
                                </CCol>
                            </CRow>
                        </div>

                        <!-- 假人数量配置 -->
                        <div class="mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="mb-0">各游戏假人数量配置</h5>
                                <CButton color="success" size="sm" @click="addFakeUserCount">
                                    <CIcon icon="cil-plus" class="me-1" />
                                    添加游戏配置
                                </CButton>
                            </div>

                            <div v-if="!config.fakeUserCounts || config.fakeUserCounts.length === 0"
                                class="text-center text-muted py-3 border rounded">
                                暂无假人数量配置，请点击"添加游戏配置"按钮添加
                            </div>

                            <div v-for="(fakeUser, index) in config.fakeUserCounts" :key="index"
                                class="border rounded p-3 mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <strong>{{ getGameName(fakeUser.gameID) }}</strong>
                                    <CButton color="danger" size="sm" @click="removeFakeUserCount(index)">
                                        <CIcon icon="cil-trash" class="me-1" />
                                        删除
                                    </CButton>
                                </div>

                                <CRow class="mb-3">
                                    <CCol :md="4">
                                        <CFormLabel>游戏ID</CFormLabel>
                                        <CFormInput type="number" v-model.number="fakeUser.gameID"
                                            placeholder="101-德州 102-广告1 103-广告2" min="101" />
                                    </CCol>
                                    <CCol :md="4">
                                        <CFormLabel>基础数量</CFormLabel>
                                        <CFormInput type="number" v-model.number="fakeUser.count"
                                            placeholder="基础数量" min="0" />
                                        <small class="text-muted">假人的基础数量</small>
                                    </CCol>
                                    <CCol :md="4">
                                        <CFormLabel>随机波动数量</CFormLabel>
                                        <CFormInput type="number" v-model.number="fakeUser.offset"
                                            placeholder="随机波动数量" min="0" />
                                        <small class="text-muted">最终数量 = 基础数量 + random(0, 波动数量)</small>
                                    </CCol>
                                </CRow>
                            </div>
                        </div>

                        <!-- 操作按钮 -->
                        <div class="mt-4">
                            <CButtonGroup role="group">
                                <CButton color="warning" @click="resetConfig">
                                    重置
                                </CButton>
                                <CButton color="success" @click="saveConfig" :disabled="saving">
                                    {{ saving ? '保存中...' : '保存配置' }}
                                </CButton>
                            </CButtonGroup>
                        </div>
                    </CForm>
                </CCardBody>
            </CCard>
        </CCol>
    </CRow>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { configGetglobal, configSetglobal } from '@/web/AdminReq'
import type { GlobalConfig } from 'pp-base-define/GlobalConfig'
import { showError, showSuccess, showWarning } from '@/utils/message'

// 响应式数据
const loading = ref(false)
const saving = ref(false)

// 配置数据 - 使用 GlobalConfig.tMain 类型
const config = ref<GlobalConfig.tMain>({
    changeNameItemID: '',
    changeNameItemCount: '',
    fakeUserCounts: []
})

// 获取游戏名称
const getGameName = (gameID: number): string => {
    const gameMap: Record<number, string> = {
        101: '德州扑克',
        102: '广告1',
        103: '广告2',
    }
    return gameMap[gameID] || `游戏 ${gameID}`
}

// 加载配置
const loadConfig = async () => {
    loading.value = true
    try {
        const response = await configGetglobal({})

        if (response.errCode) {
            showError(response.errMsg || '加载配置失败')
            return
        }
        
        if (!response.config) {
            response.config = {
                changeNameItemID: '',
                changeNameItemCount: '',
                fakeUserCounts: []
            }
        }
        Object.assign(config.value, response.config)
    } catch (error) {
        console.error('Load config error:', error)
        showError('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// 保存配置
const saveConfig = async () => {
    saving.value = true
    try {
        const response = await configSetglobal({
            config: config.value
        })

        if (response.errCode) {
            showError(response.errMsg || '保存配置失败')
            return
        }
        showSuccess('配置保存成功')
    } catch (error) {
        console.error('Save config error:', error)
        showError('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// 重置配置
const resetConfig = () => {
    config.value = {
        changeNameItemID: '',
        changeNameItemCount: '',
        fakeUserCounts: []
    }
    showWarning('配置已重置，请保存以应用更改')
}

// 添加假人数量配置
const addFakeUserCount = () => {
    if (!config.value.fakeUserCounts) {
        config.value.fakeUserCounts = []
    }

    config.value.fakeUserCounts.push({
        gameID: 101,
        count: 0,
        offset: 0
    })
}

// 删除假人数量配置
const removeFakeUserCount = (index: number) => {
    if (config.value.fakeUserCounts && config.value.fakeUserCounts.length > index) {
        config.value.fakeUserCounts.splice(index, 1)
    }
}

// 组件挂载时加载配置
onMounted(() => {
    loadConfig()
})
</script>
