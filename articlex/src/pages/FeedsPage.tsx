import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  CheckCheck,
  ChevronLeft,
  Loader2,
  Lock,
  Menu,
  Newspaper,
  Plus,
  RefreshCw,
  Rss,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArticlePreview } from '../components/ArticlePreview'
import { AddSubstackModal } from '../components/AddSubstackModal'
import { AuthModal } from '../components/AuthModal'
import { useAuth } from '../hooks/useAuth'
import {
  addSubscription,
  fetchLatestArticles,
  getPublicationId,
  getUserReadStatuses,
  getUserSubscriptions,
  invalidateCache,
  markArticleRead,
  removeSubscription,
  substackArticleToArticleObject,
  toggleBookmark,
  type SubstackArticle,
  type SubstackPublication,
  type SubstackSubscriptionRecord,
} from '../lib/substack'
import { isSupabaseConfigured } from '../lib/supabase'
import { showToast } from '../lib/toast'
import type { AuthUser } from '../lib/auth'
import type { ArticleObject } from '../types/article'

// ─── Animation variants ──────────────────────────────────────────────────────

const sidebarListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const sidebarItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

const articleListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const articleCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 24 } },
}

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'unread' | 'bookmarked' | string

interface LoadedPub {
  subscription: SubstackSubscriptionRecord
  publication: SubstackPublication | null
  error: string | null
  loading: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / 86_400_000)

    if (diffDays === 0) {
      const diffHrs = Math.floor(diffMs / 3_600_000)
      if (diffHrs === 0) {
        const diffMin = Math.floor(diffMs / 60_000)
        return diffMin <= 1 ? 'just now' : `${diffMin}m ago`
      }
      return `${diffHrs}h ago`
    }
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`

    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined })
  } catch {
    return ''
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PublicationFavicon({
  src,
  title,
  size = 'md',
}: {
  src: string | null
  title: string
  size?: 'sm' | 'md'
}) {
  const [errored, setErrored] = useState(false)
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-sm'

  if (!src || errored) {
    return (
      <div
        className={`${dim} shrink-0 flex items-center justify-center rounded-lg font-jakarta font-bold text-white ${textSize}`}
        style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
      >
        {title.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className={`${dim} shrink-0 rounded-lg object-cover`}
      onError={() => setErrored(true)}
    />
  )
}

function ArticleCard({
  article,
  onRead,
  onToggleBookmark,
  onMarkRead,
  isActive,
}: {
  article: SubstackArticle
  onRead: (article: SubstackArticle) => void
  onToggleBookmark: (article: SubstackArticle) => void
  onMarkRead: (article: SubstackArticle) => void
  isActive: boolean
}) {
  return (
    <motion.article
      variants={articleCardVariants}
      className={`group relative rounded-2xl border p-4 transition-all duration-200 ${
        isActive ? 'ring-2 ring-[var(--accent-violet)]/40' : ''
      }`}
      style={{
        background: 'var(--card-bg)',
        borderColor: article.isRead ? 'var(--border-subtle)' : 'var(--card-border)',
        opacity: article.isRead ? 0.75 : 1,
      }}
    >
      {/* Unread dot */}
      {!article.isRead && (
        <span
          className="absolute left-4 top-5 h-1.5 w-1.5 rounded-full"
          style={{ background: 'var(--accent-violet)' }}
        />
      )}

      <div className={`${!article.isRead ? 'pl-4' : ''}`}>
        {/* Publication + meta row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-muted">
            {article.publicationName}
          </span>
          <span className="font-mono text-[10px] text-text-dim">·</span>
          <span className="font-mono text-[10px] text-text-dim">{formatDate(article.publishedAt)}</span>
          <span className="font-mono text-[10px] text-text-dim">·</span>
          <span className="font-mono text-[10px] text-text-dim">{article.readingTime} min read</span>
          {article.isPaywalled && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-amber-400">
              <Lock className="h-2.5 w-2.5" />
              Subscriber Only
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={`mt-1.5 font-jakarta text-[15px] font-bold leading-snug text-text-primary line-clamp-2 ${
            article.isRead ? 'font-semibold' : ''
          }`}
        >
          {article.title}
        </h3>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="mt-1 line-clamp-2 font-inter text-[13px] text-text-muted leading-relaxed">
            {article.subtitle}
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {article.isPaywalled ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="pointer"
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-inter text-[12px] font-medium text-text-muted transition-colors hover:text-text-primary"
              style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
            >
              <ArrowUpRight className="h-3 w-3" />
              Open on Substack
            </a>
          ) : (
            <motion.button
              type="button"
              data-cursor="pointer"
              onClick={() => onRead(article)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-inter text-[12px] font-semibold text-white"
              style={{ background: isActive ? 'linear-gradient(135deg, #5b21b6, #0e7490)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <BookOpen className="h-3 w-3" />
              {isActive ? 'Close' : 'Read'}
            </motion.button>
          )}

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="pointer"
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-inter text-[12px] text-text-muted transition-colors hover:text-text-primary"
            style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
          >
            <ArrowUpRight className="h-3 w-3" />
            Substack
          </a>

          {!article.isRead && (
            <button
              type="button"
              data-cursor="pointer"
              onClick={() => onMarkRead(article)}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-inter text-[12px] text-text-dim transition-colors hover:text-text-primary"
              style={{ borderColor: 'transparent' }}
              title="Mark as read"
            >
              <CheckCheck className="h-3 w-3" />
            </button>
          )}

          <button
            type="button"
            data-cursor="pointer"
            onClick={() => onToggleBookmark(article)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-inter text-[12px] transition-colors ${
              article.isBookmarked ? 'text-[var(--accent-violet)]' : 'text-text-dim hover:text-text-primary'
            }`}
            style={{ borderColor: 'transparent' }}
            title={article.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {article.isBookmarked ? (
              <BookmarkCheck className="h-3 w-3" />
            ) : (
              <Bookmark className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    </motion.article>
  )
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function ArticleSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl border p-4"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <div className="flex gap-2">
        <div className="h-3 w-24 rounded" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-3 w-12 rounded" style={{ background: 'var(--bg-elevated)' }} />
      </div>
      <div className="mt-2 h-5 w-3/4 rounded" style={{ background: 'var(--bg-elevated)' }} />
      <div className="mt-1.5 h-4 w-full rounded" style={{ background: 'var(--bg-elevated)' }} />
      <div className="mt-1 h-4 w-5/6 rounded" style={{ background: 'var(--bg-elevated)' }} />
      <div className="mt-3 flex gap-2">
        <div className="h-7 w-16 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-7 w-20 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
      </div>
    </div>
  )
}

// ─── Inline Article Reader ────────────────────────────────────────────────────

function ArticleReaderOverlay({
  article,
  onClose,
}: {
  article: ArticleObject
  onClose: () => void
}) {
  const handleExport = useCallback(() => {}, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex flex-col bg-[var(--bg-base)] overflow-hidden"
    >
      {/* Toolbar */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-4 py-3"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <motion.button
          type="button"
          data-cursor="pointer"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary"
          style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to feeds
        </motion.button>
        <button
          type="button"
          data-cursor="pointer"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full border text-text-muted transition-colors hover:text-text-primary"
          style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Article content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <ArticlePreview article={article} onExport={handleExport} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main FeedsPage ───────────────────────────────────────────────────────────

export function FeedsPage() {
  const { user, loading: authLoading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [loadedPubs, setLoadedPubs] = useState<LoadedPub[]>([])
  const [globalLoading, setGlobalLoading] = useState(false)
  const [activeArticle, setActiveArticle] = useState<SubstackArticle | null>(null)
  const [readerArticle, setReaderArticle] = useState<ArticleObject | null>(null)
  const hasFetchedRef = useRef(false)
  const hasSupabase = isSupabaseConfigured()

  // ── Load subscriptions + feeds ─────────────────────────────────────────────

  const loadFeeds = useCallback(
    async (currentUser: AuthUser, forceRefresh = false) => {
      setGlobalLoading(true)
      try {
        const [subs, statuses] = await Promise.all([
          getUserSubscriptions(currentUser.id),
          getUserReadStatuses(currentUser.id),
        ])

        if (subs.length === 0) {
          setLoadedPubs([])
          return
        }

        // Initialize with loading state
        setLoadedPubs(
          subs.map((sub) => ({ subscription: sub, publication: null, error: null, loading: true })),
        )

        if (forceRefresh) {
          subs.forEach((sub) => {
            invalidateCache(getPublicationId(sub.publication_url))
          })
        }

        // Fetch all feeds in parallel
        const results = await Promise.allSettled(
          subs.map((sub) => fetchLatestArticles(sub, statuses)),
        )

        setLoadedPubs(
          subs.map((sub, i) => {
            const result = results[i]
            if (result.status === 'fulfilled') {
              return { subscription: sub, publication: result.value, error: null, loading: false }
            }
            return {
              subscription: sub,
              publication: null,
              error: result.reason instanceof Error ? result.reason.message : 'Failed to load',
              loading: false,
            }
          }),
        )
      } catch (err) {
        console.error('[FeedsPage] loadFeeds', err)
        showToast('error', 'Failed to load feeds')
      } finally {
        setGlobalLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!user || hasFetchedRef.current) return
    hasFetchedRef.current = true
    void loadFeeds(user)
  }, [user, loadFeeds])

  // ── All articles merged + sorted ───────────────────────────────────────────

  const allArticles = useMemo<SubstackArticle[]>(() => {
    const articles: SubstackArticle[] = []
    for (const lp of loadedPubs) {
      if (lp.publication) {
        articles.push(...lp.publication.articles)
      }
    }
    return articles.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
  }, [loadedPubs])

  // ── Filtered articles ──────────────────────────────────────────────────────

  const filteredArticles = useMemo<SubstackArticle[]>(() => {
    if (activeFilter === 'all') return allArticles
    if (activeFilter === 'unread') return allArticles.filter((a) => !a.isRead)
    if (activeFilter === 'bookmarked') return allArticles.filter((a) => a.isBookmarked)
    return allArticles.filter((a) => a.publicationId === activeFilter)
  }, [allArticles, activeFilter])

  // ── Unread counts per publication ──────────────────────────────────────────

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const article of allArticles) {
      if (!article.isRead) {
        counts[article.publicationId] = (counts[article.publicationId] ?? 0) + 1
      }
    }
    return counts
  }, [allArticles])

  const totalUnread = useMemo(
    () => allArticles.filter((a) => !a.isRead).length,
    [allArticles],
  )

  const totalBookmarked = useMemo(
    () => allArticles.filter((a) => a.isBookmarked).length,
    [allArticles],
  )

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleLogin = useCallback(
    (loggedInUser: AuthUser) => {
      setShowAuthModal(false)
      hasFetchedRef.current = false
      void loadFeeds(loggedInUser)
    },
    [loadFeeds],
  )

  const handleAddConfirm = useCallback(
    async (publication: SubstackPublication) => {
      if (!user) return
      const result = await addSubscription(user.id, publication.url)
      if (!result.success) {
        showToast('error', result.error)
        throw new Error(result.error)
      }
      showToast('success', `Subscribed to ${publication.title}`)
      hasFetchedRef.current = false
      void loadFeeds(user)
    },
    [user, loadFeeds],
  )

  const handleRemoveSubscription = useCallback(
    async (sub: SubstackSubscriptionRecord) => {
      if (!user) return
      await removeSubscription(sub.id)
      setLoadedPubs((prev) => prev.filter((lp) => lp.subscription.id !== sub.id))
      showToast('info', `Removed ${sub.title ?? 'subscription'}`)
    },
    [user],
  )

  const handleRefresh = useCallback(() => {
    if (!user) return
    hasFetchedRef.current = false
    void loadFeeds(user, true)
  }, [user, loadFeeds])

  const updateArticleInState = useCallback(
    (url: string, updates: Partial<SubstackArticle>) => {
      setLoadedPubs((prev) =>
        prev.map((lp) => {
          if (!lp.publication) return lp
          return {
            ...lp,
            publication: {
              ...lp.publication,
              articles: lp.publication.articles.map((a) =>
                a.url === url ? { ...a, ...updates } : a,
              ),
            },
          }
        }),
      )
    },
    [],
  )

  const handleReadArticle = useCallback(
    (article: SubstackArticle) => {
      if (activeArticle?.url === article.url) {
        setActiveArticle(null)
        setReaderArticle(null)
        return
      }
      setActiveArticle(article)
      setReaderArticle(substackArticleToArticleObject(article))

      if (!article.isRead && user) {
        updateArticleInState(article.url, { isRead: true })
        void markArticleRead(user.id, article.url, true)
      }
    },
    [activeArticle, user, updateArticleInState],
  )

  const handleToggleBookmark = useCallback(
    (article: SubstackArticle) => {
      if (!user) return
      const newVal = !article.isBookmarked
      updateArticleInState(article.url, { isBookmarked: newVal })
      void toggleBookmark(user.id, article.url, newVal)
      showToast(
        'success',
        newVal ? `Bookmarked "${article.title.slice(0, 30)}…"` : 'Bookmark removed',
      )
    },
    [user, updateArticleInState],
  )

  const handleMarkRead = useCallback(
    (article: SubstackArticle) => {
      if (!user) return
      updateArticleInState(article.url, { isRead: true })
      void markArticleRead(user.id, article.url, true)
    },
    [user, updateArticleInState],
  )

  const handleCloseReader = useCallback(() => {
    setActiveArticle(null)
    setReaderArticle(null)
  }, [])

  // ── Loading / auth states ──────────────────────────────────────────────────

  if (authLoading) {
    return (
      <main className="relative z-10 flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </main>
    )
  }

  if (!user) {
    return (
      <>
        <main className="relative z-10 flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
          <div
            className="w-full max-w-md rounded-[28px] border p-10"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
          >
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
            >
              <Rss className="h-7 w-7 text-white" />
            </div>
            <h1 className="mt-5 font-jakarta text-2xl font-bold text-text-primary">
              Substack Feeds
            </h1>
            <p className="mt-3 font-inter text-[15px] leading-relaxed text-text-muted">
              Sign in to subscribe to Substack publications and see all new posts in one unified
              inbox.
            </p>
            {!hasSupabase && (
              <p className="mt-3 font-inter text-[12px] text-amber-400">
                Note: Supabase is not configured — subscription data will not persist.
              </p>
            )}
            <motion.button
              type="button"
              data-cursor="pointer"
              onClick={() => setShowAuthModal(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-inter text-[14px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Sign In to Continue
            </motion.button>
          </div>
        </main>
        <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />
      </>
    )
  }

  const isLoading = globalLoading || loadedPubs.some((lp) => lp.loading)

  return (
    <>
      {/* Article reader overlay */}
      <AnimatePresence>
        {readerArticle && (
          <ArticleReaderOverlay article={readerArticle} onClose={handleCloseReader} />
        )}
      </AnimatePresence>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              type="button"
              data-cursor="pointer"
              onClick={() => setSidebarOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border text-text-muted transition-colors hover:text-text-primary lg:hidden"
              style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
            >
              <Menu className="h-4 w-4" />
            </button>

            <div>
              <h1 className="font-jakarta text-2xl font-bold text-text-primary">Feeds</h1>
              <p className="font-inter text-[12px] text-text-muted">
                {loadedPubs.length} publication{loadedPubs.length !== 1 ? 's' : ''} ·{' '}
                {totalUnread} unread
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              data-cursor="pointer"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-xl border text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
              style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
              title="Refresh feeds"
              whileTap={{ rotate: 360, transition: { duration: 0.5 } }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </motion.button>

            <motion.button
              type="button"
              data-cursor="pointer"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-inter text-[13px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Publication</span>
              <span className="sm:hidden">Add</span>
            </motion.button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar ─────────────────────────────────────────────────────── */}

          {/* Mobile overlay backdrop */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          <motion.aside
            className={`
              fixed top-0 left-0 z-40 h-full w-72 overflow-y-auto border-r pt-16 pb-6 px-4
              lg:static lg:z-auto lg:h-auto lg:w-64 lg:shrink-0 lg:pt-0 lg:pb-0 lg:border-r-0
              transition-transform duration-300
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
            style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
          >
            {/* Mobile close */}
            <button
              type="button"
              data-cursor="pointer"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border text-text-muted lg:hidden"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-dim">
                Publications
              </p>
            </div>

            {loadedPubs.length === 0 && !isLoading ? (
              <div className="mt-4 rounded-xl border border-dashed p-4 text-center" style={{ borderColor: 'var(--border-subtle)' }}>
                <Newspaper className="mx-auto h-6 w-6 text-text-dim" />
                <p className="mt-2 font-inter text-[12px] text-text-dim">No subscriptions yet</p>
              </div>
            ) : (
              <motion.ul
                variants={sidebarListVariants}
                initial="hidden"
                animate="visible"
                className="space-y-1"
              >
                {loadedPubs.map((lp) => {
                  const pubId = lp.publication?.id ?? lp.subscription.id
                  const isActive = activeFilter === (lp.publication?.id ?? '')
                  const unread = unreadCounts[lp.publication?.id ?? ''] ?? 0

                  return (
                    <motion.li key={lp.subscription.id} variants={sidebarItemVariants}>
                      <div
                        className={`group flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-150 ${
                          isActive
                            ? 'bg-[var(--accent-violet)]/10'
                            : 'hover:bg-[var(--bg-elevated)]'
                        }`}
                        onClick={() => {
                          setActiveFilter(isActive ? 'all' : (lp.publication?.id ?? pubId))
                          setSidebarOpen(false)
                        }}
                        data-cursor="pointer"
                      >
                        {lp.loading ? (
                          <div className="h-7 w-7 shrink-0 animate-pulse rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
                        ) : (
                          <PublicationFavicon
                            src={lp.subscription.favicon_url ?? lp.publication?.faviconUrl ?? null}
                            title={lp.subscription.title ?? lp.publication?.title ?? '?'}
                            size="sm"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate font-inter text-[13px] ${
                              isActive ? 'font-semibold text-text-primary' : 'text-text-muted'
                            }`}
                          >
                            {lp.subscription.title ?? lp.publication?.title ?? 'Loading…'}
                          </p>
                          {lp.error && (
                            <p className="truncate font-inter text-[10px] text-red-400">{lp.error}</p>
                          )}
                        </div>

                        {unread > 0 && (
                          <span
                            className="shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[9px] text-white"
                            style={{ background: 'var(--accent-violet)' }}
                          >
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}

                        <button
                          type="button"
                          data-cursor="pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleRemoveSubscription(lp.subscription)
                          }}
                          className="ml-auto hidden h-5 w-5 shrink-0 items-center justify-center rounded text-text-dim hover:text-red-400 group-hover:flex"
                          title="Remove subscription"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.li>
                  )
                })}
              </motion.ul>
            )}

            {/* Add button in sidebar */}
            <motion.button
              type="button"
              data-cursor="pointer"
              onClick={() => { setShowAddModal(true); setSidebarOpen(false) }}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2.5 font-inter text-[12px] text-text-muted transition-colors hover:text-text-primary"
              style={{ borderColor: 'var(--border-subtle)', borderStyle: 'dashed', background: 'transparent' }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add publication
            </motion.button>
          </motion.aside>

          {/* ── Main content ─────────────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            {/* Filter tabs */}
            <div
              className="mb-4 flex flex-wrap gap-1.5 rounded-2xl border p-2"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
            >
              {[
                { key: 'all', label: 'All', count: allArticles.length },
                { key: 'unread', label: 'Unread', count: totalUnread },
                { key: 'bookmarked', label: 'Bookmarked', count: totalBookmarked },
                ...loadedPubs
                  .filter((lp) => lp.publication)
                  .map((lp) => ({
                    key: lp.publication!.id,
                    label: lp.subscription.title ?? lp.publication!.title,
                    count: lp.publication!.articles.length,
                  })),
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  data-cursor="pointer"
                  onClick={() => setActiveFilter(tab.key as FilterTab)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-all duration-150 ${
                    activeFilter === tab.key
                      ? 'text-white'
                      : 'text-text-dim hover:text-text-primary'
                  }`}
                  style={
                    activeFilter === tab.key
                      ? { background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }
                      : undefined
                  }
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] ${
                        activeFilter === tab.key
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--bg-base)] text-text-dim'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Article list */}
            <AnimatePresence mode="wait">
              {isLoading && loadedPubs.every((lp) => lp.loading) ? (
                <motion.div
                  key="skeletons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <ArticleSkeleton key={i} />
                  ))}
                </motion.div>
              ) : loadedPubs.length === 0 ? (
                /* Empty — no subscriptions */
                <motion.div
                  key="empty-subs"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center rounded-[28px] border px-6 py-20 text-center"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.15))' }}
                  >
                    <Rss className="h-8 w-8 text-text-muted" />
                  </div>
                  <h2 className="mt-5 font-jakarta text-xl font-bold text-text-primary">
                    Your inbox is empty
                  </h2>
                  <p className="mt-3 max-w-sm font-inter text-[14px] leading-relaxed text-text-muted">
                    Subscribe to Substack publications to see their latest posts here in one place.
                  </p>
                  <motion.button
                    type="button"
                    data-cursor="pointer"
                    onClick={() => setShowAddModal(true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 font-inter text-[14px] font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Plus className="h-4 w-4" />
                    Add your first publication
                  </motion.button>
                </motion.div>
              ) : filteredArticles.length === 0 ? (
                /* Filter has no results */
                <motion.div
                  key="empty-filter"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center rounded-[28px] border px-6 py-16 text-center"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
                >
                  <BookOpen className="mx-auto h-10 w-10 text-text-dim" />
                  <p className="mt-4 font-jakarta text-lg font-bold text-text-primary">
                    {activeFilter === 'unread'
                      ? 'All caught up!'
                      : activeFilter === 'bookmarked'
                      ? 'No bookmarks yet'
                      : 'No articles in this feed'}
                  </p>
                  <p className="mt-2 font-inter text-[13px] text-text-muted">
                    {activeFilter === 'unread'
                      ? 'You have read all available articles.'
                      : activeFilter === 'bookmarked'
                      ? 'Bookmark articles to save them for later.'
                      : 'Check back later for new posts.'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={`articles-${activeFilter}`}
                  variants={articleListVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {filteredArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onRead={handleReadArticle}
                      onToggleBookmark={handleToggleBookmark}
                      onMarkRead={handleMarkRead}
                      isActive={activeArticle?.url === article.url}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddSubstackModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={handleAddConfirm}
      />
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />
    </>
  )
}
