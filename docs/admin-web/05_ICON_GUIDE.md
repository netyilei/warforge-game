# 图标使用指南

> 本文档记录项目中图标的使用方法，避免开发时重复踩坑
> 
> 创建日期：2026-04-03

---

## 快速参考

### 在 render 函数中使用图标（推荐）

```typescript
import { useSvgIcon } from '@/hooks/common/icon';

const { SvgIconVNode } = useSvgIcon();

// 在 NButton 的 icon 插槽中使用
h(NButton, {
  size: 'small',
  type: 'error',
}, {
  icon: SvgIconVNode({ icon: 'carbon:trash-can', fontSize: 16 }),
})
```

### 在模板中使用图标

```vue
<template>
  <!-- 方式1：使用 NIcon 包裹 Icon 组件 -->
  <NButton type="primary">
    <template #icon>
      <NIcon><Icon icon="carbon:add" /></NIcon>
    </template>
    添加
  </NButton>

  <!-- 方式2：直接使用 Icon 组件 -->
  <Icon icon="carbon:edit" />
</template>

<script setup>
import { Icon } from '@iconify/vue';
import { NIcon, NButton } from 'naive-ui';
</script>
```

---

## 核心要点

### 1. 使用 `SvgIconVNode` 而非 `h(Icon, ...)`

**错误做法**（图标不显示）：
```typescript
// ❌ 错误：直接使用 h(Icon, ...)
icon: () => h(Icon, { icon: 'carbon:trash' }),

// ❌ 错误：使用 NIcon 包裹
icon: () => h(NIcon, null, { default: () => h(Icon, { icon: 'carbon:trash' }) }),
```

**正确做法**：
```typescript
// ✅ 正确：使用 SvgIconVNode
icon: SvgIconVNode({ icon: 'carbon:trash-can', fontSize: 16 }),
```

### 2. `SvgIconVNode` 参数说明

```typescript
SvgIconVNode({
  icon: string,      // 图标名称，格式：'图标集:图标名'
  localIcon?: string, // 本地图标名称（可选）
  fontSize?: number,  // 字体大小，默认 20
})
```

### 3. 常用图标集

| 图标集 | 前缀 | 示例 |
|--------|------|------|
| Carbon Design | `carbon:` | `carbon:edit`, `carbon:trash-can`, `carbon:add` |
| Material Design Icons | `mdi:` | `mdi:monitor-dashboard`, `mdi:pin-outline` |
| Ant Design | `ant-design:` | `ant-design:close-outlined`, `ant-design:line-outlined` |
| Phosphor | `ph:` | `ph:key`, `ph:sign-out` |

---

## 完整示例

### 数据表格操作按钮

```typescript
<script setup lang="ts">
import { h } from 'vue';
import { NButton, NSpace, NPopconfirm } from 'naive-ui';
import { useSvgIcon } from '@/hooks/common/icon';

const { SvgIconVNode } = useSvgIcon();

const columns = [
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, {}, [
        // 编辑按钮
        h(NButton, {
          size: 'small',
          type: 'info',
          onClick: () => handleEdit(row),
        }, {
          icon: SvgIconVNode({ icon: 'carbon:edit', fontSize: 16 }),
        }),
        // 删除按钮（带确认框）
        h(NPopconfirm, {
          onPositiveClick: () => handleDelete(row.id),
        }, {
          default: () => '确定删除？',
          trigger: () => h(NButton, {
            size: 'small',
            type: 'error',
          }, {
            icon: SvgIconVNode({ icon: 'carbon:trash-can', fontSize: 16 }),
          }),
        }),
      ]);
    },
  },
];
</script>
```

### 下拉菜单选项

```typescript
import { useSvgIcon } from '@/hooks/common/icon';

const { SvgIconVNode } = useSvgIcon();

const options = [
  {
    key: 'close',
    label: '关闭',
    icon: SvgIconVNode({ icon: 'ant-design:close-outlined', fontSize: 18 })
  },
  {
    key: 'edit',
    label: '编辑',
    icon: SvgIconVNode({ icon: 'carbon:edit', fontSize: 18 })
  }
];
```

---

## 图标资源

### 在线图标搜索

- [Iconify 官网](https://icon-sets.iconify.design/) - 搜索所有可用图标
- [Carbon Design Icons](https://icon-sets.iconify.design/carbon/) - Carbon 图标集
- [Material Design Icons](https://icon-sets.iconify.design/mdi/) - MDI 图标集

### 常用图标速查

| 用途 | 图标名称 |
|------|----------|
| 添加 | `carbon:add` |
| 编辑 | `carbon:edit` |
| 删除 | `carbon:trash-can` |
| 保存 | `carbon:save` |
| 关闭 | `ant-design:close-outlined` |
| 搜索 | `carbon:search` |
| 刷新 | `carbon:renew` |
| 设置 | `carbon:settings` |
| 用户 | `carbon:user` |
| 用户组 | `carbon:user-multiple` |
| 角色 | `carbon:user-role` |
| 权限 | `carbon:locked` |
| 首页 | `mdi:monitor-dashboard` |

---

## 注意事项

1. **不要在 render 函数中直接使用 `h(Icon, ...)`**，这会导致图标无法正常渲染
2. **模板中可以使用 `<Icon icon="..." />`**，但建议用 `<NIcon>` 包裹以保持样式一致
3. **图标名称格式**：`图标集前缀:图标名`，例如 `carbon:edit`
4. **fontSize 参数**：按钮图标建议 16px，菜单图标建议 18px

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/hooks/common/icon.ts` | 图标 Hook 定义 |
| `packages/hooks/src/use-svg-icon-render.ts` | SvgIconVNode 实现 |
| `src/components/custom/svg-icon.vue` | SVG 图标组件 |
| `src/plugins/iconify.ts` | Iconify 插件配置 |
