<script lang="ts" setup>
defineOptions({ name: 'SearchFooter' });
</script>

<template>
  <div class="h-44px flex-y-center gap-14px px-24px">
    <span class="flex-y-center">
      <icon-mdi-keyboard-return class="operate-shadow operate-item" />
      <span>确认</span>
    </span>
    <span class="flex-y-center">
      <icon-mdi-arrow-up-thin class="operate-shadow operate-item" />
      <icon-mdi-arrow-down-thin class="operate-shadow operate-item" />
      <span>切换</span>
    </span>
    <span class="flex-y-center">
      <icon-mdi-keyboard-esc class="operate-shadow operate-item" />
      <span>关闭</span>
    </span>
  </div>
</template>

<style lang="scss" scoped>
.operate-shadow {
  box-shadow:
    inset 0 -2px #cdcde6,
    inset 0 0 1px 1px #fff,
    0 1px 2px 1px #1e235a66;
}

.operate-item {
  --uno: mr-6px p-2px text-20px;
}
</style>
