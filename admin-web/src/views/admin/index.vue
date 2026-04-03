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
  NTabs,
  NTabPane,
} from 'naive-ui';
import { Icon } from '@iconify/vue';
import dayjs from 'dayjs';
import { adminApi } from '@/service/api';
import { useSvgIcon } from '@/hooks/common/icon';

const { SvgIconVNode } = useSvgIcon();

interface AdminUser {
  id: string;
  username: string;
  nickname: string;
  email: string;
  phone: string;
  avatar: string;
  status: number;
  createdAt: string;
  roles: string[];
  password?: string;
}

const message = useMessage();

const loading = ref(false);
const data = ref<AdminUser[]>([]);
const showModal = ref(false);
const modalTitle = ref('添加管理员');
const formData = ref<Partial<AdminUser>>({});
const roleOptions = ref<Array<{ label: string; value: string }>>([]);
const currentTab = ref('users');

const columns = [
  {
    title: '用户名',
    key: 'username',
  },
  {
    title: '昵称',
    key: 'nickname',
  },
  {
    title: '邮箱',
    key: 'email',
  },
  {
    title: '电话',
    key: 'phone',
  },
  {
    title: '状态',
    key: 'status',
    render(row: AdminUser) {
      return row.status === 1 
        ? h(NTag, { type: 'success' }, { default: () => '启用' })
        : h(NTag, { type: 'error' }, { default: () => '禁用' });
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    render(row: AdminUser) {
      return dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss');
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row: AdminUser) {
      return h(NSpace, {}, [
        h(NButton, {
          size: 'small',
          type: 'info',
          onClick: () => handleEdit(row),
        }, {
          icon: SvgIconVNode({ icon: 'carbon:edit', fontSize: 16 }),
        }),
        h(NPopconfirm, {
          onPositiveClick: () => handleDelete(row.id),
        }, {
          default: () => '确定删除此管理员？',
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
    const res = await adminApi.getAdminUsers();
    data.value = res;
  } catch (error) {
    message.error('获取管理员列表失败');
  } finally {
    loading.value = false;
  }
};

const fetchRoles = async () => {
  try {
    const res = await adminApi.getRoles();
    roleOptions.value = res.map((role: any) => ({
      label: role.name,
      value: role.id,
    }));
  } catch (error) {
    message.error('获取角色列表失败');
  }
};

const getAdminUserRoles = async (userId: string): Promise<string[]> => {
  try {
    const roles = await adminApi.getAdminUserRoles(userId);
    return roles || [];
  } catch (error) {
    return [];
  }
};

const handleAdd = () => {
  modalTitle.value = '添加管理员';
  formData.value = {
    status: 1,
    roles: [],
  };
  showModal.value = true;
};

const handleEdit = async (row: AdminUser) => {
  modalTitle.value = '编辑管理员';
  formData.value = { ...row };
  // 获取管理员的角色信息
  const roles = await getAdminUserRoles(row.id);
  formData.value.roles = roles;
  showModal.value = true;
};

const handleDelete = async (id: string) => {
  try {
    await adminApi.deleteAdminUser(id);
    message.success('删除成功');
    fetchData();
  } catch (error) {
    message.error('删除失败');
  }
};

const handleSubmit = async () => {
  try {
    if (formData.value.id) {
      await adminApi.updateAdminUser({
        id: formData.value.id,
        nickname: formData.value.nickname,
        email: formData.value.email,
        phone: formData.value.phone,
        status: formData.value.status,
        password: formData.value.password,
        roles: formData.value.roles,
      });
    } else {
      await adminApi.createAdminUser({
        username: formData.value.username,
        password: formData.value.password,
        nickname: formData.value.nickname,
        email: formData.value.email,
        phone: formData.value.phone,
        status: formData.value.status,
        roles: formData.value.roles,
      });
    }
    message.success('保存成功');
    showModal.value = false;
    fetchData();
  } catch (error: any) {
    message.error(error.message || '保存失败');
  }
};

onMounted(() => {
  fetchData();
  fetchRoles();
});
</script>

<template>
  <div class="admin-container">
    <NGrid :cols="1" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard title="管理员管理" :bordered="false">
          <template #header-extra>
            <NSpace>
              <NButton type="primary" @click="handleAdd">
                <template #icon>
                  <NIcon><Icon icon="carbon:add" /></NIcon>
                </template>
                添加管理员
              </NButton>
            </NSpace>
          </template>
          
          <NTabs v-model:value="currentTab" type="line">
            <NTabPane name="users" tab="管理员列表">
              <NDataTable
                :columns="columns"
                :data="data"
                :loading="loading"
                :pagination="{ pageSize: 10 }"
              />
            </NTabPane>
          </NTabs>
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
        <NFormItem label="用户名">
          <NInput v-model:value="formData.username" placeholder="请输入用户名" />
        </NFormItem>
        <NFormItem label="昵称">
          <NInput v-model:value="formData.nickname" placeholder="请输入昵称" />
        </NFormItem>
        <NFormItem label="邮箱">
          <NInput v-model:value="formData.email" placeholder="请输入邮箱" />
        </NFormItem>
        <NFormItem label="电话">
          <NInput v-model:value="formData.phone" placeholder="请输入电话" />
        </NFormItem>
        <NFormItem label="密码">
          <NInput
            v-model:value="formData.password"
            type="password"
            placeholder="请输入密码"
          />
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
        <NFormItem label="角色">
          <NSelect
            v-model:value="formData.roles"
            :options="roleOptions"
            multiple
            placeholder="请选择角色"
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
.admin-container {
  padding: 20px;
}
</style>
