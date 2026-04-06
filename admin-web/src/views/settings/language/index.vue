<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue';
import {
  NCard,
  NButton,
  NSpace,
  useMessage,
  NGrid,
  NGridItem,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NDataTable,
  NTag,
  NDivider,
} from 'naive-ui';
import { Icon } from '@iconify/vue';
import { languageApi, type Language } from '@/service/api/v2/language';
import IconPicker from '@/components/common/icon-picker.vue';

const message = useMessage();

const loading = ref(false);
const languages = ref<Language[]>([]);
const showEditModal = ref(false);
const editingLanguage = ref<Partial<Language>>({});
const saving = ref(false);

const supportedLanguages = computed(() => 
  languages.value.filter(l => l.status === 1).sort((a, b) => a.sortOrder - b.sortOrder)
);

const unsupportedLanguages = computed(() => 
  languages.value.filter(l => l.status !== 1).sort((a, b) => a.sortOrder - b.sortOrder)
);

const fetchLanguages = async () => {
  loading.value = true;
  try {
    const { data: res, error } = await languageApi.getLanguages();
    if (error) {
      message.error('获取语言列表失败');
      return;
    }
    languages.value = (res?.languages || []).map(l => ({
      ...l,
      isSupported: l.status === 1
    }));
  } catch (error) {
    message.error('获取语言列表失败');
  } finally {
    loading.value = false;
  }
};

const handleEditLanguage = (lang: Language) => {
  editingLanguage.value = { ...lang };
  showEditModal.value = true;
};

const handleSaveLanguage = async () => {
  if (!editingLanguage.value.code || !editingLanguage.value.name) {
    message.warning('请填写语言标识和名称');
    return;
  }
  
  saving.value = true;
  try {
    await languageApi.updateLanguage(editingLanguage.value);
    message.success('更新成功');
    showEditModal.value = false;
    fetchLanguages();
  } catch (error) {
    message.error('更新失败');
  } finally {
    saving.value = false;
  }
};

const handleToggleSupport = async (lang: Language) => {
  const newStatus = lang.status === 1 ? 0 : 1;
  try {
    await languageApi.updateLanguage({
      ...lang,
      status: newStatus
    });
    message.success(newStatus === 1 ? '已启用' : '已禁用');
    fetchLanguages();
  } catch (error) {
    message.error('操作失败');
  }
};

const handleSetDefault = async (id: string) => {
  try {
    await languageApi.setDefaultLanguage(id);
    message.success('设置默认语言成功');
    fetchLanguages();
  } catch (error) {
    message.error('设置失败');
  }
};

const columns = [
  {
    title: '图标',
    key: 'icon',
    width: 60,
    render: (row: Language) =>
      row.icon
        ? h(Icon, { icon: row.icon, style: 'font-size: 24px' })
        : h('span', '🌐'),
  },
  {
    title: '语言标识',
    key: 'code',
    width: 100,
  },
  {
    title: '语言名称',
    key: 'name',
    width: 120,
  },
  {
    title: '本地名称',
    key: 'nativeName',
    width: 120,
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row: Language) => 
      row.status === 1
        ? h(NTag, { type: 'success' }, () => '已启用')
        : h(NTag, { type: 'default' }, () => '未启用'),
  },
  {
    title: '默认',
    key: 'isDefault',
    width: 80,
    render: (row: Language) => 
      row.isDefault
        ? h(NTag, { type: 'info' }, () => '默认')
        : '',
  },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render: (row: Language) => {
      return h(NSpace, {}, () => [
        h(NButton, {
          size: 'small',
          onClick: () => handleEditLanguage(row),
        }, () => '编辑'),
        row.status === 1 && !row.isDefault
          ? h(NButton, {
              size: 'small',
              type: 'primary',
              tertiary: true,
              onClick: () => handleSetDefault(row.id),
            }, () => '设为默认')
          : null,
      ].filter(Boolean));
    },
  },
];

onMounted(() => {
  fetchLanguages();
});
</script>

<template>
  <div class="language-settings-container">
    <NGrid :cols="1" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard title="语言设置" :bordered="false" :loading="loading">
          <div class="language-sections">
            <div class="section">
              <div class="section-header">
                <span class="section-title">已启用的语言</span>
                <span class="section-count">{{ supportedLanguages.length }} 种</span>
              </div>
              <div class="language-grid">
                <div
                  v-for="lang in supportedLanguages"
                  :key="lang.id"
                  class="language-card"
                  :class="{ 'is-default': lang.isDefault }"
                >
                  <div class="card-icon">
                    <Icon v-if="lang.icon" :icon="lang.icon" />
                    <span v-else>🌐</span>
                  </div>
                  <div class="card-content">
                    <div class="card-name">{{ lang.name }}</div>
                    <div class="card-code">{{ lang.code }}</div>
                  </div>
                  <div class="card-actions">
                    <NTag v-if="lang.isDefault" type="info" size="small">默认</NTag>
                    <NButton
                      v-else
                      size="tiny"
                      type="primary"
                      tertiary
                      @click="handleSetDefault(lang.id)"
                    >
                      设为默认
                    </NButton>
                    <NButton
                      size="tiny"
                      type="warning"
                      tertiary
                      @click="handleToggleSupport(lang)"
                    >
                      禁用
                    </NButton>
                  </div>
                </div>
                <div v-if="supportedLanguages.length === 0" class="empty-tip">
                  暂无启用的语言
                </div>
              </div>
            </div>

            <NDivider />

            <div class="section">
              <div class="section-header">
                <span class="section-title">未启用的语言</span>
                <span class="section-count">{{ unsupportedLanguages.length }} 种</span>
              </div>
              <div class="language-grid">
                <div
                  v-for="lang in unsupportedLanguages"
                  :key="lang.id"
                  class="language-card disabled"
                >
                  <div class="card-icon">
                    <Icon v-if="lang.icon" :icon="lang.icon" />
                    <span v-else>🌐</span>
                  </div>
                  <div class="card-content">
                    <div class="card-name">{{ lang.name }}</div>
                    <div class="card-code">{{ lang.code }}</div>
                  </div>
                  <div class="card-actions">
                    <NButton
                      size="tiny"
                      type="success"
                      tertiary
                      @click="handleToggleSupport(lang)"
                    >
                      启用
                    </NButton>
                  </div>
                </div>
                <div v-if="unsupportedLanguages.length === 0" class="empty-tip">
                  所有语言都已启用
                </div>
              </div>
            </div>
          </div>
        </NCard>
      </NGridItem>

      <NGridItem>
        <NCard title="语言列表管理" :bordered="false">
          <NDataTable
            :columns="columns"
            :data="languages"
            :pagination="false"
            :max-height="400"
          />
        </NCard>
      </NGridItem>
    </NGrid>

    <NModal
      v-model:show="showEditModal"
      title="编辑语言"
      preset="card"
      style="width: 500px"
    >
      <NForm :model="editingLanguage" label-placement="left" label-width="100">
        <NFormItem label="语言标识" path="code">
          <NInput 
            v-model:value="editingLanguage.code" 
            placeholder="如：zh-CN、en、ja"
            disabled
          />
        </NFormItem>
        <NFormItem label="语言名称" path="name">
          <NInput v-model:value="editingLanguage.name" placeholder="如：简体中文" />
        </NFormItem>
        <NFormItem label="本地名称" path="nativeName">
          <NInput v-model:value="editingLanguage.nativeName" placeholder="如：简体中文" />
        </NFormItem>
        <NFormItem label="图标" path="icon">
          <IconPicker v-model:value="editingLanguage.icon" />
        </NFormItem>
        <NFormItem label="排序" path="sortOrder">
          <NInputNumber v-model:value="editingLanguage.sortOrder" :min="0" />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showEditModal = false">取消</NButton>
          <NButton type="primary" :loading="saving" @click="handleSaveLanguage">
            保存
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.language-settings-container {
  padding: 20px;
}

.language-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-weight: 500;
  font-size: 14px;
}

.section-count {
  color: #999;
  font-size: 12px;
}

.language-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.language-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 1px solid #e0e0e6;
  border-radius: 12px;
  background: #fff;
  min-height: 140px;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border-color: #c2c2cc;
  }
  
  &.is-default {
    border-color: #2080f0;
    background: linear-gradient(135deg, rgba(32, 128, 240, 0.05) 0%, rgba(32, 128, 240, 0.02) 100%);
    
    .card-icon {
      background: linear-gradient(135deg, #2080f0 0%, #63a4ff 100%);
    }
  }
  
  &.disabled {
    opacity: 0.7;
    background: #fafafa;
  }
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 12px;
}

.card-content {
  text-align: center;
  margin-bottom: 12px;
  width: 100%;
}

.card-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-code {
  font-size: 12px;
  color: #999;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.empty-tip {
  color: #999;
  font-size: 14px;
  padding: 40px;
  text-align: center;
  width: 100%;
  grid-column: 1 / -1;
}
</style>
