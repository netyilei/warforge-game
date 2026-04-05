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
  NTree,
  NCheckbox,
  type TreeOption,
} from 'naive-ui';
import { Icon } from '@iconify/vue';
import { adminApi } from '@/service/api';
import { useSvgIcon } from '@/hooks/common/icon';

const { SvgIconVNode } = useSvgIcon();

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  status: number;
  sortOrder: number;
  permissions: string[];
}

interface Permission {
  id: string;
  name: string;
  code: string;
  type: string;
  parentId: string;
  icon: string;
  sortOrder: number;
  children?: Permission[];
}

const message = useMessage();

const loading = ref(false);
const data = ref<Role[]>([]);
const permissions = ref<Permission[]>([]);
const showModal = ref(false);
const showPermissionModal = ref(false);
const modalTitle = ref('添加角色');
const formData = ref<Partial<Role>>({});
const currentRole = ref<Role | null>(null);
const checkedKeys = ref<string[]>([]);
const expandedKeys = ref<string[]>([]);
const indeterminateKeys = ref<string[]>([]);

const columns = [
  {
    title: '角色名称',
    key: 'name',
    width: 120,
  },
  {
    title: '角色编码',
    key: 'code',
    width: 120,
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: { tooltip: true },
  },
  {
    title: '排序',
    key: 'sortOrder',
    width: 80,
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render(row: Role) {
      return row.status === 1 
        ? h(NTag, { type: 'success', size: 'small' }, { default: () => '启用' })
        : h(NTag, { type: 'error', size: 'small' }, { default: () => '禁用' });
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render(row: Role) {
      return h(NSpace, { size: 'small' }, () => [
        h(NButton, {
          size: 'tiny',
          type: 'info',
          onClick: () => handlePermission(row),
        }, {
          default: () => '权限配置',
        }),
        h(NButton, {
          size: 'tiny',
          type: 'primary',
          onClick: () => handleEdit(row),
        }, {
          default: () => '编辑',
        }),
        h(NPopconfirm, {
          onPositiveClick: () => handleDelete(row.id),
        }, {
          default: () => '确定删除此角色？',
          trigger: () => h(NButton, {
            size: 'tiny',
            type: 'error',
          }, { default: () => '删除' }),
        }),
      ]);
    },
  },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const { data: res, error } = await adminApi.getRoles();
    if (error) {
      message.error('获取角色列表失败');
      return;
    }
    data.value = res?.list || [];
  } catch (error) {
    message.error('获取角色列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchPermissions = async () => {
  try {
    const { data: res, error } = await adminApi.getPermissions();
    if (error) {
      message.error('获取权限列表失败');
      return;
    }
    permissions.value = buildPermissionTree(res?.list || []);
    expandedKeys.value = getAllMenuIds(permissions.value);
  } catch (error) {
    message.error('获取权限列表失败');
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

const getAllMenuIds = (nodes: Permission[]): string[] => {
  const ids: string[] = [];
  const traverse = (items: Permission[]) => {
    items.forEach(item => {
      if (item.type === 'menu') {
        ids.push(item.id);
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      }
    });
  };
  traverse(nodes);
  return ids;
};

const handleAdd = () => {
  modalTitle.value = '添加角色';
  formData.value = {
    status: 1,
    sortOrder: 0,
    permissions: [],
  };
  showModal.value = true;
};

const handleEdit = (row: Role) => {
  modalTitle.value = '编辑角色';
  formData.value = { ...row };
  showModal.value = true;
};

const handlePermission = async (row: Role) => {
  currentRole.value = row;
  
  try {
    const { data: res, error } = await adminApi.getRolePermissions(row.id);
    if (!error && res?.permissions) {
      checkedKeys.value = res.permissions;
    } else {
      checkedKeys.value = row.permissions || [];
    }
  } catch {
    checkedKeys.value = row.permissions || [];
  }
  
  showPermissionModal.value = true;
};

const handleDelete = async (id: string) => {
  try {
    const { error } = await adminApi.deleteRole(id);
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
    if (formData.value.id) {
      const { error } = await adminApi.updateRole(formData.value.id, {
        name: formData.value.name,
        description: formData.value.description,
        status: formData.value.status,
      });
      if (error) {
        message.error('更新失败');
        return;
      }
    } else {
      const { error } = await adminApi.createRole({
        name: formData.value.name!,
        code: formData.value.code!,
        description: formData.value.description,
        status: formData.value.status,
      });
      if (error) {
        message.error('创建失败');
        return;
      }
    }
    message.success('保存成功');
    showModal.value = false;
    fetchData();
  } catch (error) {
    message.error('保存失败');
  }
};

const handlePermissionSubmit = async () => {
  if (!currentRole.value) return;
  
  try {
    const { error } = await adminApi.updateRolePermissions(
      currentRole.value.id,
      checkedKeys.value
    );
    if (error) {
      message.error('权限配置失败');
      return;
    }
    message.success('权限配置成功');
    showPermissionModal.value = false;
    fetchData();
  } catch (error) {
    message.error('权限配置失败');
  }
};

const handleExpandAll = () => {
  expandedKeys.value = getAllMenuIds(permissions.value);
};

const handleCollapseAll = () => {
  expandedKeys.value = [];
};

const handleCheckAll = () => {
  const allIds = getAllPermissionIds(permissions.value);
  checkedKeys.value = allIds;
};

const handleUncheckAll = () => {
  checkedKeys.value = [];
};

const getAllPermissionIds = (nodes: Permission[]): string[] => {
  const ids: string[] = [];
  const traverse = (items: Permission[]) => {
    items.forEach(item => {
      ids.push(item.id);
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    });
  };
  traverse(nodes);
  return ids;
};

const renderTreeLabel = ({ option }: { option: TreeOption }) => {
  const node = option as unknown as Permission;
  const iconEl = node.icon
    ? h(Icon, { icon: node.icon, style: 'margin-right: 6px; font-size: 16px;' })
    : null;
  
  const typeTag = h(NTag, {
    type: node.type === 'menu' ? 'info' : 'success',
    size: 'small',
    style: 'margin-left: 8px;'
  }, { default: () => node.type === 'menu' ? '菜单' : '功能' });

  return h('div', { style: 'display: flex; align-items: center;' }, [
    iconEl,
    h('span', node.name),
    typeTag,
  ]);
};

const nodeProps = ({ option }: { option: TreeOption }) => {
  return {
    style: 'padding: 4px 0;',
  };
};

onMounted(() => {
  fetchData();
  fetchPermissions();
});
</script>

<template>
  <div class="role-container">
    <NGrid :cols="1" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard title="角色管理" :bordered="false">
          <template #header-extra>
            <NSpace>
              <NButton type="primary" @click="handleAdd">
                <template #icon>
                  <NIcon><Icon icon="carbon:add" /></NIcon>
                </template>
                添加角色
              </NButton>
            </NSpace>
          </template>
          
          <NDataTable
            :columns="columns"
            :data="data"
            :loading="loading"
            :pagination="{ pageSize: 10 }"
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
        <NFormItem label="角色名称">
          <NInput v-model:value="formData.name" placeholder="请输入角色名称" />
        </NFormItem>
        <NFormItem label="角色编码">
          <NInput v-model:value="formData.code" placeholder="请输入角色编码" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput v-model:value="formData.description" placeholder="请输入描述" />
        </NFormItem>
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

    <NModal
      v-model:show="showPermissionModal"
      :title="`权限配置 - ${currentRole?.name || ''}`"
      preset="card"
      style="width: 700px"
    >
      <div class="permission-toolbar">
        <NSpace>
          <NButton size="small" @click="handleExpandAll">展开全部</NButton>
          <NButton size="small" @click="handleCollapseAll">收起全部</NButton>
          <NButton size="small" type="primary" @click="handleCheckAll">全选</NButton>
          <NButton size="small" @click="handleUncheckAll">清空</NButton>
        </NSpace>
      </div>
      
      <div class="permission-tree">
        <NTree
          :data="permissions"
          :label-field="'name'"
          :key-field="'id'"
          :children-field="'children'"
          :checked-keys="checkedKeys"
          :expanded-keys="expandedKeys"
          :indeterminate-keys="indeterminateKeys"
          checkable
          cascade
          selectable
          block-line
          :render-label="renderTreeLabel"
          :node-props="nodeProps"
          @update:checked-keys="checkedKeys = $event as string[]"
          @update:expanded-keys="expandedKeys = $event as string[]"
        />
      </div>
      
      <template #footer>
        <NSpace>
          <NButton @click="showPermissionModal = false">取消</NButton>
          <NButton type="primary" @click="handlePermissionSubmit">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.role-container {
  padding: 20px;
}

.permission-toolbar {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e6;
}

.permission-tree {
  max-height: 450px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e0e0e6;
  border-radius: 4px;
  background: #fafafa;
}
</style>
