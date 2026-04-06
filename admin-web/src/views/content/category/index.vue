<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
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
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import { Icon } from '@iconify/vue';
import { contentApi, type ContentCategory } from '@/service/api/v2/content';
import IconPicker from '@/components/common/icon-picker.vue';

const message = useMessage();

const loading = ref(false);
const categories = ref<ContentCategory[]>([]);
const showModal = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const formData = ref<Partial<ContentCategory>>({});

const contentTypeOptions = [
  { label: '纯文本', value: 'text' },
  { label: 'HTML', value: 'html' },
  { label: 'Markdown', value: 'markdown' },
];

const columns: DataTableColumns<ContentCategory> = [
  {
    title: '图标',
    key: 'icon',
    width: 60,
    render: (row) =>
      row.icon
        ? h(Icon, { icon: row.icon, class: 'icon' })
        : h('span', { class: 'icon' }, '📄'),
  },
  {
    title: '分类名称',
    key: 'name',
    width: 120,
  },
  {
    title: '分类标识',
    key: 'code',
    width: 120,
  },
  {
    title: '内容类型',
    key: 'contentType',
    width: 100,
    render: (row) => {
      const typeMap: Record<string, string> = {
        text: '纯文本',
        html: 'HTML',
        markdown: 'Markdown',
      };
      return typeMap[row.contentType] || row.contentType;
    },
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: { tooltip: true },
  },
  {
    title: '排序',
    key: 'sortOrder',
    width: 80,
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
    width: 150,
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
            onPositiveClick: () => handleDelete(row.id),
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
            default: () => '确定删除此分类吗？',
          }
        ),
      ]),
  },
];

const fetchCategories = async () => {
  loading.value = true;
  try {
    const { data: res, error } = await contentApi.getCategories();
    if (error) {
      message.error('获取分类列表失败');
      return;
    }
    categories.value = res?.categories || [];
  } catch (error) {
    message.error('获取分类列表失败');
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  isEdit.value = false;
  formData.value = {
    name: '',
    code: '',
    description: '',
    contentType: 'html',
    icon: 'carbon:document',
    sortOrder: categories.value.length + 1,
    status: 1,
  };
  showModal.value = true;
};

const handleEdit = (row: ContentCategory) => {
  isEdit.value = true;
  formData.value = { ...row };
  showModal.value = true;
};

const handleDelete = async (id: string) => {
  try {
    await contentApi.deleteCategory(id);
    message.success('删除成功');
    fetchCategories();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleSave = async () => {
  if (!formData.value.name || !formData.value.code) {
    message.warning('请填写分类名称和标识');
    return;
  }

  saving.value = true;
  try {
    if (isEdit.value) {
      await contentApi.updateCategory(formData.value);
      message.success('更新成功');
    } else {
      await contentApi.createCategory(formData.value);
      message.success('创建成功');
    }
    showModal.value = false;
    fetchCategories();
  } catch (error) {
    message.error(isEdit.value ? '更新失败' : '创建失败');
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="p-4">
    <NCard title="内容分类管理">
      <template #header-extra>
        <NButton type="primary" @click="handleAdd">添加分类</NButton>
      </template>
      <NDataTable
        :columns="columns"
        :data="categories"
        :loading="loading"
        :pagination="false"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      :title="isEdit ? '编辑分类' : '添加分类'"
      preset="card"
      style="width: 500px"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="分类名称" required>
          <NInput v-model:value="formData.name" placeholder="请输入分类名称" />
        </NFormItem>
        <NFormItem label="分类标识" required>
          <NInput
            v-model:value="formData.code"
            placeholder="请输入分类标识（英文）"
            :disabled="isEdit"
          />
        </NFormItem>
        <NFormItem label="内容类型">
          <NSelect
            v-model:value="formData.contentType"
            :options="contentTypeOptions"
          />
        </NFormItem>
        <NFormItem label="图标">
          <IconPicker v-model:value="formData.icon" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入分类描述"
          />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber v-model:value="formData.sortOrder" :min="0" />
        </NFormItem>
        <NFormItem label="状态">
          <NSwitch
            :value="formData.status === 1"
            @update:value="formData.status = $event ? 1 : 0"
          />
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
.icon {
  font-size: 20px;
}
</style>
