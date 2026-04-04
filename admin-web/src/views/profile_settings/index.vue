<script setup lang="ts">
import { ref } from 'vue';

const formValue = ref({
  username: '',
  email: '',
  phone: '',
  avatar: '',
});

const loading = ref(false);

const handleSave = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    window.$message?.success('保存成功');
  }, 500);
};
</script>

<template>
  <div class="h-full">
    <NCard title="个人设置" :bordered="false" class="h-full rounded-16px shadow-sm">
      <NForm label-placement="left" label-width="100px" class="max-w-600px">
        <NFormItem label="用户名">
          <NInput v-model:value="formValue.username" placeholder="请输入用户名" />
        </NFormItem>
        <NFormItem label="邮箱">
          <NInput v-model:value="formValue.email" placeholder="请输入邮箱" />
        </NFormItem>
        <NFormItem label="手机号">
          <NInput v-model:value="formValue.phone" placeholder="请输入手机号" />
        </NFormItem>
        <NFormItem label="头像">
          <NInput v-model:value="formValue.avatar" placeholder="头像URL" />
        </NFormItem>
        <NFormItem>
          <NSpace>
            <NButton type="primary" :loading="loading" @click="handleSave">保存</NButton>
          </NSpace>
        </NFormItem>
      </NForm>
    </NCard>
  </div>
</template>
