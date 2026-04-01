<script setup>
import { CContainer, CToaster, CToast, CToastHeader, CToastBody } from '@coreui/vue'
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { useToast } from '@/composables/useToast.ts'

// 获取 Toast 实例
const { toasts, removeToast } = useToast()
</script>

<template>
  <div>
    <AppSidebar />
    <div class="wrapper d-flex flex-column min-vh-100">
      <AppHeader />
      <div class="body flex-grow-1">
        <CContainer class="px-4" lg>
          <!-- 全局 Toast 容器 -->
          <CToaster placement="top-end" class="p-3">
            <CToast
              v-for="toast in toasts"
              :key="toast.id"
              :visible="toast.visible"
              :autohide="toast.autohide"
              :delay="toast.delay"
              @close="removeToast(toast.id)"
            >
              <CToastHeader closeButton>
                <svg
                  v-if="toast.color"
                  class="rounded me-2"
                  width="20"
                  height="20"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                  focusable="false"
                  role="img"
                >
                  <rect width="100%" height="100%" :fill="toast.color"></rect>
                </svg>
                <strong class="me-auto">{{ toast.title }}</strong>
                <small v-if="toast.autohide">{{ Math.ceil(toast.delay / 1000) }}秒前</small>
              </CToastHeader>
              <CToastBody>{{ toast.content }}</CToastBody>
            </CToast>
          </CToaster>
          <router-view />
        </CContainer>
      </div>
      <AppFooter />
    </div>
  </div>
</template>
