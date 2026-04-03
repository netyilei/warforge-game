<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'ProjectNews'
});

interface NewsItem {
  id: number;
  content: string;
  time: string;
}

const newses = computed<NewsItem[]>(() => [
  { id: 1, content: 'WarForge 管理系统 v1.0.0 发布', time: '2024-01-15 10:00:00' },
  { id: 2, content: '新增用户权限管理功能', time: '2024-01-20 14:30:00' },
  { id: 3, content: '优化系统性能，提升用户体验', time: '2024-02-01 09:15:00' },
  { id: 4, content: '修复已知问题，增强系统稳定性', time: '2024-02-15 16:45:00' },
  { id: 5, content: '新增数据统计与分析功能', time: '2024-03-01 11:20:00' }
]);
</script>

<template>
  <NCard title="项目动态" :bordered="false" size="small" segmented class="card-wrapper">
    <template #header-extra>
      <a class="text-primary" href="javascript:;">更多动态</a>
    </template>
    <NList>
      <NListItem v-for="item in newses" :key="item.id">
        <template #prefix>
          <WarForgeAvatar class="size-48px!" />
        </template>
        <NThing :title="item.content" :description="item.time" />
      </NListItem>
    </NList>
  </NCard>
</template>

<style scoped></style>
