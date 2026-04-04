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
  NSelect,
  NInputNumber,
  NSwitch,
  NPopconfirm,
  NTag,
  NTabs,
  NTabPane,
  NDatePicker,
  NImage,
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import { contentApi, type BannerPosition, type Banner, type BannerTranslation, type BannerWithTranslations } from '@/service/api/content';
import { languageApi, type Language } from '@/service/api/language';

const message = useMessage();

const loading = ref(false);
const positions = ref<BannerPosition[]>([]);
const languages = ref<Language[]>([]);
const banners = ref<BannerWithTranslations[]>([]);
const selectedPosition = ref<string>('');

const showModal = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const currentTab = ref('');

const formData = ref<{
  banner: Partial<Banner>;
  translations: Partial<BannerTranslation>[];
}>({
  banner: {},
  translations: [],
});

const defaultLang = computed(() => languages.value.find((l) => l.isDefault)?.code || 'zh-CN');

const supportedLanguages = computed(() =>
  languages.value.filter((l) => l.isSupported).sort((a, b) => a.sortOrder - b.sortOrder)
);

const positionOptions = computed(() =>
  positions.value.map((p) => ({
    label: `${p.name} (${p.code})`,
    value: p.id,
  }))
);

const startTimeTs = computed({
  get: () => formData.value.banner.startTime ? new Date(formData.value.banner.startTime).getTime() : null,
  set: (v: number | null) => { formData.value.banner.startTime = v ? new Date(v).toISOString() : null; }
});

const endTimeTs = computed({
  get: () => formData.value.banner.endTime ? new Date(formData.value.banner.endTime).getTime() : null,
  set: (v: number | null) => { formData.value.banner.endTime = v ? new Date(v).toISOString() : null; }
});

const columns: DataTableColumns<BannerWithTranslations> = [
  {
    title: '图片',
    key: 'imageUrl',
    width: 150,
    render: (row) => {
      const defaultTrans = row.translations.find((t) => t.lang === defaultLang.value);
      return defaultTrans?.imageUrl
        ? h(NImage, {
            src: defaultTrans.imageUrl,
            width: 120,
            height: 60,
            objectFit: 'cover',
            previewSrc: defaultTrans.imageUrl,
          })
        : '-';
    },
  },
  {
    title: '位置',
    key: 'positionId',
    width: 120,
    render: (row) => {
      const pos = positions.value.find((p) => p.id === row.banner.positionId);
      return pos?.name || '-';
    },
  },
  {
    title: 'Alt文本',
    key: 'altText',
    width: 150,
    render: (row) => {
      const defaultTrans = row.translations.find((t) => t.lang === defaultLang.value);
      return defaultTrans?.altText || '-';
    },
  },
  {
    title: '跳转链接',
    key: 'linkUrl',
    width: 150,
    ellipsis: { tooltip: true },
    render: (row) => {
      const defaultTrans = row.translations.find((t) => t.lang === defaultLang.value);
      return defaultTrans?.linkUrl || '-';
    },
  },
  {
    title: '游戏ID',
    key: 'gameId',
    width: 100,
    render: (row) => {
      const defaultTrans = row.translations.find((t) => t.lang === defaultLang.value);
      return defaultTrans?.gameId || '-';
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
            onClick: () => handleEdit(row),
          },
          () => '编辑'
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => handleDelete(row.banner.id),
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

const fetchPositions = async () => {
  try {
    const { data: res, error } = await contentApi.getBannerPositions();
    if (error) {
      message.error('获取位置列表失败');
      return;
    }
    positions.value = res?.positions || [];
  } catch (error) {
    message.error('获取位置列表失败');
  }
};

const fetchBanners = async () => {
  loading.value = true;
  try {
    const { data: res, error } = await contentApi.getBanners(selectedPosition.value);
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
      imageUrl: '',
      altText: '',
      linkUrl: '',
      gameId: '',
      linkTarget: '_blank',
    });
  });
  return translations;
};

const handleAdd = () => {
  isEdit.value = false;
  currentTab.value = defaultLang.value;
  formData.value = {
    banner: {
      positionId: selectedPosition.value || positions.value[0]?.id || '',
      sortOrder: 0,
      status: 1,
    },
    translations: initTranslations(),
  };
  showModal.value = true;
};

const handleEdit = async (row: BannerWithTranslations) => {
  isEdit.value = true;
  currentTab.value = defaultLang.value;
  
  const translations = initTranslations();
  row.translations.forEach((t) => {
    const idx = translations.findIndex((tr) => tr.lang === t.lang);
    if (idx >= 0) {
      translations[idx] = { ...t };
    }
  });

  formData.value = {
    banner: { ...row.banner },
    translations,
  };
  showModal.value = true;
};

const handleDelete = async (id: string) => {
  try {
    await contentApi.deleteBanner(id);
    message.success('删除成功');
    fetchBanners();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleSave = async () => {
  const defaultTrans = formData.value.translations.find(
    (t) => t.lang === defaultLang.value
  );
  if (!defaultTrans?.imageUrl) {
    message.warning('请填写默认语言的图片URL');
    return;
  }

  saving.value = true;
  try {
    const submitData = {
      banner: {
        ...formData.value.banner,
        startTime: formData.value.banner.startTime || null,
        endTime: formData.value.banner.endTime || null,
      },
      translations: formData.value.translations.filter((t) => t.imageUrl),
    };

    if (isEdit.value) {
      await contentApi.updateBanner(submitData);
      message.success('更新成功');
    } else {
      await contentApi.createBanner(submitData);
      message.success('创建成功');
    }
    showModal.value = false;
    fetchBanners();
  } catch (error) {
    message.error(isEdit.value ? '更新失败' : '创建失败');
  } finally {
    saving.value = false;
  }
};

const getTranslation = (lang: string) => {
  let trans = formData.value.translations.find((t) => t.lang === lang);
  if (!trans) {
    trans = { lang, imageUrl: '', altText: '', linkUrl: '', gameId: '', linkTarget: '_blank' };
    formData.value.translations.push(trans);
  }
  return trans;
};

watch(selectedPosition, () => {
  fetchBanners();
});

onMounted(() => {
  fetchLanguages();
  fetchPositions().then(() => {
    fetchBanners();
  });
});
</script>

<template>
  <div class="p-4">
    <NCard title="Banner管理">
      <template #header-extra>
        <NSpace>
          <NSelect
            v-model:value="selectedPosition"
            :options="[{ label: '全部位置', value: '' }, ...positionOptions]"
            style="width: 180px"
            clearable
          />
          <NButton type="primary" @click="handleAdd">添加Banner</NButton>
        </NSpace>
      </template>
      <NDataTable
        :columns="columns"
        :data="banners"
        :loading="loading"
        :pagination="false"
        :scroll-x="1100"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      :title="isEdit ? '编辑Banner' : '添加Banner'"
      preset="card"
      style="width: 900px"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="位置" required>
          <NSelect
            v-model:value="formData.banner.positionId"
            :options="positionOptions"
            style="width: 250px"
          />
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
          <NInputNumber v-model:value="formData.banner.sortOrder" :min="0" />
        </NFormItem>
        <NFormItem label="状态">
          <NSwitch
            :value="formData.banner.status === 1"
            @update:value="formData.banner.status = $event ? 1 : 0"
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
                  <NFormItem label="图片URL" required>
                    <NInput
                      v-model:value="getTranslation(lang.code).imageUrl"
                      placeholder="请输入图片URL"
                    />
                  </NFormItem>
                  <NFormItem label="Alt文本">
                    <NInput
                      v-model:value="getTranslation(lang.code).altText"
                      placeholder="图片替代文本"
                    />
                  </NFormItem>
                  <NFormItem label="跳转链接">
                    <NInput
                      v-model:value="getTranslation(lang.code).linkUrl"
                      placeholder="点击跳转URL"
                    />
                  </NFormItem>
                  <NFormItem label="游戏ID">
                    <NInput
                      v-model:value="getTranslation(lang.code).gameId"
                      placeholder="关联游戏ID（可选）"
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
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">
            保存
          </NButton>
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
