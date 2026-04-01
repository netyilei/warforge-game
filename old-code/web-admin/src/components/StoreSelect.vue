<template>
  <select 
    class="form-select" 
    :value="modelValue === undefined ? (placeholderValue === undefined ? '' : String(placeholderValue)) : String(modelValue)" 
    @change="handleChange"
    :disabled="disabled"
    :style="style"
  >
    <option :value="placeholderValue === undefined ? '' : String(placeholderValue)">{{ placeholder || '请选择库存' }}</option>
    <option 
      v-for="store in stores" 
      :key="store.storeID" 
      :value="store.storeID"
    >
      {{ store.name }} (ID: {{ store.storeID }})
    </option>
  </select>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { robotExtGetchargestore } from '@/web/AdminReq'
import { RobotExtDefine } from 'pp-base-define/RobotExtDefine'

interface Props {
  modelValue?: number
  placeholder?: string
  disabled?: boolean
  style?: string | Record<string, string>
  placeholderValue?: number | undefined
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择库存',
  disabled: false,
  placeholderValue: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const stores = ref<RobotExtDefine.tChargeStore[]>([])

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const placeholderStr = props.placeholderValue === undefined ? '' : String(props.placeholderValue)
  if (!target.value || target.value === placeholderStr) {
    emit('update:modelValue', undefined)
    return
  }
  const value = Number(target.value)
  emit('update:modelValue', value)
}

const loadStores = async () => {
  try {
    const response = await robotExtGetchargestore({
      page: 0,
      limit: 1000
    })
    if (!response.errCode && response.datas) {
      stores.value = response.datas
    }
  } catch (error) {
    console.error('Load stores error:', error)
  }
}

onMounted(() => {
  loadStores()
})
</script>

