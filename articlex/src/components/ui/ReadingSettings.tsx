import { AnimatePresence, motion } from 'framer-motion'
import { AlignCenter, AlignJustify, AlignLeft, Minus, Plus, Settings2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  READING_DEFAULTS,
  READING_THEME_OPTIONS,
  getReaderThemePalette,
  saveReadingConfig,
  type ReadingTheme,
  type ReadingConfig,
} from '../../lib/reading-config'

const FONT_OPTIONS: { value: ReadingConfig['fontFamily']; label: string; preview: string }[] = [
  { value: 'inter', label: 'Inter', preview: 'Aa' },
  { value: 'georgia', label: 'Serif', preview: 'Aa' },
  { value: 'literata', label: 'Literata', preview: 'Aa' },
  { value: 'system', label: 'System', preview: 'Aa' },
  { value: 'mono', label: 'Mono', preview: 'Aa' },
]

const FONT_PREVIEW_STYLE: Record<ReadingConfig['fontFamily'], string> = {
  inter: "'Inter', sans-serif",
  georgia: "Georgia, serif",
  literata: "'Literata', Georgia, serif",
  system: "-apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', monospace",
}

const WIDTH_OPTIONS: { value: ReadingConfig['maxWidth']; label: string }[] = [
  { value: 'narrow', label: 'Narrow' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
]

interface ReadingSettingsProps {
  config: ReadingConfig
  onChange: (config: ReadingConfig) => void
  showReadingModeControls?: boolean
  compactLabel?: boolean
  hidePreviewWidth?: boolean
}

export const ReadingSettingsButton = ({
  config,
  onChange,
  showReadingModeControls = false,
  compactLabel = false,
  hidePreviewWidth = false,
}: ReadingSettingsProps) => {
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

  const themePreviews = useMemo(
    () =>
      READING_THEME_OPTIONS.map((opt) => ({
        option: opt,
        palette: getReaderThemePalette(opt.value as ReadingTheme),
      })),
    [],
  )

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end justify-center p-2 sm:items-center sm:p-4"
          style={{ position: 'fixed' }}
          data-cursor-area="preview"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-6"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--card-border)',
              maxWidth: showReadingModeControls ? '640px' : '560px',
              maxHeight: 'calc(100dvh - 1rem)',
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-jakarta text-lg font-bold text-text-primary">Reading Settings</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-text-muted transition-colors hover:bg-accent-violet/10 hover:text-text-primary"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Font Size ({config.fontSize}px)</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => update({ fontSize: Math.max(12, config.fontSize - 1) })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:text-text-primary"><Minus className="h-4 w-4" /></button>
                  <input type="range" min={12} max={24} value={config.fontSize} onChange={(e) => update({ fontSize: +e.target.value })} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border-subtle accent-accent-violet" />
                  <button type="button" onClick={() => update({ fontSize: Math.min(24, config.fontSize + 1) })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:text-text-primary"><Plus className="h-4 w-4" /></button>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Line Spacing ({config.lineHeight.toFixed(1)})</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => update({ lineHeight: Math.max(1.2, +(config.lineHeight - 0.1).toFixed(1)) })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:text-text-primary"><Minus className="h-4 w-4" /></button>
                  <input type="range" min={12} max={25} value={Math.round(config.lineHeight * 10)} onChange={(e) => update({ lineHeight: +e.target.value / 10 })} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border-subtle accent-accent-violet" />
                  <button type="button" onClick={() => update({ lineHeight: Math.min(2.5, +(config.lineHeight + 0.1).toFixed(1)) })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:text-text-primary"><Plus className="h-4 w-4" /></button>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {themePreviews.map(({ option, palette }) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => update({ theme: option.value })}
                      className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
                        config.theme === option.value
                          ? 'ring-2 ring-accent-violet/70'
                          : 'hover:opacity-95'
                      }`}
                      style={{
                        borderColor: palette.colors.cardBorder,
                        background: palette.colors.cardBg,
                        color: palette.colors.textPrimary,
                      }}
                    >
                      <p className="font-inter text-[11px] font-semibold leading-tight">{option.label}</p>
                      <p className="mt-0.5 text-[9px] opacity-80">{option.blurb}</p>
                      <div
                        className="mt-2 rounded-md border px-2 py-1.5 text-[9px]"
                        style={{
                          borderColor: palette.colors.borderSubtle,
                          background: palette.colors.quoteBg,
                          color: palette.colors.bodyText,
                          fontFamily: palette.bodyFont,
                        }}
                      >
                        <p style={{ fontFamily: palette.headingFont, color: palette.colors.textPrimary }}>The quick reader</p>
                        <p className="mt-0.5" style={{ color: palette.colors.textMuted }}>Focused reading preview</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Typeface</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {FONT_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => update({ fontFamily: opt.value })}
                      className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 transition-colors ${config.fontFamily === opt.value ? 'border-accent-violet bg-accent-violet/10 text-accent-violet' : 'border-border-subtle text-text-muted hover:text-text-primary'}`}>
                      <span className="text-[16px] font-medium" style={{ fontFamily: FONT_PREVIEW_STYLE[opt.value] }}>{opt.preview}</span>
                      <span className="text-[9px]">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {!hidePreviewWidth ? (
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
              ) : null}

              {showReadingModeControls ? (
                <>
                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-muted">
                      Reading Mode Width ({config.readingModeWidth}vw)
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => update({ readingModeWidth: Math.max(45, config.readingModeWidth - 1) })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:text-text-primary"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="range"
                        min={45}
                        max={100}
                        value={config.readingModeWidth}
                        onChange={(e) => update({ readingModeWidth: +e.target.value })}
                        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border-subtle accent-accent-violet"
                      />
                      <button
                        type="button"
                        onClick={() => update({ readingModeWidth: Math.min(100, config.readingModeWidth + 1) })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:text-text-primary"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-muted">Text Alignment</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'left', label: 'Left', icon: AlignLeft },
                        { value: 'center', label: 'Center', icon: AlignCenter },
                        { value: 'justify', label: 'Justify', icon: AlignJustify },
                      ].map((opt) => {
                        const Icon = opt.icon
                        const isActive = config.readingModeAlign === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => update({ readingModeAlign: opt.value as ReadingConfig['readingModeAlign'] })}
                            className={`rounded-lg border px-2 py-2 text-center text-[11px] transition-colors ${
                              isActive
                                ? 'border-accent-violet bg-accent-violet/10 text-accent-violet'
                                : 'border-border-subtle text-text-muted hover:text-text-primary'
                            }`}
                          >
                            <Icon className="mx-auto mb-1 h-4 w-4" />
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : null}

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
  )

  return (
    <>
      <motion.button
        type="button"
        data-cursor="pointer"
        onClick={() => setOpen(true)}
        className={
          compactLabel
            ? 'inline-flex h-9 w-9 items-center justify-center rounded-full border font-mono text-[11px] text-text-muted'
            : 'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] text-text-muted'
        }
        style={{ background: 'var(--source-btn-bg)', borderColor: 'var(--source-btn-border)' }}
        whileHover={{ scale: 1.03 }}
        data-export-exclude
      >
        <Settings2 className="h-3 w-3" />
        {!compactLabel ? <span className="hidden sm:inline">Reading</span> : null}
      </motion.button>
      {createPortal(modal, document.body)}
    </>
  )
}
