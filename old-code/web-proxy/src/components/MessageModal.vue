<template>
  <CModal :visible="visible" @close="close" :backdrop="backdrop">
    <CModalHeader>
      <CModalTitle>
        <CIcon :icon="icon" :class="iconClass" class="me-2" />
        {{ title }}
      </CModalTitle>
    </CModalHeader>
    <CModalBody>
      <p class="mb-0">{{ message }}</p>
    </CModalBody>
    <CModalFooter>
      <CButton color="primary" @click="close">确定</CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CIcon } from '@coreui/icons-vue'

interface Props {
  visible: boolean
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  backdrop?: boolean | 'static'
}

const props = withDefaults(defineProps<Props>(), {
  title: '提示',
  type: 'info',
  backdrop: true,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'close': []
}>()

const icon = computed(() => {
  const iconMap = {
    success: 'cil-check-circle',
    error: 'cil-x-circle',
    warning: 'cil-warning',
    info: 'cil-info',
  }
  return iconMap[props.type]
})

const iconClass = computed(() => {
  const classMap = {
    success: 'text-success',
    error: 'text-danger',
    warning: 'text-warning',
    info: 'text-info',
  }
  return classMap[props.type]
})

const close = () => {
  emit('update:visible', false)
  emit('close')
}
</script>
