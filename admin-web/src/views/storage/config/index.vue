<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue';
import {
  NCard,
  NDataTable,
  NButton,
  NSpace,
  NTag,
  NPopconfirm,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  useMessage,
  NGrid,
  NGridItem,
  NDescriptions,
  NDescriptionsItem,
  NTooltip,
  NIcon,
  NUpload,
  NProgress,
  NAlert,
} from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui';
import dayjs from 'dayjs';
import { storageApi, type StorageConfig, type StorageDriver, testStorageConnection, uploadFile } from '@/service/api/v1/storage';
import { useSvgIcon } from '@/hooks/common/icon';

const message = useMessage();
const { SvgIconVNode } = useSvgIcon();

const loading = ref(false);
const configs = ref<StorageConfig[]>([]);
const drivers = ref<StorageDriver[]>([]);
const showModal = ref(false);
const modalLoading = ref(false);
const editingConfig = ref<Partial<StorageConfig>>({});
const isEdit = ref(false);
const testingConnection = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

const showUploadModal = ref(false);
const uploadLoading = ref(false);
const uploadProgress = ref(0);
const uploadResult = ref<{ success: boolean; filePath?: string; publicUrl?: string; error?: string } | null>(null);
const defaultStorage = computed(() => configs.value.find(c => c.isDefault && c.status === 1));

const columns = [
  {
    title: '名称',
    key: 'name',
    width: 120,
  },
  {
    title: '类型',
    key: 'driver',
    width: 120,
    render: (row: StorageConfig) => {
      const driverInfo = drivers.value.find(d => d.driver === row.driver);
      return h(NTag, { type: row.driver === 'cloudflare' ? 'success' : 'info' }, () => driverInfo?.name || row.driver);
    },
  },
  {
    title: 'Bucket',
    key: 'bucket',
    width: 150,
  },
  {
    title: 'Endpoint',
    key: 'endpoint',
    width: 200,
    ellipsis: { tooltip: true },
  },
  {
    title: '公共域名',
    key: 'publicDomain',
    width: 200,
    ellipsis: { tooltip: true },
  },
  {
    title: '最大文件',
    key: 'maxFileSize',
    width: 100,
    render: (row: StorageConfig) => formatFileSize(row.maxFileSize),
  },
  {
    title: '默认',
    key: 'isDefault',
    width: 80,
    render: (row: StorageConfig) => row.isDefault ? h(NTag, { type: 'success' }, () => '是') : '-',
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row: StorageConfig) => h(NTag, { type: row.status === 1 ? 'success' : 'error' }, () => row.status === 1 ? '启用' : '禁用'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    fixed: 'right' as const,
    render: (row: StorageConfig) => {
      return h(NSpace, {}, () => [
        h(NButton, {
          size: 'small',
          onClick: () => handleEdit(row),
        }, () => '编辑'),
        !row.isDefault ? h(NButton, {
          size: 'small',
          type: 'primary',
          onClick: () => handleSetDefault(row),
        }, () => '设为默认') : null,
        !row.isDefault ? h(NPopconfirm, {
          onPositiveClick: () => handleDelete(row),
        }, {
          trigger: () => h(NButton, {
            size: 'small',
            type: 'error',
          }, {
            icon: SvgIconVNode({ icon: 'carbon:trash-can', fontSize: 16 }),
          }),
          default: () => '确定删除此存储配置吗？',
        }) : null,
      ].filter(Boolean));
    },
  },
];

const driverOptions = computed(() => 
  drivers.value.map(d => ({
    label: d.name,
    value: d.driver,
  }))
);

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [configResult, driverResult] = await Promise.all([
      storageApi.getStorageConfigs(),
      storageApi.getStorageDrivers(),
    ]);
    configs.value = configResult.data?.configs || [];
    drivers.value = driverResult.data?.drivers || [];
  } catch (error) {
    message.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

const handleAdd = () => {
  isEdit.value = false;
  editingConfig.value = {
    driver: 'cloudflare',
    region: 'auto',
    maxFileSize: 10485760,
    isDefault: false,
    status: 1,
  };
  testResult.value = null;
  showModal.value = true;
};

const handleEdit = (row: StorageConfig) => {
  isEdit.value = true;
  editingConfig.value = { ...row };
  testResult.value = null;
  showModal.value = true;
};

const handleDelete = async (row: StorageConfig) => {
  try {
    await storageApi.deleteStorageConfig(row.id);
    message.success('删除成功');
    fetchData();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleSetDefault = async (row: StorageConfig) => {
  try {
    await storageApi.setDefaultStorage(row.id);
    message.success('设置成功');
    fetchData();
  } catch (error) {
    message.error('设置失败');
  }
};

const handleSubmit = async () => {
  modalLoading.value = true;
  try {
    if (isEdit.value) {
      await storageApi.updateStorageConfig(editingConfig.value);
      message.success('更新成功');
    } else {
      await storageApi.createStorageConfig(editingConfig.value);
      message.success('创建成功');
    }
    showModal.value = false;
    fetchData();
  } catch (error) {
    message.error(isEdit.value ? '更新失败' : '创建失败');
  } finally {
    modalLoading.value = false;
  }
};

const onDriverChange = (driver: string) => {
  const driverInfo = drivers.value.find(d => d.driver === driver);
  if (driverInfo) {
    editingConfig.value.region = driverInfo.region;
    if (driver === 'aws') {
      editingConfig.value.endpoint = '';
    }
  }
};

const handleTestConnection = async () => {
  if (!editingConfig.value.bucket || !editingConfig.value.accessKey || !editingConfig.value.secretKey) {
    message.warning('请先填写 Bucket、Access Key 和 Secret Key');
    return;
  }
  
  testingConnection.value = true;
  testResult.value = null;
  
  try {
    const result = await testStorageConnection({
      endpoint: editingConfig.value.endpoint || '',
      region: editingConfig.value.region || 'auto',
      bucket: editingConfig.value.bucket,
      accessKey: editingConfig.value.accessKey,
      secretKey: editingConfig.value.secretKey,
    });
    
    testResult.value = result;
    
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  } catch (error) {
    message.error('测试连接时发生错误');
  } finally {
    testingConnection.value = false;
  }
};

onMounted(() => {
  fetchData();
});

const handleOpenUploadTest = () => {
  if (!defaultStorage.value) {
    message.warning('请先设置默认存储配置');
    return;
  }
  uploadResult.value = null;
  uploadProgress.value = 0;
  showUploadModal.value = true;
};

const handleUpload = async ({ file }: { file: UploadFileInfo }) => {
  if (!defaultStorage.value) {
    message.error('没有可用的默认存储配置');
    return false;
  }
  
  uploadLoading.value = true;
  uploadProgress.value = 0;
  uploadResult.value = null;
  
  try {
    const result = await uploadFile(
      file.file as File,
      'admin_test',
      defaultStorage.value.id,
      (percent) => {
        uploadProgress.value = percent;
      }
    );
    
    uploadResult.value = {
      success: true,
      filePath: result.filePath,
      publicUrl: result.publicUrl,
    };
    message.success('上传成功');
  } catch (error) {
    uploadResult.value = {
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    };
    message.error('上传失败');
  } finally {
    uploadLoading.value = false;
  }
  
  return false;
};
</script>

<template>
  <div class="storage-config-container">
    <NGrid :cols="1" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard title="存储配置" :bordered="false">
          <template #header-extra>
            <NSpace>
              <NButton @click="handleOpenUploadTest">
                上传测试
              </NButton>
              <NButton type="primary" @click="handleAdd">
                添加配置
              </NButton>
            </NSpace>
          </template>
          
          <NDataTable
            :columns="columns"
            :data="configs"
            :loading="loading"
            :scroll-x="1200"
          />
        </NCard>
      </NGridItem>
    </NGrid>

    <NModal
      v-model:show="showModal"
      :title="isEdit ? '编辑存储配置' : '添加存储配置'"
      preset="card"
      style="width: 600px"
    >
      <NForm :model="editingConfig" label-placement="left" label-width="100">
        <NFormItem label="名称" path="name">
          <NInput v-model:value="editingConfig.name" placeholder="请输入配置名称" />
        </NFormItem>
        
        <NFormItem label="存储类型" path="driver">
          <NSelect
            v-model:value="editingConfig.driver"
            :options="driverOptions"
            :disabled="isEdit"
            @update:value="onDriverChange"
          />
        </NFormItem>
        
        <NFormItem label="Bucket" path="bucket">
          <NInput v-model:value="editingConfig.bucket" placeholder="存储桶名称" />
        </NFormItem>
        
        <NFormItem label="Endpoint" path="endpoint">
          <NInput 
            v-model:value="editingConfig.endpoint" 
            placeholder="留空则使用 AWS S3 默认端点"
          />
        </NFormItem>
        
        <NFormItem label="Region" path="region">
          <NInput v-model:value="editingConfig.region" placeholder="区域" />
        </NFormItem>
        
        <NFormItem label="Access Key" path="accessKey">
          <NInput v-model:value="editingConfig.accessKey" placeholder="访问密钥" />
        </NFormItem>
        
        <NFormItem label="Secret Key" path="secretKey">
          <NInput 
            v-model:value="editingConfig.secretKey" 
            type="password"
            placeholder="密钥"
          />
        </NFormItem>
        
        <NFormItem label="测试连接">
          <NSpace vertical>
            <NSpace align="center">
              <NButton 
                :loading="testingConnection" 
                @click="handleTestConnection"
              >
                测试连接
              </NButton>
              <NTooltip>
                <template #trigger>
                  <NIcon size="18" class="cursor-pointer text-gray-400 hover:text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm2-1.636V14h-2v-1.5a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.471-1.794l-1.962-.393A3.501 3.501 0 1 1 13 13.364z"/>
                    </svg>
                  </NIcon>
                </template>
                测试连接直接在前端执行。首次测试请确保已在存储服务商处配置CORS允许此域名访问，否则可能无法成功连接。本地开发环境可在CORS配置中添加 http://localhost:端口 允许访问。
              </NTooltip>
            </NSpace>
            <NTag v-if="testResult" :type="testResult.success ? 'success' : 'error'">
              {{ testResult.message }}
            </NTag>
          </NSpace>
        </NFormItem>
        
        <NFormItem label="公共域名" path="publicDomain">
          <NInput 
            v-model:value="editingConfig.publicDomain" 
            placeholder="https://cdn.example.com"
          />
        </NFormItem>
        
        <NFormItem label="最大文件" path="maxFileSize">
          <NInputNumber
            v-model:value="editingConfig.maxFileSize"
            :min="1"
            :max="10737418240"
            style="width: 100%"
          >
            <template #suffix>字节</template>
          </NInputNumber>
        </NFormItem>
        
        <NFormItem label="允许类型" path="allowedTypes">
          <NInput 
            v-model:value="editingConfig.allowedTypes" 
            placeholder="image/*,video/*,application/pdf"
          />
        </NFormItem>
        
        <NFormItem label="设为默认" path="isDefault">
          <NSwitch v-model:value="editingConfig.isDefault" />
        </NFormItem>
        
        <NFormItem label="状态" path="status">
          <NSwitch 
            :value="editingConfig.status === 1"
            @update:value="editingConfig.status = $event ? 1 : 0"
          />
        </NFormItem>
      </NForm>
      
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" :loading="modalLoading" @click="handleSubmit">
            {{ isEdit ? '更新' : '创建' }}
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal
      v-model:show="showUploadModal"
      title="上传测试"
      preset="card"
      style="width: 500px"
    >
      <NSpace vertical>
        <NAlert v-if="defaultStorage" type="info">
          使用存储配置: {{ defaultStorage.name }} ({{ defaultStorage.driver }})
        </NAlert>
        
        <NUpload
          :custom-request="handleUpload"
          :show-file-list="false"
          :disabled="uploadLoading"
        >
          <NButton :loading="uploadLoading">选择文件上传</NButton>
        </NUpload>
        
        <NProgress 
          v-if="uploadLoading" 
          type="line" 
          :percentage="uploadProgress" 
          :show-indicator="true"
        />
        
        <NAlert v-if="uploadResult" :type="uploadResult.success ? 'success' : 'error'">
          <template v-if="uploadResult.success">
            <p>上传成功！</p>
            <p>文件路径: {{ uploadResult.filePath }}</p>
            <p>访问地址: {{ uploadResult.publicUrl }}</p>
          </template>
          <template v-else>
            上传失败: {{ uploadResult.error }}
          </template>
        </NAlert>
      </NSpace>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.storage-config-container {
  padding: 20px;
}
</style>
