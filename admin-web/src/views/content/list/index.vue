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
import { contentApi, type ContentCategory, type Content, type ContentTranslation, type ContentWithTranslations } from '@/service/api/v2/content';
import { languageApi, type Language } from '@/service/api/v2/language';
import ToastEditor from '@/components/common/toast-editor.vue';
import FileUpload from '@/components/file-upload.vue';

const message = useMessage();

const loading = ref(false);
const categories = ref<ContentCategory[]>([]);
const languages = ref<Language[]>([]);
const contents = ref<ContentWithTranslations[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const selectedCategory = ref<string>('');

const showModal = ref(false);
const isEdit = ref(false);
const saving = ref(false);

const currentTab = ref('');

const editorRefs = ref<Record<string, InstanceType<typeof ToastEditor>>>({});

const formData = ref<{
  content: Partial<Content>;
  translations: Partial<ContentTranslation>[];
}>({
  content: {},
  translations: [],
});

const defaultLang = computed(() => languages.value.find((l) => l.isDefault)?.code || 'zh-CN');

const supportedLanguages = computed(() =>
  languages.value.filter((l) => l.isSupported).sort((a, b) => a.sortOrder - b.sortOrder)
);

const categoryOptions = computed(() =>
  categories.value.map((c) => ({
    label: c.name,
    value: c.id,
  }))
);

const startTimeTs = computed({
  get: () => formData.value.content.startTime ? new Date(formData.value.content.startTime).getTime() : null,
  set: (v: number | null) => { formData.value.content.startTime = v ? new Date(v).toISOString() : null; }
});

const endTimeTs = computed({
  get: () => formData.value.content.endTime ? new Date(formData.value.content.endTime).getTime() : null,
  set: (v: number | null) => { formData.value.content.endTime = v ? new Date(v).toISOString() : null; }
});

const columns: DataTableColumns<ContentWithTranslations> = [
  {
    title: '封面',
    key: 'coverImage',
    width: 80,
    render: (row) =>
      row.content.coverImage
        ? h(NImage, {
            src: row.content.coverImage,
            width: 60,
            height: 40,
            objectFit: 'cover',
            previewSrc: row.content.coverImage,
          })
        : '-',
  },
  {
    title: '标题',
    key: 'title',
    width: 200,
    render: (row) => {
      const defaultTrans = row.translations.find((t) => t.lang === defaultLang.value);
      return defaultTrans?.title || '-';
    },
  },
  {
    title: '分类',
    key: 'categoryId',
    width: 100,
    render: (row) => {
      const cat = categories.value.find((c) => c.id === row.content.categoryId);
      return cat?.name || '-';
    },
  },
  {
    title: '跑马灯',
    key: 'isMarquee',
    width: 80,
    render: (row) =>
      row.content.isMarquee
        ? h(NTag, { type: 'warning', size: 'small' }, () => '是')
        : '否',
  },
  {
    title: '弹窗',
    key: 'isPopup',
    width: 80,
    render: (row) =>
      row.content.isPopup
        ? h(NTag, { type: 'info', size: 'small' }, () => '是')
        : '否',
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      row.content.status === 1
        ? h(NTag, { type: 'success' }, () => '启用')
        : h(NTag, { type: 'default' }, () => '禁用'),
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160,
    render: (row) => row.content.createdAt?.split('T')[0] || '-',
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
            onPositiveClick: () => handleDelete(row.content.id),
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
            default: () => '确定删除此内容吗？',
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

const fetchCategories = async () => {
  try {
    const { data: res, error } = await contentApi.getCategories();
    if (error) {
      message.error('获取分类列表失败');
      return;
    }
    categories.value = res?.categories || [];
  } catch (error) {
    message.error('获取分类列表失败');
  }
};

const fetchContents = async () => {
  loading.value = true;
  try {
    const { data: res, error } = await contentApi.getContents(selectedCategory.value, page.value, pageSize.value);
    if (error) {
      message.error('获取内容列表失败');
      return;
    }
    contents.value = res?.list || [];
    total.value = res?.total || 0;
  } catch (error) {
    message.error('获取内容列表失败');
  } finally {
    loading.value = false;
  }
};

const initTranslations = () => {
  const translations: Partial<ContentTranslation>[] = [];
  supportedLanguages.value.forEach((lang) => {
    translations.push({
      lang: lang.code,
      title: '',
      summary: '',
      content: '',
    });
  });
  return translations;
};

const handleAdd = () => {
  isEdit.value = false;
  currentTab.value = defaultLang.value;
  editorRefs.value = {};
  formData.value = {
    content: {
      categoryId: selectedCategory.value || categories.value[0]?.id || '',
      coverImage: '',
      isMarquee: false,
      isPopup: false,
      sortOrder: 0,
      status: 1,
    },
    translations: initTranslations(),
  };
  showModal.value = true;
};

const handleEdit = async (row: ContentWithTranslations) => {
  isEdit.value = true;
  currentTab.value = defaultLang.value;
  editorRefs.value = {};
  
  const translations = initTranslations();
  row.translations.forEach((t) => {
    const idx = translations.findIndex((tr) => tr.lang === t.lang);
    if (idx >= 0) {
      translations[idx] = { ...t };
    }
  });

  formData.value = {
    content: { ...row.content },
    translations,
  };
  showModal.value = true;
};

const handleDelete = async (id: string) => {
  try {
    await contentApi.deleteContent(id);
    message.success('删除成功');
    fetchContents();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleSave = async () => {
  const defaultTrans = formData.value.translations.find(
    (t) => t.lang === defaultLang.value
  );
  if (!defaultTrans?.title) {
    message.warning('请填写默认语言的标题');
    return;
  }

  saving.value = true;
  try {
    const translationsWithContent = formData.value.translations.map((t) => {
      const editorRef = editorRefs.value[t.lang!];
      const content = editorRef?.getHTML() || t.content || '';
      return {
        lang: t.lang!,
        title: t.title!,
        summary: t.summary || '',
        content,
      };
    });

    const submitData = {
      categoryId: formData.value.content.categoryId!,
      coverImage: formData.value.content.coverImage || undefined,
      isMarquee: formData.value.content.isMarquee,
      isPopup: formData.value.content.isPopup,
      startTime: formData.value.content.startTime || undefined,
      endTime: formData.value.content.endTime || undefined,
      sortOrder: formData.value.content.sortOrder,
      status: formData.value.content.status,
      translations: translationsWithContent.filter((t) => t.title),
    };

    if (isEdit.value && formData.value.content.id) {
      await contentApi.updateContent(formData.value.content.id, submitData);
      message.success('更新成功');
    } else {
      await contentApi.createContent(submitData);
      message.success('创建成功');
    }
    showModal.value = false;
    fetchContents();
  } catch (error) {
    message.error(isEdit.value ? '更新失败' : '创建失败');
  } finally {
    saving.value = false;
  }
};

const getTranslation = (lang: string) => {
  let trans = formData.value.translations.find((t) => t.lang === lang);
  if (!trans) {
    trans = { lang, title: '', summary: '', content: '' };
    formData.value.translations.push(trans);
  }
  return trans;
};

const setEditorRef = (lang: string, el: InstanceType<typeof ToastEditor> | null) => {
  if (el) {
    editorRefs.value[lang] = el;
  }
};

watch(selectedCategory, () => {
  page.value = 1;
  fetchContents();
});

onMounted(() => {
  fetchLanguages();
  fetchCategories();
  fetchContents();
});
</script>

<template>
  <div class="p-4">
    <NCard title="内容管理">
      <template #header-extra>
        <NSpace>
          <NSelect
            v-model:value="selectedCategory"
            :options="[{ label: '全部分类', value: '' }, ...categoryOptions]"
            style="width: 150px"
            clearable
          />
          <NButton type="primary" @click="handleAdd">添加内容</NButton>
        </NSpace>
      </template>
      <NDataTable
        :columns="columns"
        :data="contents"
        :loading="loading"
        :pagination="{
          page: page,
          pageSize: pageSize,
          itemCount: total,
          onChange: (p) => { page = p; fetchContents(); }
        }"
        :scroll-x="1200"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      :title="isEdit ? '编辑内容' : '添加内容'"
      preset="card"
      style="width: 900px"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="分类" required>
          <NSelect
            v-model:value="formData.content.categoryId"
            :options="categoryOptions"
            style="width: 200px"
          />
        </NFormItem>
        <NFormItem label="封面图">
          <FileUpload
            v-model="formData.content.coverImage"
            upload-type="content"
            accept="image/*"
            :max-size="5 * 1024 * 1024"
          />
        </NFormItem>
        <NFormItem label="跑马灯">
          <NSwitch v-model:value="formData.content.isMarquee" />
        </NFormItem>
        <NFormItem label="弹窗显示">
          <NSwitch v-model:value="formData.content.isPopup" />
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
          <NInputNumber v-model:value="formData.content.sortOrder" :min="0" />
        </NFormItem>
        <NFormItem label="状态">
          <NSwitch
            :value="formData.content.status === 1"
            @update:value="formData.content.status = $event ? 1 : 0"
          />
        </NFormItem>

        <NFormItem label="内容翻译">
          <div class="translation-tabs">
            <NTabs v-model:value="currentTab" type="line">
              <NTabPane
                v-for="lang in supportedLanguages"
                :key="lang.code"
                :name="lang.code"
                :tab="`${lang.icon} ${lang.name}`"
              >
                <div class="translation-form">
                  <NFormItem label="标题" required>
                    <NInput
                      v-model:value="getTranslation(lang.code).title"
                      placeholder="请输入标题"
                    />
                  </NFormItem>
                  <NFormItem label="摘要">
                    <NInput
                      v-model:value="getTranslation(lang.code).summary"
                      type="textarea"
                      placeholder="请输入摘要"
                      :rows="2"
                    />
                  </NFormItem>
                  <NFormItem label="内容">
                    <ToastEditor
                      :ref="(el: any) => setEditorRef(lang.code, el)"
                      v-model:value="getTranslation(lang.code).content!"
                      mode="wysiwyg"
                      height="400px"
                      placeholder="请输入内容"
                      upload-type="content"
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
