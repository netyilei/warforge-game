<script setup lang="ts">
import { computed } from 'vue';
import { defu } from 'defu';
import { useThemeStore } from '@/store/modules/theme';
import { themeSettings } from '@/theme/settings';

defineOptions({
  name: 'ThemePreset'
});

type ThemePreset = Pick<
  App.Theme.ThemeSetting,
  | 'themeScheme'
  | 'grayscale'
  | 'colourWeakness'
  | 'recommendColor'
  | 'themeColor'
  | 'themeRadius'
  | 'otherColor'
  | 'isInfoFollowPrimary'
  | 'layout'
  | 'page'
  | 'header'
  | 'tab'
  | 'fixedHeaderAndTab'
  | 'sider'
  | 'footer'
  | 'watermark'
  | 'tokens'
> & {
  name: string;
  desc: string;
  version: string;
  naiveui?: App.Theme.NaiveUIThemeOverride;
};

const presetModules = import.meta.glob('@/theme/preset/*.json', { eager: true, import: 'default' });

const themeStore = useThemeStore();

const presets = computed(() =>
  Object.entries(presetModules)
    .map(([path, presetData]) => {
      const fileName = path.split('/').pop()?.replace('.json', '') || '';
      return {
        id: fileName,
        ...(presetData as ThemePreset)
      };
    })
    .sort((a, b) => {
      if (a.name === 'default') return -1;
      if (b.name === 'default') return 1;
      return a.name.localeCompare(b.name);
    })
);

const applyPreset = (preset: ThemePreset): void => {
  const mergedPreset = defu(preset, themeSettings);
  const { themeScheme, grayscale, colourWeakness, layout, watermark, naiveui, ...rest } = mergedPreset;
  themeStore.setThemeScheme(themeScheme);
  themeStore.setGrayscale(grayscale);
  themeStore.setColourWeakness(colourWeakness);
  themeStore.setThemeLayout(layout.mode);
  themeStore.setWatermarkEnableUserName(watermark.enableUserName);
  themeStore.setWatermarkEnableTime(watermark.enableTime);

  Object.assign(themeStore, {
    ...rest,
    layout: { ...themeStore.layout, scrollMode: layout.scrollMode },
    page: { ...rest.page },
    header: { ...rest.header },
    tab: { ...rest.tab },
    sider: { ...rest.sider },
    footer: { ...rest.footer },
    watermark: { ...watermark },
    tokens: { ...rest.tokens }
  });

  themeStore.setNaiveThemeOverrides(naiveui);

  window.$message?.success('主题应用成功');
};
</script>

<template>
  <NDivider>主题预设</NDivider>

  <div class="flex flex-col gap-3">
    <div
      v-for="preset in presets"
      :key="preset.id"
      class="border border-primary/10 rounded-lg border-solid bg-white/5 p-3 backdrop-blur-10 transition-all duration-300 hover:(shadow-md -translate-y-0.5)"
    >
      <div class="mb-2 flex items-center justify-between">
        <div class="min-w-0 w-full flex flex-1 items-center justify-between gap-2">
          <h5 class="m-0 truncate text-sm text-primary font-600">
            {{ preset.name }}
          </h5>
          <NBadge :value="`v${preset.version}`" type="info" size="small" class="flex-shrink-0 opacity-80" />
        </div>
        <NButton type="primary" size="tiny" ghost round class="ml-2 flex-shrink-0" @click="applyPreset(preset)">
          应用
        </NButton>
      </div>

      <p class="line-clamp-2 mb-3 text-xs text-gray-500 leading-4">{{ preset.desc }}</p>

      <div class="flex items-center justify-between">
        <div class="flex gap-1">
          <div
            v-for="(color, key) in { primary: preset.themeColor, ...preset.otherColor }"
            :key="key"
            class="h-3 w-3 cursor-pointer border border-white/30 rounded-full transition-transform hover:scale-110"
            :style="{ backgroundColor: color }"
            :class="{ 'ring-1 ring-primary/50': key === 'primary' }"
            :title="key"
          />
        </div>
        <div class="flex items-center gap-1">
          <div class="text-lg">
            {{ preset.themeScheme === 'dark' ? '🌙' : '☀️' }}
          </div>
          <div class="text-lg">
            {{ preset.grayscale ? '🎨' : '' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
