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
  NInputNumber,
  NSwitch,
  NPopconfirm,
  NTag,
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import { contentApi, type BannerPosition } from '@/service/api/content';

const message = useMessage();

const loading = ref(false);
const positions = ref<BannerPosition[]>([]);
const showModal = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const formData = ref<Partial<BannerPosition>>({});

const columns: DataTableColumns<BannerPosition> = [
  {
    title: '位置名称',
    key: 'name',
    width: 120,
  },
  {
    title: '位置标识',
    key: 'code',
    width: 120,
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: { tooltip: true },
  },
  {
    title: '宽度',
    key: 'width',
    width: 80,
    render: (row) => `${row.width}px`,
  },
  {
    title: '高度',
    key: 'height',
    width: 80,
    render: (row) => `${row.height}px`,
  },
  {
    title: '最大数量',
    key: 'maxItems',
    width: 100,
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
            default: () => '删除后该位置下的Banner也会被删除，确定删除吗？',
          }
        ),
      ]),
  },
];

const fetchPositions = async () => {
  loading.value = true;
  try {
    const { data: res, error } = await contentApi.getBannerPositions();
    if (error) {
      message.error('获取位置列表失败');
      return;
    }
    positions.value = res?.positions || [];
  } catch (error) {
    message.error('获取位置列表失败');
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
    width: 1200,
    height: 400,
    maxItems: 5,
    status: 1,
  };
  showModal.value = true;
};

const handleEdit = (row: BannerPosition) => {
  isEdit.value = true;
  formData.value = { ...row };
  showModal.value = true;
};

const handleDelete = async (id: string) => {
  try {
    await contentApi.deleteBannerPosition(id);
    message.success('删除成功');
    fetchPositions();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleSave = async () => {
  if (!formData.value.name || !formData.value.code) {
    message.warning('请填写位置名称和标识');
    return;
  }

  saving.value = true;
  try {
    if (isEdit.value) {
      await contentApi.updateBannerPosition(formData.value);
      message.success('更新成功');
    } else {
      await contentApi.createBannerPosition(formData.value);
      message.success('创建成功');
    }
    showModal.value = false;
    fetchPositions();
  } catch (error) {
    message.error(isEdit.value ? '更新失败' : '创建失败');
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="p-4">
    <NCard title="Banner位置管理">
      <template #header-extra>
        <NButton type="primary" @click="handleAdd">添加位置</NButton>
      </template>
      <NDataTable
        :columns="columns"
        :data="positions"
        :loading="loading"
        :pagination="false"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      :title="isEdit ? '编辑位置' : '添加位置'"
      preset="card"
      style="width: 500px"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="位置名称" required>
          <NInput v-model:value="formData.name" placeholder="请输入位置名称" />
        </NFormItem>
        <NFormItem label="位置标识" required>
          <NInput
            v-model:value="formData.code"
            placeholder="请输入位置标识（英文）"
            :disabled="isEdit"
          />
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="formData.description"
            type="textarea"
            placeholder="请输入位置描述"
          />
        </NFormItem>
        <NFormItem label="宽度(px)">
          <NInputNumber v-model:value="formData.width" :min="100" />
        </NFormItem>
        <NFormItem label="高度(px)">
          <NInputNumber v-model:value="formData.height" :min="50" />
        </NFormItem>
        <NFormItem label="最大数量">
          <NInputNumber v-model:value="formData.maxItems" :min="1" :max="20" />
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
