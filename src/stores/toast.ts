import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

let nextId = 0
const toasts = ref<Toast[]>([])

export function useToast() {
  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function show(message: string, type: Toast['type'] = 'info'): void {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => dismiss(id), 4000)
  }

  return {
    toasts,
    show,
    dismiss,
  }
}
