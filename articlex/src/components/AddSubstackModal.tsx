import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Globe, Loader2, Plus, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { normalizeFeedUrl, parseSubstackFeed, type SubstackPublication } from '../lib/substack'

interface AddSubstackModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (publication: SubstackPublication) => Promise<void>
}

export function AddSubstackModal({ open, onClose, onConfirm }: AddSubstackModalProps) {
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<SubstackPublication | null>(null)
  const [validating, setValidating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setUrl('')
    setPreview(null)
    setError(null)
    setValidating(false)
    setConfirming(false)
    document.body.style.overflow = 'hidden'
    const timer = setTimeout(() => inputRef.current?.focus(), 80)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const handleValidate = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a Substack URL')
      return
    }

    let feedUrl: string
    try {
      feedUrl = normalizeFeedUrl(trimmed)
    } catch {
      setError('That doesn\'t look like a valid URL. Try https://example.substack.com')
      return
    }

    if (!feedUrl.includes('.substack.com')) {
      setError('Only Substack publications are supported (*.substack.com)')
      return
    }

    setValidating(true)
    setError(null)
    setPreview(null)

    try {
      const pub = await parseSubstackFeed(trimmed)
      setPreview(pub)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not fetch this publication'
      setError(msg)
    } finally {
      setValidating(false)
    }
  }, [url])

  const handleConfirm = useCallback(async () => {
    if (!preview) return
    setConfirming(true)
    try {
      await onConfirm(preview)
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save subscription'
      setError(msg)
    } finally {
      setConfirming(false)
    }
  }, [preview, onConfirm, onClose])

  const handleReset = useCallback(() => {
    setPreview(null)
    setError(null)
    setUrl('')
  }, [])

  const inputClass =
    'mt-1.5 w-full rounded-xl border bg-[var(--bg-elevated)] px-4 py-3 font-inter text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-[var(--accent-violet)]/60'

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="relative z-[91] w-full max-w-md rounded-[28px] border p-6 backdrop-blur-xl"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              data-cursor="pointer"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-text-dim transition-colors hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
              >
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-jakarta text-lg font-bold text-text-primary">
                  Add Substack Publication
                </h2>
                <p className="font-inter text-[12px] text-text-muted">
                  Subscribe to a Substack newsletter
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* Input step */}
              {!preview && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 space-y-4"
                >
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">
                      Substack URL
                    </label>
                    <input
                      ref={inputRef}
                      type="url"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        setError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleValidate()
                      }}
                      placeholder="https://example.substack.com"
                      className={inputClass}
                      style={{ borderColor: 'var(--border-subtle)' }}
                    />
                    <p className="mt-1.5 font-inter text-[11px] text-text-dim">
                      Enter the publication home URL, e.g. stratechery.substack.com
                    </p>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5"
                      >
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                        <p className="font-inter text-[12px] text-red-400">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="button"
                    data-cursor="pointer"
                    onClick={() => void handleValidate()}
                    disabled={validating || !url.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-inter text-[14px] font-semibold text-white disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                    whileHover={validating ? undefined : { scale: 1.02 }}
                    whileTap={validating ? undefined : { scale: 0.97 }}
                  >
                    {validating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Fetching feed…
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4" />
                        Look Up Publication
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {/* Preview step */}
              {preview && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-5 space-y-4"
                >
                  {/* Publication card */}
                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      background: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-11 w-11 shrink-0">
                        {preview.faviconUrl ? (
                          <img
                            src={preview.faviconUrl}
                            alt=""
                            className="h-11 w-11 rounded-xl object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-xl font-jakarta text-lg font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                          >
                            {preview.title.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-jakarta text-[15px] font-bold text-text-primary">
                          {preview.title}
                        </p>
                        {preview.description && (
                          <p className="mt-0.5 line-clamp-2 font-inter text-[12px] text-text-muted">
                            {preview.description}
                          </p>
                        )}
                        <p className="mt-1.5 font-mono text-[10px] text-text-dim">
                          {preview.articles.length} article
                          {preview.articles.length !== 1 ? 's' : ''} in feed
                        </p>
                      </div>

                      <div className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-text-dim" style={{ borderColor: 'var(--border-subtle)' }}>
                        Substack
                      </div>
                    </div>
                  </div>

                  {/* Confirmation badge */}
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <p className="font-inter text-[12px] text-emerald-400">
                      Publication found! Confirm to subscribe.
                    </p>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5"
                      >
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                        <p className="font-inter text-[12px] text-red-400">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-cursor="pointer"
                      onClick={handleReset}
                      className="flex-1 rounded-full border px-4 py-2.5 font-inter text-[13px] text-text-muted transition-colors hover:text-text-primary"
                      style={{ borderColor: 'var(--border-subtle)', background: 'var(--source-btn-bg)' }}
                    >
                      Change URL
                    </button>

                    <motion.button
                      type="button"
                      data-cursor="pointer"
                      onClick={() => void handleConfirm()}
                      disabled={confirming}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 font-inter text-[13px] font-semibold text-white disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                      whileHover={confirming ? undefined : { scale: 1.02 }}
                      whileTap={confirming ? undefined : { scale: 0.97 }}
                    >
                      {confirming ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Subscribe
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
