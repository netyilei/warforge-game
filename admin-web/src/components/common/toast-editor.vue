<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import { uploadFile } from '@/service/api/v1/storage';
import { useMessage, NButton, NSpace, NModal, NInput } from 'naive-ui';

const props = withDefaults(
  defineProps<{
    value: string;
    mode?: 'markdown' | 'wysiwyg';
    height?: string;
    placeholder?: string;
    uploadType?: string;
    hideModeSwitch?: boolean;
  }>(),
  {
    mode: 'markdown',
    height: '400px',
    placeholder: '请输入内容...',
    uploadType: 'content',
    hideModeSwitch: false
  }
);

const emit = defineEmits<{
  (e: 'update:value', value: string): void;
  (e: 'change', value: string): void;
}>();

const message = useMessage();
const editorRef = ref<HTMLElement>();
let editor: Editor | null = null;

const showSourceModal = ref(false);
const sourceCode = ref('');

const initEditor = () => {
  if (!editorRef.value) return;

  editor = new Editor({
    el: editorRef.value,
    height: props.height,
    initialEditType: props.mode as 'markdown' | 'wysiwyg',
    previewStyle: 'vertical',
    initialValue: props.value || '',
    placeholder: props.placeholder,
    usageStatistics: false,
    hideModeSwitch: props.hideModeSwitch,
    hooks: {
      addImageBlobHook: async (blob: Blob | File, callback: (url: string, altText: string) => void) => {
        try {
          const file = blob instanceof File ? blob : new File([blob], 'image.png', { type: blob.type || 'image/png' });
          const result = await uploadFile(file, props.uploadType);
          callback(result.publicUrl, file.name);
          message.success('图片上传成功');
        } catch (error) {
          message.error('图片上传失败：' + (error instanceof Error ? error.message : String(error)));
        }
      }
    }
  });

  editor.on('change', () => {
    const content = editor!.getMarkdown();
    emit('update:value', content);
    emit('change', content);
  });
};

watch(() => props.value, (newVal) => {
  if (editor && editor.getMarkdown() !== newVal) {
    editor.setMarkdown(newVal || '', false);
  }
});

watch(() => props.mode, (newMode) => {
  if (editor) {
    editor.changeMode(newMode as 'markdown' | 'wysiwyg');
  }
});

onMounted(() => {
  initEditor();
});

onUnmounted(() => {
  if (editor) {
    editor.destroy();
    editor = null;
  }
});

const getMarkdown = (): string => {
  return editor?.getMarkdown() || '';
};

const getHTML = (): string => {
  return editor?.getHTML() || '';
};

const setMarkdown = (content: string) => {
  editor?.setMarkdown(content, false);
};

const focus = () => {
  editor?.focus();
};

const openSourceModal = () => {
  if (editor) {
    sourceCode.value = editor.getHTML();
    showSourceModal.value = true;
  }
};

const applySourceCode = () => {
  if (editor && sourceCode.value) {
    editor.setHTML(sourceCode.value, false);
    showSourceModal.value = false;
    message.success('源码已应用');
  }
};

defineExpose({
  getMarkdown,
  getHTML,
  setMarkdown,
  focus
});
</script>

<template>
  <div class="toast-editor-wrapper">
    <div class="editor-toolbar">
      <NSpace>
        <NButton size="tiny" quaternary @click="openSourceModal">
          查看/编辑 HTML 源码
        </NButton>
      </NSpace>
    </div>
    <div ref="editorRef" class="toast-editor-container"></div>
  </div>

  <NModal
    v-model:show="showSourceModal"
    preset="card"
    title="HTML 源码"
    style="width: 800px"
  >
    <NInput
      v-model:value="sourceCode"
      type="textarea"
      :rows="20"
      placeholder="HTML 源码"
      :input-props="{ style: 'font-family: monospace; font-size: 12px;' }"
    />
    <template #footer>
      <NSpace justify="end">
        <NButton @click="showSourceModal = false">取消</NButton>
        <NButton type="primary" @click="applySourceCode">应用</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.toast-editor-wrapper {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  padding: 4px 8px;
  background: #fafafa;
  border-bottom: 1px solid #e0e0e0;
}

.toast-editor-container {
  background: #fff;
}

:deep(.toastui-editor-defaultUI) {
  border: none;
}

:deep(.toastui-editor-toolbar) {
  border-bottom: 1px solid #e0e0e0;
}

:deep(.toastui-editor-main-container) {
  min-height: 200px;
}
</style>
