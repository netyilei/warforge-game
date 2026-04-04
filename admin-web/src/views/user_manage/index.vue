<script setup lang="ts">
import { ref, onMounted } from 'vue';

const loading = ref(false);

onMounted(() => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 500);
});
</script>

<template>
  <div class="h-full">
    <NCard title="用户列表" :bordered="false" class="h-full rounded-16px shadow-sm">
      <div class="flex flex-col h-full">
        <NSpace class="mb-4">
          <NInput placeholder="搜索用户" style="width: 200px" />
          <NButton type="primary">搜索</NButton>
        </NSpace>
        <NDataTable
          :loading="loading"
          :columns="[
            { title: 'ID', key: 'id' },
            { title: '用户名', key: 'username' },
            { title: '邮箱', key: 'email' },
            { title: '状态', key: 'status' },
            { title: '注册时间', key: 'createdAt' },
          ]"
          :data="[]"
          :pagination="{ pageSize: 10 }"
        />
      </div>
    </NCard>
  </div>
</template>
