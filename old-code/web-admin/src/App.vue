<script setup>
import { onBeforeMount } from 'vue'
import { useColorModes } from '@coreui/vue-pro'

import { useThemeStore } from '@/stores/theme.js'
import MessageModal from '@/components/MessageModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { messageState, confirmState, closeMessage, confirmConfirm, cancelConfirm } from '@/utils/message'

const { isColorModeSet, setColorMode } = useColorModes(
  'coreui-free-vue-admin-template-theme',
)
const currentTheme = useThemeStore()

onBeforeMount(() => {
  const urlParams = new URLSearchParams(window.location.href.split('?')[1])
  let theme = urlParams.get('theme')

  if (theme !== null && theme.match(/^[A-Za-z0-9\s]+/)) {
    theme = theme.match(/^[A-Za-z0-9\s]+/)[0]
  }

  if (theme) {
    setColorMode(theme)
    return
  }

  if (isColorModeSet()) {
    return
  }

  setColorMode(currentTheme.theme)
})
</script>

<template>
  <router-view />
  <MessageModal
    :visible="messageState.visible.value"
    :title="messageState.title.value"
    :message="messageState.message.value"
    :type="messageState.type.value"
    :backdrop="messageState.backdrop.value"
    @update:visible="closeMessage"
  />
  <ConfirmModal
    :visible="confirmState.visible.value"
    :title="confirmState.title.value"
    :message="confirmState.message.value"
    :type="confirmState.type.value"
    :confirm-text="confirmState.confirmText.value"
    :cancel-text="confirmState.cancelText.value"
    @confirm="confirmConfirm"
    @cancel="cancelConfirm"
  />
</template>

<style lang="scss">
// Import Main styles for this application
@use 'styles/style';
// We use those styles to show code examples, you should remove them in your application.
@use 'styles/examples';
</style>
