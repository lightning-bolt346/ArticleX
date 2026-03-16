import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Code2, FileImage, FileText, FileType, Globe } from 'lucide-react'
import { useRef, useState } from 'react'
import { generateDOCX } from '../lib/generators/docx'
import { generateHTML } from '../lib/generators/html'
import { generateMarkdown } from '../lib/generators/markdown'
import { generatePDF } from '../lib/generators/pdf'
import { generatePNG } from '../lib/generators/png'
import type { ArticleObject } from '../types/article'

type ExportFormat = 'html' | 'md' | 'docx' | 'pdf' | 'png'

interface ExportButtonsProps {
  article: ArticleObject
  articleRef: React.RefObject<HTMLElement | null>
  onExport: (format: string) => void
}

interface ButtonConfig {
  format: ExportFormat
  label: string
  sublabel: string
  icon: typeof Globe
  iconClassName: string
  className: string
  hoverClassName: string
}

const BUTTON_CONFIGS: ButtonConfig[] = [
  {
    format: 'html',
    label: 'HTML',
    sublabel: 'Styled + standalone',
    icon: Globe,
    iconClassName: 'text-[#7c3aed]',
    className: 'border border-[rgba(124,58,237,0.3)] bg-[rgba(124,58,237,0.06)]',
    hoverClassName: 'hover:border-[rgba(124,58,237,0.5)] hover:bg-[rgba(124,58,237,0.12)]',
  },
  {
    format: 'md',
    label: 'Markdown',
    sublabel: 'Dev-friendly',
    icon: Code2,
    iconClassName: 'text-[#a855f7]',
    className: 'border border-border-subtle bg-[rgba(168,85,247,0.04)]',
    hoverClassName: 'hover:border-[rgba(168,85,247,0.35)] hover:bg-[rgba(168,85,247,0.08)]',
  },
  {
    format: 'docx',
    label: 'Word',
    sublabel: 'Edit in Word',
    icon: FileType,
    iconClassName: 'text-[#06b6d4]',
    className: 'border border-border-subtle bg-[rgba(6,182,212,0.04)]',
    hoverClassName: 'hover:border-[rgba(6,182,212,0.35)] hover:bg-[rgba(6,182,212,0.08)]',
  },
  {
    format: 'pdf',
    label: 'PDF',
    sublabel: 'Print-ready',
    icon: FileText,
    iconClassName: 'text-[#ef4444]',
    className: 'border border-border-subtle bg-[rgba(239,68,68,0.04)]',
    hoverClassName: 'hover:border-[rgba(239,68,68,0.35)] hover:bg-[rgba(239,68,68,0.08)]',
  },
  {
    format: 'png',
    label: 'Image',
    sublabel: 'HD screenshot',
    icon: FileImage,
    iconClassName: 'text-[#f59e0b]',
    className: 'border border-border-subtle bg-[rgba(245,158,11,0.04)]',
    hoverClassName: 'hover:border-[rgba(245,158,11,0.35)] hover:bg-[rgba(245,158,11,0.08)]',
  },
]

export const ExportButtons = ({ article, articleRef, onExport }: ExportButtonsProps) => {
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null)
  const [successFormat, setSuccessFormat] = useState<ExportFormat | null>(null)
  const timerRef = useRef<number | null>(null)

  const handle = article.authorHandle.replace(/^@/, '')

  const handleExport = async (format: ExportFormat) => {
    if (loadingFormat) return
    setLoadingFormat(format)
    const start = Date.now()

    try {
      switch (format) {
        case 'html': generateHTML(article); break
        case 'md': generateMarkdown(article); break
        case 'docx': await generateDOCX(article); break
        case 'pdf': await generatePDF(article); break
        case 'png':
          if (articleRef.current) await generatePNG(articleRef.current, `${handle}-article`)
          break
      }

      const elapsed = Date.now() - start
      if (elapsed < 800) await new Promise((r) => window.setTimeout(r, 800 - elapsed))

      setSuccessFormat(format)
      onExport(format)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setSuccessFormat(null), 2000)
    } finally {
      setLoadingFormat(null)
    }
  }

  return (
    <section data-export-exclude>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
        Export As
      </p>
      <div className="flex flex-wrap gap-2">
        {BUTTON_CONFIGS.map((config) => {
          const Icon = config.icon
          const isLoadingCurrent = loadingFormat === config.format
          const isSuccessCurrent = successFormat === config.format

          return (
            <motion.button
              key={config.format}
              type="button"
              data-cursor="pointer"
              onClick={() => void handleExport(config.format)}
              disabled={!!loadingFormat}
              className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-left transition-colors disabled:opacity-50 ${config.className} ${config.hoverClassName}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isSuccessCurrent ? (
                  <motion.div key="ok" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </motion.div>
                ) : (
                  <motion.div key="icon" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                    <Icon className={`h-4 w-4 ${config.iconClassName}`} />
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <p className="font-inter text-[13px] font-semibold text-text-primary">{config.label}</p>
                <p className="font-inter text-[10px] text-text-muted">{config.sublabel}</p>
              </div>
              {isLoadingCurrent && (
                <motion.div
                  className="absolute bottom-0 left-0 h-[2px] rounded-b-xl bg-[linear-gradient(90deg,#7c3aed,#06b6d4)]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
