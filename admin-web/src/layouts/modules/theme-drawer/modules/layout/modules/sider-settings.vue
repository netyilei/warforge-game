<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/store/modules/theme';
import SettingItem from '../../../components/setting-item.vue';

defineOptions({
  name: 'SiderSettings'
});

const themeStore = useThemeStore();

const layoutMode = computed(() => themeStore.layout.mode);
const isMixLayoutMode = computed(() => layoutMode.value.includes('mix') || layoutMode.value.includes('hybrid'));
const isHybridLayoutMode = computed(() => layoutMode.value.includes('hybrid'));
</script>

<template>
  <NDivider>侧边栏设置</NDivider>
  <TransitionGroup tag="div" name="setting-list" class="flex-col-stretch gap-12px">
    <SettingItem v-if="layoutMode === 'vertical'" key="1" label="侧边栏宽度">
      <NInputNumber v-model:value="themeStore.sider.width" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="layoutMode === 'vertical'" key="2" label="侧边栏折叠宽度">
      <NInputNumber v-model:value="themeStore.sider.collapsedWidth" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="isMixLayoutMode" key="3" label="混合侧边栏宽度">
      <NInputNumber v-model:value="themeStore.sider.mixWidth" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="isMixLayoutMode" key="4" label="混合侧边栏折叠宽度">
      <NInputNumber v-model:value="themeStore.sider.mixCollapsedWidth" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="layoutMode === 'vertical-mix'" key="5" label="混合子菜单宽度">
      <NInputNumber v-model:value="themeStore.sider.mixChildMenuWidth" size="small" :step="1" class="w-120px" />
    </SettingItem>
    <SettingItem v-if="isHybridLayoutMode" key="6" label="自动选择第一个菜单">
      <template #suffix>
        <IconTooltip desc="开启后，会自动选择混合布局第一个菜单" />
      </template>
      <NSwitch v-model:value="themeStore.sider.autoSelectFirstMenu" />
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
