<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import avatar from '@/assets/images/avatars/8.jpg'
import { Toast } from '@/composables/useToast'

const router = useRouter()
const itemsCount = 42
const accountInfo = ref<any>(null)

// 获取账户信息
const loadAccountInfo = () => {
  try {
    const accountStr = sessionStorage.getItem('account')
    if (accountStr) {
      accountInfo.value = JSON.parse(accountStr)
    }
  } catch (error) {
    console.error('获取账户信息失败:', error)
  }
}

// 退出登录
const handleLogout = () => {
  // 清除登录信息与权限缓存
  sessionStorage.removeItem('account')
  sessionStorage.removeItem('ak')
  sessionStorage.removeItem('roleTarget')
  
  // 提示用户
  Toast.success('已退出登录')
  
  // 跳转到登录页
  router.push('/pages/login').catch(() => {})
}

onMounted(() => {
  loadAccountInfo()
})
</script>

<template>
  <CDropdown placement="bottom-end" variant="nav-item">
    <CDropdownToggle class="py-0 pe-0" :caret="false">
      <CAvatar :src="avatar" size="md" />
    </CDropdownToggle>
    <CDropdownMenu class="pt-0">
      <CDropdownHeader
        component="h6"
        class="bg-body-secondary text-body-secondary fw-semibold mb-2 rounded-top"
      >
        <div v-if="accountInfo">
          <div class="fw-bold">{{ accountInfo.account || accountInfo.userID || '用户' }}</div>
          <small class="text-muted" v-if="accountInfo.userID">ID: {{ accountInfo.userID }}</small>
        </div>
        <div v-else>账户</div>
      </CDropdownHeader>
      <CDropdownDivider />
      <CDropdownItem @click="handleLogout">
        <CIcon icon="cil-lock-locked" /> 退出登录
      </CDropdownItem>
    </CDropdownMenu>
  </CDropdown>
</template>
