<template>
  <CFormRange
    :min="min"
    :max="max"
    :step="step"
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="handleUpdate"
    :style="style"
  />
</template>

<script setup lang="ts">
import { CFormRange } from '@coreui/vue'

interface Props {
  modelValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  style?: string | Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const handleUpdate = (value: number) => {
  emit('update:modelValue', value)
}
</script>

