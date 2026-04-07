<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { NCard, NForm, NFormItem, NInput, NButton, NSpace, NDynamicTags, useMessage } from 'naive-ui';
import ToastEditor from '@/components/common/toast-editor.vue';
import { supportApi } from '@/service/api/v1/support';

const message = useMessage();

const formRef = ref();
const editorRef = ref<InstanceType<typeof ToastEditor>>();
const loading = ref(false);

const form = reactive({
  toList: [] as string[],
  subject: '',
  content: ''
});

const isBatchSend = computed(() => form.toList.length > 1);

const rules = {
  toList: [
    { 
      required: true, 
      type: 'array' as const, 
      min: 1, 
      message: '请输入收件人邮箱', 
      trigger: 'change' 
    }
  ],
  subject: { required: true, message: '请输入邮件主题', trigger: 'blur' },
  content: { required: true, message: '请输入邮件内容', trigger: 'blur' }
};

const validateEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

const handleSend = async () => {
  await formRef.value?.validate();
  
  const invalidEmails = form.toList.filter(email => !validateEmail(email));
  if (invalidEmails.length > 0) {
    message.error(`以下邮箱地址格式无效: ${invalidEmails.join(', ')}`);
    return;
  }
  
  loading.value = true;
  try {
    const htmlContent = editorRef.value?.getHTML() || '';
    const { data } = await supportApi.sendEmail({
      to: form.toList,
      subject: form.subject,
      content: htmlContent
    });
    if (data) {
      const successMsg = isBatchSend.value 
        ? `批量邮件已加入发送队列，共 ${form.toList.length} 封`
        : '邮件发送成功';
      message.success(successMsg);
      form.toList = [];
      form.subject = '';
      form.content = '';
      editorRef.value?.setMarkdown('');
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
  form.toList = [];
  form.subject = '';
  form.content = '';
  editorRef.value?.setMarkdown('');
};
</script>

<template>
  <div class="page-container">
    <NCard title="发送邮件" :bordered="false" class="card-wrapper rounded-16px shadow-sm">
      <div class="max-w-1100px mx-auto">
        <NForm ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="100">
          <NFormItem label="收件人" path="toList">
            <div class="w-full">
              <NDynamicTags 
                v-model:value="form.toList" 
                :max="100"
              >
                <template #trigger="{ activate, disabled }">
                  <NButton
                    size="small"
                    type="primary"
                    dashed
                    :disabled="disabled"
                    @click="activate()"
                  >
                    + 添加邮箱
                  </NButton>
                </template>
              </NDynamicTags>
              <div class="text-12px text-gray-500 mt-4px">
                输入邮箱地址后按回车添加，支持批量发送（最多100个）
              </div>
            </div>
          </NFormItem>
          <NFormItem label="主题" path="subject">
            <NInput v-model:value="form.subject" placeholder="请输入邮件主题" />
          </NFormItem>
          <NFormItem label="内容" path="content">
            <div class="w-full">
              <ToastEditor
                ref="editorRef"
                v-model:value="form.content"
                mode="wysiwyg"
                height="500px"
                placeholder="请输入邮件内容..."
                upload-type="email"
                hide-mode-switch
              />
            </div>
          </NFormItem>
          <NFormItem :show-label="false">
            <NSpace>
              <NButton type="primary" :loading="loading" @click="handleSend">
                {{ isBatchSend ? `批量发送 (${form.toList.length}封)` : '发送邮件' }}
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

.text-12px {
  font-size: 12px;
}

.text-gray-500 {
  color: #6b7280;
}

.mt-4px {
  margin-top: 4px;
}
</style>
