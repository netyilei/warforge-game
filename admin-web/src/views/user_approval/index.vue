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
    <NCard title="注册审核" :bordered="false" class="h-full rounded-16px shadow-sm">
      <div class="flex flex-col h-full">
        <NDataTable
          :loading="loading"
          :columns="[
            { title: 'ID', key: 'id' },
            { title: '用户名', key: 'username' },
            { title: '邮箱', key: 'email' },
            { title: '申请时间', key: 'createdAt' },
            { title: '操作', key: 'actions' },
          ]"
          :data="[]"
          :pagination="{ pageSize: 10 }"
        />
      </div>
    </NCard>
  </div>
</template>
