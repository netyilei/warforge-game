<script setup lang="ts">
import { themeTabModeOptions } from '@/constants/app';
import { useThemeStore } from '@/store/modules/theme';
import { translateOptions } from '@/utils/common';
import SettingItem from '../../../components/setting-item.vue';

defineOptions({
  name: 'TabSettings'
});

const themeStore = useThemeStore();
</script>

<template>
  <NDivider>标签页设置</NDivider>
  <TransitionGroup tag="div" name="setting-list" class="flex-col-stretch gap-12px">
    <SettingItem key="1" label="显示标签页">
      <NSwitch v-model:value="themeStore.tab.visible" />
    </SettingItem>
    <SettingItem v-if="themeStore.tab.visible" key="2" label="缓存标签页">
      <template #suffix>
        <IconTooltip desc="开启后，刷新页面时标签页状态会被保留" />
      </template>
      <NSwitch v-model:value="themeStore.tab.cache" />
    </SettingItem>
    <SettingItem v-if="themeStore.tab.visible" key="3" label="标签页高度">
      <NInputNumber v-model:value="themeStore.tab.height" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="themeStore.tab.visible" key="4" label="标签页风格">
      <NSelect
        v-model:value="themeStore.tab.mode"
        :options="translateOptions(themeTabModeOptions)"
        size="small"
        class="w-120px"
      />
    </SettingItem>
    <SettingItem v-if="themeStore.tab.visible" key="5" label="中键关闭标签页">
      <template #suffix>
        <IconTooltip desc="开启后，鼠标中键点击标签页可关闭" />
      </template>
      <NSwitch v-model:value="themeStore.tab.closeTabByMiddleClick" />
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
