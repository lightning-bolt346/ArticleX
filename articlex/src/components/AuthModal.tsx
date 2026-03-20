import { AnimatePresence, motion } from 'framer-motion'
import { LogIn, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { loginUser, type AuthUser } from '../lib/auth'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onLogin: (user: AuthUser) => void
}

export function AuthModal({ open, onClose, onLogin }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const handleSubmit = useCallback(() => {
    const trimmed = email.trim()
    if (!trimmed) { setError('Email is required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError('Please enter a valid email.'); return }
    const user = loginUser(trimmed, displayName.trim() || undefined)
    onLogin(user)
    setEmail('')
    setDisplayName('')
    setError(null)
  }, [email, displayName, onLogin])

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

            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
              >
                <LogIn className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-jakarta text-lg font-bold text-text-primary">Sign in to ArticleX</h2>
                <p className="font-inter text-[12px] text-text-muted">Unlock private collections & editing</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border bg-bg-elevated px-4 py-3 font-inter text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-accent-violet/60"
                  style={{ borderColor: 'var(--border-subtle)' }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">
                  Display Name <span className="normal-case text-text-dim">(optional)</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                  placeholder="Your name"
                  className="mt-1.5 w-full rounded-xl border bg-bg-elevated px-4 py-3 font-inter text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-accent-violet/60"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
              </div>

              {error && <p className="font-inter text-[12px] text-red-400">{error}</p>}

              <motion.button
                type="button"
                data-cursor="pointer"
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-inter text-[14px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </motion.button>

              <p className="text-center font-inter text-[11px] text-text-dim">
                No password needed. Your email is stored locally in this browser.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
