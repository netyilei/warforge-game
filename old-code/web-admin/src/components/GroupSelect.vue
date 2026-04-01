<template>
  <select 
    class="form-select" 
    :value="modelValue" 
    @change="handleChange"
    :disabled="disabled"
    :style="style"
  >
    <option :value="placeholderValue">{{ placeholder || '请选择匹配' }}</option>
    <option 
      v-for="group in groups" 
      :key="group.groupID" 
      :value="group.groupID"
    >
      {{ group.groupID }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { mgrGetgroups } from '@/web/AdminReq'
import { GroupDefine } from 'pp-base-define/GroupDefine'

interface Props {
  modelValue?: number
  placeholder?: string
  disabled?: boolean
  style?: string | Record<string, string>
  placeholderValue?: number | undefined
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择匹配',
  disabled: false,
  placeholderValue: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const groups = ref<GroupDefine.tData[]>([])

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value ? Number(target.value) : undefined
  emit('update:modelValue', value)
}

const loadGroups = async () => {
  try {
    const response = await mgrGetgroups({})
    if (!response.errCode && response.groups) {
      groups.value = response.groups
    }
  } catch (error) {
    console.error('Load groups error:', error)
  }
}

onMounted(() => {
  loadGroups()
})
</script>

