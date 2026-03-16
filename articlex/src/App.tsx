import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { ArticlePreview } from './components/ArticlePreview'
import { UrlInput } from './components/UrlInput'
import { AuroraBackground } from './components/ui/AuroraBackground'
import { CustomCursor } from './components/ui/CustomCursor'
import {
  FxTwitterErrorCode,
  type FxTwitterError,
  fetchTweet,
} from './lib/fxtwitter'
import { addToHistory } from './lib/history'
import { normalizeTweet } from './lib/normalizer'
import type { ArticleObject } from './types/article'

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

const headlineContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
} as const

const headlineWord = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 14,
    },
  },
} as const

function App() {
  const [article, setArticle] = useState<ArticleObject | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [convertError, setConvertError] = useState<string | null>(null)

  const resolveErrorMessage = (error: unknown): string => {
    const typedError = error as FxTwitterError

    switch (typedError?.code) {
      case FxTwitterErrorCode.INVALID_URL:
        return 'Please paste a valid X/Twitter URL.'
      case FxTwitterErrorCode.NOT_FOUND:
        return 'Tweet not found. It may have been deleted.'
      case FxTwitterErrorCode.PRIVATE_TWEET:
        return 'This tweet is private and cannot be accessed.'
      case FxTwitterErrorCode.API_ERROR:
        return `FixTweet API error${typedError.status ? ` (${typedError.status})` : ''}. Try again in a moment.`
      case FxTwitterErrorCode.TWEET_ERROR:
        return 'The API returned an invalid tweet payload.'
      default:
        return 'Something went wrong while converting this URL.'
    }
  }

  const handleConvert = async (url: string) => {
    setConvertError(null)
    setIsConverting(true)

    try {
      const apiResponse = await fetchTweet(url)
      const normalized = normalizeTweet(apiResponse)
      setArticle(normalized)
      addToHistory(normalized, [])
    } catch (error) {
      setConvertError(resolveErrorMessage(error))
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-bg-base">
      <AuroraBackground />
      <CustomCursor />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-14 pt-10 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-4xl pt-8 text-center sm:pt-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-text-muted"
            style={{
              background:
                'linear-gradient(var(--bg-surface), var(--bg-surface)) padding-box, linear-gradient(135deg, #7c3aed, #06b6d4, #a855f7) border-box',
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
                    className={`inline-block ${wordIndex > 0 ? 'ml-3' : ''} ${
                      word.gradient
                        ? 'bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] bg-clip-text text-transparent'
                        : ''
                    }`}
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
            HTML. Markdown. Word. One URL. Zero friction.
          </motion.p>

          <div
            className="mt-8 h-px w-full opacity-40"
            style={{
              background:
                'linear-gradient(90deg, transparent, #7c3aed, #06b6d4, transparent)',
            }}
          />
        </section>

        <section className="mx-auto w-full max-w-4xl">
          <UrlInput onConvert={handleConvert} isLoading={isConverting} />
          {convertError ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-sm text-red-300"
            >
              <AlertCircle className="h-4 w-4" />
              <span>{convertError}</span>
            </motion.div>
          ) : null}
        </section>

        {article ? (
          <section className="mx-auto w-full max-w-4xl">
            <ArticlePreview article={article} />
          </section>
        ) : null}
      </main>
    </div>
  )
}

export default App
