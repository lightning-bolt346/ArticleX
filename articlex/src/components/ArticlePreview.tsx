import { motion } from 'framer-motion'
import { Check, Clock3, Copy, FileText, ImageIcon } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { ExportButtons } from './ExportButtons'
import type { ArticleObject, ContentBlock, InlineAnnotation } from '../types/article'

interface ArticlePreviewProps {
  article: ArticleObject
  onExport: (format: 'html' | 'md' | 'docx') => void
}

interface TextSegment {
  text: string
  bold: boolean
  italic: boolean
  link?: string
}

function segmentText(text: string, annotations: InlineAnnotation[]): TextSegment[] {
  if (!text || annotations.length === 0) {
    return [{ text, bold: false, italic: false }]
  }

  const boundaries = new Set<number>([0, text.length])
  for (const ann of annotations) {
    boundaries.add(ann.offset)
    boundaries.add(Math.min(ann.offset + ann.length, text.length))
  }

  const sorted = Array.from(boundaries).sort((a, b) => a - b)
  const segments: TextSegment[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]
    const end = sorted[i + 1]
    const slice = text.slice(start, end)
    if (!slice) continue

    let bold = false
    let italic = false
    let link: string | undefined

    for (const ann of annotations) {
      if (ann.offset <= start && start < ann.offset + ann.length) {
        if (ann.type === 'bold') bold = true
        if (ann.type === 'italic') italic = true
        if (ann.type === 'link') link = ann.url
      }
    }

    segments.push({ text: slice, bold, italic, link })
  }

  return segments
}

function renderAnnotatedText(text: string, annotations: InlineAnnotation[]): ReactNode {
  const segments = segmentText(text, annotations)
  if (segments.length === 1 && !segments[0].bold && !segments[0].italic && !segments[0].link) {
    return text
  }

  return segments.map((segment, i) => {
    let node: ReactNode = segment.text

    if (segment.bold) {
      node = <strong key={`b-${i}`} className="font-semibold text-text-primary">{node}</strong>
    }

    if (segment.italic) {
      node = <em key={`i-${i}`}>{node}</em>
    }

    if (segment.link) {
      node = (
        <a
          key={`l-${i}`}
          href={segment.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-cyan underline underline-offset-4 decoration-accent-cyan/40 hover:text-accent-violet hover:decoration-accent-violet/40 transition-colors"
        >
          {node}
        </a>
      )
    }

    if (!segment.bold && !segment.italic && !segment.link) {
      return <span key={`s-${i}`}>{node}</span>
    }

    return node
  })
}

function CodeBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-5 rounded-xl border border-border-subtle" style={{ background: 'var(--code-bg)' }}>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-dim">
          markdown
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-[1.7]" style={{ color: 'var(--code-text)' }}>
        <code>{text}</code>
      </pre>
    </div>
  )
}

function RichContentRenderer({ blocks, tweetId }: { blocks: ContentBlock[]; tweetId: string }) {
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({})
  const groups: { type: string; items: { block: ContentBlock; index: number }[] }[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const last = groups[groups.length - 1]

    if (block.type === 'list-item' && last?.type === 'list-item') {
      last.items.push({ block, index: i })
    } else {
      groups.push({ type: block.type, items: [{ block, index: i }] })
    }
  }

  return (
    <>
      {groups.map((group, gi) => {
        if (group.type === 'list-item') {
          return (
            <ul key={`g-${gi}`} className="my-4 ml-5 list-disc space-y-2">
              {group.items.map(({ block, index }) => (
                <li
                  key={`${tweetId}-li-${index}`}
                  className="text-[15px] leading-[1.85] marker:text-accent-violet"
                  style={{ color: 'var(--body-text)' }}
                >
                  {renderAnnotatedText(block.text, block.annotations)}
                </li>
              ))}
            </ul>
          )
        }

        return group.items.map(({ block, index }) => {
          switch (block.type) {
            case 'heading': {
              const isH1 = block.level === 1
              return isH1 ? (
                <h2
                  key={`${tweetId}-h1-${index}`}
                  className="mt-10 mb-4 border-b border-border-subtle pb-3 font-jakarta text-[24px] font-extrabold leading-[1.3] tracking-[-0.01em] text-text-primary"
                >
                  {renderAnnotatedText(block.text, block.annotations)}
                </h2>
              ) : (
                <h3
                  key={`${tweetId}-h2-${index}`}
                  className="mt-8 mb-3 font-jakarta text-[20px] font-bold leading-[1.3] tracking-[-0.01em] text-text-primary"
                >
                  {renderAnnotatedText(block.text, block.annotations)}
                </h3>
              )
            }

            case 'blockquote':
              return (
                <blockquote
                  key={`${tweetId}-bq-${index}`}
                  className="my-4 border-l-[3px] border-accent-violet/50 pl-5 text-[15px] italic leading-[1.85] text-text-muted"
                >
                  {renderAnnotatedText(block.text, block.annotations)}
                </blockquote>
              )

            case 'code-block':
              return <CodeBlock key={`${tweetId}-cb-${index}`} text={block.text} />

            case 'image':
              return (
                <figure key={`${tweetId}-img-${index}`} className="my-6">
                  <div className="relative overflow-hidden rounded-2xl border border-border-subtle">
                    {!loadedImages[index] && (
                      <div
                        className="absolute inset-0 animate-[shimmer_1.5s_infinite]"
                        style={{
                          background:
                            'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%)',
                          backgroundSize: '200% 100%',
                        }}
                      />
                    )}
                    <img
                      src={block.imageUrl}
                      alt="Article media"
                      className={`w-full object-contain transition-opacity duration-300 ${
                        loadedImages[index] ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() =>
                        setLoadedImages((state) => ({ ...state, [index]: true }))
                      }
                    />
                  </div>
                </figure>
              )

            default:
              return (
                <p
                  key={`${tweetId}-p-${index}`}
                  className="mb-[1em] text-[15px] leading-[1.85]"
                  style={{ color: 'var(--body-text)' }}
                >
                  {renderAnnotatedText(block.text, block.annotations)}
                </p>
              )
          }
        })
      })}
    </>
  )
}

export const ArticlePreview = ({ article, onExport }: ArticlePreviewProps) => {
  const [expanded, setExpanded] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  const hasRichContent = article.contentBlocks.length > 0
  const shouldShowToggle = !hasRichContent && article.body.length > 700

  const paragraphs = useMemo(
    () => article.body.split('\n').map((line) => line.trim()).filter(Boolean),
    [article.body],
  )

  useEffect(() => {
    setExpanded(false)
    setAvatarError(false)
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

  const trailingImages = hasRichContent ? [] : article.images

  return (
    <motion.article
      key={article.tweetId}
      initial={{ opacity: 0, y: 60, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
      className="rounded-[28px] border p-10"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        backdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: 'var(--card-shadow)',
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
          className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] text-text-muted"
          style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
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

      {article.coverImage ? (
        <section className="mb-6 overflow-hidden rounded-2xl border border-border-subtle">
          <img src={article.coverImage} alt="Cover" className="w-full object-cover" />
        </section>
      ) : null}

      <section className="relative">
        {hasRichContent ? (
          <div className="text-left font-inter">
            <RichContentRenderer blocks={article.contentBlocks} tweetId={article.tweetId} />
          </div>
        ) : (
          <>
            <motion.div
              layout
              className={`relative ${shouldShowToggle && !expanded ? 'max-h-[300px] overflow-hidden' : ''}`}
            >
              <div className="text-left font-inter text-[15px] font-normal leading-[1.85]" style={{ color: 'var(--body-text)' }}>
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
          </>
        )}
      </section>

      {trailingImages.length > 0 ? (
        <section className="mt-6">
          <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {trailingImages.map((image, index) => (
              <motion.button
                key={`${image}-${index}`}
                type="button"
                data-cursor="pointer"
                onClick={() => window.open(image, '_blank', 'noopener,noreferrer')}
                className="relative h-[220px] max-w-[380px] overflow-hidden rounded-2xl border border-border-subtle p-0"
                whileHover={{ scale: 1.02, filter: 'brightness(1.05)' }}
              >
                <img
                  src={image}
                  alt={`Article media ${index + 1}`}
                  className="h-full w-full object-cover"
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
