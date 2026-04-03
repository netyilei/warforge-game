<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
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
const checkedPermissions = ref<string[]>([]);

const columns = [
  {
    title: '角色名称',
    key: 'name',
  },
  {
    title: '角色编码',
    key: 'code',
  },
  {
    title: '描述',
    key: 'description',
  },
  {
    title: '排序',
    key: 'sortOrder',
  },
  {
    title: '状态',
    key: 'status',
    render(row: Role) {
      return row.status === 1 
        ? h(NTag, { type: 'success' }, { default: () => '启用' })
        : h(NTag, { type: 'error' }, { default: () => '禁用' });
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row: Role) {
      return h(NSpace, {}, [
        h(NButton, {
          size: 'small',
          type: 'info',
          onClick: () => handlePermission(row),
        }, {
          default: () => '权限配置',
        }),
        h(NButton, {
          size: 'small',
          type: 'primary',
          onClick: () => handleEdit(row),
        }, {
          icon: SvgIconVNode({ icon: 'carbon:edit', fontSize: 16 }),
        }),
        h(NPopconfirm, {
          onPositiveClick: () => handleDelete(row.id),
        }, {
          default: () => '确定删除此角色？',
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

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await adminApi.getRoles();
    data.value = res;
  } catch (error) {
    message.error('获取角色列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchPermissions = async () => {
  try {
    const res = await adminApi.getPermissions();
    permissions.value = buildPermissionTree(res);
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
      map.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
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

const handlePermission = (row: Role) => {
  currentRole.value = row;
  checkedPermissions.value = row.permissions || [];
  showPermissionModal.value = true;
};

const handleDelete = async (id: string) => {
  try {
    message.success('删除成功');
    fetchData();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleSubmit = async () => {
  try {
    message.success('保存成功');
    showModal.value = false;
    fetchData();
  } catch (error) {
    message.error('保存失败');
  }
};

const handlePermissionSubmit = async () => {
  try {
    message.success('权限配置成功');
    showPermissionModal.value = false;
    fetchData();
  } catch (error) {
    message.error('权限配置失败');
  }
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
      title="权限配置"
      preset="card"
      style="width: 800px; max-height: 600px"
    >
      <div class="permission-tree">
        <NTree
          :data="permissions"
          :label-field="'name'"
          :key-field="'id'"
          :children-field="'children'"
          selectable
          multiple
          v-model:checked-keys="checkedPermissions"
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

.permission-tree {
  max-height: 400px;
  overflow-y: auto;
}
</style>
