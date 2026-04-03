<script setup lang="ts">
import { computed } from 'vue';
import { watermarkTimeFormatOptions } from '@/constants/app';
import { useThemeStore } from '@/store/modules/theme';
import SettingItem from '../../../components/setting-item.vue';

defineOptions({
  name: 'WatermarkSettings'
});

const themeStore = useThemeStore();

const isWatermarkTextVisible = computed(
  () => themeStore.watermark.visible && !themeStore.watermark.enableUserName && !themeStore.watermark.enableTime
);
</script>

<template>
  <NDivider>水印</NDivider>
  <TransitionGroup tag="div" name="setting-list" class="flex-col-stretch gap-12px">
    <SettingItem key="1" label="显示水印">
      <NSwitch v-model:value="themeStore.watermark.visible" />
    </SettingItem>
    <SettingItem v-if="themeStore.watermark.visible" key="2" label="显示用户名">
      <NSwitch :value="themeStore.watermark.enableUserName" @update:value="themeStore.setWatermarkEnableUserName" />
    </SettingItem>
    <SettingItem v-if="themeStore.watermark.visible" key="3" label="显示时间">
      <NSwitch :value="themeStore.watermark.enableTime" @update:value="themeStore.setWatermarkEnableTime" />
    </SettingItem>
    <SettingItem
      v-if="themeStore.watermark.visible && themeStore.watermark.enableTime"
      key="4"
      label="时间格式"
    >
      <NSelect
        v-model:value="themeStore.watermark.timeFormat"
        :options="watermarkTimeFormatOptions"
        size="small"
        class="w-210px"
      />
    </SettingItem>
    <SettingItem v-if="isWatermarkTextVisible" key="5" label="水印文本">
      <NInput
        v-model:value="themeStore.watermark.text"
        autosize
        type="text"
        size="small"
        class="w-120px"
        placeholder="WarForge Admin"
      />
    </SettingItem>
  </TransitionGroup>
</template>

<style scoped>
.setting-list-move,
.setting-list-enter-active,
.setting-list-leave-active {
  --uno: transition-all-300;
}

.setting-list-enter-from,
.setting-list-leave-to {
  --uno: opacity-0 -translate-x-30px;
}

.setting-list-leave-active {
  --uno: absolute;
}
</style>
