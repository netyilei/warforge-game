import { ref } from 'vue'

interface MessageOptions {
  title?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  backdrop?: boolean | 'static'
}

interface ConfirmOptions {
  title?: string
  type?: 'danger' | 'warning' | 'info'
  confirmText?: string
  cancelText?: string
}

// 全局消息状态
export const messageState = {
  visible: ref(false),
  message: ref(''),
  title: ref('提示'),
  type: ref<'success' | 'error' | 'warning' | 'info'>('info'),
  backdrop: ref<boolean | 'static'>(true),
}

// 全局确认状态
export const confirmState = {
  visible: ref(false),
  message: ref(''),
  title: ref('确认'),
  type: ref<'danger' | 'warning' | 'info'>('warning'),
  confirmText: ref('确定'),
  cancelText: ref('取消'),
  resolve: ref<((value: boolean) => void) | null>(null),
}

function getDefaultTitle(type: 'success' | 'error' | 'warning' | 'info'): string {
  const titleMap = {
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '提示',
  }
  return titleMap[type]
}

export function showMessage(msg: string, options?: MessageOptions) {
  messageState.message.value = msg
  messageState.title.value = options?.title || getDefaultTitle(options?.type || 'info')
  messageState.type.value = options?.type || 'info'
  messageState.backdrop.value = options?.backdrop !== undefined ? options.backdrop : true
  messageState.visible.value = true
}

export function showSuccess(msg: string, title?: string) {
  showMessage(msg, { type: 'success', title })
}

export function showError(msg: string, title?: string) {
  showMessage(msg, { type: 'error', title })
}

export function showWarning(msg: string, title?: string) {
  showMessage(msg, { type: 'warning', title })
}

export function showInfo(msg: string, title?: string) {
  showMessage(msg, { type: 'info', title })
}

export function closeMessage() {
  messageState.visible.value = false
}

export function showConfirm(msg: string, options?: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    confirmState.message.value = msg
    confirmState.title.value = options?.title || '确认'
    confirmState.type.value = options?.type || 'warning'
    confirmState.confirmText.value = options?.confirmText || '确定'
    confirmState.cancelText.value = options?.cancelText || '取消'
    confirmState.resolve.value = resolve
    confirmState.visible.value = true
  })
}

export function confirmConfirm() {
  if (confirmState.resolve.value) {
    confirmState.resolve.value(true)
    confirmState.resolve.value = null
  }
  confirmState.visible.value = false
}

export function cancelConfirm() {
  if (confirmState.resolve.value) {
    confirmState.resolve.value(false)
    confirmState.resolve.value = null
  }
  confirmState.visible.value = false
}
