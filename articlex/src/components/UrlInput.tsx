import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { buildPreviewArticleFromUrl, parseXArticleUrl } from '../lib/fxtwitter'
import type { ArticleObject } from '../types/article'

interface UrlInputProps {
  onSuccess: (article: ArticleObject) => void
}

const sampleUrls = [
  {
    label: '📰 Article',
    value: 'https://x.com/the2ndfloorguy/status/2023377751374188903',
  },
  {
    label: '🧵 Long Post',
    value: 'https://x.com/JulienBek/status/2029680516568600933',
  },
  {
    label: '📖 Essay',
    value: 'https://x.com/digiii/status/2008518313995911533',
  },
]

export const UrlInput = ({ onSuccess }: UrlInputProps) => {
  const [url, setUrl] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (isLoading) {
      return
    }

    const parsed = parseXArticleUrl(url)
    if (!parsed) {
      setError('Please paste a valid X/Twitter status URL.')
      return
    }

    setError(null)
    setIsLoading(true)

    await new Promise((resolve) => window.setTimeout(resolve, 950))
    const article = buildPreviewArticleFromUrl(parsed.canonicalUrl)

    if (!article) {
      setError('Could not convert this URL yet. Try another one.')
      setIsLoading(false)
      return
    }

    onSuccess(article)
    setIsLoading(false)
  }

  return (
    <div className="w-full space-y-4">
      <motion.div
        className="flex flex-col gap-3 rounded-[20px] border p-2 shadow-glass sm:flex-row sm:items-center"
        style={{
          background: 'rgba(255,255,255,0.025)',
          borderColor: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
        }}
        animate={{
          borderColor: isFocused ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.07)',
          boxShadow: isFocused
            ? 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.5), 0 0 0 4px rgba(124,58,237,0.08)'
            : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.5)',
        }}
        transition={{ duration: 0.2 }}
      >
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Paste an X article URL..."
          className="w-full flex-1 bg-transparent px-4 py-3 font-mono text-sm text-text-primary outline-none placeholder:font-inter placeholder:text-text-muted"
        />

        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="inline-flex min-w-[140px] items-center justify-center rounded-[14px] px-7 py-3 font-inter text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-75"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
          whileHover={
            isLoading
              ? undefined
              : {
                  scale: 1.02,
                  boxShadow:
                    '0 0 40px rgba(124,58,237,0.3), 0 0 80px rgba(124,58,237,0.1)',
                }
          }
          whileTap={isLoading ? undefined : { scale: 0.96 }}
        >
          {isLoading ? (
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((index) => (
                <motion.span
                  key={index}
                  className="h-1.5 w-1.5 rounded-full bg-white"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: index * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          ) : (
            'Convert'
          )}
        </motion.button>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {sampleUrls.map((sample) => (
          <motion.button
            key={sample.label}
            type="button"
            onClick={() => {
              setUrl(sample.value)
              setError(null)
            }}
            className="cursor-pointer rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-text-muted transition-colors hover:bg-white/[0.08]"
            whileHover={{ scale: 1.03 }}
          >
            {sample.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {error ? (
          <motion.div
            key="url-input-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
