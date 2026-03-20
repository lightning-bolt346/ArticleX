export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'offline' | 'online' | 'syncing'

export interface ToastData {
  id: string
  type: ToastType
  message: string
  duration: number
}

let _toastId = 0
const listeners = new Set<(toast: ToastData) => void>()

export function showToast(type: ToastType, message: string, duration = 4000) {
  const toast: ToastData = { id: String(++_toastId), type, message, duration }
  listeners.forEach((fn) => fn(toast))
}

export function onToast(fn: (toast: ToastData) => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
