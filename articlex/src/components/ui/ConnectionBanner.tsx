import { AnimatePresence, motion } from 'framer-motion'
import { Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { useConnection } from '../../hooks/useConnection'
import { getPendingCount } from '../../lib/offline-queue'

export function ConnectionBanner() {
  const { isOffline, isSyncing } = useConnection()
  const pending = getPendingCount()

  const show = isOffline || isSyncing

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed left-0 right-0 top-0 z-[80] flex items-center justify-center gap-2 px-4 py-2 font-inter text-[12px]"
          style={{
            background: isOffline
              ? 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9))'
              : 'linear-gradient(135deg, rgba(6,182,212,0.9), rgba(59,130,246,0.9))',
            backdropFilter: 'blur(12px)',
          }}
        >
          {isOffline ? (
            <>
              <CloudOff className="h-3.5 w-3.5 text-white/90" />
              <span className="text-white/90">
                You&apos;re offline.
                {pending > 0
                  ? ` ${pending} change${pending !== 1 ? 's' : ''} saved locally — will sync when back online.`
                  : ' Data is being saved locally.'}
              </span>
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-white/90" />
              <span className="text-white/90">Syncing your data...</span>
            </>
          )}
          {!isOffline && (
            <Cloud className="h-3.5 w-3.5 text-white/70" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
