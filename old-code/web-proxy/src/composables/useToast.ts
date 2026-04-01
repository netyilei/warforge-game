import { ref, reactive } from 'vue'

// 类型定义
export interface ToastOptions {
  title?: string
  content?: string
  color?: string
  autohide?: boolean
  delay?: number
  placement?: string
}

export interface ToastItem {
  id: number
  title: string
  content: string
  color: string
  autohide: boolean
  delay: number
  placement: string
  visible: boolean
  show: boolean
}

export interface ToastMethods {
  success(content: string, title?: string): void
  error(content: string, title?: string): void
  warning(content: string, title?: string): void
  info(content: string, title?: string): void
  custom(options: ToastOptions): void
}

export interface ToastComposable {
  toasts: import('vue').Ref<ToastItem[]>
  showToast: (options: ToastOptions) => number
  removeToast: (id: number) => void
  clearToasts: () => void
}

declare global {
  interface Window {
    Toast: ToastMethods
  }
}

// 为 Vue 组件添加类型
declare module 'vue' {
  interface ComponentCustomProperties {
    $toast: ToastMethods
    Toast: ToastMethods
  }
}

const toasts = ref<ToastItem[]>([])

export function useToast(): ToastComposable {
  const showToast = (options: ToastOptions = {}): number => {
    const {
      title = '',
      content = '',
      color = '#007aff',
      autohide = true,
      delay = 5000,
      placement = 'top-end'
    } = options

    const id = Date.now() + Math.random()

    const toast: ToastItem = reactive({
      id,
      title,
      content,
      color,
      autohide,
      delay,
      placement,
      visible: true,
      show: true
    })

    toasts.value.push(toast)

    // 自动移除
    if (autohide) {
      setTimeout(() => {
        removeToast(id)
      }, delay)
    }

    return id
  }

  const removeToast = (id: number): void => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearToasts = () => {
    toasts.value = []
  }

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts
  }
}

// 全局实例
let globalToast: ToastComposable | null = null

export function initGlobalToast(): ToastComposable {
  globalToast = useToast()
  return globalToast
}

// 全局可用的 Toast 实例
export function getGlobalToast() {
  if (!globalToast) {
    throw new Error('Toast not initialized. Call initGlobalToast() first.')
  }
  return globalToast
}

// Vue 插件
export const ToastPlugin = {
  install(app: import('vue').App) {
    // 初始化全局 Toast
    if (!globalToast) {
      globalToast = useToast()
    }

    // 在 Vue 组件中通过 this.$toast 访问
    app.config.globalProperties.$toast = Toast

    // 挂载到 window 对象，方便在任何地方使用
    if (typeof window !== 'undefined') {
      window.Toast = Toast
      // 在 Vue 模板中也可以通过 window.Toast 访问
      app.config.globalProperties.Toast = Toast
    }

    // 添加全局 mixin，让模板可以直接访问 Toast
    app.mixin({
      computed: {
        Toast() {
          return Toast
        }
      }
    })
  }
}

// 全局 Toast 方法 - 延迟初始化
export const Toast: ToastMethods = {
  success: (content: string, title: string = '成功'): void => {
    if (!globalToast) throw new Error('Toast not initialized. Call initGlobalToast() first.')
    globalToast.showToast({
      title,
      content,
      color: '#198754', // success green
      autohide: true
    })
  },

  error: (content: string, title: string = '错误'): void => {
    if (!globalToast) throw new Error('Toast not initialized. Call initGlobalToast() first.')
    globalToast.showToast({
      title,
      content,
      color: '#dc3545', // danger red
      autohide: false
    })
  },

  warning: (content: string, title: string = '警告'): void => {
    if (!globalToast) throw new Error('Toast not initialized. Call initGlobalToast() first.')
    globalToast.showToast({
      title,
      content,
      color: '#ffc107', // warning yellow
      autohide: true
    })
  },

  info: (content: string, title: string = '提示'): void => {
    if (!globalToast) throw new Error('Toast not initialized. Call initGlobalToast() first.')
    globalToast.showToast({
      title,
      content,
      color: '#0dcaf0', // info cyan
      autohide: true
    })
  },

  custom: (options: ToastOptions): void => {
    if (!globalToast) throw new Error('Toast not initialized. Call initGlobalToast() first.')
    globalToast.showToast(options)
  }
}
