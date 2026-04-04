<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  NInput,
  NButton,
  NSpace,
  NUpload,
  NIcon,
  useMessage,
  type UploadFileInfo,
} from 'naive-ui';
import { Icon } from '@iconify/vue';
import { uploadFile } from '@/service/api/storage';

const props = defineProps<{
  value: string;
  type: 'text' | 'html' | 'markdown';
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:value', value: string): void;
}>();

const message = useMessage();
const uploading = ref(false);
const showPreview = ref(false);

const localValue = ref(props.value || '');

const editorType = computed(() => props.type);

const isHtml = computed(() => editorType.value === 'html');
const isMarkdown = computed(() => editorType.value === 'markdown');
const isText = computed(() => editorType.value === 'text');

watch(() => props.value, (newVal) => {
  localValue.value = newVal;
});

watch(localValue, (newVal) => {
  emit('update:value', newVal);
});

const handleImageUpload = async (options: { file: UploadFileInfo }) => {
  const file = options.file.file;
  if (!file) return;

  uploading.value = true;
  try {
    const result = await uploadFile(file, 'content');

    if (isHtml.value) {
      const imgTag = `<img src="${result.publicUrl}" alt="${file.name}" style="max-width: 100%;" />`;
      localValue.value += imgTag;
    } else if (isMarkdown.value) {
      const mdImg = `![${file.name}](${result.publicUrl})`;
      localValue.value += mdImg;
    }

    message.success('图片上传成功');
  } catch (error) {
    message.error('上传失败：' + (error instanceof Error ? error.message : String(error)));
  } finally {
    uploading.value = false;
  }

  return false;
};

const insertLink = () => {
  if (isHtml.value) {
    const url = prompt('请输入链接URL:');
    const text = prompt('请输入链接文本:') || url;
    if (url) {
      localValue.value += `<a href="${url}" target="_blank">${text}</a>`;
    }
  } else if (isMarkdown.value) {
    const url = prompt('请输入链接URL:');
    const text = prompt('请输入链接文本:') || url;
    if (url) {
      localValue.value += `[${text}](${url})`;
    }
  }
};

const insertHeading = () => {
  if (isHtml.value) {
    localValue.value += '<h2>标题</h2>';
  } else if (isMarkdown.value) {
    localValue.value += '\n## 标题\n';
  }
};

const insertList = () => {
  if (isHtml.value) {
    localValue.value += '<ul>\n<li>列表项1</li>\n<li>列表项2</li>\n</ul>';
  } else if (isMarkdown.value) {
    localValue.value += '\n- 列表项1\n- 列表项2\n';
  }
};

const insertCode = () => {
  if (isHtml.value) {
    localValue.value += '<pre><code>代码块</code></pre>';
  } else if (isMarkdown.value) {
    localValue.value += '\n```\n代码块\n```\n';
  }
};
</script>

<template>
  <div class="rich-editor">
    <div class="toolbar" v-if="!isText">
      <NSpace>
        <NUpload
          :custom-request="handleImageUpload"
          :show-file-list="false"
          accept="image/*"
        >
          <NButton size="small" :loading="uploading" quaternary>
            <template #icon>
              <NIcon><Icon icon="carbon:image" /></NIcon>
            </template>
            上传图片
          </NButton>
        </NUpload>
        <NButton size="small" quaternary @click="insertLink">
          <template #icon>
            <NIcon><Icon icon="carbon:link" /></NIcon>
          </template>
          链接
        </NButton>
        <NButton size="small" quaternary @click="insertHeading">
          <template #icon>
            <NIcon><Icon icon="carbon:text-font" /></NIcon>
          </template>
          标题
        </NButton>
        <NButton size="small" quaternary @click="insertList">
          <template #icon>
            <NIcon><Icon icon="carbon:list" /></NIcon>
          </template>
          列表
        </NButton>
        <NButton size="small" quaternary @click="insertCode" v-if="isHtml || isMarkdown">
          <template #icon>
            <NIcon><Icon icon="carbon:code" /></NIcon>
          </template>
          代码
        </NButton>
        <NButton size="small" quaternary @click="showPreview = !showPreview">
          <template #icon>
            <NIcon><Icon :icon="showPreview ? 'carbon:edit' : 'carbon:view'" /></NIcon>
          </template>
          {{ showPreview ? '编辑' : '预览' }}
        </NButton>
      </NSpace>
    </div>
    <div class="editor-content">
      <NInput
        v-if="!showPreview"
        v-model:value="localValue"
        type="textarea"
        :placeholder="placeholder"
        :rows="10"
        :input-props="{ style: 'font-family: monospace;' }"
      />
      <div v-else class="preview-area">
        <div v-if="isHtml" v-html="localValue" class="html-preview"></div>
        <div v-else-if="isMarkdown" class="markdown-preview">{{ localValue }}</div>
        <div v-else class="text-preview">{{ localValue }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rich-editor {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.toolbar {
  padding: 8px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.editor-content {
  min-height: 200px;
}

.preview-area {
  padding: 12px;
  min-height: 200px;
  background: #fff;
}

.html-preview :deep(img) {
  max-width: 100%;
  height: auto;
}

.html-preview :deep(a) {
  color: #1890ff;
}

.html-preview :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.html-preview :deep(code) {
  font-family: 'Consolas', 'Monaco', monospace;
}

.markdown-preview {
  white-space: pre-wrap;
  font-family: monospace;
}

.text-preview {
  white-space: pre-wrap;
}
</style>
