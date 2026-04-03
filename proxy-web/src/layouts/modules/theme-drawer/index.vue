<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '@/store/modules/app';
import AppearanceSettings from './modules/appearance/index.vue';
import LayoutSettings from './modules/layout/index.vue';
import GeneralSettings from './modules/general/index.vue';
import ConfigOperation from './modules/config-operation.vue';
import PresetSettings from './modules/preset/index.vue';

defineOptions({
  name: 'ThemeDrawer'
});

const appStore = useAppStore();
const activeTab = ref('appearance');

const drawerWidth = computed(() => {
  const width = 400;

  if (appStore.isMobile) {
    return `min(90vw, ${width}px)`;
  }

  return width;
});
</script>

<template>
  <NDrawer v-model:show="appStore.themeDrawerVisible" display-directive="show" :width="drawerWidth">
    <NDrawerContent title="主题设置" :native-scrollbar="false" closable>
      <NTabs v-model:value="activeTab" type="segment" size="medium" class="mb-16px">
        <NTab name="appearance" tab="外观"></NTab>
        <NTab name="layout" tab="布局"></NTab>
        <NTab name="general" tab="通用"></NTab>
        <NTab name="preset" tab="预设"></NTab>
      </NTabs>

      <div class="min-h-400px">
        <KeepAlive>
          <AppearanceSettings v-if="activeTab === 'appearance'" />
          <LayoutSettings v-else-if="activeTab === 'layout'" />
          <GeneralSettings v-else-if="activeTab === 'general'" />
          <PresetSettings v-else-if="activeTab === 'preset'" />
        </KeepAlive>
      </div>

      <template #footer>
        <ConfigOperation />
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
:deep(.n-tab) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.n-tab-pane) {
  padding: 0;
}
</style>
