import { motion } from 'framer-motion'
import { Clock3, FileText, ImageIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ExportButtons } from './ExportButtons'
import type { ArticleObject } from '../types/article'

interface ArticlePreviewProps {
  article: ArticleObject
  onExport: (format: 'html' | 'md' | 'docx') => void
}

export const ArticlePreview = ({ article, onExport }: ArticlePreviewProps) => {
  const [expanded, setExpanded] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({})

  const shouldShowToggle = article.body.length > 700
  const paragraphs = useMemo(
    () => article.body.split('\n').map((line) => line.trim()).filter(Boolean),
    [article.body],
  )

  useEffect(() => {
    setExpanded(false)
    setAvatarError(false)
    setLoadedImages({})
  }, [article.tweetId])

  const publishedAt = useMemo(() => {
    const date = new Date(article.publishedAt)
    const datePart = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
    const timePart = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
    return `${datePart} · ${timePart}`
  }, [article.publishedAt])

  const fallbackLetter = article.authorName.charAt(0).toUpperCase() || 'A'

  return (
    <motion.article
      key={article.tweetId}
      initial={{ opacity: 0, y: 60, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
      className="rounded-[28px] border p-10"
      style={{
        background: 'rgba(13, 13, 20, 0.85)',
        borderColor: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px) saturate(180%)',
        boxShadow:
          '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04), 0 40px 80px -20px rgba(124,58,237,0.15)',
      }}
    >
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {!avatarError && article.authorAvatar ? (
            <img
              src={article.authorAvatar}
              alt={article.authorName}
              onError={() => setAvatarError(true)}
              className="h-[52px] w-[52px] rounded-full object-cover ring-2 ring-[rgba(124,58,237,0.4)] ring-offset-2 ring-offset-bg-base"
            />
          ) : (
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] font-jakarta text-xl font-bold text-white ring-2 ring-[rgba(124,58,237,0.4)] ring-offset-2 ring-offset-bg-base">
              {fallbackLetter}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate font-inter text-[15px] font-semibold text-text-primary">
              {article.authorName}
            </p>
            <p className="truncate font-mono text-[13px] text-accent-cyan">
              {article.authorHandle}
            </p>
            <p className="font-inter text-xs text-text-muted">{publishedAt}</p>
          </div>
        </div>

        <motion.button
          type="button"
          data-cursor="pointer"
          onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1.5 font-mono text-[11px] text-text-muted"
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <span className="inline-flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white text-[10px] font-semibold text-black">
            𝕏
          </span>
          View Source
        </motion.button>
      </section>

      <div className="my-5 h-px w-full bg-border-subtle" />

      {article.title ? (
        <motion.section
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="mb-5 border-l-[3px] pl-5"
          style={{
            borderImage: 'linear-gradient(to bottom, #7c3aed, #06b6d4) 1',
          }}
        >
          <h2 className="font-jakarta text-[28px] font-extrabold leading-[1.25] tracking-[-0.02em] text-text-primary">
            {article.title}
          </h2>
        </motion.section>
      ) : null}

      <section className="relative">
        <motion.div
          layout
          className={`relative ${shouldShowToggle && !expanded ? 'max-h-[300px] overflow-hidden' : ''}`}
        >
          <div className="text-left font-inter text-[15px] font-normal leading-[1.85] text-[rgba(240,240,255,0.85)]">
            {paragraphs.map((paragraph, index) => (
              <p
                key={`${article.tweetId}-paragraph-${index}`}
                className={index === paragraphs.length - 1 ? '' : 'mb-[1em]'}
                style={{ whiteSpace: 'pre-line' }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {shouldShowToggle && !expanded ? (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
              style={{
                background: 'linear-gradient(to bottom, transparent, rgba(13,13,20,0.95))',
              }}
            />
          ) : null}
        </motion.div>

        {shouldShowToggle ? (
          <motion.button
            type="button"
            data-cursor="pointer"
            onClick={() => setExpanded((value) => !value)}
            className="mt-3 border-none bg-transparent p-0 font-inter text-[13px] font-medium text-accent-violet hover:underline hover:underline-offset-4"
            whileHover={{ color: '#9f67ff' }}
          >
            {expanded ? 'Collapse ↑' : 'Show full article ↓'}
          </motion.button>
        ) : null}
      </section>

      {article.images.length > 0 ? (
        <section className="mt-6">
          <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {article.images.map((image, index) => (
              <motion.button
                key={`${image}-${index}`}
                type="button"
                data-cursor="pointer"
                onClick={() => window.open(image, '_blank', 'noopener,noreferrer')}
                className="relative h-[220px] max-w-[380px] overflow-hidden rounded-2xl border border-border-subtle p-0"
                whileHover={{ scale: 1.02, filter: 'brightness(1.05)' }}
              >
                {!loadedImages[index] ? (
                  <div
                    className="absolute inset-0 animate-[shimmer_1.5s_infinite]"
                    style={{
                      background:
                        'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%)',
                      backgroundSize: '200% 100%',
                    }}
                  />
                ) : null}

                <img
                  src={image}
                  alt={`Article media ${index + 1}`}
                  className={`h-full w-full object-cover transition-opacity duration-300 ${
                    loadedImages[index] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() =>
                    setLoadedImages((state) => ({
                      ...state,
                      [index]: true,
                    }))
                  }
                />
              </motion.button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 flex flex-col gap-4 border-t border-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-5">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted">
            <FileText className="h-[14px] w-[14px] text-accent-violet" />
            {article.wordCount} words
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted">
            <Clock3 className="h-[14px] w-[14px] text-accent-violet" />
            {article.readingTime} min read
          </span>
          {article.images.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted">
              <ImageIcon className="h-[14px] w-[14px] text-accent-violet" />
              {article.images.length} images
            </span>
          ) : null}
        </div>

        <ExportButtons article={article} onExport={onExport} />
      </section>
    </motion.article>
  )
}
