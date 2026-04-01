<template>
    <CRow>
        <CCol :xs="12">
            <CCard class="mb-4">
                <CCardHeader>
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>充值奖励配置</strong>
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
                        <div class="mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="mb-0">充值返利配置</h5>
                                <CButton color="success" size="sm" @click="addChargeItem">
                                    <CIcon icon="cil-plus" class="me-1" />
                                    添加配置项
                                </CButton>
                            </div>

                            <div v-if="!chargeConfig.charges || chargeConfig.charges.length === 0"
                                class="text-center text-muted py-3 border rounded">
                                暂无充值返利配置，请点击"添加配置项"按钮添加
                            </div>

                            <div v-for="(item, index) in chargeConfig.charges" :key="index"
                                class="border rounded p-3 mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <strong>配置项 #{{ index + 1 }}</strong>
                                    <CButton color="danger" size="sm" @click="removeChargeItem(index)">
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
                                        <CFormLabel>最小充值金额</CFormLabel>
                                        <CFormInput v-model="item.minChargeValue" placeholder="请输入最小充值金额" />
                                    </CCol>
                                </CRow>
                                <CRow class="mb-3">
                                    <CCol :md="6">
                                        <CFormLabel>最大充值金额</CFormLabel>
                                        <CFormInput v-model="item.maxChargeValue" placeholder="请输入最大充值金额（0表示不限制）" />
                                        <CFormText class="text-muted small">
                                            输入 0 表示不限制最大充值金额
                                        </CFormText>
                                    </CCol>
                                    <CCol :md="6">
                                        <FormSlider v-model="item.chargeLeaderPercent" label="上级返利百分比" value-suffix="%" value-type="number" :min="0" :max="100" :step="0.01" />
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
import {
    configGetglobalchargereward,
    configSetglobalchargereward,
} from '@/web/AdminReq'
import { RewardDefine } from 'pp-base-define/RewardDefine'
import { Toast } from '@/composables/useToast'
import ItemSelect from '@/components/ItemSelect.vue'
import FormSlider from '@/components/FormSlider.vue'

// Reactive data
const loading = ref(false)
const saving = ref(false)

// Charge reward configuration
const chargeConfig = ref<RewardDefine.tCharge>({
    loginRegisters: [],
    charges: []
})

// Load configuration
const loadConfig = async () => {
    loading.value = true
    try {
        const response = await configGetglobalchargereward({})

        if (response.errCode) {
            Toast.error(response.errMsg || '加载充值奖励配置失败')
            return
        }

        if (response.charge) {
            chargeConfig.value = response.charge
            if (!chargeConfig.value.charges) {
                chargeConfig.value.charges = []
            }
        } else {
            chargeConfig.value = { loginRegisters: [], charges: [] }
        }
        Toast.success('配置加载成功')
    } catch (error) {
        console.error('Load config error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        loading.value = false
    }
}

// Save configuration
const saveConfig = async () => {
    saving.value = true
    try {
        const response = await configSetglobalchargereward({
            charge: chargeConfig.value
        })

        if (response.errCode) {
            Toast.error(response.errMsg || '保存充值奖励配置失败')
            return
        }
        Toast.success('充值奖励配置保存成功')
    } catch (error) {
        console.error('Save config error:', error)
        Toast.error('网络错误，请稍后重试')
    } finally {
        saving.value = false
    }
}

// Reset configuration
const resetConfig = () => {
    chargeConfig.value = { charges: [] }
    Toast.warning('配置已重置，请保存以应用更改')
}

// Add charge item
const addChargeItem = () => {
    if (!chargeConfig.value.charges) {
        chargeConfig.value.charges = []
    }

    chargeConfig.value.charges.push({
        itemID: '',
        minChargeValue: '0',
        maxChargeValue: '0',
        chargeLeaderPercent: 0,
    })
}

// Remove charge item
const removeChargeItem = (index: number) => {
    if (chargeConfig.value.charges && chargeConfig.value.charges.length > index) {
        chargeConfig.value.charges.splice(index, 1)
    }
}

// Load configuration when component is mounted
onMounted(() => {
    loadConfig()
})
</script>

