import { ToastMethods } from '@/composables/useToast.ts'

declare module 'vue' {
  interface ComponentCustomProperties {
    $toast: ToastMethods
    Toast: ToastMethods
  }
}
