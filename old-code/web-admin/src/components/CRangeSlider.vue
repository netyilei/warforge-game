<template>
  <div class="crange-slider-wrapper">
    <div v-if="label || valueSuffix" class="d-flex justify-content-between align-items-center mb-1">
      <span v-if="label" class="text-secondary">{{ label }}</span>
      <strong class="text-body">{{ formattedValue }}{{ valueSuffix }}</strong>
    </div>
    <CFormRange
      :min="min"
      :max="max"
      :step="step"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="handleUpdate"
      :style="style"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CFormRange } from '@coreui/vue'

interface Props {
  modelValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  style?: string | Record<string, string>
  /** 字段名，显示在滑块上方左侧 */
  label?: string
  /** 数值后缀，如 "%" */
  valueSuffix?: string
  /** 小数位数，不传则根据 step 自动推断 */
  decimalPlaces?: number
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  valueSuffix: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const decimalPlaces = computed(() => {
  if (props.decimalPlaces !== undefined) return props.decimalPlaces
  const s = props.step
  if (s <= 0.001) return 3
  if (s <= 0.01) return 2
  if (s <= 0.1) return 1
  return 0
})

const formattedValue = computed(() => {
  const v = props.modelValue ?? 0
  return Number(v).toFixed(decimalPlaces.value)
})

const handleUpdate = (value: number) => {
  emit('update:modelValue', value)
}
</script>
