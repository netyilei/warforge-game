<template>
  <div>
    <CRow class="mb-3">
      <CCol :md="6">
        <CFormSwitch
          v-model="localConfig.enabled"
          label="启用"
        />
      </CCol>
      <CCol :md="6">
        <CFormSwitch
          v-model="localConfig.allowNoStrategyRobot"
          label="允许未设置策略的机器人进入"
        />
      </CCol>
    </CRow>

    <CRow class="mb-3">
      <CCol :md="6">
        <CFormSwitch
          v-model="localConfig.autoCharge"
          label="自动充值"
        />
      </CCol>
      <CCol v-if="showClubId" :md="6">
        <CFormLabel>俱乐部ID</CFormLabel>
        <CFormInput
          type="number"
          v-model.number="(localConfig as any).clubID"
          placeholder="请输入俱乐部ID"
        />
      </CCol>
      <CCol v-if="showGroupId" :md="6">
        <CFormLabel>匹配ID</CFormLabel>
        <CFormInput
          type="number"
          v-model.number="(localConfig as any).groupID"
          placeholder="请输入匹配ID"
        />
      </CCol>
    </CRow>

    <!-- 买入配置 -->
    <div class="mb-3">
      <h6>买入配置</h6>
      <CRow>
        <CCol :md="4">
          <CFormLabel>最小买入倍数</CFormLabel>
          <CFormInput
            type="number"
            step="0.01"
            v-model.number="localConfig.buyin.minMultiRate"
          />
        </CCol>
        <CCol :md="4">
          <CFormLabel>最大买入倍数</CFormLabel>
          <CFormInput
            type="number"
            step="0.01"
            v-model.number="localConfig.buyin.maxMultiRate"
          />
        </CCol>
        <CCol :md="4">
          <CFormLabel>倍数小数点</CFormLabel>
          <CFormInput
            type="number"
            v-model.number="localConfig.buyin.rateAcc"
          />
        </CCol>
      </CRow>
    </div>

    <!-- 充值配置 -->
    <div class="mb-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">充值配置</h6>
        <CButton size="sm" color="primary" @click="addCharge">
          <CIcon icon="cil-plus" class="me-1" />
          添加充值项
        </CButton>
      </div>
      <div v-if="!localConfig.charges || localConfig.charges.length === 0" class="text-center text-muted py-2 border rounded">
        暂无充值配置
      </div>
      <div v-else>
        <div v-for="(charge, index) in localConfig.charges" :key="index" class="mb-2 p-2 border rounded">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <strong>充值项 {{ index + 1 }}</strong>
            <CButton size="sm" color="danger" @click="removeCharge(index)">
              <CIcon icon="cil-trash" />
            </CButton>
          </div>
          <CRow>
            <CCol :md="6">
              <CFormLabel>道具ID</CFormLabel>
              <CFormInput
                v-model="charge.itemID"
                placeholder="请输入道具ID"
              />
            </CCol>
            <CCol :md="6">
              <CFormLabel>最小充值</CFormLabel>
              <CFormInput
                v-model="charge.minChargeValue"
                placeholder="请输入最小充值"
              />
            </CCol>
            <CCol :md="6">
              <CFormLabel>最大充值</CFormLabel>
              <CFormInput
                v-model="charge.maxChargeValue"
                placeholder="请输入最大充值"
              />
            </CCol>
            <CCol :md="6">
              <CFormLabel>触发充值额度</CFormLabel>
              <CFormInput
                v-model="charge.needChargeLeastValue"
                placeholder="请输入触发充值额度"
              />
            </CCol>
          </CRow>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { RobotDefine } from 'pp-base-define/RobotDefine'

interface Props {
  modelValue: RobotDefine.tEnvConfig_ItemBase | RobotDefine.tEnvConfig_Club | RobotDefine.tEnvConfig_Group
  showClubId?: boolean
  showGroupId?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: RobotDefine.tEnvConfig_ItemBase | RobotDefine.tEnvConfig_Club | RobotDefine.tEnvConfig_Group): void
}

const props = withDefaults(defineProps<Props>(), {
  showClubId: false,
  showGroupId: false
})

const emit = defineEmits<Emits>()

const localConfig = ref({ ...props.modelValue })
let isUpdating = false

// 监听外部变化，更新本地值
watch(() => props.modelValue, (newVal) => {
  if (!isUpdating) {
    isUpdating = true
    localConfig.value = { ...newVal }
    nextTick(() => {
      isUpdating = false
    })
  }
}, { deep: true })

// 监听本地变化，通知父组件
watch(localConfig, (newVal) => {
  if (!isUpdating) {
    isUpdating = true
    emit('update:modelValue', { ...newVal })
    nextTick(() => {
      isUpdating = false
    })
  }
}, { deep: true })

const addCharge = () => {
  if (!localConfig.value.charges) {
    localConfig.value.charges = []
  }
  localConfig.value.charges.push({
    itemID: '',
    minChargeValue: '',
    maxChargeValue: '',
    needChargeLeastValue: ''
  })
}

const removeCharge = (index: number) => {
  if (localConfig.value.charges) {
    localConfig.value.charges.splice(index, 1)
  }
}
</script>

