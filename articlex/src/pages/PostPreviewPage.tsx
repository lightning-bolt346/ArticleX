import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArticlePreview } from '../components/ArticlePreview'
import { loadArticleByTweetId, resolveArticleErrorMessage } from '../lib/article-service'
import { updateFormats } from '../lib/history'
import type { ArticleObject } from '../types/article'

type PreviewLocationState = {
  sourceUrl?: string
  fromCollectionName?: string
}

function PreviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl rounded-[28px] border p-8 animate-pulse" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-36 rounded" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-3 w-28 rounded" style={{ background: 'var(--bg-elevated)' }} />
        </div>
      </div>
      <div className="mt-8 h-10 w-2/3 rounded" style={{ background: 'var(--bg-elevated)' }} />
      <div className="mt-6 h-72 w-full rounded-2xl" style={{ background: 'var(--bg-elevated)' }} />
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full rounded" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-4 w-[94%] rounded" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-4 w-[88%] rounded" style={{ background: 'var(--bg-elevated)' }} />
      </div>
    </div>
  )
}

export function PostPreviewPage() {
  const { tweetId } = useParams<{ tweetId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const locationState = (location.state ?? {}) as PreviewLocationState
  const collectionId = searchParams.get('collection')
  const [article, setArticle] = useState<ArticleObject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const backHref = useMemo(
    () => (collectionId ? `/collections/${collectionId}` : '/'),
    [collectionId],
  )

  const backLabel = useMemo(() => {
    if (locationState.fromCollectionName) return `Back to ${locationState.fromCollectionName}`
    return collectionId ? 'Back to Collection' : 'Back to Home'
  }, [collectionId, locationState.fromCollectionName])

  const load = useCallback(async () => {
    if (!tweetId) {
      setError('Post not found.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await loadArticleByTweetId({
        tweetId,
        sourceUrl: locationState.sourceUrl,
        collectionId,
      })
      setArticle(result.article)
    } catch (err) {
      setError(resolveArticleErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [collectionId, locationState.sourceUrl, tweetId])

  useEffect(() => {
    void load()
  }, [load])

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(backHref)
  }, [backHref, navigate])

  const handleExport = useCallback((format: string) => {
    if (article) updateFormats(article.tweetId, format)
  }, [article])

  return (
    <main className="relative z-10 min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <motion.button
            type="button"
            data-cursor="pointer"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary"
            style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </motion.button>

          <Link
            to={backHref}
            data-cursor="pointer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border text-text-muted transition-colors hover:text-text-primary"
            style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
            aria-label={backLabel}
          >
            <X className="h-4 w-4" />
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.section
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] text-text-muted" style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading full preview
              </div>
              <PreviewSkeleton />
            </motion.section>
          ) : error ? (
            <motion.section
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center rounded-[28px] border px-6 py-12 text-center"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h1 className="mt-5 font-jakarta text-2xl font-bold text-text-primary">Could not open this preview</h1>
              <p className="mt-3 max-w-xl font-inter text-[15px] leading-relaxed text-text-muted">{error}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <motion.button
                  type="button"
                  data-cursor="pointer"
                  onClick={() => void load()}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-inter text-[14px] font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Retry
                </motion.button>
                <Link
                  to={backHref}
                  data-cursor="pointer"
                  className="inline-flex items-center rounded-full border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary"
                  style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
                >
                  {backLabel}
                </Link>
              </div>
            </motion.section>
          ) : article ? (
            <motion.section
              key={article.tweetId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <ArticlePreview article={article} onExport={handleExport} />
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  )
}
