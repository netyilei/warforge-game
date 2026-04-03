<script setup lang="ts">
import { useThemeStore } from '@/store/modules/theme';
import SettingItem from '../../../components/setting-item.vue';

defineOptions({
  name: 'ThemeColor'
});

const themeStore = useThemeStore();

function handleUpdateColor(color: string, key: App.Theme.ThemeColorKey) {
  themeStore.updateThemeColors(key, color);
}

const swatches: string[] = [
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#0ea5e9',
  '#06b6d4',
  '#f43f5e',
  '#ef4444',
  '#ec4899',
  '#d946ef',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981'
];

const colorLabels: Record<App.Theme.ThemeColorKey, string> = {
  primary: '主色',
  info: '信息色',
  success: '成功色',
  warning: '警告色',
  error: '错误色'
};
</script>

<template>
  <NDivider>主题颜色</NDivider>
  <div class="flex-col-stretch gap-12px">
    <SettingItem key="recommend-color" label="推荐颜色">
      <template #suffix>
        <IconTooltip>
          <p>
            <span class="pr-12px">使用推荐颜色可以获得更好的视觉效果</span>
            <br />
            <NButton
              text
              tag="a"
              href="https://uicolors.app/create"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray"
            >
              https://uicolors.app/create
            </NButton>
          </p>
        </IconTooltip>
      </template>
      <NSwitch v-model:value="themeStore.recommendColor" />
    </SettingItem>

    <SettingItem
      v-for="(_, key) in themeStore.themeColors"
      :key="key"
      :label="colorLabels[key]"
    >
      <template v-if="key === 'info'" #suffix>
        <NCheckbox v-model:checked="themeStore.isInfoFollowPrimary">
          跟随主色
        </NCheckbox>
      </template>
      <div class="w-90px">
        <NColorPicker
          :value="themeStore.themeColors[key]"
          :disabled="key === 'info' && themeStore.isInfoFollowPrimary"
          :show-alpha="false"
          :swatches="swatches"
          @update:value="handleUpdateColor($event, key)"
        />
      </div>
    </SettingItem>
  </div>
</template>

<style scoped></style>
