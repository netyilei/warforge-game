<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import {
  NCard,
  NButton,
  NDataTable,
  NSpace,
  NInput,
  NSelect,
  NDatePicker,
  NGrid,
  NGridItem,
  NModal,
  NDescriptions,
  NDescriptionsItem,
  NPagination,
  useMessage,
  type DataTableColumns,
} from 'naive-ui';
import { operationLogApi, type OperationLog } from '@/service/api/operation-log';

const message = useMessage();

const loading = ref(false);
const logs = ref<OperationLog[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const showDetailModal = ref(false);
const selectedLog = ref<OperationLog | null>(null);

const searchParams = ref({
  username: '',
  action: '',
  targetType: '',
  timeRange: null as [number, number] | null,
});

const actionOptions = [
  { label: '全部', value: '' },
  { label: '登录', value: 'login' },
  { label: '登出', value: 'logout' },
  { label: '创建', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '查看', value: 'view' },
];

const targetTypeOptions = [
  { label: '全部', value: '' },
  { label: '管理员', value: 'admin' },
  { label: '角色', value: 'role' },
  { label: '权限', value: 'permission' },
  { label: '语言', value: 'language' },
  { label: '内容', value: 'content' },
  { label: '存储', value: 'storage' },
];

const columns: DataTableColumns<OperationLog> = [
  {
    title: '时间',
    key: 'createdAt',
    width: 180,
    render: (row) => new Date(row.createdAt).toLocaleString('zh-CN'),
  },
  {
    title: '操作人',
    key: 'username',
    width: 120,
  },
  {
    title: '操作类型',
    key: 'action',
    width: 100,
  },
  {
    title: '目标类型',
    key: 'targetType',
    width: 100,
  },
  {
    title: '目标ID',
    key: 'targetId',
    width: 100,
    ellipsis: { tooltip: true },
  },
  {
    title: 'IP地址',
    key: 'ip',
    width: 130,
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render: (row) =>
      h(
        NButton,
        {
          size: 'small',
          onClick: () => handleViewDetail(row),
        },
        () => '详情'
      ),
  },
];

const fetchLogs = async () => {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      pageSize: pageSize.value,
      username: searchParams.value.username,
      action: searchParams.value.action,
      targetType: searchParams.value.targetType,
    };

    if (searchParams.value.timeRange) {
      params.startTime = new Date(searchParams.value.timeRange[0]).toISOString();
      params.endTime = new Date(searchParams.value.timeRange[1]).toISOString();
    }

    const { data: res, error } = await operationLogApi.getLogs(params);
    if (error) {
      message.error('获取日志列表失败');
      return;
    }
    logs.value = res?.list || [];
    total.value = res?.total || 0;
  } catch (error) {
    message.error('获取日志列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchLogs();
};

const handleReset = () => {
  searchParams.value = {
    username: '',
    action: '',
    targetType: '',
    timeRange: null,
  };
  currentPage.value = 1;
  fetchLogs();
};

const handleViewDetail = (log: OperationLog) => {
  selectedLog.value = log;
  showDetailModal.value = true;
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchLogs();
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchLogs();
};

onMounted(() => {
  fetchLogs();
});
</script>

<template>
  <div class="p-4">
    <NCard title="后台操作日志">
      <template #header-extra>
        <NButton @click="fetchLogs">刷新</NButton>
      </template>

      <div class="search-bar">
        <NGrid :cols="5" :x-gap="12">
          <NGridItem>
            <NInput
              v-model:value="searchParams.username"
              placeholder="操作人"
              clearable
            />
          </NGridItem>
          <NGridItem>
            <NSelect
              v-model:value="searchParams.action"
              :options="actionOptions"
              placeholder="操作类型"
              clearable
            />
          </NGridItem>
          <NGridItem>
            <NSelect
              v-model:value="searchParams.targetType"
              :options="targetTypeOptions"
              placeholder="目标类型"
              clearable
            />
          </NGridItem>
          <NGridItem>
            <NDatePicker
              v-model:value="searchParams.timeRange"
              type="datetimerange"
              clearable
              class="w-full"
            />
          </NGridItem>
          <NGridItem>
            <NSpace>
              <NButton type="primary" @click="handleSearch">搜索</NButton>
              <NButton @click="handleReset">重置</NButton>
            </NSpace>
          </NGridItem>
        </NGrid>
      </div>

      <NDataTable
        :columns="columns"
        :data="logs"
        :loading="loading"
        :pagination="false"
        class="mt-4"
      />

      <div class="pagination-wrapper">
        <NPagination
          v-model:page="currentPage"
          v-model:page-size="pageSize"
          :item-count="total"
          :page-sizes="[10, 20, 50, 100]"
          show-size-picker
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </NCard>

    <NModal
      v-model:show="showDetailModal"
      title="日志详情"
      preset="card"
      style="width: 600px"
    >
      <NDescriptions label-placement="left" :column="1" bordered>
        <NDescriptionsItem label="操作时间">
          {{ selectedLog ? new Date(selectedLog.createdAt).toLocaleString('zh-CN') : '' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="操作人">
          {{ selectedLog?.username }}
        </NDescriptionsItem>
        <NDescriptionsItem label="操作类型">
          {{ selectedLog?.action }}
        </NDescriptionsItem>
        <NDescriptionsItem label="目标类型">
          {{ selectedLog?.targetType }}
        </NDescriptionsItem>
        <NDescriptionsItem label="目标ID">
          {{ selectedLog?.targetId }}
        </NDescriptionsItem>
        <NDescriptionsItem label="IP地址">
          {{ selectedLog?.ip }}
        </NDescriptionsItem>
        <NDescriptionsItem label="User-Agent">
          {{ selectedLog?.userAgent }}
        </NDescriptionsItem>
        <NDescriptionsItem label="详细信息">
          <pre class="details-pre">{{ selectedLog?.details }}</pre>
        </NDescriptionsItem>
      </NDescriptions>
    </NModal>
  </div>
</template>

<style scoped>
.search-bar {
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.w-full {
  width: 100%;
}

.details-pre {
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font-size: 12px;
}
</style>
