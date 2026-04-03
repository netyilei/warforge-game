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
} from 'naive-ui';
import { Icon } from '@iconify/vue';
import { adminApi } from '@/service/api';
import { useSvgIcon } from '@/hooks/common/icon';

const { SvgIconVNode } = useSvgIcon();

interface Permission {
  id: string;
  name: string;
  code: string;
  type: string;
  parentId: string;
  path: string;
  component: string;
  icon: string;
  sortOrder: number;
  status: number;
  children?: Permission[];
}

const message = useMessage();

const loading = ref(false);
const data = ref<Permission[]>([]);
const showModal = ref(false);
const modalTitle = ref('添加权限');
const formData = ref<Partial<Permission>>({});
const parentOptions = ref<Array<{ label: string; value: string }>>([]);

const typeOptions = [
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
];

const columns = [
  {
    title: '权限名称',
    key: 'name',
  },
  {
    title: '权限编码',
    key: 'code',
  },
  {
    title: '类型',
    key: 'type',
    render(row: Permission) {
      return h(NTag, { type: row.type === 'menu' ? 'info' : 'success' }, {
        default: () => (row.type === 'menu' ? '菜单' : '按钮'),
      });
    },
  },
  {
    title: '路径',
    key: 'path',
  },
  {
    title: '组件',
    key: 'component',
  },
  {
    title: '排序',
    key: 'sortOrder',
  },
  {
    title: '状态',
    key: 'status',
    render(row: Permission) {
      return row.status === 1
        ? h(NTag, { type: 'success' }, { default: () => '启用' })
        : h(NTag, { type: 'error' }, { default: () => '禁用' });
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row: Permission) {
      return h(NSpace, {}, [
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
          default: () => '确定删除此权限？',
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
    const res = await adminApi.getPermissions();
    data.value = res;
    parentOptions.value = buildParentOptions(res);
  } catch (error) {
    message.error('获取权限列表失败');
  } finally {
    loading.value = false;
  }
};

const buildParentOptions = (flatList: any[]) => {
  const options = [
    { label: '顶级菜单', value: '' },
  ];
  
  flatList.forEach((item) => {
    if (item.type === 'menu') {
      options.push({
        label: item.name,
        value: item.id,
      });
    }
  });
  
  return options;
};

const handleAdd = () => {
  modalTitle.value = '添加权限';
  formData.value = {
    type: 'menu',
    status: 1,
    sortOrder: 0,
  };
  showModal.value = true;
};

const handleEdit = (row: Permission) => {
  modalTitle.value = '编辑权限';
  formData.value = { ...row };
  showModal.value = true;
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
        <NFormItem label="上级菜单">
          <NSelect
            v-model:value="formData.parentId"
            :options="parentOptions"
            placeholder="请选择上级菜单"
          />
        </NFormItem>
        <NFormItem label="权限名称">
          <NInput v-model:value="formData.name" placeholder="请输入权限名称" />
        </NFormItem>
        <NFormItem label="权限编码">
          <NInput v-model:value="formData.code" placeholder="请输入权限编码" />
        </NFormItem>
        <NFormItem label="类型">
          <NSelect
            v-model:value="formData.type"
            :options="typeOptions"
          />
        </NFormItem>
        <NFormItem label="路径">
          <NInput v-model:value="formData.path" placeholder="请输入路由路径" />
        </NFormItem>
        <NFormItem label="组件">
          <NInput v-model:value="formData.component" placeholder="请输入组件路径" />
        </NFormItem>
        <NFormItem label="图标">
          <NInput v-model:value="formData.icon" placeholder="请输入图标名称" />
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
  </div>
</template>

<style scoped lang="scss">
.permission-container {
  padding: 20px;
}
</style>
