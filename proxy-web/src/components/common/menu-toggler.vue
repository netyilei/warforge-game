<script lang="ts" setup>
import { computed } from 'vue';

defineOptions({ name: 'MenuToggler' });

interface Props {
  collapsed?: boolean;
  arrowIcon?: boolean;
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  arrowIcon: false,
  zIndex: 98
});

type NumberBool = 0 | 1;

const icon = computed(() => {
  const icons: Record<NumberBool, Record<NumberBool, string>> = {
    0: {
      0: 'line-md:menu-fold-left',
      1: 'line-md:menu-fold-right'
    },
    1: {
      0: 'ph-caret-double-left-bold',
      1: 'ph-caret-double-right-bold'
    }
  };

  const arrowIcon = Number(props.arrowIcon || false) as NumberBool;

  const collapsed = Number(props.collapsed || false) as NumberBool;

  return icons[arrowIcon][collapsed];
});
</script>

<template>
  <ButtonIcon
    :key="String(collapsed)"
    :tooltip-content="collapsed ? '展开' : '折叠'"
    tooltip-placement="bottom-start"
    :z-index="zIndex"
  >
    <SvgIcon :icon="icon" />
  </ButtonIcon>
</template>

<style scoped></style>
