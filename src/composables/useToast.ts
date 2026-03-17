// src/composables/useToast.ts
import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    const newToast: Toast = {
      id,
      duration: 3000,
      ...toast
    }
    
    toasts.value.push(newToast)
    
    if (newToast.duration) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
    
    return id
  }
  
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const success = (message: string, duration?: number) => {
    return addToast({ message, type: 'success', duration })
  }
  
  const error = (message: string, duration?: number) => {
    return addToast({ message, type: 'error', duration })
  }
  
  const warning = (message: string, duration?: number) => {
    return addToast({ message, type: 'warning', duration })
  }
  
  const info = (message: string, duration?: number) => {
    return addToast({ message, type: 'info', duration })
  }
  
  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
