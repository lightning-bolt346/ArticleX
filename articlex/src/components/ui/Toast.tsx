import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, Info, Wifi, WifiOff, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { onToast, type ToastData, type ToastType } from '../../lib/toast'

const ICONS: Record<ToastType, typeof Info> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: AlertTriangle,
  offline: WifiOff,
  online: Wifi,
  syncing: Wifi,
}

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  info: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', icon: '#818cf8' },
  success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', icon: '#22c55e' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: '#f59e0b' },
  error: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', icon: '#ef4444' },
  offline: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', icon: '#ef4444' },
  online: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', icon: '#22c55e' },
  syncing: { bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.25)', icon: '#06b6d4' },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  useEffect(() => {
    return onToast((toast) => setToasts((prev) => [...prev.slice(-4), toast]))
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    if (toasts.length === 0) return
    const latest = toasts[toasts.length - 1]
    if (!latest.duration) return
    const timer = setTimeout(() => dismiss(latest.id), latest.duration)
    return () => clearTimeout(timer)
  }, [toasts, dismiss])

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-2" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type]
          const colors = COLORS[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex items-center gap-2.5 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl"
              style={{ background: colors.bg, borderColor: colors.border }}
            >
              <Icon className="h-4 w-4 flex-shrink-0" style={{ color: colors.icon }} />
              <span className="font-inter text-[13px] text-text-primary">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="ml-1 flex-shrink-0 rounded-full p-0.5 text-text-dim transition-colors hover:text-text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
