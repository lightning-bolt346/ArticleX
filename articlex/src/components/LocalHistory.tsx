import { Clock3, History } from 'lucide-react'
import type { ArticleObject } from '../types/article'

interface LocalHistoryProps {
  entries: ArticleObject[]
  onSelect: (article: ArticleObject) => void
}

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export const LocalHistory = ({ entries, onSelect }: LocalHistoryProps) => {
  return (
    <section className="rounded-3xl border border-white/10 bg-bg-surface/70 p-5 shadow-card backdrop-blur sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-accent-purple" />
        <h3 className="font-jakarta text-lg font-bold text-text-primary">
          Local Conversion History
        </h3>
      </div>

      {entries.length === 0 ? (
        <p className="font-inter text-sm text-text-muted">
          Your conversions will appear here and stay on this device.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <button
              key={entry.tweetId}
              type="button"
              onClick={() => onSelect(entry)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/10"
            >
              <div className="min-w-0">
                <p className="truncate font-inter text-sm font-medium text-text-primary">
                  {entry.title ?? `Post by @${entry.authorHandle}`}
                </p>
                <p className="truncate font-mono text-[11px] text-text-muted">
                  @{entry.authorHandle}
                </p>
              </div>
              <span className="ml-3 inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-text-muted">
                <Clock3 className="h-3 w-3" />
                {formatDate(entry.publishedAt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
