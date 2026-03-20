import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, ShieldAlert, WifiOff } from 'lucide-react'
import { useConnection } from '../../hooks/useConnection'
import { getPendingCount } from '../../lib/offline-queue'

export function ConnectionBanner() {
  const { isOffline, isBackendIssue, isSyncing } = useConnection()
  const pending = getPendingCount()

  const show = isOffline || isBackendIssue || isSyncing

  let bg = ''
  let content = null

  if (isOffline) {
    bg = 'linear-gradient(135deg, rgba(239,68,68,0.92), rgba(220,38,38,0.92))'
    content = (
      <>
        <WifiOff className="h-3.5 w-3.5 text-white/90" />
        <span className="text-white/90">
          No internet connection.
          {pending > 0
            ? ` ${pending} change${pending !== 1 ? 's' : ''} saved locally — will sync automatically when you're back.`
            : ' Your work will be saved locally until you reconnect.'}
        </span>
      </>
    )
  } else if (isBackendIssue) {
    bg = 'linear-gradient(135deg, rgba(245,158,11,0.92), rgba(217,119,6,0.92))'
    content = (
      <>
        <ShieldAlert className="h-3.5 w-3.5 text-white/90" />
        <span className="text-white/90">
          We're experiencing a temporary service issue — our team is on it.
          {pending > 0
            ? ` ${pending} change${pending !== 1 ? 's' : ''} saved locally and will sync shortly.`
            : ' Your data is safe and saved locally in the meantime.'}
        </span>
      </>
    )
  } else if (isSyncing) {
    bg = 'linear-gradient(135deg, rgba(6,182,212,0.92), rgba(59,130,246,0.92))'
    content = (
      <>
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-white/90" />
        <span className="text-white/90">Syncing your data — just a moment...</span>
      </>
    )
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed left-0 right-0 top-0 z-[80] flex items-center justify-center gap-2 px-4 py-2.5 font-inter text-[12px]"
          style={{ background: bg, backdropFilter: 'blur(12px)' }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
