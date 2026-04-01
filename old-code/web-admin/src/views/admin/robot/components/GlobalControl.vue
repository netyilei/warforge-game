<template>
  <div>
    <div v-if="loading" class="text-center py-4">
      <CSpinner />
      <div class="mt-2">加载中...</div>
    </div>
    <div v-else>
      <CCard>
        <CCardHeader>
          <strong>全局控制配置</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow class="mb-3">
              <CCol :md="12">
                <CFormLabel>机器人总开关</CFormLabel>
                <div class="mt-2">
                  <CFormSwitch
                    v-model="control.enabled"
                    label="启用机器人"
                    @update:modelValue="handleSwitchChange('enabled', $event)"
                  />
                </div>
              </CCol>
            </CRow>

            <CRow class="mb-3">
              <CCol :md="12">
                <CFormLabel>机器人匹配开关</CFormLabel>
                <div class="mt-2">
                  <CFormSwitch
                    v-model="control.groupEnabled"
                    label="启用匹配机器人"
                    @update:modelValue="handleSwitchChange('groupEnabled', $event)"
                  />
                </div>
              </CCol>
            </CRow>

            <CRow class="mb-3">
              <CCol :md="12">
                <CFormLabel>机器人比赛开关</CFormLabel>
                <div class="mt-2">
                  <CFormSwitch
                    v-model="control.matchEnabled"
                    label="启用比赛机器人"
                    @update:modelValue="handleSwitchChange('matchEnabled', $event)"
                  />
                </div>
              </CCol>
            </CRow>

            <CRow class="mb-3">
              <CCol :md="12">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <CFormLabel class="mb-0">具体匹配开关</CFormLabel>
                  <CButton color="success" size="sm" @click="addGroupControl">
                    <CIcon icon="cil-plus" class="me-1" />
                    添加
                  </CButton>
                </div>
                <div v-if="control.groups.length === 0" class="text-muted small mb-2">
                  暂无配置，将使用默认开启状态
                </div>
                <div v-for="(group, index) in control.groups" :key="index" class="d-flex align-items-center mb-2 gap-2">
                  <CFormInput
                    type="number"
                    v-model.number="group.groupID"
                    placeholder="匹配ID"
                    style="width: 150px;"
                  />
                  <CFormSwitch
                    v-model="group.enabled"
                    label="启用"
                  />
                  <CButton color="danger" size="sm" @click="removeGroupControl(index)">
                    <CIcon icon="cil-trash" />
                  </CButton>
                </div>
              </CCol>
            </CRow>

            <div class="mt-4">
              <CButtonGroup role="group">
                <CButton color="primary" @click="saveControl" :disabled="saving">
                  {{ saving ? '保存中...' : '保存配置' }}
                </CButton>
              </CButtonGroup>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Toast } from '@/composables/useToast'
import {
  robotExtGetglobalcontrol,
  robotExtSetglobalcontrol
} from '@/web/AdminReq'
import { RobotExtDefine } from 'pp-base-define/RobotExtDefine'

const loading = ref(false)
const saving = ref(false)
const control = ref<RobotExtDefine.tGlobalControl>({
  enabled: false,
  groupEnabled: false,
  matchEnabled: false,
  groups: []
})

const loadControl = async () => {
  loading.value = true
  try {
    const response = await robotExtGetglobalcontrol({})
    if (response.errCode) {
      Toast.error(response.errMsg || '加载失败')
      return
    }
    if (response.control) {
      control.value = response.control
    }
  } catch (error) {
    console.error('Load control error:', error)
    Toast.error('网络错误')
  } finally {
    loading.value = false
  }
}

const saveControl = async () => {
  saving.value = true
  try {
    const response = await robotExtSetglobalcontrol({
      control: control.value
    })
    if (response.errCode) {
      Toast.error(response.errMsg || '保存失败')
      return
    }
    Toast.success('保存成功')
  } catch (error) {
    console.error('Save control error:', error)
    Toast.error('网络错误')
  } finally {
    saving.value = false
  }
}

const handleSwitchChange = async (field: string, value: boolean) => {
  // 可以在这里实现自动保存，或者只在点击保存按钮时保存
  // 这里选择手动保存
}

const addGroupControl = () => {
  control.value.groups.push({
    groupID: 0,
    enabled: true
  })
}

const removeGroupControl = (index: number) => {
  control.value.groups.splice(index, 1)
}

onMounted(() => {
  loadControl()
})
</script>

