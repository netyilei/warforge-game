import { ToastMethods } from '@/composables/useToast.ts'

declare global {
  interface Window {
    Toast: ToastMethods
  }
}
