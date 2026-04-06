<script setup lang="ts">
import { ref, onMounted, computed, h, watch } from 'vue';
import {
  NCard,
  NButton,
  NSpace,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NPopconfirm,
  NTag,
  NTabs,
  NTabPane,
  NDatePicker,
  NImage,
  NSelect,
  NDynamicInput,
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import { contentApi, type BannerGroup, type Banner, type BannerTranslation, type BannerWithTranslations, type BannerExtraData } from '@/service/api/v2/content';
import { languageApi, type Language } from '@/service/api/v2/language';

const message = useMessage();

const loading = ref(false);
const groups = ref<BannerGroup[]>([]);
const languages = ref<Language[]>([]);
const banners = ref<BannerWithTranslations[]>([]);
const selectedGroup = ref<string>('');

const showGroupModal = ref(false);
const showBannerModal = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const currentTab = ref('');
const editingBannerId = ref('');

const groupFormData = ref<Partial<BannerGroup>>({});
const bannerFormData = ref<{
  groupId: string;
  imageUrl: string;
  linkUrl: string;
  linkTarget: string;
  isExternal: boolean;
  extraData: { key: string; value: string }[];
  startTime: string | null;
  endTime: string | null;
  sortOrder: number;
  status: number;
  translations: Partial<BannerTranslation>[];
}>({
  groupId: '',
  imageUrl: '',
  linkUrl: '',
  linkTarget: '_blank',
  isExternal: false,
  extraData: [],
  startTime: null,
  endTime: null,
  sortOrder: 0,
  status: 1,
  translations: [],
});

const defaultLang = computed(() => languages.value.find((l) => l.isDefault)?.code || 'zh-CN');

const supportedLanguages = computed(() =>
  languages.value.filter((l) => l.isSupported).sort((a, b) => a.sortOrder - b.sortOrder)
);

const groupColumns: DataTableColumns<BannerGroup> = [
  {
    title: '分组名称',
    key: 'name',
    width: 150,
  },
  {
    title: '分组标识',
    key: 'code',
    width: 120,
  },
  {
    title: '尺寸',
    key: 'size',
    width: 100,
    render: (row) => `${row.width}x${row.height}`,
  },
  {
    title: 'Banner数量',
    key: 'bannerCount',
    width: 100,
    render: (row) => row.bannerCount || 0,
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      row.status === 1
        ? h(NTag, { type: 'success' }, () => '启用')
        : h(NTag, { type: 'default' }, () => '禁用'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) =>
      h(NSpace, {}, () => [
        h(
          NButton,
          {
            size: 'small',
            onClick: () => {
              selectedGroup.value = row.id;
              fetchBanners();
            },
          },
          () => '管理Banner'
        ),
        h(
          NButton,
          {
            size: 'small',
            onClick: () => handleEditGroup(row),
          },
          () => '编辑'
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDeleteGroup(row.id),
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: 'small',
                  type: 'error',
                },
                () => '删除'
              ),
            default: () => '确定删除此分组吗？',
          }
        ),
      ]),
  },
];

const bannerColumns: DataTableColumns<BannerWithTranslations> = [
  {
    title: '图片',
    key: 'imageUrl',
    width: 150,
    render: (row) => {
      const defaultTrans = row.translations.find((t) => t.lang === defaultLang.value);
      return row.banner.imageUrl
        ? h(NImage, {
            src: row.banner.imageUrl,
            width: 120,
            height: 60,
            objectFit: 'cover',
            previewSrc: row.banner.imageUrl,
          })
        : '-';
    },
  },
  {
    title: '链接',
    key: 'linkUrl',
    width: 150,
    ellipsis: { tooltip: true },
    render: (row) => row.banner.linkUrl || '-',
  },
  {
    title: '外部链接',
    key: 'isExternal',
    width: 80,
    render: (row) =>
      row.banner.isExternal
        ? h(NTag, { type: 'info' }, () => '是')
        : h(NTag, { type: 'default' }, () => '否'),
  },
  {
    title: '自定义参数',
    key: 'extraData',
    width: 150,
    ellipsis: { tooltip: true },
    render: (row) => {
      const extra = row.banner.extraData;
      if (!extra || Object.keys(extra).length === 0) return '-';
      return Object.entries(extra)
        .map(([k, v]) => `${k}:${v}`)
        .join(', ');
    },
  },
  {
    title: '排序',
    key: 'sortOrder',
    width: 80,
    render: (row) => row.banner.sortOrder,
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      row.banner.status === 1
        ? h(NTag, { type: 'success' }, () => '启用')
        : h(NTag, { type: 'default' }, () => '禁用'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
    render: (row) =>
      h(NSpace, {}, () => [
        h(
          NButton,
          {
            size: 'small',
            onClick: () => handleEditBanner(row),
          },
          () => '编辑'
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDeleteBanner(row.banner.id),
          },
          {
            trigger: () =>
              h(
                NButton,
                {
                  size: 'small',
                  type: 'error',
                },
                () => '删除'
              ),
            default: () => '确定删除此Banner吗？',
          }
        ),
      ]),
  },
];

const fetchLanguages = async () => {
  try {
    const { data: res, error } = await languageApi.getLanguages();
    if (error) {
      message.error('获取语言列表失败');
      return;
    }
    languages.value = res?.languages || [];
  } catch (error) {
    message.error('获取语言列表失败');
  }
};

const fetchGroups = async () => {
  loading.value = true;
  try {
    const { data: res, error } = await contentApi.getBannerGroups();
    if (error) {
      message.error('获取分组列表失败');
      return;
    }
    groups.value = res?.groups || [];
  } catch (error) {
    message.error('获取分组列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchBanners = async () => {
  if (!selectedGroup.value) {
    banners.value = [];
    return;
  }
  loading.value = true;
  try {
    const { data: res, error } = await contentApi.getBanners(selectedGroup.value);
    if (error) {
      message.error('获取Banner列表失败');
      return;
    }
    banners.value = res?.banners || [];
  } catch (error) {
    message.error('获取Banner列表失败');
  } finally {
    loading.value = false;
  }
};

const initTranslations = () => {
  const translations: Partial<BannerTranslation>[] = [];
  supportedLanguages.value.forEach((lang) => {
    translations.push({
      lang: lang.code,
      title: '',
      content: '',
    });
  });
  return translations;
};

const handleAddGroup = () => {
  isEdit.value = false;
  groupFormData.value = {
    name: '',
    code: '',
    description: '',
    width: 0,
    height: 0,
    status: 1,
    sortOrder: groups.value.length + 1,
  };
  showGroupModal.value = true;
};

const handleEditGroup = (row: BannerGroup) => {
  isEdit.value = true;
  groupFormData.value = { ...row };
  showGroupModal.value = true;
};

const handleDeleteGroup = async (id: string) => {
  try {
    await contentApi.deleteBannerGroup(id);
    message.success('删除成功');
    fetchGroups();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleSaveGroup = async () => {
  if (!groupFormData.value.name || !groupFormData.value.code) {
    message.warning('请填写分组名称和标识');
    return;
  }

  saving.value = true;
  try {
    if (isEdit.value) {
      await contentApi.updateBannerGroup(groupFormData.value as BannerGroup);
      message.success('更新成功');
    } else {
      await contentApi.createBannerGroup(groupFormData.value as BannerGroup);
      message.success('创建成功');
    }
    showGroupModal.value = false;
    fetchGroups();
  } catch (error) {
    message.error(isEdit.value ? '更新失败' : '创建失败');
  } finally {
    saving.value = false;
  }
};

const handleAddBanner = () => {
  if (!selectedGroup.value) {
    message.warning('请先选择一个分组');
    return;
  }
  isEdit.value = false;
  editingBannerId.value = '';
  currentTab.value = defaultLang.value;
  bannerFormData.value = {
    groupId: selectedGroup.value,
    imageUrl: '',
    linkUrl: '',
    linkTarget: '_blank',
    isExternal: false,
    extraData: [],
    startTime: null,
    endTime: null,
    sortOrder: banners.value.length + 1,
    status: 1,
    translations: initTranslations(),
  };
  showBannerModal.value = true;
};

const handleEditBanner = (row: BannerWithTranslations) => {
  isEdit.value = true;
  editingBannerId.value = row.banner.id;
  currentTab.value = defaultLang.value;

  const translations = initTranslations();
  row.translations.forEach((t) => {
    const idx = translations.findIndex((tr) => tr.lang === t.lang);
    if (idx >= 0) {
      translations[idx] = { ...t };
    }
  });

  const extraData: { key: string; value: string }[] = [];
  if (row.banner.extraData) {
    Object.entries(row.banner.extraData).forEach(([key, value]) => {
      extraData.push({ key, value: String(value) });
    });
  }

  bannerFormData.value = {
    groupId: row.banner.groupId,
    imageUrl: row.banner.imageUrl,
    linkUrl: row.banner.linkUrl || '',
    linkTarget: row.banner.linkTarget || '_blank',
    isExternal: row.banner.isExternal,
    extraData,
    startTime: row.banner.startTime,
    endTime: row.banner.endTime,
    sortOrder: row.banner.sortOrder,
    status: row.banner.status,
    translations,
  };
  showBannerModal.value = true;
};

const handleDeleteBanner = async (id: string) => {
  try {
    await contentApi.deleteBanner(id);
    message.success('删除成功');
    fetchBanners();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleSaveBanner = async () => {
  if (!bannerFormData.value.imageUrl) {
    message.warning('请填写图片URL');
    return;
  }

  saving.value = true;
  try {
    const extraData: BannerExtraData = {};
    bannerFormData.value.extraData.forEach((item) => {
      if (item.key && item.value) {
        extraData[item.key] = item.value;
      }
    });

    const submitData = {
      groupId: bannerFormData.value.groupId,
      imageUrl: bannerFormData.value.imageUrl,
      linkUrl: bannerFormData.value.linkUrl || undefined,
      linkTarget: bannerFormData.value.linkTarget,
      isExternal: bannerFormData.value.isExternal,
      extraData: Object.keys(extraData).length > 0 ? extraData : undefined,
      startTime: bannerFormData.value.startTime || undefined,
      endTime: bannerFormData.value.endTime || undefined,
      sortOrder: bannerFormData.value.sortOrder,
      status: bannerFormData.value.status,
      translations: bannerFormData.value.translations
        .filter((t) => t.title || t.content)
        .map((t) => ({
          lang: t.lang!,
          title: t.title || '',
          content: t.content || '',
        })),
    };

    if (isEdit.value) {
      await contentApi.updateBanner({
        id: editingBannerId.value,
        ...submitData,
      });
      message.success('更新成功');
    } else {
      await contentApi.createBanner(submitData);
      message.success('创建成功');
    }
    showBannerModal.value = false;
    fetchBanners();
  } catch (error) {
    message.error(isEdit.value ? '更新失败' : '创建失败');
  } finally {
    saving.value = false;
  }
};

const getTranslation = (lang: string) => {
  let trans = bannerFormData.value.translations.find((t) => t.lang === lang);
  if (!trans) {
    trans = { lang, title: '', content: '' };
    bannerFormData.value.translations.push(trans);
  }
  return trans;
};

const startTimeTs = computed({
  get: () => bannerFormData.value.startTime ? new Date(bannerFormData.value.startTime).getTime() : null,
  set: (v: number | null) => { bannerFormData.value.startTime = v ? new Date(v).toISOString() : null; }
});

const endTimeTs = computed({
  get: () => bannerFormData.value.endTime ? new Date(bannerFormData.value.endTime).getTime() : null,
  set: (v: number | null) => { bannerFormData.value.endTime = v ? new Date(v).toISOString() : null; }
});

onMounted(() => {
  fetchLanguages();
  fetchGroups();
});
</script>

<template>
  <div class="p-4">
    <NCard title="Banner分组管理">
      <template #header-extra>
        <NButton type="primary" @click="handleAddGroup">添加分组</NButton>
      </template>
      <NDataTable
        :columns="groupColumns"
        :data="groups"
        :loading="loading"
        :pagination="false"
        :scroll-x="800"
      />
    </NCard>

    <NCard v-if="selectedGroup" :title="`Banner列表 - ${groups.find(g => g.id === selectedGroup)?.name || ''}`" class="mt-4">
      <template #header-extra>
        <NSpace>
          <NButton @click="selectedGroup = ''">返回分组列表</NButton>
          <NButton type="primary" @click="handleAddBanner">添加Banner</NButton>
        </NSpace>
      </template>
      <NDataTable
        :columns="bannerColumns"
        :data="banners"
        :loading="loading"
        :pagination="false"
        :scroll-x="900"
      />
    </NCard>

    <NModal
      v-model:show="showGroupModal"
      :title="isEdit ? '编辑分组' : '添加分组'"
      preset="card"
      style="width: 500px"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="名称" required>
          <NInput v-model:value="groupFormData.name" placeholder="分组名称" />
        </NFormItem>
        <NFormItem label="标识" required>
          <NInput v-model:value="groupFormData.code" placeholder="分组标识（如：home_banner）" :disabled="isEdit" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput v-model:value="groupFormData.description" placeholder="分组描述" />
        </NFormItem>
        <NFormItem label="宽度">
          <NInputNumber v-model:value="groupFormData.width" :min="0" placeholder="推荐宽度" />
        </NFormItem>
        <NFormItem label="高度">
          <NInputNumber v-model:value="groupFormData.height" :min="0" placeholder="推荐高度" />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber v-model:value="groupFormData.sortOrder" :min="0" />
        </NFormItem>
        <NFormItem label="状态">
          <NSwitch
            :value="groupFormData.status === 1"
            @update:value="groupFormData.status = $event ? 1 : 0"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showGroupModal = false">取消</NButton>
          <NButton type="primary" :loading="saving" @click="handleSaveGroup">保存</NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="showBannerModal"
      :title="isEdit ? '编辑Banner' : '添加Banner'"
      preset="card"
      style="width: 900px"
    >
      <NForm label-placement="left" label-width="100">
        <NFormItem label="图片URL" required>
          <NInput v-model:value="bannerFormData.imageUrl" placeholder="图片URL" />
        </NFormItem>
        <NFormItem label="链接URL">
          <NInput v-model:value="bannerFormData.linkUrl" placeholder="点击跳转URL" />
        </NFormItem>
        <NFormItem label="链接目标">
          <NSelect
            v-model:value="bannerFormData.linkTarget"
            :options="[
              { label: '新窗口 (_blank)', value: '_blank' },
              { label: '当前窗口 (_self)', value: '_self' },
            ]"
            style="width: 200px"
          />
        </NFormItem>
        <NFormItem label="外部链接">
          <NSwitch v-model:value="bannerFormData.isExternal">
            <template #checked>是</template>
            <template #unchecked>否</template>
          </NSwitch>
        </NFormItem>
        <NFormItem label="自定义参数">
          <NDynamicInput
            v-model:value="bannerFormData.extraData"
            :on-create="() => ({ key: '', value: '' })"
          >
            <template #default="{ value }">
              <div style="display: flex; gap: 8px; width: 100%">
                <NInput v-model:value="value.key" placeholder="参数名（如：game_id）" style="flex: 1" />
                <NInput v-model:value="value.value" placeholder="参数值" style="flex: 1" />
              </div>
            </template>
          </NDynamicInput>
        </NFormItem>
        <NFormItem label="生效时间">
          <NSpace>
            <NDatePicker
              v-model:value="startTimeTs"
              type="datetime"
              clearable
              placeholder="开始时间"
            />
            <span>至</span>
            <NDatePicker
              v-model:value="endTimeTs"
              type="datetime"
              clearable
              placeholder="结束时间"
            />
          </NSpace>
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber v-model:value="bannerFormData.sortOrder" :min="0" />
        </NFormItem>
        <NFormItem label="状态">
          <NSwitch
            :value="bannerFormData.status === 1"
            @update:value="bannerFormData.status = $event ? 1 : 0"
          />
        </NFormItem>

        <NFormItem label="翻译内容">
          <div class="translation-tabs">
            <NTabs v-model:value="currentTab" type="line">
              <NTabPane
                v-for="lang in supportedLanguages"
                :key="lang.code"
                :name="lang.code"
                :tab="`${lang.icon} ${lang.name}`"
              >
                <div class="translation-form">
                  <NFormItem label="标题">
                    <NInput
                      v-model:value="getTranslation(lang.code)!.title"
                      placeholder="Banner标题"
                    />
                  </NFormItem>
                  <NFormItem label="简单内容">
                    <NInput
                      v-model:value="getTranslation(lang.code)!.content"
                      type="textarea"
                      placeholder="简单内容（最多255字符）"
                      :maxlength="255"
                      show-count
                      :rows="2"
                    />
                  </NFormItem>
                </div>
              </NTabPane>
            </NTabs>
          </div>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showBannerModal = false">取消</NButton>
          <NButton type="primary" :loading="saving" @click="handleSaveBanner">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.translation-tabs {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
}

.translation-form {
  margin-top: 12px;
}
</style>
