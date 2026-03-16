import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, Settings2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { READING_DEFAULTS, saveReadingConfig, type ReadingConfig } from '../../lib/reading-config'

const FONT_OPTIONS: { value: ReadingConfig['fontFamily']; label: string }[] = [
  { value: 'inter', label: 'Sans-serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Monospace' },
]

const WIDTH_OPTIONS: { value: ReadingConfig['maxWidth']; label: string }[] = [
  { value: 'narrow', label: 'Narrow' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
]

interface ReadingSettingsProps {
  config: ReadingConfig
  onChange: (config: ReadingConfig) => void
}

export const ReadingSettingsButton = ({ config, onChange }: ReadingSettingsProps) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const update = (partial: Partial<ReadingConfig>) => {
    const next = { ...config, ...partial }
    onChange(next)
    saveReadingConfig(next)
  }

  return (
    <>
      <motion.button
        type="button"
        data-cursor="pointer"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] text-text-muted"
        style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
        whileHover={{ scale: 1.03 }}
        data-export-exclude
      >
        <Settings2 className="h-3 w-3" />
        <span className="hidden sm:inline">Reading</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-sm rounded-2xl border p-6"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--card-border)' }}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-jakarta text-lg font-bold text-text-primary">Reading Settings</h3>
                <button type="button" onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Font Size</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => update({ fontSize: Math.max(12, config.fontSize - 1) })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:text-text-primary"><Minus className="h-4 w-4" /></button>
                    <span className="min-w-[3ch] text-center font-mono text-sm text-text-primary">{config.fontSize}</span>
                    <button type="button" onClick={() => update({ fontSize: Math.min(24, config.fontSize + 1) })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:text-text-primary"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Line Height</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => update({ lineHeight: Math.max(1.2, +(config.lineHeight - 0.1).toFixed(1)) })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:text-text-primary"><Minus className="h-4 w-4" /></button>
                    <span className="min-w-[3ch] text-center font-mono text-sm text-text-primary">{config.lineHeight.toFixed(1)}</span>
                    <button type="button" onClick={() => update({ lineHeight: Math.min(2.5, +(config.lineHeight + 0.1).toFixed(1)) })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:text-text-primary"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Font</label>
                  <div className="flex gap-2">
                    {FONT_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button" onClick={() => update({ fontFamily: opt.value })}
                        className={`flex-1 rounded-lg border px-3 py-2 text-center text-[12px] transition-colors ${config.fontFamily === opt.value ? 'border-accent-violet bg-accent-violet/10 text-accent-violet' : 'border-border-subtle text-text-muted hover:text-text-primary'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Content Width</label>
                  <div className="flex gap-2">
                    {WIDTH_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button" onClick={() => update({ maxWidth: opt.value })}
                        className={`flex-1 rounded-lg border px-3 py-2 text-center text-[12px] transition-colors ${config.maxWidth === opt.value ? 'border-accent-violet bg-accent-violet/10 text-accent-violet' : 'border-border-subtle text-text-muted hover:text-text-primary'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { onChange(READING_DEFAULTS); saveReadingConfig(READING_DEFAULTS) }}
                  className="w-full rounded-lg border border-border-subtle py-2 text-center font-mono text-[11px] text-text-muted transition-colors hover:text-text-primary"
                >
                  Reset to defaults
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
