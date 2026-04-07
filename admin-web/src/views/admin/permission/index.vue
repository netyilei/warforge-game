<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue';
import {
  NCard,
  NDataTable,
  NButton,
  NIcon,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  useMessage,
  NPopconfirm,
  NTag,
  NGrid,
  NGridItem,
  NInputNumber,
  NSwitch,
  NTooltip,
} from 'naive-ui';
import { Icon } from '@iconify/vue';
import { adminApi } from '@/service/api';
import IconPicker from '@/components/common/icon-picker.vue';

interface Permission {
  id: string;
  name: string;
  code: string;
  type: string;
  parentId: string;
  path: string;
  component: string;
  icon: string;
  href: string;
  showInMenu: boolean;
  sortOrder: number;
  status: number;
  children?: Permission[];
}

interface FlatPermission extends Permission {
  prefix: string;
  level: number;
  isLast: boolean;
  hasChildren: boolean;
}

const message = useMessage();

const loading = ref(false);
const flatData = ref<FlatPermission[]>([]);
const showModal = ref(false);
const modalTitle = ref('添加权限');
const formData = ref<Partial<Permission>>({});
const parentOptions = ref<Array<{ label: string; value: string }>>([]);

const typeOptions = [
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
];

const isExternalLink = computed(() => {
  return formData.value.type === 'menu' && formData.value.href && formData.value.href.trim() !== '';
});

const columns = [
  {
    title: '权限名称',
    key: 'name',
    width: 280,
    render(row: FlatPermission) {
      const tags = [];
      if (row.href) {
        tags.push(h(NTag, { type: 'warning', size: 'small', style: 'margin-left: 6px;' }, { default: () => '外链' }));
      }
      return h('div', { style: 'display: inline-flex; align-items: center; font-family: monospace;' }, [
        h('span', { style: 'white-space: pre; color: #999;' }, row.prefix),
        row.icon ? h(Icon, { icon: row.icon, style: 'margin-right: 6px; font-size: 16px; flex-shrink: 0;' }) : null,
        h('span', { style: 'white-space: nowrap;' }, row.name),
        ...tags,
      ]);
    },
  },
  {
    title: '权限编码',
    key: 'code',
    width: 160,
    render(row: FlatPermission) {
      const tagType = row.type === 'menu' ? 'info' : 'success';
      return h(NTag, { type: tagType, size: 'small' }, { default: () => row.code });
    },
  },
  {
    title: '类型',
    key: 'type',
    width: 80,
    render(row: FlatPermission) {
      return h(NTag, { 
        type: row.type === 'menu' ? 'info' : 'success',
        size: 'small'
      }, {
        default: () => (row.type === 'menu' ? '菜单' : '功能'),
      });
    },
  },
  {
    title: '路径/链接',
    key: 'path',
    width: 180,
    ellipsis: { tooltip: true },
    render(row: FlatPermission) {
      if (row.href) {
        return h(NTooltip, {}, {
          trigger: () => h('a', { 
            href: row.href, 
            target: '_blank',
            style: 'color: #2080f0; text-decoration: none;'
          }, row.href),
          default: () => '点击访问外部链接'
        });
      }
      return row.path || '-';
    },
  },
  {
    title: '显示',
    key: 'showInMenu',
    width: 60,
    render(row: FlatPermission) {
      if (row.type !== 'menu') return '-';
      return row.showInMenu
        ? h(NTag, { type: 'success', size: 'small' }, { default: () => '是' })
        : h(NTag, { type: 'default', size: 'small' }, { default: () => '否' });
    },
  },
  {
    title: '排序',
    key: 'sortOrder',
    width: 60,
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render(row: FlatPermission) {
      return row.status === 1
        ? h(NTag, { type: 'success', size: 'small' }, { default: () => '启用' })
        : h(NTag, { type: 'error', size: 'small' }, { default: () => '禁用' });
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render(row: FlatPermission) {
      return h(NSpace, { size: 'small' }, () => [
        h(NButton, {
          size: 'tiny',
          type: 'primary',
          onClick: () => handleEdit(row),
        }, { default: () => '编辑' }),
        h(NPopconfirm, {
          onPositiveClick: () => handleDelete(row.id),
        }, {
          default: () => '确定删除此权限？',
          trigger: () => h(NButton, {
            size: 'tiny',
            type: 'error',
          }, { default: () => '删除' }),
        }),
      ]);
    },
  },
];

const flattenTree = (nodes: Permission[], level = 0, parentPrefix = ''): FlatPermission[] => {
  const result: FlatPermission[] = [];
  
  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const hasChildren = node.children && node.children.length > 0;
    
    let prefix = '';
    if (level === 0) {
      prefix = '';
    } else {
      prefix = parentPrefix + (isLast ? '└─ ' : '├─ ');
    }
    
    const { children, ...rest } = node;
    result.push({
      ...rest,
      level,
      isLast,
      hasChildren: !!hasChildren,
      prefix,
    });
    
    if (hasChildren) {
      const childPrefix = parentPrefix + (isLast ? '    ' : '│   ');
      result.push(...flattenTree(node.children!, level + 1, childPrefix));
    }
  });
  
  return result;
};

const fetchData = async () => {
  loading.value = true;
  try {
    const { data: res, error } = await adminApi.getPermissions();
    if (error) {
      message.error('获取权限列表失败');
      return;
    }
    const flatList = res?.list || [];
    const treeData = buildPermissionTree(flatList);
    flatData.value = flattenTree(treeData);
    parentOptions.value = buildParentOptions(treeData);
  } catch (error) {
    message.error('获取权限列表失败');
  } finally {
    loading.value = false;
  }
};

const buildPermissionTree = (flatList: any[]): Permission[] => {
  const map = new Map<string, Permission>();
  const roots: Permission[] = [];

  flatList.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  flatList.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortChildren = (nodes: Permission[]) => {
    nodes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortChildren(node.children);
      }
    });
  };
  sortChildren(roots);

  return roots;
};

const buildParentOptions = (tree: Permission[]): Array<{ label: string; value: string }> => {
  const options: Array<{ label: string; value: string }> = [
    { label: '顶级菜单', value: '' },
  ];
  
  const traverse = (nodes: Permission[], prefix = '') => {
    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1;
      const newPrefix = prefix + (isLast ? '└─ ' : '├─ ');
      options.push({
        label: newPrefix + node.name,
        value: node.id,
      });
      if (node.children && node.children.length > 0 && node.type === 'menu') {
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        traverse(node.children, childPrefix);
      }
    });
  };
  
  traverse(tree);
  return options;
};

const handleAdd = () => {
  modalTitle.value = '添加权限';
  formData.value = {
    type: 'menu',
    status: 1,
    sortOrder: 0,
    parentId: '',
    showInMenu: true,
    href: '',
  };
  showModal.value = true;
};

const handleEdit = (row: FlatPermission) => {
  modalTitle.value = '编辑权限';
  formData.value = { ...row };
  showModal.value = true;
};

const handleDelete = async (id: string) => {
  try {
    const { error } = await adminApi.deletePermission(id);
    if (error) {
      message.error('删除失败');
      return;
    }
    message.success('删除成功');
    fetchData();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleSubmit = async () => {
  try {
    let error;
    if (formData.value.id) {
      const { error: err } = await adminApi.updatePermission(formData.value.id, formData.value);
      error = err;
    } else {
      const { error: err } = await adminApi.createPermission(formData.value as any);
      error = err;
    }
    if (error) {
      message.error('保存失败');
      return;
    }
    message.success('保存成功');
    showModal.value = false;
    fetchData();
  } catch (error) {
    message.error('保存失败');
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="permission-container">
    <NGrid :cols="1" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard title="权限管理" :bordered="false">
          <template #header-extra>
            <NSpace>
              <NButton type="primary" @click="handleAdd">
                <template #icon>
                  <NIcon><Icon icon="carbon:add" /></NIcon>
                </template>
                添加权限
              </NButton>
            </NSpace>
          </template>
          
          <NDataTable
            :columns="columns"
            :data="flatData"
            :loading="loading"
            :pagination="false"
            :max-height="600"
          />
        </NCard>
      </NGridItem>
    </NGrid>

    <NModal
      v-model:show="showModal"
      :title="modalTitle"
      preset="card"
      style="width: 600px"
    >
      <NForm label-placement="left" label-width="100px">
        <NFormItem label="上级菜单">
          <NSelect
            v-model:value="formData.parentId"
            :options="parentOptions"
            placeholder="请选择上级菜单"
            clearable
          />
        </NFormItem>
        <NFormItem label="权限名称">
          <NInput v-model:value="formData.name" placeholder="请输入权限名称" />
        </NFormItem>
        <NFormItem label="权限编码">
          <NInput v-model:value="formData.code" placeholder="如：admin、admin_list、admin:create" />
        </NFormItem>
        <NFormItem label="类型">
          <NSelect
            v-model:value="formData.type"
            :options="typeOptions"
          />
        </NFormItem>
        
        <template v-if="formData.type === 'menu'">
          <NFormItem :label="isExternalLink ? '外部链接' : '路径'">
            <NInput 
              v-model:value="formData.href" 
              placeholder="填写外部链接地址，如：https://example.com（留空则为内部路由）" 
            />
          </NFormItem>
          
          <template v-if="!isExternalLink">
            <NFormItem label="路径">
              <NInput v-model:value="formData.path" placeholder="如：/admin/list" />
            </NFormItem>
            <NFormItem label="组件">
              <NInput v-model:value="formData.component" placeholder="如：view.admin_list" />
            </NFormItem>
          </template>
          
          <NFormItem label="图标">
            <IconPicker v-model:value="formData.icon" />
          </NFormItem>
          
          <NFormItem label="显示在菜单">
            <NSwitch v-model:value="formData.showInMenu">
              <template #checked>显示</template>
              <template #unchecked>隐藏</template>
            </NSwitch>
          </NFormItem>
        </template>
        
        <NFormItem label="排序">
          <NInputNumber v-model:value="formData.sortOrder" :min="0" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="formData.status"
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace>
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" @click="handleSubmit">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.permission-container {
  padding: 20px;
}
</style>
