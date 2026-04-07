<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue';
import {
  NCard,
  NDataTable,
  NButton,
  NSpace,
  NTag,
  NPopconfirm,
  NSelect,
  useMessage,
  NGrid,
  NGridItem,
} from 'naive-ui';
import dayjs from 'dayjs';
import { storageApi, type UploadRecord } from '@/service/api/v1/storage';
import { useSvgIcon } from '@/hooks/common/icon';

const message = useMessage();
const { SvgIconVNode } = useSvgIcon();

const loading = ref(false);
const data = ref<UploadRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const userTypeFilter = ref<string>('');
const uploadTypeFilter = ref<string>('');

const userTypeOptions = [
  { label: '全部', value: '' },
  { label: '管理员', value: 'admin' },
  { label: '玩家', value: 'player' },
];

const uploadTypeOptions = [
  { label: '全部', value: '' },
  { label: '头像', value: 'avatar' },
  { label: '文档', value: 'document' },
  { label: '图片', value: 'image' },
  { label: '其他', value: 'other' },
];

const formatFileSize = (bytes: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
};

const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 280,
    ellipsis: { tooltip: true },
  },
  {
    title: '用户',
    key: 'userName',
    width: 120,
    render: (row: UploadRecord) => row.userName || row.userId?.substring(0, 8) || '-',
  },
  {
    title: '用户类型',
    key: 'userType',
    width: 100,
    render: (row: UploadRecord) => h(NTag, { 
      type: row.userType === 'admin' ? 'info' : 'success' 
    }, () => row.userType === 'admin' ? '管理员' : '玩家'),
  },
  {
    title: '原文件名',
    key: 'originalName',
    width: 200,
    ellipsis: { tooltip: true },
  },
  {
    title: '存储路径',
    key: 'filePath',
    width: 250,
    ellipsis: { tooltip: true },
    render: (row: UploadRecord) => {
      if (!row.fileUrl) return row.filePath || '-';
      return h('span', {
        style: 'color: #2080f0; cursor: pointer;',
        onClick: () => window.open(row.fileUrl, '_blank'),
      }, row.filePath);
    },
  },
  {
    title: '文件大小',
    key: 'fileSize',
    width: 100,
    render: (row: UploadRecord) => formatFileSize(row.fileSize),
  },
  {
    title: '类型',
    key: 'mimeType',
    width: 120,
    ellipsis: { tooltip: true },
  },
  {
    title: '上传类型',
    key: 'uploadType',
    width: 100,
    render: (row: UploadRecord) => h(NTag, { type: 'warning' }, () => row.uploadType || '-'),
  },
  {
    title: '存储',
    key: 'storageName',
    width: 120,
    render: (row: UploadRecord) => row.storageName || '-',
  },
  {
    title: '上传时间',
    key: 'createdAt',
    width: 180,
    render: (row: UploadRecord) => dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    fixed: 'right' as const,
    render: (row: UploadRecord) => {
      return h(NPopconfirm, {
        onPositiveClick: () => handleDelete(row),
      }, {
        trigger: () => h(NButton, {
          size: 'small',
          type: 'error',
        }, {
          icon: SvgIconVNode({ icon: 'carbon:trash-can', fontSize: 16 }),
        }),
        default: () => '确定删除此记录吗？文件也将从存储中删除。',
      });
    },
  },
];

const pagination = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  onChange: (p: number) => {
    page.value = p;
    fetchData();
  },
  onUpdatePageSize: (ps: number) => {
    pageSize.value = ps;
    page.value = 1;
    fetchData();
  },
}));

const fetchData = async () => {
  loading.value = true;
  try {
    const { data: res, error } = await storageApi.getUploadRecords(
      page.value, 
      pageSize.value,
      userTypeFilter.value || undefined,
      uploadTypeFilter.value || undefined
    );
    if (error) {
      message.error('获取数据失败');
      return;
    }
    data.value = res?.list || [];
    total.value = res?.total || 0;
  } catch (error) {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

const handleDelete = async (row: UploadRecord) => {
  try {
    await storageApi.deleteUploadRecord(row.id);
    message.success('删除成功');
    fetchData();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleFilter = () => {
  page.value = 1;
  fetchData();
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="storage-records-container">
    <NGrid :cols="1" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard title="上传记录" :bordered="false">
          <template #header-extra>
            <NSpace>
              <NSelect
                v-model:value="userTypeFilter"
                :options="userTypeOptions"
                placeholder="用户类型"
                style="width: 120px"
                @update:value="handleFilter"
              />
              <NSelect
                v-model:value="uploadTypeFilter"
                :options="uploadTypeOptions"
                placeholder="上传类型"
                style="width: 120px"
                @update:value="handleFilter"
              />
            </NSpace>
          </template>
          
          <NDataTable
            :columns="columns"
            :data="data"
            :loading="loading"
            :pagination="pagination"
            :scroll-x="1600"
          />
        </NCard>
      </NGridItem>
    </NGrid>
  </div>
</template>

<style scoped lang="scss">
.storage-records-container {
  padding: 20px;
}
</style>
