<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
  NTag,
  NDivider,
} from 'naive-ui';
import { Icon } from '@iconify/vue';
import { languageApi, type Language } from '@/service/api/v2/language';
import IconPicker from '@/components/common/icon-picker.vue';

interface LanguageWithStatus extends Language {
  isSupported: boolean;
}

const message = useMessage();

const loading = ref(false);
const dbLanguages = ref<Language[]>([]);
const showEditModal = ref(false);
const showAddModal = ref(false);
const editingLanguage = ref<Partial<Language>>({});
const newLanguage = ref<Partial<Language>>({
  code: '',
  name: '',
  nativeName: '',
  icon: '',
  sortOrder: 0,
  status: 1
});
const saving = ref(false);

const supportedLanguages = computed<LanguageWithStatus[]>(() => 
  dbLanguages.value
    .filter(l => l.status === 1)
    .map(l => ({ ...l, isSupported: true }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
);

const unsupportedLanguages = computed<LanguageWithStatus[]>(() => 
  dbLanguages.value
    .filter(l => l.status === 0)
    .map(l => ({ ...l, isSupported: false }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
);

const fetchLanguages = async () => {
  loading.value = true;
  try {
    const { data: res, error } = await languageApi.getLanguages();
    if (error) {
      message.error('获取语言列表失败');
      return;
    }
    dbLanguages.value = res?.languages || [];
  } catch (error) {
    message.error('获取语言列表失败');
  } finally {
    loading.value = false;
  }
};

const handleEditLanguage = (lang: LanguageWithStatus) => {
  editingLanguage.value = { ...lang };
  showEditModal.value = true;
};

const handleAddLanguage = () => {
  newLanguage.value = {
    code: '',
    name: '',
    nativeName: '',
    icon: '',
    sortOrder: dbLanguages.value.length + 1,
    status: 1
  };
  showAddModal.value = true;
};

const handleSaveLanguage = async () => {
  if (!editingLanguage.value.code || !editingLanguage.value.name) {
    message.warning('请填写语言标识和名称');
    return;
  }
  
  saving.value = true;
  try {
    await languageApi.updateLanguage(editingLanguage.value);
    message.success('保存成功');
    showEditModal.value = false;
    fetchLanguages();
  } catch (error) {
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
};

const handleCreateLanguage = async () => {
  if (!newLanguage.value.code || !newLanguage.value.name) {
    message.warning('请填写语言标识和名称');
    return;
  }
  
  saving.value = true;
  try {
    await languageApi.createLanguage(newLanguage.value as any);
    message.success('创建成功');
    showAddModal.value = false;
    fetchLanguages();
  } catch (error) {
    message.error('创建失败');
  } finally {
    saving.value = false;
  }
};

const handleToggleSupport = async (lang: LanguageWithStatus) => {
  const newStatus = lang.isSupported ? 0 : 1;
  
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

const handleSetDefault = async (lang: LanguageWithStatus) => {
  try {
    await languageApi.setDefaultLanguage(lang.id);
    message.success('设置默认语言成功');
    fetchLanguages();
  } catch (error) {
    message.error('设置失败');
  }
};

onMounted(() => {
  fetchLanguages();
});
</script>

<template>
  <div class="language-settings-container">
    <NGrid :cols="1" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard title="语言设置" :bordered="false" :loading="loading">
          <template #header-extra>
            <NButton type="primary" size="small" @click="handleAddLanguage">
              添加语言
            </NButton>
          </template>
          <div class="language-sections">
            <div class="section">
              <div class="section-header">
                <span class="section-title">已启用的语言</span>
                <span class="section-count">{{ supportedLanguages.length }} 种</span>
              </div>
              <div class="language-grid">
                <div
                  v-for="lang in supportedLanguages"
                  :key="lang.code"
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
                      @click="handleSetDefault(lang)"
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
                    <NButton
                      size="tiny"
                      tertiary
                      @click="handleEditLanguage(lang)"
                    >
                      编辑
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
                  :key="lang.code"
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
                    <NButton
                      size="tiny"
                      tertiary
                      @click="handleEditLanguage(lang)"
                    >
                      编辑
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

    <NModal
      v-model:show="showAddModal"
      title="添加语言"
      preset="card"
      style="width: 500px"
    >
      <NForm :model="newLanguage" label-placement="left" label-width="100">
        <NFormItem label="语言标识" path="code">
          <NInput 
            v-model:value="newLanguage.code" 
            placeholder="如：zh-CN、en、ja"
          />
        </NFormItem>
        <NFormItem label="语言名称" path="name">
          <NInput v-model:value="newLanguage.name" placeholder="如：简体中文" />
        </NFormItem>
        <NFormItem label="本地名称" path="nativeName">
          <NInput v-model:value="newLanguage.nativeName" placeholder="如：简体中文" />
        </NFormItem>
        <NFormItem label="图标" path="icon">
          <IconPicker v-model:value="newLanguage.icon" />
        </NFormItem>
        <NFormItem label="排序" path="sortOrder">
          <NInputNumber v-model:value="newLanguage.sortOrder" :min="0" />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="showAddModal = false">取消</NButton>
          <NButton type="primary" :loading="saving" @click="handleCreateLanguage">
            创建
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
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
  min-height: 130px;
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 10px;
}

.card-content {
  text-align: center;
  margin-bottom: 10px;
  width: 100%;
}

.card-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-code {
  font-size: 11px;
  color: #999;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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
