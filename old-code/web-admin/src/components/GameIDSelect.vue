<template>
  <select 
    class="form-select" 
    :value="getSelectValue" 
    @change="handleChange"
    :disabled="disabled"
    :style="style"
  >
    <option :value="placeholderOptionValue">{{ placeholder || '请选择游戏' }}</option>
    <option 
      v-for="game in gameList" 
      :key="game.value" 
      :value="game.value"
    >
      {{ game.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GameID } from 'pp-base-define/GameIDDefine'

interface Props {
  modelValue?: number
  placeholder?: string
  disabled?: boolean
  style?: string | Record<string, string>
  placeholderValue?: number | undefined
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择游戏',
  disabled: false,
  placeholderValue: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

// 从 GameID 枚举生成游戏列表
const gameList = computed(() => {
  const list: { label: string; value: number }[] = []
  for (const key in GameID) {
    if (isNaN(Number(key))) {
      // 这是枚举的键名（如 "Texas"）
      const value = GameID[key as keyof typeof GameID]
      // 生成中文标签
      let label = key
      if (key === 'Texas') {
        label = '德州扑克'
      }
      list.push({
        label: `${label} (${value})`,
        value: value as number
      })
    }
  }
  return list.sort((a, b) => a.value - b.value)
})

// Placeholder option 的值
const placeholderOptionValue = computed(() => {
  return props.placeholderValue === undefined ? '' : String(props.placeholderValue)
})

// Select 的当前值
const getSelectValue = computed(() => {
  if (props.modelValue === undefined || props.modelValue === null) {
    return placeholderOptionValue.value
  }
  return String(props.modelValue)
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const placeholderStr = placeholderOptionValue.value
  if (!target.value || target.value === placeholderStr) {
    emit('update:modelValue', undefined)
    return
  }
  const value = Number(target.value)
  emit('update:modelValue', value)
}
</script>

