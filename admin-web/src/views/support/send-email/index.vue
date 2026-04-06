<script setup lang="ts">
import { ref, reactive, shallowRef, onBeforeUnmount } from 'vue';
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, useMessage } from 'naive-ui';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import { supportApi } from '@/service/api/v2/support';
import '@wangeditor/editor/dist/css/style.css';

const message = useMessage();

const formRef = ref();
const loading = ref(false);

const form = reactive({
  to: '',
  subject: '',
  content: ''
});

const editorRef = shallowRef<IDomEditor>();

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入邮件内容...',
  MENU_CONF: {}
};

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['fullScreen', 'group-video']
};

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor;
};

const rules = {
  to: [
    { required: true, message: '请输入收件人邮箱', trigger: 'blur' },
    { type: 'email' as const, message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  subject: { required: true, message: '请输入邮件主题', trigger: 'blur' },
  content: { required: true, message: '请输入邮件内容', trigger: 'blur' }
};

const handleSend = async () => {
  await formRef.value?.validate();
  
  loading.value = true;
  try {
    const { data } = await supportApi.sendEmail({
      to: form.to,
      subject: form.subject,
      content: form.content
    });
    if (data) {
      message.success('邮件发送成功');
      form.to = '';
      form.subject = '';
      form.content = '';
      if (editorRef.value) {
        editorRef.value.clear();
      }
    }
  } catch (error: any) {
    const errorMsg = error?.response?.data?.msg || error?.message || '发送失败';
    message.error(errorMsg);
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  formRef.value?.restoreValidation();
  form.to = '';
  form.subject = '';
  form.content = '';
  if (editorRef.value) {
    editorRef.value.clear();
  }
};

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor) {
    editor.destroy();
  }
});
</script>

<template>
  <div class="page-container">
    <NCard title="发送邮件" :bordered="false" class="card-wrapper rounded-16px shadow-sm">
      <div class="max-w-1100px mx-auto">
        <NForm ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="100">
          <NFormItem label="收件人" path="to">
            <NInput v-model:value="form.to" placeholder="请输入收件人邮箱地址" />
          </NFormItem>
          <NFormItem label="主题" path="subject">
            <NInput v-model:value="form.subject" placeholder="请输入邮件主题" />
          </NFormItem>
          <NFormItem label="内容" path="content">
            <div class="w-full editor-container">
              <Toolbar
                :editor="editorRef"
                :default-config="toolbarConfig"
                :mode="'default'"
                class="toolbar"
              />
              <Editor
                v-model="form.content"
                :default-config="editorConfig"
                :mode="'default'"
                class="editor"
                @on-created="handleCreated"
              />
            </div>
          </NFormItem>
          <NFormItem :show-label="false">
            <NSpace>
              <NButton type="primary" :loading="loading" @click="handleSend">
                发送邮件
              </NButton>
              <NButton @click="handleReset">
                重置
              </NButton>
            </NSpace>
          </NFormItem>
        </NForm>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.page-container {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.card-wrapper {
  min-height: calc(100% - 32px);
}

.max-w-1100px {
  max-width: 1100px;
}

.editor-container {
  border: 1px solid #e0e0e6;
  border-radius: 8px;
  overflow: hidden;
}

.toolbar {
  border-bottom: 1px solid #e0e0e6;
  background: #fafafa;
}

.editor {
  height: 600px !important;
  overflow-y: auto;
}

.editor :deep(.w-e-text-container) {
  height: 600px !important;
  min-height: 600px !important;
}

.editor :deep(.w-e-scroll) {
  height: 100% !important;
}

@media (max-width: 768px) {
  .page-container {
    padding: 8px;
  }

  .editor {
    height: 400px !important;
  }

  .editor :deep(.w-e-text-container) {
    height: 400px !important;
    min-height: 400px !important;
  }
}

@media (max-width: 480px) {
  .editor {
    height: 300px !important;
  }

  .editor :deep(.w-e-text-container) {
    height: 300px !important;
    min-height: 300px !important;
  }
}
</style>
