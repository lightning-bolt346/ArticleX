import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Copy,
  FileImage,
  FileText,
  FileType,
  Globe,
  ImageIcon,
  Maximize2,
  X,
} from 'lucide-react'
import { ExportButtons } from './ExportButtons'
import { createPortal } from 'react-dom'
import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ImageLightbox } from './ui/ImageLightbox'
import { generateDOCX } from '../lib/generators/docx'
import { generateHTML } from '../lib/generators/html'
import { generateMarkdown } from '../lib/generators/markdown'
import { generatePDF } from '../lib/generators/pdf'
import { ReadingSettingsButton } from './ui/ReadingSettings'
import {
  READING_DEFAULTS,
  cardMaxWidth,
  getReaderThemePalette,
  getReadingConfig,
  readingFontStyle,
  type ReaderThemePalette,
  type ReadingConfig,
} from '../lib/reading-config'
import { generatePNG } from '../lib/generators/png'
import type { ArticleObject, ContentBlock, InlineAnnotation } from '../types/article'
import brandMark from '../assets/articlex-mark.svg'

type ExportFormat = 'html' | 'md' | 'docx' | 'pdf' | 'png'

interface ArticlePreviewProps {
  article: ArticleObject
  onExport: (format: string) => void
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

function renderAnnotatedText(
  text: string,
  annotations: InlineAnnotation[],
  linkDecoration: 'solid' | 'dotted' = 'solid',
): ReactNode {
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
          style={{ textDecorationStyle: linkDecoration }}
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

function CodeBlock({ text, codeFont }: { text: string; codeFont: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="group relative my-5 rounded-xl border border-border-subtle" style={{ background: 'var(--code-bg)' }}>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-dim">markdown</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          {copied ? <><Check className="h-3 w-3 text-green-400" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
        </button>
      </div>
      <pre
        className="overflow-x-auto p-4 font-mono text-[13px] leading-[1.7]"
        style={{ color: 'var(--code-text)', fontFamily: codeFont }}
      >
        <code>{text}</code>
      </pre>
    </div>
  )
}

function ClickableImage({ src, alt, className, onOpen }: { src: string; alt: string; className?: string; onOpen: (src: string) => void }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`cursor-pointer transition-transform hover:scale-[1.01] ${className ?? ''}`}
      onClick={() => onOpen(src)}
    />
  )
}

function RichContentRenderer({
  blocks,
  tweetId,
  onImageOpen,
  themePalette,
  bodyFont,
}: {
  blocks: ContentBlock[]
  tweetId: string
  onImageOpen: (src: string) => void
  themePalette: ReaderThemePalette
  bodyFont: string
}) {
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({})
  const linkDecoration = themePalette.id === 'sepia-comfort' ? 'dotted' : 'solid'
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
                  style={{ color: 'var(--body-text)', fontFamily: bodyFont }}
                >
                  {renderAnnotatedText(block.text, block.annotations, linkDecoration)}
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
                  className="mt-10 mb-4 border-b border-border-subtle pb-3 text-[1.6em] font-extrabold leading-[1.3] tracking-[-0.01em] text-text-primary"
                  style={{ fontFamily: themePalette.headingFont }}
                >
                  {renderAnnotatedText(block.text, block.annotations, linkDecoration)}
                </h2>
              ) : (
                <h3
                  key={`${tweetId}-h2-${index}`}
                  className="mt-8 mb-3 text-[1.35em] font-bold leading-[1.3] tracking-[-0.01em] text-text-primary"
                  style={{ fontFamily: themePalette.headingFont }}
                >
                  {renderAnnotatedText(block.text, block.annotations, linkDecoration)}
                </h3>
              )
            }
            case 'blockquote':
              return (
                <blockquote
                  key={`${tweetId}-bq-${index}`}
                  className="my-4 rounded-r-xl border-l-[3px] py-2 pr-4 pl-5 text-[15px] italic leading-[1.85] text-text-muted"
                  style={{ background: 'var(--reader-quote-bg)', borderLeftColor: 'var(--reader-quote-border)', fontFamily: bodyFont }}
                >
                  {renderAnnotatedText(block.text, block.annotations, linkDecoration)}
                </blockquote>
              )
            case 'code-block':
              return <CodeBlock key={`${tweetId}-cb-${index}`} text={block.text} codeFont={themePalette.codeFont} />
            case 'image':
              return (
                <figure key={`${tweetId}-img-${index}`} className="my-6">
                  <div className="relative overflow-hidden rounded-2xl border border-border-subtle">
                    {!loadedImages[index] && (
                      <div className="absolute inset-0 animate-[shimmer_1.5s_infinite]" style={{ background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-surface) 50%, var(--bg-elevated) 75%)', backgroundSize: '200% 100%' }} />
                    )}
                    <ClickableImage
                      src={block.imageUrl ?? ''}
                      alt="Article media"
                      className={`w-full object-contain transition-opacity duration-300 ${loadedImages[index] ? 'opacity-100' : 'opacity-0'}`}
                      onOpen={onImageOpen}
                    />
                    <img
                      src={block.imageUrl}
                      alt=""
                      className="hidden"
                      onLoad={() => setLoadedImages((s) => ({ ...s, [index]: true }))}
                    />
                  </div>
                </figure>
              )
            default:
              return (
                <p
                  key={`${tweetId}-p-${index}`}
                  className="mb-[1em] text-[15px] leading-[1.85]"
                  style={{ color: 'var(--body-text)', fontFamily: bodyFont }}
                >
                  {renderAnnotatedText(block.text, block.annotations, linkDecoration)}
                </p>
              )
          }
        })
      })}
    </>
  )
}

const EXPORT_OPTIONS: { format: ExportFormat; label: string; icon: typeof Globe }[] = [
  { format: 'html', label: 'HTML File', icon: Globe },
  { format: 'md', label: 'Markdown', icon: Code2 },
  { format: 'docx', label: 'Word Doc', icon: FileType },
  { format: 'pdf', label: 'PDF', icon: FileText },
  { format: 'png', label: 'HD Image', icon: FileImage },
]

function ExportDropdown({
  article,
  articleRef,
  onExport,
}: {
  article: ArticleObject
  articleRef: React.RefObject<HTMLElement | null>
  onExport: (format: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<ExportFormat | null>(null)
  const [success, setSuccess] = useState<ExportFormat | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  const handle = article.authorHandle.replace(/^@/, '')

  const doExport = async (format: ExportFormat) => {
    if (loading) return
    setLoading(format)
    try {
      switch (format) {
        case 'html':
          generateHTML(article)
          break
        case 'md':
          generateMarkdown(article)
          break
        case 'docx':
          await generateDOCX(article)
          break
        case 'pdf':
          await generatePDF(article)
          break
        case 'png':
          if (articleRef.current) await generatePNG(articleRef.current, `${handle}-article`)
          break
      }
      setSuccess(format)
      onExport(format)
      window.setTimeout(() => setSuccess((c) => (c === format ? null : c)), 2000)
    } finally {
      setLoading(null)
      setOpen(false)
    }
  }

  return (
    <div ref={dropdownRef} className="relative" data-export-exclude>
      <motion.button
        type="button"
        data-cursor="pointer"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] text-text-muted transition-colors"
        style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
        whileHover={{ scale: 1.03 }}
      >
        {success ? <Check className="h-3 w-3 text-green-400" /> : <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />}
        Download
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border shadow-lg"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--card-border)' }}
          >
            {EXPORT_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isLoading = loading === opt.format
              return (
                <button
                  key={opt.format}
                  type="button"
                  data-cursor="pointer"
                  onClick={() => void doExport(opt.format)}
                  disabled={!!loading}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-inter text-[13px] text-text-primary transition-colors hover:bg-accent-violet/10 disabled:opacity-50"
                >
                  <Icon className="h-4 w-4 text-accent-violet" />
                  <span className="flex-1">{opt.label}</span>
                  {isLoading && (
                    <motion.div
                      className="h-3 w-3 rounded-full border-2 border-accent-violet border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const ArticlePreview = ({ article, onExport }: ArticlePreviewProps) => {
  const [expanded, setExpanded] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState(false)
  const [themeNow, setThemeNow] = useState(() => new Date())
  const [readingConfig, setReadingConfig] = useState<ReadingConfig>(getReadingConfig)
  const articleRef = useRef<HTMLElement>(null)

  const hasRichContent = article.contentBlocks.length > 0
  const shouldShowToggle = !hasRichContent && article.body.length > 700

  const paragraphs = useMemo(
    () => article.body.split('\n').map((line) => line.trim()).filter(Boolean),
    [article.body],
  )

  useEffect(() => {
    if (readingConfig.theme !== 'dynamic-dim') return
    const initialTick = window.setTimeout(() => setThemeNow(new Date()), 0)
    const interval = window.setInterval(() => setThemeNow(new Date()), 60_000)
    return () => {
      window.clearTimeout(initialTick)
      window.clearInterval(interval)
    }
  }, [readingConfig.theme])

  useEffect(() => {
    if (!focusMode) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFocusMode(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focusMode])

  useEffect(() => {
    if (focusMode) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [focusMode])

  const themePalette = useMemo(
    () => getReaderThemePalette(readingConfig.theme, themeNow),
    [readingConfig.theme, themeNow],
  )

  const bodyFont =
    readingConfig.fontFamily === READING_DEFAULTS.fontFamily
      ? themePalette.bodyFont
      : readingFontStyle[readingConfig.fontFamily]

  const scopedThemeStyle = useMemo(() => ({
    '--bg-base': themePalette.colors.bgSurface,
    '--bg-surface': themePalette.colors.bgSurface,
    '--bg-elevated': themePalette.colors.bgElevated,
    '--text-primary': themePalette.colors.textPrimary,
    '--text-muted': themePalette.colors.textMuted,
    '--text-dim': themePalette.colors.textDim,
    '--accent-violet': themePalette.colors.accent,
    '--accent-cyan': themePalette.colors.accentAlt,
    '--border-subtle': themePalette.colors.borderSubtle,
    '--card-bg': themePalette.colors.cardBg,
    '--card-border': themePalette.colors.cardBorder,
    '--card-shadow': themePalette.colors.cardShadow,
    '--code-bg': themePalette.colors.codeBg,
    '--code-text': themePalette.colors.codeText,
    '--body-text': themePalette.colors.bodyText,
    '--gradient-fade': themePalette.colors.gradientFade,
    '--source-btn-bg': themePalette.colors.sourceBtnBg,
    '--source-btn-border': themePalette.colors.sourceBtnBorder,
    '--badge-bg': themePalette.colors.sourceBtnBg,
    '--glass-bg': themePalette.colors.sourceBtnBg,
    '--glass-border': themePalette.colors.sourceBtnBorder,
    '--reader-quote-bg': themePalette.colors.quoteBg,
    '--reader-quote-border': themePalette.colors.quoteBorder,
  } as CSSProperties), [themePalette])

  const publishedAt = useMemo(() => {
    const date = new Date(article.publishedAt)
    const datePart = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
    const timePart = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
    return `${datePart} · ${timePart}`
  }, [article.publishedAt])

  const fallbackLetter = article.authorName.charAt(0).toUpperCase() || 'A'
  const trailingImages = hasRichContent ? [] : article.images

  const openLightbox = useCallback((src: string) => setLightboxSrc(src), [])
  const closeLightbox = useCallback(() => setLightboxSrc(null), [])

  const renderBody = (forceExpanded: boolean) => (
    <>
      <section className="relative">
        {hasRichContent ? (
          <div
            className="text-left"
            style={{
              fontFamily: bodyFont,
              fontSize: `${readingConfig.fontSize}px`,
              lineHeight: readingConfig.lineHeight,
            }}
          >
            <RichContentRenderer
              blocks={article.contentBlocks}
              tweetId={article.tweetId}
              onImageOpen={openLightbox}
              themePalette={themePalette}
              bodyFont={bodyFont}
            />
          </div>
        ) : (
          <>
            <motion.div
              layout
              className={`relative ${
                shouldShowToggle && !expanded && !forceExpanded ? 'max-h-[300px] overflow-hidden' : ''
              }`}
            >
              <div
                className="text-left font-normal"
                style={{
                  color: 'var(--body-text)',
                  fontFamily: bodyFont,
                  fontSize: `${readingConfig.fontSize}px`,
                  lineHeight: readingConfig.lineHeight,
                }}
              >
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
              {shouldShowToggle && !expanded && !forceExpanded ? (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
                  style={{ background: 'linear-gradient(to bottom, transparent, var(--gradient-fade))' }}
                />
              ) : null}
            </motion.div>
            {shouldShowToggle && !forceExpanded ? (
              <motion.button
                type="button"
                data-cursor="pointer"
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 border-none bg-transparent p-0 font-inter text-[13px] font-medium text-accent-violet hover:underline hover:underline-offset-4"
                whileHover={{ color: themePalette.colors.accentAlt }}
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
                onClick={() => openLightbox(image)}
                className="relative h-[220px] max-w-[380px] overflow-hidden rounded-2xl border border-border-subtle p-0"
                whileHover={{ scale: 1.02, filter: 'brightness(1.05)' }}
              >
                <img src={image} alt={`Article media ${index + 1}`} className="h-full w-full object-cover" />
              </motion.button>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )

  return (
    <>
      <ImageLightbox src={lightboxSrc} onClose={closeLightbox} />

      <motion.div
        style={{ ...scopedThemeStyle, maxWidth: cardMaxWidth[readingConfig.maxWidth], margin: '0 auto', width: '100%' }}
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.article
          ref={articleRef}
          key={article.tweetId}
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
          className="relative overflow-hidden rounded-[28px] border p-10"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            backdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div className="pointer-events-none absolute top-5 right-5 opacity-[0.16]">
            <img src={brandMark} alt="" className="h-8 w-8" />
          </div>

          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {!avatarError && article.authorAvatar ? (
                <img
                  src={article.authorAvatar}
                  alt={article.authorName}
                  onError={() => setAvatarError(true)}
                  onClick={() => openLightbox(article.authorAvatar)}
                  className="h-[52px] w-[52px] cursor-pointer rounded-full object-cover ring-2 ring-[rgba(124,58,237,0.4)] ring-offset-2 ring-offset-bg-base transition-transform hover:scale-105"
                />
              ) : (
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] font-jakarta text-xl font-bold text-white ring-2 ring-[rgba(124,58,237,0.4)] ring-offset-2 ring-offset-bg-base">
                  {fallbackLetter}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-inter text-[15px] font-semibold text-text-primary">{article.authorName}</p>
                <p className="truncate font-mono text-[13px] text-accent-cyan">{article.authorHandle}</p>
                <p className="font-inter text-xs text-text-muted">{publishedAt}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                data-cursor="pointer"
                onClick={() => setFocusMode(true)}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] text-text-muted"
                style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
                whileHover={{ scale: 1.03 }}
                data-export-exclude
              >
                <Maximize2 className="h-3 w-3" />
                <span className="hidden sm:inline">Focus</span>
              </motion.button>

              <motion.button
                type="button"
                data-cursor="pointer"
                onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] text-text-muted"
                style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
                whileHover={{ scale: 1.03 }}
              >
                <span className="inline-flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white text-[10px] font-semibold text-black">𝕏</span>
                View Source
              </motion.button>

              <ExportDropdown article={article} articleRef={articleRef} onExport={onExport} />
              <ReadingSettingsButton config={readingConfig} onChange={setReadingConfig} />
            </div>
          </section>

          <div className="my-5 h-px w-full bg-border-subtle" />

          {article.title ? (
            <motion.section
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.35 }}
              className="mb-5 border-l-[3px] pl-5"
              style={{ borderImage: 'linear-gradient(to bottom, var(--accent-violet), var(--accent-cyan)) 1' }}
            >
              <h2
                className="text-[28px] font-extrabold leading-[1.25] tracking-[-0.02em] text-text-primary"
                style={{ fontFamily: themePalette.headingFont }}
              >
                {article.title}
              </h2>
            </motion.section>
          ) : null}

          {article.coverImage ? (
            <section className="mb-6 overflow-hidden rounded-2xl border border-border-subtle">
              <ClickableImage src={article.coverImage} alt="Cover" className="w-full object-cover" onOpen={openLightbox} />
            </section>
          ) : null}

          {renderBody(false)}

          <section className="mt-6 border-t border-border-subtle pt-4">
            <div className="mb-4 flex flex-wrap items-center gap-5">
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
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted">
                Theme: {themePalette.label}
              </span>
            </div>

            <ExportButtons article={article} articleRef={articleRef} onExport={onExport} />
          </section>
        </motion.article>
      </motion.div>

      <AnimatePresence>
        {focusMode
          ? createPortal(
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999]"
              >
                <div className="absolute inset-0 bg-black/70" onClick={() => setFocusMode(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="relative z-10 h-full overflow-y-auto"
                  style={{ background: themePalette.colors.bgSurface }}
                >
                  <div
                    className="mx-auto w-full px-4 py-6"
                    style={{ ...scopedThemeStyle, maxWidth: cardMaxWidth[readingConfig.maxWidth] }}
                  >
                    <section
                      className="sticky top-3 z-20 mb-6 flex items-center justify-end gap-2 rounded-full border px-2 py-2 backdrop-blur-md"
                      style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
                    >
                      <ReadingSettingsButton config={readingConfig} onChange={setReadingConfig} />
                      <motion.button
                        type="button"
                        onClick={() => setFocusMode(false)}
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] text-text-muted"
                        style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
                        whileHover={{ scale: 1.03 }}
                      >
                        <X className="h-3 w-3" />
                        <span className="hidden sm:inline">Close</span>
                      </motion.button>
                    </section>

                    {article.title ? (
                      <h2
                        className="mb-6 text-[32px] font-bold leading-[1.2] tracking-[-0.02em] text-text-primary"
                        style={{ fontFamily: themePalette.headingFont }}
                      >
                        {article.title}
                      </h2>
                    ) : null}

                    {article.coverImage ? (
                      <section className="mb-6 overflow-hidden rounded-2xl border border-border-subtle">
                        <ClickableImage src={article.coverImage} alt="Cover" className="w-full object-cover" onOpen={openLightbox} />
                      </section>
                    ) : null}

                    {renderBody(true)}
                  </div>
                </motion.div>
              </motion.div>,
              document.body,
            )
          : null}
      </AnimatePresence>
    </>
  )
}
