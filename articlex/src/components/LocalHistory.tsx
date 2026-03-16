import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  HISTORY_UPDATED_EVENT,
  clearHistory,
  getHistory,
  type HistoryEntry,
} from '../lib/history'

interface LocalHistoryProps {
  onSelect: (url: string) => void
}

const timeAgo = (dateString: string): string => {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) {
    return 'Just now'
  }
  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  }
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  if (days === 1) {
    return 'Yesterday'
  }
  if (days < 7) {
    return `${days} days ago`
  }

  return new Date(dateString).toLocaleDateString()
}

const formatLabel = (format: string) => format.toUpperCase()

const badgeClassByFormat = (format: string): string => {
  if (format === 'html') {
    return 'text-accent-violet border-accent-violet/30'
  }
  if (format === 'md') {
    return 'text-accent-purple border-accent-purple/30'
  }
  return 'text-accent-cyan border-accent-cyan/30'
}

const MAX_VISIBLE_ITEMS = 5

export const LocalHistory = ({ onSelect }: LocalHistoryProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const hydrate = () => setHistory(getHistory())
    hydrate()

    window.addEventListener(HISTORY_UPDATED_EVENT, hydrate)
    return () => window.removeEventListener(HISTORY_UPDATED_EVENT, hydrate)
  }, [])

  const hiddenCount = Math.max(0, history.length - MAX_VISIBLE_ITEMS)
  const visibleHistory = useMemo(
    () => (expanded ? history : history.slice(0, MAX_VISIBLE_ITEMS)),
    [expanded, history],
  )

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-jakarta text-lg font-bold text-text-primary">
          Recent Conversions
        </h3>
        <button
          type="button"
          data-cursor="pointer"
          onClick={clearHistory}
          className="font-inter text-xs text-text-muted transition-colors hover:text-text-primary"
        >
          Clear all
        </button>
      </div>

      {history.length === 0 ? (
        <p className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 font-inter text-sm text-text-muted">
          No conversions yet — your recent exports will appear here.
        </p>
      ) : (
        <motion.div layout className="space-y-2.5">
          <AnimatePresence initial={false}>
            {visibleHistory.map((entry, index) => (
              <motion.button
                layout
                key={entry.tweetId}
                type="button"
                data-cursor="pointer"
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                onClick={() => onSelect(entry.url)}
                className="flex w-full items-start justify-between rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-[18px] py-[14px] text-left transition-colors hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-accent-cyan">
                    @{entry.authorHandle.replace(/^@/, '')}
                  </p>
                  <p className="mt-1 truncate font-inter text-[13px] text-text-muted">
                    {entry.snippet.slice(0, 80)}
                    {entry.snippet.length > 80 ? '…' : ''}
                  </p>
                </div>

                <div className="ml-4 shrink-0 text-right">
                  <div className="mb-2 flex justify-end gap-1.5">
                    {entry.formats.map((format) => (
                      <span
                        key={`${entry.tweetId}-${format}`}
                        className={`rounded-full border bg-white/5 px-2 py-0.5 font-mono text-[10px] ${badgeClassByFormat(
                          format,
                        )}`}
                      >
                        {formatLabel(format)}
                      </span>
                    ))}
                  </div>
                  <p className="font-inter text-[11px] text-text-dim">
                    {timeAgo(entry.convertedAt)}
                  </p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {hiddenCount > 0 && !expanded ? (
        <button
          type="button"
          data-cursor="pointer"
          onClick={() => setExpanded(true)}
          className="font-inter text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          Show {hiddenCount} more
        </button>
      ) : null}
    </section>
  )
}
