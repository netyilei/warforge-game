<script setup lang="ts">
import { computed } from 'vue';
import { themePageAnimationModeOptions, themeScrollModeOptions } from '@/constants/app';
import { useThemeStore } from '@/store/modules/theme';
import SettingItem from '../../../components/setting-item.vue';

defineOptions({
  name: 'ContentSettings'
});

const themeStore = useThemeStore();

const isWrapperScrollMode = computed(() => themeStore.layout.scrollMode === 'wrapper');
</script>

<template>
  <NDivider>内容区域</NDivider>
  <TransitionGroup tag="div" name="setting-list" class="flex-col-stretch gap-12px">
    <SettingItem key="1" label="滚动模式">
      <NSelect
        v-model:value="themeStore.layout.scrollMode"
        :options="themeScrollModeOptions"
        size="small"
        class="w-120px"
      />
    </SettingItem>
    <SettingItem key="2" label="页面动画">
      <NSwitch v-model:value="themeStore.page.animate" />
    </SettingItem>
    <SettingItem v-if="themeStore.page.animate" key="3" label="动画模式">
      <NSelect
        v-model:value="themeStore.page.animateMode"
        :options="themePageAnimationModeOptions"
        size="small"
        class="w-120px"
      />
    </SettingItem>
    <SettingItem v-if="isWrapperScrollMode" key="4" label="固定头部和标签栏">
      <NSwitch v-model:value="themeStore.fixedHeaderAndTab" />
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
