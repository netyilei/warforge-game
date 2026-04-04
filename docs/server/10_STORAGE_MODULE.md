# 存储模块文档

> 多云对象存储模块，支持 Cloudflare R2、AWS S3 等 S3 兼容存储服务

---

## 概述

存储模块提供统一的文件上传管理功能，支持多种 S3 兼容的对象存储服务。采用"服务端签名 + 客户端直传"模式，确保安全性和高效性。

---

## 支持的存储服务

| 服务商 | Driver | 特点 |
|--------|--------|------|
| **Cloudflare R2** | `cloudflare` | 无出站流量费用，全球 CDN ⭐ 推荐 |
| **AWS S3** | `aws` | 最成熟稳定，全球节点 |
| MinIO | `minio` | 自建私有存储，开发测试用 |
| DigitalOcean Spaces | `digitalocean` | 价格便宜 |
| Backblaze B2 | `backblaze` | 存储便宜，免费出站 |
| Wasabi | `wasabi` | 无出站费用 |

---

## 架构设计

### 上传流程

```
┌─────────┐    1. 请求上传权限     ┌─────────┐
│  前端   │ ───────────────────► │  后端   │
│         │                       │         │
│         │ ◄─────────────────── │         │
│         │    2. 返回预签名URL   │         │
│         │       + 新文件名      │         │
│         │                       └─────────┘
│         │
│         │    3. 直接上传文件     ┌─────────┐
│         │ ───────────────────► │   CDN   │
│         │                       │ 对象存储 │
│         │ ◄─────────────────── │         │
│         │    4. 上传成功        └─────────┘
│         │
│         │    5. 通知后端上传完成  ┌─────────┐
│         │ ───────────────────► │  后端   │
└─────────┘                       └─────────┘
```

### 优势

1. **安全**：密钥不暴露给前端
2. **高效**：文件不经过后端服务器
3. **灵活**：后端控制上传权限和路径
4. **可追溯**：记录谁上传了什么

---

## 后端实现

### 目录结构

```
d:\geme\server\
├── models\
│   ├── storage_config.go     # 存储配置模型
│   └── upload_record.go      # 上传记录模型
├── modules\
│   ├── storage\
│   │   └── storage.go        # 存储核心逻辑
│   └── admin\
│       └── storage.go        # 存储 API 接口
└── migrations\
    └── 009_add_storage_module.sql
```

### 数据库表

#### storage_configs

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(50) | 配置名称 |
| driver | VARCHAR(20) | 驱动类型 |
| bucket | VARCHAR(100) | 存储桶 |
| endpoint | VARCHAR(255) | 端点地址 |
| region | VARCHAR(50) | 区域 |
| access_key | VARCHAR(255) | 访问密钥 |
| secret_key | VARCHAR(255) | 密钥（加密存储） |
| public_domain | VARCHAR(255) | 公共访问域名 |
| max_file_size | BIGINT | 最大文件大小 |
| allowed_types | VARCHAR(500) | 允许的文件类型 |
| is_default | BOOLEAN | 是否默认 |
| status | SMALLINT | 状态 |

#### upload_records

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 上传用户 |
| user_type | VARCHAR(20) | 用户类型 |
| original_name | VARCHAR(255) | 原始文件名 |
| file_path | VARCHAR(500) | 存储路径 |
| file_size | BIGINT | 文件大小 |
| mime_type | VARCHAR(100) | MIME 类型 |
| storage_id | UUID | 使用的存储配置 |
| upload_type | VARCHAR(50) | 上传类型 |
| created_at | TIMESTAMP | 创建时间 |

### API 接口

| RPC 函数 | 功能 |
|---------|------|
| `admin_get_storage_configs` | 获取存储配置列表 |
| `admin_get_storage_config` | 获取单个配置 |
| `admin_create_storage_config` | 创建配置 |
| `admin_update_storage_config` | 更新配置 |
| `admin_delete_storage_config` | 删除配置 |
| `admin_set_default_storage` | 设为默认 |
| `admin_get_storage_drivers` | 获取支持的驱动列表 |
| `admin_get_upload_records` | 获取上传记录 |
| `admin_delete_upload_record` | 删除上传记录 |
| `admin_get_presigned_upload` | 获取预签名上传 URL |
| `admin_confirm_upload` | 确认上传完成 |

### 核心代码示例

```go
// 生成预签名上传 URL
func (c *StorageClient) GeneratePresignedUploadURL(ctx context.Context, uploadType, userID, originalFilename string, expiresIn time.Duration) (*PresignedUploadResult, error) {
    ext := filepath.Ext(originalFilename)
    timestamp := time.Now().Format("20060102/150405")
    filePath := fmt.Sprintf("%s/%s/%s%s", uploadType, userID, timestamp, ext)

    presignedReq, err := c.presigner.PresignPutObject(ctx, &s3.PutObjectInput{
        Bucket: aws.String(c.config.Bucket),
        Key:    aws.String(filePath),
    }, func(opts *s3.PresignOptions) {
        opts.Expires = expiresIn
    })

    return &PresignedUploadResult{
        UploadURL: presignedReq.URL,
        Method:    presignedReq.Method,
        FilePath:  filePath,
        ExpiresIn: int(expiresIn.Seconds()),
    }, nil
}
```

---

## 前端实现

### 目录结构

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

### API 服务

```typescript
// 获取预签名上传 URL
const presigned = await storageApi.getPresignedUpload('avatar', 'image.png');

// 上传文件
const result = await uploadFile(file, 'avatar', storageId, (percent) => {
  console.log(`上传进度: ${percent}%`);
});

console.log('文件路径:', result.filePath);
console.log('公共 URL:', result.publicUrl);
```

### 上传组件使用

```vue
<template>
  <FileUpload
    v-model="avatarUrl"
    upload-type="avatar"
    accept="image/*"
    :max-size="5 * 1024 * 1024"
    @success="handleUploadSuccess"
  />
</template>

<script setup>
import FileUpload from '@/components/file-upload.vue';

const avatarUrl = ref('');

const handleUploadSuccess = (data) => {
  console.log('上传成功:', data.filePath, data.publicUrl);
};
</script>
```

### 组件 Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| uploadType | string | - | 上传类型（必填） |
| accept | string | '*' | 接受的文件类型 |
| maxSize | number | 10MB | 最大文件大小（字节） |
| storageId | string | - | 指定存储配置 ID |
| modelValue | string | '' | 已上传文件的 URL |

### 组件 Events

| 事件 | 参数 | 说明 |
|------|------|------|
| update:modelValue | filePath | 更新 v-model 值 |
| success | { filePath, publicUrl } | 上传成功 |
| error | Error | 上传失败 |

---

## 配置示例

### Cloudflare R2

```
名称: Cloudflare R2
驱动: cloudflare
Bucket: my-bucket
Endpoint: https://<account_id>.r2.cloudflarestorage.com
Region: auto
Access Key: <R2 Access Key ID>
Secret Key: <R2 Secret Access Key>
公共域名: https://cdn.mygame.com
最大文件: 10485760 (10MB)
```

### AWS S3

```
名称: AWS S3
驱动: aws
Bucket: my-bucket
Endpoint: (留空使用默认)
Region: us-east-1
Access Key: <AWS Access Key ID>
Secret Key: <AWS Secret Access Key>
公共域名: https://my-bucket.s3.amazonaws.com
最大文件: 10485760 (10MB)
```

---

## 菜单与权限

### 菜单结构

```
存储
├── 存储配置
└── 上传记录
```

### 权限代码

| 权限 | 代码 |
|------|------|
| 查看存储配置 | `storage:config:view` |
| 创建存储配置 | `storage:config:create` |
| 编辑存储配置 | `storage:config:edit` |
| 删除存储配置 | `storage:config:delete` |
| 查看上传记录 | `storage:records:view` |
| 删除上传记录 | `storage:records:delete` |

---

## 最佳实践

### 1. 存储配置管理

- 至少配置一个默认存储
- 生产环境使用 Cloudflare R2 或 AWS S3
- 开发测试可使用 MinIO

### 2. 文件路径规范

```
{uploadType}/{userID}/{timestamp}.{ext}

示例：
avatar/admin-uuid/20260403/143015.png
document/player-uuid/20260403/143015.pdf
```

### 3. 安全建议

- 定期轮换 Access Key
- 设置合理的文件大小限制
- 配置 CORS 规则限制来源
- 使用 CDN 加速访问

### 4. 错误处理

```typescript
try {
  const result = await uploadFile(file, 'avatar');
} catch (error) {
  if (error.message.includes('exceeds maximum')) {
    message.error('文件大小超过限制');
  } else {
    message.error('上传失败，请重试');
  }
}
```

---

## 相关文档

- [RED_LINES.md](../RED_LINES.md) - 项目红线文档
- [01_ADMIN_MODULE.md](./01_ADMIN_MODULE.md) - 管理后台模块
- [05_DATABASE_DESIGN.md](./05_DATABASE_DESIGN.md) - 数据库设计
