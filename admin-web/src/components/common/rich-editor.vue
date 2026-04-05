<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  NInput,
  NButton,
  NSpace,
  NUpload,
  NIcon,
  NProgress,
  useMessage,
  type UploadCustomRequestOptions,
} from 'naive-ui';
import { Icon } from '@iconify/vue';
import { uploadFile } from '@/service/api/storage';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

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
const uploadProgress = ref(0);
const showPreview = ref(false);

const localValue = ref(props.value || '');

const editorType = computed(() => props.type);

const isHtml = computed(() => editorType.value === 'html');
const isMarkdown = computed(() => editorType.value === 'markdown');
const isText = computed(() => editorType.value === 'text');

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
      } catch {
        // ignore
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

const renderedMarkdown = computed(() => {
  if (!localValue.value) return '';
  return md.render(localValue.value);
});

watch(() => props.value, (newVal) => {
  localValue.value = newVal;
});

watch(localValue, (newVal) => {
  emit('update:value', newVal);
});

const handleImageUpload = async ({ file }: UploadCustomRequestOptions) => {
  const rawFile = file.file;
  if (!rawFile) return;

  uploading.value = true;
  uploadProgress.value = 0;
  try {
    const result = await uploadFile(rawFile, 'content', undefined, (percent) => {
      uploadProgress.value = percent;
    });

    if (isHtml.value) {
      const imgTag = `<img src="${result.publicUrl}" alt="${rawFile.name}" style="max-width: 100%;" />`;
      localValue.value += imgTag;
    } else if (isMarkdown.value) {
      const mdImg = `![${rawFile.name}](${result.publicUrl})`;
      localValue.value += mdImg;
    }

    message.success('图片上传成功');
  } catch (error) {
    message.error('上传失败：' + (error instanceof Error ? error.message : String(error)));
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
};

const insertLink = () => {
  if (isHtml.value) {
    const url = prompt('请输入链接URL:');
    if (url) {
      const text = prompt('请输入链接文本:') || url;
      localValue.value += `<a href="${url}" target="_blank">${text}</a>`;
    }
  } else if (isMarkdown.value) {
    const url = prompt('请输入链接URL:');
    if (url) {
      const text = prompt('请输入链接文本:') || url;
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

const insertBold = () => {
  if (isHtml.value) {
    localValue.value += '<strong>粗体文本</strong>';
  } else if (isMarkdown.value) {
    localValue.value += '**粗体文本**';
  }
};

const insertItalic = () => {
  if (isHtml.value) {
    localValue.value += '<em>斜体文本</em>';
  } else if (isMarkdown.value) {
    localValue.value += '*斜体文本*';
  }
};

const insertQuote = () => {
  if (isHtml.value) {
    localValue.value += '<blockquote>引用文本</blockquote>';
  } else if (isMarkdown.value) {
    localValue.value += '\n> 引用文本\n';
  }
};

const insertTable = () => {
  if (isHtml.value) {
    localValue.value += '<table>\n<thead>\n<tr><th>标题1</th><th>标题2</th></tr>\n</thead>\n<tbody>\n<tr><td>内容1</td><td>内容2</td></tr>\n</tbody>\n</table>';
  } else if (isMarkdown.value) {
    localValue.value += '\n| 标题1 | 标题2 |\n|-------|-------|\n| 内容1 | 内容2 |\n';
  }
};
</script>

<template>
  <div class="rich-editor">
    <div class="toolbar" v-if="!isText">
      <NSpace wrap>
        <NUpload
          :custom-request="handleImageUpload"
          :show-file-list="false"
          accept="image/*"
          :disabled="uploading"
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
        <NButton size="small" quaternary @click="insertBold">
          <template #icon>
            <NIcon><Icon icon="carbon:text-bold" /></NIcon>
          </template>
          粗体
        </NButton>
        <NButton size="small" quaternary @click="insertItalic">
          <template #icon>
            <NIcon><Icon icon="carbon:text-italic" /></NIcon>
          </template>
          斜体
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
        <NButton size="small" quaternary @click="insertQuote">
          <template #icon>
            <NIcon><Icon icon="carbon:chat" /></NIcon>
          </template>
          引用
        </NButton>
        <NButton size="small" quaternary @click="insertCode">
          <template #icon>
            <NIcon><Icon icon="carbon:code" /></NIcon>
          </template>
          代码
        </NButton>
        <NButton size="small" quaternary @click="insertTable">
          <template #icon>
            <NIcon><Icon icon="carbon:table" /></NIcon>
          </template>
          表格
        </NButton>
        <NButton size="small" quaternary @click="showPreview = !showPreview">
          <template #icon>
            <NIcon><Icon :icon="showPreview ? 'carbon:edit' : 'carbon:view'" /></NIcon>
          </template>
          {{ showPreview ? '编辑' : '预览' }}
        </NButton>
      </NSpace>
      <NProgress
        v-if="uploading"
        type="line"
        :percentage="uploadProgress"
        :show-indicator="false"
        :height="4"
        style="margin-top: 8px;"
      />
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
        <div v-else-if="isMarkdown" v-html="renderedMarkdown" class="markdown-preview"></div>
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

.html-preview :deep(img),
.markdown-preview :deep(img) {
  max-width: 100%;
  height: auto;
}

.html-preview :deep(a),
.markdown-preview :deep(a) {
  color: #1890ff;
}

.html-preview :deep(pre),
.markdown-preview :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.html-preview :deep(code),
.markdown-preview :deep(code) {
  font-family: 'Consolas', 'Monaco', monospace;
}

.html-preview :deep(table),
.markdown-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
}

.html-preview :deep(th),
.html-preview :deep(td),
.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.html-preview :deep(th),
.markdown-preview :deep(th) {
  background-color: #f5f5f5;
}

.html-preview :deep(blockquote),
.markdown-preview :deep(blockquote) {
  border-left: 4px solid #ddd;
  margin: 0;
  padding-left: 16px;
  color: #666;
}

.markdown-preview :deep(h1) {
  font-size: 2em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
  margin-bottom: 16px;
}

.markdown-preview :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
  margin-bottom: 16px;
}

.markdown-preview :deep(h3) {
  font-size: 1.25em;
  margin-bottom: 16px;
}

.markdown-preview :deep(h4) {
  font-size: 1em;
  margin-bottom: 16px;
}

.markdown-preview :deep(p) {
  margin-bottom: 16px;
  line-height: 1.6;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 2em;
  margin-bottom: 16px;
}

.markdown-preview :deep(li) {
  margin-bottom: 4px;
}

.markdown-preview :deep(.hljs) {
  background: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
}

.text-preview {
  white-space: pre-wrap;
}
</style>
