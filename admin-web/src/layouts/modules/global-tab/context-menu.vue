<script setup lang="ts">
import { computed } from 'vue';
import type { VNode } from 'vue';
import { useTabStore } from '@/store/modules/tab';
import { useSvgIcon } from '@/hooks/common/icon';

defineOptions({
  name: 'ContextMenu'
});

interface Props {
  x: number;
  y: number;
  tabId: string;
  excludeKeys?: App.Global.DropdownKey[];
  disabledKeys?: App.Global.DropdownKey[];
}

const props = withDefaults(defineProps<Props>(), {
  excludeKeys: () => [],
  disabledKeys: () => []
});

const visible = defineModel<boolean>('visible');

const { removeTab, clearTabs, clearLeftTabs, clearRightTabs, fixTab, unfixTab, isTabRetain, homeTab } = useTabStore();
const { SvgIconVNode } = useSvgIcon();

type DropdownOption = {
  key: App.Global.DropdownKey;
  label: string;
  icon?: () => VNode;
  disabled?: boolean;
};

const options = computed(() => {
  const opts: DropdownOption[] = [
    {
      key: 'closeCurrent',
      label: '关闭当前',
      icon: SvgIconVNode({ icon: 'ant-design:close-outlined', fontSize: 18 })
    },
    {
      key: 'closeOther',
      label: '关闭其他',
      icon: SvgIconVNode({ icon: 'ant-design:column-width-outlined', fontSize: 18 })
    },
    {
      key: 'closeLeft',
      label: '关闭左侧',
      icon: SvgIconVNode({ icon: 'mdi:format-horizontal-align-left', fontSize: 18 })
    },
    {
      key: 'closeRight',
      label: '关闭右侧',
      icon: SvgIconVNode({ icon: 'mdi:format-horizontal-align-right', fontSize: 18 })
    },
    {
      key: 'closeAll',
      label: '关闭所有',
      icon: SvgIconVNode({ icon: 'ant-design:line-outlined', fontSize: 18 })
    }
  ];

  if (props.tabId !== homeTab?.id) {
    if (isTabRetain(props.tabId)) {
      opts.push({
        key: 'unpin',
        label: '取消固定',
        icon: SvgIconVNode({ icon: 'mdi:pin-off-outline', fontSize: 18 })
      });
    } else {
      opts.push({
        key: 'pin',
        label: '固定',
        icon: SvgIconVNode({ icon: 'mdi:pin-outline', fontSize: 18 })
      });
    }
  }

  const { excludeKeys, disabledKeys } = props;

  const result = opts.filter(opt => !excludeKeys.includes(opt.key));

  disabledKeys.forEach(key => {
    const opt = result.find(item => item.key === key);

    if (opt) {
      opt.disabled = true;
    }
  });

  return result;
});

function hideDropdown() {
  visible.value = false;
}

const dropdownAction: Record<App.Global.DropdownKey, () => void> = {
  closeCurrent() {
    removeTab(props.tabId);
  },
  closeOther() {
    clearTabs([props.tabId]);
  },
  closeLeft() {
    clearLeftTabs(props.tabId);
  },
  closeRight() {
    clearRightTabs(props.tabId);
  },
  closeAll() {
    clearTabs();
  },
  pin() {
    fixTab(props.tabId);
  },
  unpin() {
    unfixTab(props.tabId);
  }
};

function handleDropdown(optionKey: App.Global.DropdownKey) {
  dropdownAction[optionKey]?.();
  hideDropdown();
}
</script>

<template>
  <NDropdown
    :show="visible"
    placement="bottom-start"
    trigger="manual"
    :x="x"
    :y="y"
    :options="options"
    @clickoutside="hideDropdown"
    @select="handleDropdown"
  />
</template>

<style scoped></style>
