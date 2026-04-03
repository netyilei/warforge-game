<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/store/modules/theme';
import SettingItem from '../../../components/setting-item.vue';

defineOptions({
  name: 'FooterSettings'
});

const themeStore = useThemeStore();

const layoutMode = computed(() => themeStore.layout.mode);
const isWrapperScrollMode = computed(() => themeStore.layout.scrollMode === 'wrapper');
const isMixHorizontalMode = computed(() =>
  ['top-hybrid-sidebar-first', 'top-hybrid-header-first'].includes(layoutMode.value)
);
</script>

<template>
  <NDivider>底部设置</NDivider>
  <TransitionGroup tag="div" name="setting-list" class="flex-col-stretch gap-12px">
    <SettingItem key="1" label="显示底部">
      <NSwitch v-model:value="themeStore.footer.visible" />
    </SettingItem>
    <SettingItem
      v-if="themeStore.footer.visible && isWrapperScrollMode"
      key="2"
      label="固定底部"
    >
      <NSwitch v-model:value="themeStore.footer.fixed" />
    </SettingItem>
    <SettingItem v-if="themeStore.footer.visible" key="3" label="底部高度">
      <NInputNumber v-model:value="themeStore.footer.height" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem
      v-if="themeStore.footer.visible && isMixHorizontalMode"
      key="4"
      label="底部靠右"
    >
      <NSwitch v-model:value="themeStore.footer.right" />
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
