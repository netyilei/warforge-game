<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  NModal,
  NInput,
  NGrid,
  NGi,
  NEmpty,
  NTooltip,
  NButton,
  NTabs,
  NTabPane,
  NScrollbar,
} from 'naive-ui';
import { Icon } from '@iconify/vue';

interface Props {
  value?: string;
  showPreview?: boolean;
}

interface Emits {
  (e: 'update:value', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  showPreview: true,
});

const emit = defineEmits<Emits>();

const showModal = ref(false);
const searchQuery = ref('');
const activeTab = ref('common');

const iconCategories = {
  common: {
    name: '常用图标',
    icons: [
      'carbon:document',
      'carbon:folder',
      'carbon:settings',
      'carbon:user',
      'carbon:group',
      'carbon:star',
      'carbon:heart',
      'carbon:home',
      'carbon:search',
      'carbon:notification',
      'carbon:email',
      'carbon:phone',
      'carbon:calendar',
      'carbon:time',
      'carbon:location',
      'carbon:tag',
      'carbon:bookmark',
      'carbon:pin',
      'carbon:lock',
      'carbon:unlock',
      'carbon:eye',
      'carbon:eye-off',
      'carbon:edit',
      'carbon:trash-can',
      'carbon:add',
      'carbon:close',
      'carbon:checkmark',
      'carbon:warning',
      'carbon:information',
      'carbon:help',
      'carbon:filter',
      'carbon:sort',
      'carbon:list',
      'carbon:grid',
      'carbon:chart-bar',
      'carbon:chart-line',
      'carbon:dashboard',
      'carbon:analytics',
      'carbon:report',
      'carbon:data-table',
    ],
  },
  file: {
    name: '文件图标',
    icons: [
      'carbon:document',
      'carbon:document-pdf',
      'carbon:document-word',
      'carbon:document-excel',
      'carbon:document-ppt',
      'carbon:document-image',
      'carbon:document-video',
      'carbon:document-audio',
      'carbon:document-code',
      'carbon:document-txt',
      'carbon:document-download',
      'carbon:document-upload',
      'carbon:folder',
      'carbon:folder-open',
      'carbon:folder-add',
      'carbon:folder-move',
      'carbon:archive',
      'carbon:package',
      'carbon:file',
      'carbon:file-add',
    ],
  },
  user: {
    name: '用户图标',
    icons: [
      'carbon:user',
      'carbon:user-avatar',
      'carbon:user-profile',
      'carbon:user-multiple',
      'carbon:user-role',
      'carbon:user-certification',
      'carbon:user-identification',
      'carbon:user-security',
      'carbon:user-settings',
      'carbon:user-activity',
      'carbon:group',
      'carbon:group-account',
      'carbon:collaborate',
      'carbon:partnership',
      'carbon:login',
      'carbon:logout',
      'carbon:security',
      'carbon:locked',
      'carbon:unlocked',
      'carbon:password',
    ],
  },
  media: {
    name: '媒体图标',
    icons: [
      'carbon:image',
      'carbon:camera',
      'carbon:video',
      'carbon:video-filled',
      'carbon:microphone',
      'carbon:music',
      'carbon:play',
      'carbon:pause',
      'carbon:stop',
      'carbon:skip-forward',
      'carbon:skip-back',
      'carbon:volume-up',
      'carbon:volume-down',
      'carbon:volume-mute',
      'carbon:screen',
      'carbon:fullscreen',
      'carbon:crop',
      'carbon:rotate',
      'carbon:mirror',
      'carbon:color-palette',
    ],
  },
  communication: {
    name: '通讯图标',
    icons: [
      'carbon:email',
      'carbon:chat',
      'carbon:chat-bot',
      'carbon:message',
      'carbon:notification',
      'carbon:notification-new',
      'carbon:notification-off',
      'carbon:phone',
      'carbon:phone-filled',
      'carbon:video-filled',
      'carbon:video-off',
      'carbon:send',
      'carbon:send-alt',
      'carbon:reply',
      'carbon:forward',
      'carbon:attachment',
      'carbon:link',
      'carbon:share',
      'carbon:collaborate',
      'carbon:forum',
    ],
  },
  device: {
    name: '设备图标',
    icons: [
      'carbon:computer',
      'carbon:laptop',
      'carbon:mobile',
      'carbon:tablet',
      'carbon:watch',
      'carbon:printer',
      'carbon:scanner',
      'carbon:camera',
      'carbon:headset',
      'carbon:keyboard',
      'carbon:mouse',
      'carbon:screen',
      'carbon:server',
      'carbon:data-base',
      'carbon:cloud',
      'carbon:cloud-upload',
      'carbon:cloud-download',
      'carbon:wifi',
      'carbon:bluetooth',
      'carbon:usb',
    ],
  },
  game: {
    name: '游戏图标',
    icons: [
      'carbon:game-console',
      'carbon:game',
      'carbon:trophy',
      'carbon:medal',
      'carbon:star',
      'carbon:star-filled',
      'carbon:flash',
      'carbon:fire',
      'carbon:lightning',
      'carbon:energy',
      'carbon:rocket',
      'carbon:target',
      'carbon:crosshair',
      'carbon:sword',
      'carbon:shield',
      'carbon:growth',
      'carbon:chart-line-data',
      'carbon:activity',
      'carbon:events',
      'carbon:task',
    ],
  },
  flags: {
    name: '国旗图标',
    icons: [
      'emojione:flag-for-china',
      'emojione:flag-for-taiwan',
      'emojione:flag-for-united-states',
      'emojione:flag-for-united-kingdom',
      'emojione:flag-for-japan',
      'emojione:flag-for-south-korea',
      'emojione:flag-for-france',
      'emojione:flag-for-germany',
      'emojione:flag-for-spain',
      'emojione:flag-for-mexico',
      'emojione:flag-for-italy',
      'emojione:flag-for-brazil',
      'emojione:flag-for-portugal',
      'emojione:flag-for-russia',
      'emojione:flag-for-saudi-arabia',
      'emojione:flag-for-thailand',
      'emojione:flag-for-vietnam',
      'emojione:flag-for-indonesia',
      'emojione:flag-for-malaysia',
      'emojione:flag-for-turkey',
    ],
  },
};

const filteredIcons = computed(() => {
  const category = iconCategories[activeTab.value as keyof typeof iconCategories];
  if (!category) return [];

  if (!searchQuery.value) return category.icons;

  return category.icons.filter((icon) =>
    icon.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const handleSelect = (icon: string) => {
  emit('update:value', icon);
  showModal.value = false;
};

const handleClear = () => {
  emit('update:value', '');
};
</script>

<template>
  <div class="icon-picker">
    <div class="icon-picker-trigger" @click="showModal = true">
      <div v-if="value" class="icon-preview">
        <Icon :icon="value" class="icon-display" />
        <span class="icon-name">{{ value }}</span>
      </div>
      <div v-else class="icon-placeholder">
        <Icon icon="carbon:add" class="placeholder-icon" />
        <span>选择图标</span>
      </div>
    </div>
    <NButton
      v-if="value"
      size="small"
      quaternary
      circle
      class="clear-btn"
      @click.stop="handleClear"
    >
      <template #icon>
        <Icon icon="carbon:close" />
      </template>
    </NButton>
  </div>

  <NModal
    v-model:show="showModal"
    title="选择图标"
    preset="card"
    style="width: 600px"
    :mask-closable="false"
  >
    <div class="icon-picker-modal">
      <NInput
        v-model:value="searchQuery"
        placeholder="搜索图标..."
        clearable
        class="search-input"
      >
        <template #prefix>
          <Icon icon="carbon:search" />
        </template>
      </NInput>

      <NTabs v-model:value="activeTab" type="line" animated>
        <NTabPane
          v-for="(category, key) in iconCategories"
          :key="key"
          :name="key"
          :tab="category.name"
        >
          <NScrollbar style="max-height: 400px">
            <NGrid :cols="6" :x-gap="8" :y-gap="8" class="icon-grid">
              <NGi v-for="icon in filteredIcons" :key="icon">
                <NTooltip :show-arrow="false">
                  <template #trigger>
                    <div
                      class="icon-item"
                      :class="{ active: value === icon }"
                      @click="handleSelect(icon)"
                    >
                      <Icon :icon="icon" class="icon-display" />
                    </div>
                  </template>
                  {{ icon }}
                </NTooltip>
              </NGi>
            </NGrid>
            <NEmpty
              v-if="filteredIcons.length === 0"
              description="没有找到匹配的图标"
              class="empty-state"
            />
          </NScrollbar>
        </NTabPane>
      </NTabs>
    </div>
  </NModal>
</template>

<style scoped>
.icon-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.icon-picker-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--n-border-color, #e0e0e6);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 180px;
  background: var(--n-color, #fff);
}

.icon-picker-trigger:hover {
  border-color: var(--n-border-color-hover, #c2c2cc);
}

.icon-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-display {
  font-size: 20px;
  flex-shrink: 0;
}

.icon-name {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
}

.placeholder-icon {
  font-size: 20px;
}

.clear-btn {
  position: absolute;
  right: 32px;
}

.icon-picker-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-input {
  width: 100%;
}

.icon-grid {
  padding: 8px 0;
}

.icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--n-color-modal, #fff);
}

.icon-item:hover {
  border-color: var(--n-border-color-hover, #c2c2cc);
  background: var(--n-color-hover, #f5f5f5);
}

.icon-item.active {
  border-color: #2080f0;
  background: rgba(32, 128, 240, 0.1);
}

.icon-item .icon-display {
  font-size: 24px;
}

.empty-state {
  padding: 40px 0;
}
</style>
