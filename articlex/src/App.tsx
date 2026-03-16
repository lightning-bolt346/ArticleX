import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Github, Heart, Zap } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArticlePreview } from './components/ArticlePreview'
import { LocalHistory } from './components/LocalHistory'
import { UrlInput } from './components/UrlInput'
import { AuroraBackground } from './components/ui/AuroraBackground'
import { CustomCursor } from './components/ui/CustomCursor'
import { ThemeToggle } from './components/ui/ThemeToggle'
import {
  FxTwitterErrorCode,
  type FxTwitterError,
  fetchTweet,
} from './lib/fxtwitter'
import { addToHistory, updateFormats } from './lib/history'
import { normalizeTweet } from './lib/normalizer'
import type { ArticleObject } from './types/article'

type Theme = 'dark' | 'light'

const THEME_KEY = 'articlex-theme'

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

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
const headlineWord = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 14 } } } as const

function App() {
  const [article, setArticle] = useState<ArticleObject | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prefillUrl, setPrefillUrl] = useState('')
  const [theme, setTheme] = useState<Theme>(getStoredTheme)
  const previewRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const resolveErrorMessage = (err: unknown): string => {
    const typedError = err as FxTwitterError
    switch (typedError?.code) {
      case FxTwitterErrorCode.INVALID_URL: return 'Please paste a valid X/Twitter URL.'
      case FxTwitterErrorCode.NOT_FOUND: return 'Tweet not found. It may have been deleted.'
      case FxTwitterErrorCode.PRIVATE_TWEET: return 'This tweet is private and cannot be accessed.'
      case FxTwitterErrorCode.API_ERROR: return `FixTweet API error${typedError.status ? ` (${typedError.status})` : ''}. Try again in a moment.`
      case FxTwitterErrorCode.TWEET_ERROR: return 'The API returned an invalid tweet payload.'
      default: return 'Something went wrong while converting this URL.'
    }
  }

  const handleSuccess = async (url: string) => {
    setError(null)
    setIsLoading(true)
    setPrefillUrl(url)
    try {
      const payload = await fetchTweet(url)
      const normalized = normalizeTweet(payload)
      setArticle(normalized)
      addToHistory(normalized, [])
    } catch (err) {
      setError(resolveErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleHistorySelect = (url: string) => { void handleSuccess(url) }
  const handleExport = (format: string) => { if (article) updateFormats(article.tweetId, format) }

  useEffect(() => {
    if (article) previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [article])

  return (
    <div className="relative min-h-screen overflow-x-clip bg-bg-base">
      <AuroraBackground />
      <CustomCursor />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4">
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
        </section>

        <section>
          <UrlInput onSuccess={handleSuccess} isLoading={isLoading} prefillUrl={prefillUrl} />
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-sm text-red-300"
            >
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </motion.div>
          ) : null}
        </section>

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
                { icon: Zap, title: 'Instant', desc: 'Paste a URL, get a document in seconds' },
                { icon: Heart, title: 'Free Forever', desc: 'No signup, no paywall, no limits' },
                { icon: Github, title: 'Open', desc: 'Client-side only, your data never leaves your browser' },
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

      <footer className="relative z-10 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div>
              <p className="font-jakarta text-lg font-bold text-text-primary">
                Article<span className="bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] bg-clip-text text-transparent">X</span>
              </p>
              <p className="mt-1 font-inter text-xs text-text-muted">Turn X posts into beautiful documents.</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/lightning-bolt346/ArticleX"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted transition-colors hover:text-text-primary"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center gap-2 border-t pt-6 sm:flex-row sm:justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="font-mono text-[10px] text-text-dim">
              Built with FixTweet API · No data collected · 100% client-side
            </p>
            <p className="font-mono text-[10px] text-text-dim">
              Made with <Heart className="inline h-3 w-3 text-red-400" /> · Free & open source
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
