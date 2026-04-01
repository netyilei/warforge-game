<template>
  <select 
    class="form-select" 
    :value="String(modelValue || placeholderValue)" 
    @change="handleChange"
    :disabled="disabled"
    :style="style"
  >
    <option :value="String(placeholderValue)">{{ placeholder || '请选择道具' }}</option>
    <option 
      v-for="item in items" 
      :key="item.id" 
      :value="item.id"
    >
      {{ item.name }} ({{ item.id }})
    </option>
  </select>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { configItemGet } from '@/web/AdminReq'
import { ItemDefine } from 'pp-base-define/ItemDefine'

interface Props {
  modelValue?: string | number
  placeholder?: string
  disabled?: boolean
  style?: string | Record<string, string>
  placeholderValue?: string | number | undefined
  returnNumber?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择道具',
  disabled: false,
  placeholderValue: '',
  returnNumber: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | undefined]
}>()

const items = ref<ItemDefine.tConfig[]>([])

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  if (!target.value || target.value === String(props.placeholderValue)) {
    emit('update:modelValue', undefined)
    return
  }
  const value = props.returnNumber ? Number(target.value) : target.value
  emit('update:modelValue', value)
}

const loadItems = async () => {
  try {
    const response = await configItemGet({
      page: 0,
      limit: 1000
    })
    if (!response.errCode && response.datas) {
      items.value = response.datas
    }
  } catch (error) {
    console.error('Load items error:', error)
  }
}

onMounted(() => {
  loadItems()
})
</script>
