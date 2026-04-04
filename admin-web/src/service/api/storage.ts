import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { request } from '../request';

export interface StorageConfig {
  id: string;
  name: string;
  driver: string;
  bucket: string;
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
  publicDomain: string;
  maxFileSize: number;
  allowedTypes: string;
  isDefault: boolean;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface StorageDriver {
  driver: string;
  name: string;
  description: string;
  endpointTpl: string;
  region: string;
}

export interface UploadRecord {
  id: string;
  userId: string;
  userType: string;
  userName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  storageId: string;
  storageName: string;
  uploadType: string;
  createdAt: string;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  filePath: string;
  publicUrl: string;
  expiresIn: number;
  maxFileSize: number;
  storageId: string;
}

export const storageApi = {
  getStorageConfigs: () =>
    request<{ configs: StorageConfig[] }>({
      url: '/storage/configs',
      method: 'GET'
    }),

  getStorageConfig: (id: string) =>
    request<StorageConfig>({
      url: `/storage/config/${id}`,
      method: 'GET'
    }),

  createStorageConfig: (config: Partial<StorageConfig>) =>
    request<StorageConfig>({
      url: '/storage/config',
      method: 'POST',
      data: config
    }),

  updateStorageConfig: (config: Partial<StorageConfig>) =>
    request<StorageConfig>({
      url: `/storage/config/${config.id}`,
      method: 'PUT',
      data: config
    }),

  deleteStorageConfig: (id: string) =>
    request<{ success: boolean }>({
      url: `/storage/config/${id}`,
      method: 'DELETE'
    }),

  setDefaultStorage: (id: string) =>
    request<{ success: boolean }>({
      url: `/storage/config/${id}/default`,
      method: 'PUT'
    }),

  getStorageDrivers: () =>
    request<{ drivers: StorageDriver[] }>({
      url: '/storage/drivers',
      method: 'GET'
    }),

  getUploadRecords: (page: number = 1, pageSize: number = 20, userType?: string, uploadType?: string) =>
    request<{ list: UploadRecord[]; total: number; page: number; pageSize: number }>({
      url: '/storage/records',
      method: 'GET',
      params: {
        page,
        pageSize,
        userType: userType || '',
        uploadType: uploadType || ''
      }
    }),

  deleteUploadRecord: (id: string) =>
    request<{ success: boolean }>({
      url: `/storage/record/${id}`,
      method: 'DELETE'
    }),

  getPresignedUpload: (uploadType: string, originalFilename: string, storageId?: string) =>
    request<PresignedUploadResult>({
      url: '/storage/presigned',
      method: 'POST',
      data: {
        uploadType,
        originalFilename,
        storageId: storageId || ''
      }
    }),

  confirmUpload: (data: {
    filePath: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    storageId: string;
    uploadType: string;
  }) =>
    request<{ success: boolean }>({
      url: '/storage/confirm',
      method: 'POST',
      data
    })
};

export const uploadFile = async (
  file: File,
  uploadType: string,
  storageId?: string,
  onProgress?: (percent: number) => void
): Promise<{ filePath: string; publicUrl: string }> => {
  const presignedResult = await storageApi.getPresignedUpload(uploadType, file.name, storageId);

  if (presignedResult.error) {
    throw new Error(presignedResult.error.message || 'Failed to get presigned upload URL');
  }

  const presigned = presignedResult.data;

  if (file.size > presigned.maxFileSize) {
    throw new Error(`File size exceeds maximum allowed size of ${presigned.maxFileSize} bytes`);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const confirmResult = await storageApi.confirmUpload({
            filePath: presigned.filePath,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            storageId: presigned.storageId,
            uploadType,
          });

          if (confirmResult.error) {
            reject(new Error(confirmResult.error.message || 'Failed to confirm upload'));
            return;
          }

          resolve({
            filePath: presigned.filePath,
            publicUrl: presigned.publicUrl,
          });
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open(presigned.method, presigned.uploadUrl);

    Object.entries(presigned.headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.send(file);
  });
};

export interface TestConnectionResult {
  success: boolean;
  message: string;
  error?: string;
}

export const testStorageConnection = async (config: {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
}): Promise<TestConnectionResult> => {
  try {
    const client = new S3Client({
      region: config.region || 'auto',
      endpoint: config.endpoint || undefined,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: config.endpoint ? !config.endpoint.includes('.amazonaws.com') : false,
    });

    const command = new ListObjectsV2Command({
      Bucket: config.bucket,
      MaxKeys: 1,
    });

    await client.send(command);

    return {
      success: true,
      message: '连接成功！存储配置有效。',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    let friendlyMessage = '连接失败';
    if (errorMessage.includes('Access Denied') || errorMessage.includes('403')) {
      friendlyMessage = '访问被拒绝，请检查 Access Key 和 Secret Key 是否正确';
    } else if (errorMessage.includes('NoSuchBucket') || errorMessage.includes('404')) {
      friendlyMessage = '存储桶不存在，请检查 Bucket 名称是否正确';
    } else if (errorMessage.includes('InvalidAccessKeyId')) {
      friendlyMessage = 'Access Key 无效';
    } else if (errorMessage.includes('SignatureDoesNotMatch')) {
      friendlyMessage = 'Secret Key 不正确';
    } else if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
      friendlyMessage = '网络连接失败，请检查 Endpoint 是否正确';
    } else if (errorMessage.includes('CORS')) {
      friendlyMessage = 'CORS 配置错误，请在存储服务中配置允许此域名访问';
    }

    return {
      success: false,
      message: friendlyMessage,
      error: errorMessage,
    };
  }
};
