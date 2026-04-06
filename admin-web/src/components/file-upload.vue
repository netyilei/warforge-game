<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  NUpload,
  NButton,
  NProgress,
  NImage,
  NIcon,
  NText,
  NSpace,
  useMessage,
  type UploadFileInfo,
} from 'naive-ui';
import { uploadFile } from '@/service/api/v1/storage';

interface Props {
  uploadType: string;
  accept?: string;
  maxSize?: number;
  storageId?: string;
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  accept: '*',
  maxSize: 10 * 1024 * 1024,
  modelValue: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'success', data: { filePath: string; publicUrl: string }): void;
  (e: 'error', error: Error): void;
}>();

const message = useMessage();
const uploading = ref(false);
const uploadProgress = ref(0);
const previewUrl = ref(props.modelValue);

const isImage = computed(() => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  return props.accept.split(',').some(type => 
    imageTypes.some(imgType => type.trim().includes(imgType.replace('image/', '')))
  );
});

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
};

const handleUpload = async ({ file }: { file: UploadFileInfo }) => {
  if (!file.file) {
    message.error('文件无效');
    return false;
  }

  if (file.file.size > props.maxSize) {
    message.error(`文件大小超过限制 (${formatFileSize(props.maxSize)})`);
    return false;
  }

  uploading.value = true;
  uploadProgress.value = 0;

  try {
    const result = await uploadFile(
      file.file,
      props.uploadType,
      props.storageId,
      (percent) => {
        uploadProgress.value = percent;
      }
    );

    previewUrl.value = result.publicUrl || result.filePath;
    emit('update:modelValue', result.publicUrl || result.filePath);
    emit('success', result);
    message.success('上传成功');
  } catch (error) {
    message.error('上传失败');
    emit('error', error as Error);
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }

  return false;
};

const handleRemove = () => {
  previewUrl.value = '';
  emit('update:modelValue', '');
};

const beforeUpload = (data: { file: UploadFileInfo }) => {
  if (props.accept !== '*') {
    const acceptedTypes = props.accept.split(',').map(t => t.trim());
    const fileType = data.file.type || '';
    const fileExt = '.' + data.file.name.split('.').pop()?.toLowerCase();
    
    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExt === type.toLowerCase();
      }
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', '/'));
      }
      return fileType === type;
    });

    if (!isAccepted) {
      message.error(`不支持的文件类型，仅支持: ${props.accept}`);
      return false;
    }
  }
  return true;
};
</script>

<template>
  <div class="file-upload">
    <div v-if="previewUrl && isImage" class="preview-container">
      <NImage
        :src="previewUrl"
        :width="120"
        :height="120"
        object-fit="cover"
        class="preview-image"
      />
      <NButton
        size="small"
        type="error"
        circle
        class="remove-btn"
        @click="handleRemove"
      >
        <template #icon>
          <span class="i-carbon-close"></span>
        </template>
      </NButton>
    </div>
    
    <div v-else-if="previewUrl" class="file-preview">
      <NSpace align="center">
        <NIcon size="24" class="i-carbon-document"></NIcon>
        <NText>{{ previewUrl.split('/').pop() }}</NText>
        <NButton size="small" type="error" @click="handleRemove">
          删除
        </NButton>
      </NSpace>
    </div>
    
    <NUpload
      v-else
      :accept="accept"
      :show-file-list="false"
      :custom-request="handleUpload"
      :before-upload="beforeUpload"
    >
      <NButton :loading="uploading" :disabled="uploading">
        <template #icon>
          <span class="i-carbon-cloud-upload"></span>
        </template>
        {{ uploading ? `上传中 ${uploadProgress}%` : '选择文件' }}
      </NButton>
    </NUpload>
    
    <NProgress
      v-if="uploading"
      type="line"
      :percentage="uploadProgress"
      :show-indicator="false"
      style="margin-top: 8px"
    />
    
    <div class="upload-tip">
      <NText depth="3" style="font-size: 12px">
        最大文件大小: {{ formatFileSize(maxSize) }}
      </NText>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-upload {
  display: inline-block;
}

.preview-container {
  position: relative;
  display: inline-block;
}

.preview-image {
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
}

.file-preview {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fafafa;
}

.upload-tip {
  margin-top: 4px;
}
</style>
