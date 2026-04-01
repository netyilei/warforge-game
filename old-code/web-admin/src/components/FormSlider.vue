<template>
  <div class="form-slider">
    <div class="d-flex justify-content-between align-items-center mb-1">
      <span class="text-secondary">{{ label }}</span>
      <div class="d-flex align-items-center gap-2">
        <input
          v-if="valueType === 'number'"
          type="number"
          class="form-control form-control-sm text-end"
          :style="{ width: inputWidth }"
          :min="min"
          :max="max"
          :step="step"
          :value="currentValue"
          @input="onInputChange"
        />
        <input
          v-else
          type="text"
          class="form-control form-control-sm text-end"
          :style="{ width: inputWidth }"
          :value="displayValue"
          @input="onInputChange"
        />
        <span v-if="valueSuffix" class="text-body">{{ valueSuffix }}</span>
      </div>
    </div>
    <CFormRange
      :min="min"
      :max="max"
      :step="step"
      :model-value="currentValue"
      :disabled="disabled"
      @update:model-value="onSliderInputValue"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CFormRange } from '@coreui/vue'

interface Props {
  /** 当前值（支持 number 或 string，会转为 number 参与计算） */
  modelValue?: number | string
  /** 参数名称，显示在左侧 */
  label: string
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
  /** 步长 */
  step?: number
  /** 数值类型：number 用数字输入框，string 用文本输入框（内部仍按数字处理） */
  valueType?: 'number' | 'string'
  /** 数值后缀，如 "%" */
  valueSuffix?: string
  /** 小数位数（不传则根据 step 自动推断） */
  decimalPlaces?: number
  /** 数值输入框宽度，如 "4rem" */
  inputWidth?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  valueType: 'number',
  valueSuffix: '',
  inputWidth: '4.5rem',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const toNumber = (v: number | string | undefined): number => {
  if (v === undefined || v === null || v === '') return props.min
  const n = typeof v === 'string' ? parseFloat(v) : v
  return isNaN(n) ? props.min : n
}

const clamp = (n: number): number => {
  const lo = props.min
  const max = props.max
  if (n <= lo) return lo
  if (n >= max) return max
  return n
}

const decimalPlaces = computed(() => {
  if (props.decimalPlaces !== undefined) return props.decimalPlaces
  const s = props.step
  if (s <= 0.001) return 3
  if (s <= 0.01) return 2
  if (s <= 0.1) return 1
  return 0
})

const currentValue = computed(() => {
  const n = toNumber(props.modelValue)
  return clamp(n)
})

const displayValue = computed(() => {
  return Number(currentValue.value).toFixed(decimalPlaces.value)
})

function onSliderInputValue(v: number | string) {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (!isNaN(n)) emit('update:modelValue', n)
}

function onInputChange(e: Event) {
  const target = e.target as HTMLInputElement
  const v = parseFloat(target.value)
  if (isNaN(v)) return
  const clamped = clamp(v)
  emit('update:modelValue', clamped)
}
</script>

<style scoped>
.form-slider :deep(.form-range) {
  padding: 0;
}
</style>
