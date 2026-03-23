import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Sparkles, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArticlePreview } from '../components/ArticlePreview'
import { LocalHistory } from '../components/LocalHistory'
import { TipButton } from '../components/TipButton'
import { UrlInput } from '../components/UrlInput'
import { updateFormats } from '../lib/history'
import { loadArticleFromUrl, resolveArticleErrorMessage } from '../lib/article-service'
import type { ArticleObject } from '../types/article'
import brandMark from '../assets/articlex-mark.svg'

const headlineRows = [
  [
    { value: 'Turn', gradient: false },
    { value: 'X', gradient: false },
    { value: 'Posts', gradient: false },
    { value: 'Into', gradient: false },
  ],
  [
    { value: 'Beautiful', gradient: true },
    { value: 'Documents', gradient: true },
  ],
]

const headlineContainer = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } } as const
const headlineWord = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } },
} as const

interface HomePageProps {
  razorpayStatus: 'checking' | 'working' | 'unavailable'
}

export function HomePage({ razorpayStatus }: HomePageProps) {
  const [article, setArticle] = useState<ArticleObject | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prefillUrl, setPrefillUrl] = useState('')
  const [fromCache, setFromCache] = useState(false)
  const previewRef = useRef<HTMLElement | null>(null)

  const handleSuccess = useCallback(async (url: string) => {
    setError(null)
    setFromCache(false)
    setIsLoading(true)
    setPrefillUrl(url)
    try {
      const result = await loadArticleFromUrl(url)
      setArticle(result.article)
      setFromCache(result.fromCache)
    } catch (err) {
      setError(resolveArticleErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleHistorySelect = useCallback((url: string) => { void handleSuccess(url) }, [handleSuccess])
  const handleExport = useCallback((format: string) => {
    if (article) updateFormats(article.tweetId, format)
  }, [article])

  useEffect(() => {
    if (article) previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [article])

  const quickLinks = useMemo(() => ([
    { to: '/features', label: 'Features' },
    { to: '/collections', label: 'Collections' },
    { to: '/feeds', label: 'Feeds' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ]), [])

  return (
    <>
      <main className="relative z-10 mx-auto w-full max-w-4xl px-4">
        <section className="pt-20 pb-10 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-text-muted"
            style={{
              background: 'linear-gradient(var(--bg-surface), var(--bg-surface)) padding-box, linear-gradient(135deg, #7c3aed, #06b6d4, #a855f7) border-box',
              backgroundSize: '100% 100%, 200% 100%',
              border: '1px solid transparent',
              animation: 'shimmer 4s linear infinite',
            }}
          >
            ✦ Free · No Login · Instant Export
          </motion.div>

          <motion.h1
            variants={headlineContainer}
            initial="hidden"
            animate="show"
            className="mt-6 font-jakarta text-[36px] font-extrabold leading-[1.1] tracking-[-0.03em] text-text-primary md:text-[68px]"
          >
            <span className="mb-4 flex items-center justify-center opacity-75">
              <img src={brandMark} alt="ArticleX logo" className="h-8 w-8 md:h-10 md:w-10" />
            </span>
            {headlineRows.map((row, rowIndex) => (
              <span key={`row-${rowIndex}`} className="block">
                {row.map((word, wordIndex) => (
                  <motion.span
                    key={`${word.value}-${wordIndex}`}
                    variants={headlineWord}
                    className={`inline-block ${wordIndex > 0 ? 'ml-3' : ''} ${word.gradient ? 'bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] bg-clip-text text-transparent' : ''}`}
                  >
                    {word.value}
                  </motion.span>
                ))}
              </span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.45 }}
            className="mx-auto mt-6 max-w-2xl font-inter text-lg font-normal text-text-muted"
          >
            Paste any X/Twitter URL. Get a beautiful, exportable document. HTML, Markdown, Word, PDF, or HD Image.
          </motion.p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                data-cursor="pointer"
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted transition-colors hover:text-text-primary"
                style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
              >
                {item.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <UrlInput key={prefillUrl || 'url-input'} onSuccess={handleSuccess} isLoading={isLoading} prefillUrl={prefillUrl} />
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-sm text-red-400"
            >
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </motion.div>
          ) : null}
        </section>

        <AnimatePresence>
          {fromCache && article && (
            <motion.div
              key="cache-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] text-text-muted"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
            >
              <Zap className="h-3 w-3 text-accent-cyan" />
              Loaded from cache
            </motion.div>
          )}
        </AnimatePresence>

        <section ref={previewRef} className="mt-8">
          <AnimatePresence mode="wait">
            {article ? <ArticlePreview key={article.tweetId} article={article} onExport={handleExport} /> : null}
          </AnimatePresence>
        </section>

        <section className="mt-10 pt-2">
          <div className="h-px w-full opacity-50" style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, #06b6d4, transparent)' }} />
          <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-text-dim">↓ Recent</p>
        </section>

        <section className="mt-5 pb-6">
          <LocalHistory onSelect={handleHistorySelect} />
        </section>

        {!article && (
          <section className="mt-8 mb-12 rounded-2xl border p-8 text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <h2 className="font-jakarta text-2xl font-bold text-text-primary">What is ArticleX?</h2>
            <p className="mx-auto mt-4 max-w-xl font-inter text-[15px] leading-relaxed text-text-muted">
              ArticleX converts X/Twitter posts, articles, and long-form content into clean, exportable documents. No account needed, no data stored, everything runs in your browser.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Sparkles, title: 'Beautiful by default', desc: 'Readable layouts with elegant typography and media support' },
                { icon: ArrowRight, title: 'Instant workflow', desc: 'Paste a URL and export in seconds' },
                { icon: AlertCircle, title: 'Private by design', desc: 'Everything runs client-side in your browser' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border-subtle p-4" style={{ background: 'var(--glass-bg)' }}>
                  <item.icon className="mx-auto h-6 w-6 text-accent-violet" />
                  <p className="mt-2 font-jakarta text-sm font-bold text-text-primary">{item.title}</p>
                  <p className="mt-1 font-inter text-xs text-text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <TipButton visible={Boolean(article)} razorpayStatus={razorpayStatus} />
    </>
  )
}
