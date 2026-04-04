# 存储模块前端文档

> 多云对象存储模块前端实现，包含存储配置管理、上传记录管理和文件上传组件

---

## 概述

存储模块前端提供：
- 存储配置管理页面
- 上传记录查看页面
- 通用文件上传组件

---

## 目录结构

```
d:\geme\admin-web\src\
├── service\api\
│   └── storage.ts           # 存储 API 服务
├── components\
│   └── file-upload.vue      # 文件上传组件
└── views\storage\
    ├── config\index.vue     # 存储配置管理
    └── records\index.vue    # 上传记录管理
```

---

## API 服务 (storage.ts)

### 接口定义

```typescript
export const storageApi = {
  // 存储配置管理
  getStorageConfigs: () => nakamaRpc<{ configs: StorageConfig[] }>('admin_get_storage_configs', {}),
  getStorageConfig: (id: string) => nakamaRpc<StorageConfig>('admin_get_storage_config', { id }),
  createStorageConfig: (config: Partial<StorageConfig>) => nakamaRpc<StorageConfig>('admin_create_storage_config', config),
  updateStorageConfig: (config: Partial<StorageConfig>) => nakamaRpc<StorageConfig>('admin_update_storage_config', config),
  deleteStorageConfig: (id: string) => nakamaRpc<{ success: boolean }>('admin_delete_storage_config', { id }),
  setDefaultStorage: (id: string) => nakamaRpc<{ success: boolean }>('admin_set_default_storage', { id }),
  getStorageDrivers: () => nakamaRpc<{ drivers: StorageDriver[] }>('admin_get_storage_drivers', {}),

  // 上传记录管理
  getUploadRecords: (page, pageSize, userType?, uploadType?) => nakamaRpc<{ list, total }>('admin_get_upload_records', { ... }),
  deleteUploadRecord: (id: string) => nakamaRpc<{ success: boolean }>('admin_delete_upload_record', { id }),

  // 预签名上传
  getPresignedUpload: (uploadType, originalFilename, storageId?) => nakamaRpc<PresignedUploadResult>('admin_get_presigned_upload', { ... }),
  confirmUpload: (data) => nakamaRpc<{ success: boolean }>('admin_confirm_upload', data),
};
```

### 文件上传函数

```typescript
export const uploadFile = async (
  file: File,
  uploadType: string,
  storageId?: string,
  onProgress?: (percent: number) => void
): Promise<{ filePath: string; publicUrl: string }> => {
  // 1. 获取预签名 URL
  const presigned = await storageApi.getPresignedUpload(uploadType, file.name, storageId);

  // 2. 检查文件大小
  if (file.size > presigned.maxFileSize) {
    throw new Error(`File size exceeds maximum allowed size`);
  }

  // 3. 直接上传到对象存储
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // 4. 确认上传
        await storageApi.confirmUpload({ ... });
        resolve({ filePath, publicUrl });
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.open(presigned.method, presigned.uploadUrl);
    Object.entries(presigned.headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    xhr.send(file);
  });
};
```

---

## 文件上传组件 (file-upload.vue)

### 基本使用

```vue
<template>
  <FileUpload
    v-model="avatarUrl"
    upload-type="avatar"
    accept="image/*"
    :max-size="5 * 1024 * 1024"
    @success="handleSuccess"
    @error="handleError"
  />
</template>

<script setup lang="ts">
import FileUpload from '@/components/file-upload.vue';

const avatarUrl = ref('');

const handleSuccess = (data) => {
  console.log('上传成功:', data.filePath, data.publicUrl);
};

const handleError = (error) => {
  console.error('上传失败:', error);
};
</script>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| uploadType | string | - | 上传类型（必填），如 `avatar`, `document`, `image` |
| accept | string | '*' | 接受的文件类型，如 `image/*`, `.pdf,.doc` |
| maxSize | number | 10485760 | 最大文件大小（字节），默认 10MB |
| storageId | string | - | 指定存储配置 ID，不填使用默认配置 |
| modelValue | string | '' | 已上传文件的 URL（支持 v-model） |

### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| update:modelValue | filePath: string | 更新 v-model 值 |
| success | { filePath, publicUrl } | 上传成功回调 |
| error | error: Error | 上传失败回调 |

### 功能特性

- 图片预览（自动检测图片类型）
- 上传进度显示
- 文件类型验证
- 文件大小验证
- 删除已上传文件

---

## 存储配置页面

### 功能

- 查看存储配置列表
- 创建新存储配置
- 编辑现有配置
- 删除配置（非默认配置）
- 设置默认存储

### 支持的存储类型

| 类型 | 名称 | 说明 |
|------|------|------|
| cloudflare | Cloudflare R2 | 无出站流量费用 ⭐ |
| aws | AWS S3 | 最成熟稳定 |
| minio | MinIO | 自建私有存储 |
| digitalocean | DigitalOcean Spaces | 价格便宜 |
| backblaze | Backblaze B2 | 存储便宜 |
| wasabi | Wasabi | 无出站费用 |

### 配置字段

| 字段 | 说明 |
|------|------|
| 名称 | 配置显示名称 |
| 存储类型 | 选择存储服务商 |
| Bucket | 存储桶名称 |
| Endpoint | 端点地址（AWS S3 可留空） |
| Region | 区域 |
| Access Key | 访问密钥 |
| Secret Key | 密钥 |
| 公共域名 | CDN 域名，用于生成公开访问 URL |
| 最大文件 | 单文件最大大小 |
| 允许类型 | 允许的 MIME 类型 |

---

## 上传记录页面

### 功能

- 查看所有上传记录
- 按用户类型筛选
- 按上传类型筛选
- 删除记录（同时删除存储文件）

### 显示字段

| 字段 | 说明 |
|------|------|
| ID | 记录 ID |
| 用户 | 上传用户 |
| 用户类型 | admin / player |
| 原文件名 | 上传时的原始文件名 |
| 存储路径 | CDN 上的存储路径 |
| 文件大小 | 文件大小 |
| 类型 | MIME 类型 |
| 上传类型 | avatar / document / image 等 |
| 存储 | 使用的存储配置名称 |
| 上传时间 | 上传时间 |

---

## 使用示例

### 头像上传

```vue
<template>
  <NFormItem label="头像">
    <FileUpload
      v-model="form.avatar"
      upload-type="avatar"
      accept="image/jpeg,image/png,image/gif"
      :max-size="2 * 1024 * 1024"
    />
  </NFormItem>
</template>
```

### 文档上传

```vue
<template>
  <NFormItem label="证件">
    <FileUpload
      v-model="form.document"
      upload-type="document"
      accept=".pdf,.jpg,.jpeg,.png"
      :max-size="10 * 1024 * 1024"
    />
  </NFormItem>
</template>
```

### 图片上传（带预览）

```vue
<template>
  <FileUpload
    v-model="imageUrl"
    upload-type="image"
    accept="image/*"
    :max-size="5 * 1024 * 1024"
    @success="handleImageUploaded"
  />
</template>

<script setup>
const handleImageUploaded = (data) => {
  // data.publicUrl 可以直接用于显示
  console.log('图片 URL:', data.publicUrl);
};
</script>
```

---

## 注意事项

1. **上传类型**：`uploadType` 参数用于区分不同业务场景，文件会存储在对应目录下
2. **文件大小**：前端和后端都会校验文件大小，以后端配置为准
3. **文件类型**：`accept` 属性支持 MIME 类型和扩展名两种格式
4. **进度显示**：上传过程中会显示进度条和百分比
5. **错误处理**：上传失败会通过 `error` 事件通知，需要自行处理提示

---

## 相关文档

- [10_STORAGE_MODULE.md](../../server/10_STORAGE_MODULE.md) - 存储模块后端文档
- [02_API_LAYER.md](./02_API_LAYER.md) - API 层设计
- [05_ICON_GUIDE.md](./05_ICON_GUIDE.md) - 图标使用指南
