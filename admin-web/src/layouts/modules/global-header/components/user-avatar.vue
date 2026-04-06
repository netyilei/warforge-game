<script setup lang="ts">
import { computed, ref } from 'vue';
import type { VNode } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useSvgIcon } from '@/hooks/common/icon';
import { fetchUpdateProfile } from '@/service/api';

defineOptions({
  name: 'UserAvatar'
});

const authStore = useAuthStore();
const { routerPushByKey, toLogin } = useRouterPush();
const { SvgIconVNode } = useSvgIcon();

const showChangePasswordModal = ref(false);
const changePasswordLoading = ref(false);
const changePasswordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const showProfileSettingsModal = ref(false);
const profileSettingsLoading = ref(false);
const profileSettingsForm = ref({
  username: '',
  email: '',
  phone: ''
});

function loginOrRegister() {
  toLogin();
}

type DropdownKey = 'profileSettings' | 'changePassword' | 'logout';

type DropdownOption =
  | {
      key: DropdownKey;
      label: string;
      icon?: () => VNode;
    }
  | {
      type: 'divider';
      key: string;
    };

const options = computed(() => {
  const opts: DropdownOption[] = [
    {
      label: '个人设置',
      key: 'profileSettings',
      icon: SvgIconVNode({ icon: 'ph:user-circle-gear', fontSize: 18 })
    },
    {
      label: '修改密码',
      key: 'changePassword',
      icon: SvgIconVNode({ icon: 'ph:key', fontSize: 18 })
    },
    {
      type: 'divider',
      key: 'd1'
    },
    {
      label: '退出登录',
      key: 'logout',
      icon: SvgIconVNode({ icon: 'ph:sign-out', fontSize: 18 })
    }
  ];

  return opts;
});

function logout() {
  window.$dialog?.info({
    title: '提示',
    content: '确认退出登录吗？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: () => {
      authStore.logout();
    }
  });
}

function openChangePasswordModal() {
  changePasswordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  showChangePasswordModal.value = true;
}

function openProfileSettingsModal() {
  profileSettingsForm.value = {
    username: authStore.userInfo.userName || '',
    email: '',
    phone: ''
  };
  showProfileSettingsModal.value = true;
}

async function handleChangePassword() {
  const { oldPassword, newPassword, confirmPassword } = changePasswordForm.value;

  if (!oldPassword || !newPassword || !confirmPassword) {
    window.$message?.error('请填写所有字段');
    return;
  }

  if (newPassword !== confirmPassword) {
    window.$message?.error('两次输入的密码不一致');
    return;
  }

  if (newPassword.length < 6) {
    window.$message?.error('密码长度至少6位');
    return;
  }

  changePasswordLoading.value = true;

  try {
    const success = await authStore.changePassword(oldPassword, newPassword);

    if (success) {
      showChangePasswordModal.value = false;
    }
  } finally {
    changePasswordLoading.value = false;
  }
}

async function handleSaveProfileSettings() {
  const { username, email, phone } = profileSettingsForm.value;

  if (!username) {
    window.$message?.error('用户名不能为空');
    return;
  }

  profileSettingsLoading.value = true;

  try {
    const { data, error } = await fetchUpdateProfile({
      nickname: username,
      email,
      phone
    });

    if (!error && data?.success) {
      authStore.userInfo.userName = data.nickname || username;
      window.$message?.success('保存成功');
      showProfileSettingsModal.value = false;
    } else {
      window.$message?.error('保存失败');
    }
  } finally {
    profileSettingsLoading.value = false;
  }
}

function handleDropdown(key: DropdownKey) {
  if (key === 'logout') {
    logout();
  } else if (key === 'changePassword') {
    openChangePasswordModal();
  } else if (key === 'profileSettings') {
    openProfileSettingsModal();
  } else {
    routerPushByKey(key);
  }
}
</script>

<template>
  <NButton v-if="!authStore.isLogin" quaternary @click="loginOrRegister">
    登录 / 注册
  </NButton>
  <NDropdown v-else placement="bottom" trigger="click" :options="options" @select="handleDropdown">
    <div>
      <ButtonIcon>
        <SvgIcon icon="ph:user-circle" class="text-icon-large" />
        <span class="text-16px font-medium">{{ authStore.userInfo.userName }}</span>
      </ButtonIcon>
    </div>
  </NDropdown>

  <NModal v-model:show="showChangePasswordModal" preset="card" title="修改密码" :style="{ width: '400px' }">
    <NForm :model="changePasswordForm" label-placement="left" label-width="100">
      <NFormItem label="原密码">
        <NInput
          v-model:value="changePasswordForm.oldPassword"
          type="password"
          show-password-on="click"
          placeholder="请输入原密码"
        />
      </NFormItem>
      <NFormItem label="新密码">
        <NInput
          v-model:value="changePasswordForm.newPassword"
          type="password"
          show-password-on="click"
          placeholder="请输入新密码"
        />
      </NFormItem>
      <NFormItem label="确认密码">
        <NInput
          v-model:value="changePasswordForm.confirmPassword"
          type="password"
          show-password-on="click"
          placeholder="请再次输入新密码"
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="showChangePasswordModal = false">取消</NButton>
        <NButton type="primary" :loading="changePasswordLoading" @click="handleChangePassword">
          确认
        </NButton>
      </NSpace>
    </template>
  </NModal>

  <NModal v-model:show="showProfileSettingsModal" preset="card" title="个人设置" :style="{ width: '480px' }">
    <NForm :model="profileSettingsForm" label-placement="left" label-width="80">
      <NFormItem label="用户名">
        <NInput v-model:value="profileSettingsForm.username" placeholder="请输入用户名" />
      </NFormItem>
      <NFormItem label="邮箱">
        <NInput v-model:value="profileSettingsForm.email" placeholder="请输入邮箱" />
      </NFormItem>
      <NFormItem label="手机号">
        <NInput v-model:value="profileSettingsForm.phone" placeholder="请输入手机号" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="showProfileSettingsModal = false">取消</NButton>
        <NButton type="primary" :loading="profileSettingsLoading" @click="handleSaveProfileSettings">
          保存
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
