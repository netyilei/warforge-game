<template>
  <div class="login-wrapper">
    <div class="background-overlay"></div>
    <div class="wrapper min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow class="justify-content-center">
          <CCol :md="5">
            <CCardGroup>
              <CCard class="p-4">
                <CCardBody>
                  <CForm @submit.prevent="submit">
                    <h1>登录</h1>
                    <p class="text-body-secondary">请登录您的账户</p>
                    <CInputGroup class="mb-3">
                      <CInputGroupText>
                        <CIcon icon="cil-user" />
                      </CInputGroupText>
                      <CFormInput v-model="formRef.username" placeholder="用户名" autocomplete="username" required />
                    </CInputGroup>
                    <CInputGroup class="mb-4">
                      <CInputGroupText>
                        <CIcon icon="cil-lock-locked" />
                      </CInputGroupText>
                      <CFormInput v-model="formRef.password" type="password" placeholder="密码"
                        autocomplete="current-password" required />
                    </CInputGroup>
                    <CRow>
                      <CCol :xs="6">
                        <CButton type="submit" color="primary" class="px-4" :disabled="loading">
                          {{ loading ? '登录中...' : '登录' }}
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { md5 } from '@/utils/md5'
import { loginLeaderproxy } from '@/web/LoginReq'
import { showError, showWarning } from '@/utils/message'
import { UserDefine } from 'pp-base-define/UserDefine'

// 路由
const router = useRouter()

// 表单数据
const formRef = ref({
  username: '',
  password: '',
})

// 加载状态
const loading = ref(false)

// 提交登录
const submit = async () => {
  if (!formRef.value.username || !formRef.value.password) {
    showWarning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    // 构造登录参数（根据ProxyReqDefine.ts中的定义）
    const loginReq = {
      channel: UserDefine.LoginChannel.Account,
      account: formRef.value.username,
      pwdMD5: md5(formRef.value.password),
    }

    const res = await loginLeaderproxy(loginReq)

    if (res.errCode) {
      showError(res.errMsg || '用户名或密码错误')
      return
    }

    // 确保 ak 存在
    if (!res.ak) {
      showError('登录失败：未获取到登录凭证')
      return
    }

    // 保存登录信息到sessionStorage
    sessionStorage.setItem('account', JSON.stringify(res.loginData || {}))
    sessionStorage.setItem('ak', res.ak)

    // 使用 nextTick 确保 sessionStorage 已写入，然后跳转
    await nextTick()
    router.push('/dashboard').catch(() => { })
  } catch (error) {
    console.error('登录失败:', error)
    showError('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  position: relative;
  min-height: 100vh;
  background: url('/cpp-admin/back.jpg') center center / cover no-repeat;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.wrapper {
  position: relative;
  z-index: 1;
}
</style>