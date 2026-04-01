<template>
  <CModal :visible="visible" @close="cancel" backdrop="static">
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
      <CButton color="secondary" @click="cancel">{{ cancelText }}</CButton>
      <CButton :color="buttonColor" @click="confirm">{{ confirmText }}</CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CIcon } from '@coreui/icons-vue'

interface Props {
  visible: boolean
  title: string
  message: string
  type: 'danger' | 'warning' | 'info'
  confirmText: string
  cancelText: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'confirm': []
  'cancel': []
}>()

const icon = computed(() => {
  const iconMap = {
    danger: 'cil-warning',
    warning: 'cil-warning',
    info: 'cil-info',
  }
  return iconMap[props.type]
})

const iconClass = computed(() => {
  const classMap = {
    danger: 'text-danger',
    warning: 'text-warning',
    info: 'text-info',
  }
  return classMap[props.type]
})

const buttonColor = computed(() => {
  const colorMap = {
    danger: 'danger',
    warning: 'warning',
    info: 'primary',
  }
  return colorMap[props.type]
})

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
}
</script>
