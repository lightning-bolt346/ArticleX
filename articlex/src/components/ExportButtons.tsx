import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Code2, FileType, Globe } from 'lucide-react'
import { useMemo, useState } from 'react'
import { generateDOCX } from '../lib/generators/docx'
import { generateHTML } from '../lib/generators/html'
import { generateMarkdown } from '../lib/generators/markdown'
import type { ArticleObject } from '../types/article'

interface ExportButtonsProps {
  article: ArticleObject
  onExport: (format: 'html' | 'md' | 'docx') => void
}

type ExportFormat = 'html' | 'md' | 'docx'

const PARTICLE_COLORS = ['#7c3aed', '#06b6d4', '#a855f7'] as const

interface Particle {
  dx: number
  dy: number
  color: string
  delay: number
}

const ParticleBurst = ({ seed }: { seed: number }) => {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 10 }).map((_, index) => {
        const angle = Math.random() * Math.PI * 2
        const distance = 30 + Math.random() * 40
        return {
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          color: PARTICLE_COLORS[index % PARTICLE_COLORS.length],
          delay: index * 0.03,
        }
      }),
    [seed],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {particles.map((particle, index) => (
        <motion.div
          key={`${seed}-${index}`}
          className="absolute left-1/2 top-1/2 h-[5px] w-[5px] rounded-full"
          style={{ background: particle.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: particle.dx, y: particle.dy, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.6, delay: particle.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

interface ExportButtonConfig {
  format: ExportFormat
  label: string
  description: string
  sublabel: string
  icon: typeof Globe
  iconClassName: string
  className: string
  hoverClassName: string
}

const BUTTON_CONFIGS: ExportButtonConfig[] = [
  {
    format: 'html',
    label: 'HTML File',
    description: 'HTML',
    sublabel: 'Styled + standalone',
    icon: Globe,
    iconClassName: 'text-[#7c3aed]',
    className:
      'border border-[rgba(124,58,237,0.35)] bg-[linear-gradient(135deg,#7c3aed20,#06b6d420)]',
    hoverClassName:
      'hover:border-[rgba(124,58,237,0.6)] hover:bg-[rgba(124,58,237,0.15)] hover:shadow-glow-violet',
  },
  {
    format: 'md',
    label: 'Markdown',
    description: 'Markdown',
    sublabel: 'Dev-friendly',
    icon: Code2,
    iconClassName: 'text-[#a855f7]',
    className: 'border border-[rgba(255,255,255,0.08)] bg-white/[0.03]',
    hoverClassName: 'hover:border-[rgba(168,85,247,0.4)] hover:bg-[rgba(168,85,247,0.1)]',
  },
  {
    format: 'docx',
    label: 'Word Doc',
    description: 'DOCX',
    sublabel: 'Edit in Word',
    icon: FileType,
    iconClassName: 'text-[#06b6d4]',
    className: 'border border-[rgba(255,255,255,0.08)] bg-white/[0.03]',
    hoverClassName: 'hover:border-[rgba(6,182,212,0.4)] hover:bg-[rgba(6,182,212,0.1)]',
  },
]

export const ExportButtons = ({ article, onExport }: ExportButtonsProps) => {
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null)
  const [successFormat, setSuccessFormat] = useState<ExportFormat | null>(null)
  const [burst, setBurst] = useState<{ format: ExportFormat; seed: number } | null>(null)

  const handleExport = async (format: ExportFormat) => {
    if (loadingFormat) {
      return
    }

    setLoadingFormat(format)
    const start = Date.now()

    try {
      if (format === 'html') {
        generateHTML(article)
      } else if (format === 'md') {
        generateMarkdown(article)
      } else {
        await generateDOCX(article)
      }

      const elapsed = Date.now() - start
      if (elapsed < 1200) {
        await new Promise((resolve) => window.setTimeout(resolve, 1200 - elapsed))
      }

      setSuccessFormat(format)
      setBurst({ format, seed: Date.now() })
      onExport(format)

      window.setTimeout(() => {
        setSuccessFormat((current) => (current === format ? null : current))
        setBurst((current) => (current?.format === format ? null : current))
      }, 2000)
    } finally {
      setLoadingFormat(null)
    }
  }

  const isDisabled = loadingFormat !== null

  return (
    <section className={isDisabled ? 'opacity-50 pointer-events-none' : ''}>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
        Export Article
      </p>

      <div className="flex flex-wrap gap-3">
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
              className={`relative min-w-[170px] flex-1 overflow-visible rounded-2xl px-5 py-4 text-left transition-colors ${config.className} ${config.hoverClassName}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              disabled={isDisabled}
            >
              <div className="flex items-start gap-3">
                <AnimatePresence mode="wait" initial={false}>
                  {isSuccessCurrent ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Icon className={`h-5 w-5 ${config.iconClassName}`} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <p className="font-inter text-sm font-semibold text-text-primary">
                    {config.label}
                  </p>
                  <p className="mt-1 font-inter text-[11px] text-text-muted">{config.sublabel}</p>
                </div>
              </div>

              <span className="mt-3 block font-mono text-[10px] uppercase tracking-[0.08em] text-text-dim">
                {config.description}
              </span>

              {isLoadingCurrent ? (
                <motion.div
                  className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl bg-[linear-gradient(90deg,#7c3aed,#06b6d4)]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                />
              ) : null}

              {burst?.format === config.format ? <ParticleBurst seed={burst.seed} /> : null}
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
