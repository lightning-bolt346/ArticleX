import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { signIn, signUp, type AuthUser } from '../lib/auth'
import { isSupabaseConfigured } from '../lib/supabase'

type Mode = 'signin' | 'signup'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onLogin: (user: AuthUser) => void
}

export function AuthModal({ open, onClose, onLogin }: AuthModalProps) {
  const hasSupabase = isSupabaseConfigured()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  useEffect(() => {
    if (open) { setError(null); setSuccess(null) }
  }, [open, mode])

  const handleSubmit = useCallback(async () => {
    const trimEmail = email.trim()
    if (!trimEmail) { setError('Email is required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) { setError('Invalid email address.'); return }
    if (hasSupabase && !password) { setError('Password is required.'); return }
    if (hasSupabase && password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setSubmitting(true); setError(null); setSuccess(null)
    try {
      if (mode === 'signup') {
        const result = await signUp(trimEmail, password || 'local-dev', displayName.trim() || undefined)
        if ('error' in result) { setError(result.error); return }
        if (hasSupabase) {
          setSuccess('Account created! Check your email to confirm, then sign in.')
          setMode('signin')
        } else {
          onLogin(result.user)
        }
      } else {
        const result = await signIn(trimEmail, password || 'local-dev')
        if ('error' in result) { setError(result.error); return }
        onLogin(result.user)
      }
    } catch { setError('Something went wrong. Please try again.') }
    finally { setSubmitting(false) }
  }, [email, password, displayName, mode, hasSupabase, onLogin])

  const inputClass = 'mt-1.5 w-full rounded-xl border bg-bg-elevated px-4 py-3 font-inter text-[14px] text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-accent-violet/60'

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
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
            <button type="button" data-cursor="pointer" onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-text-dim transition-colors hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                {mode === 'signin' ? <LogIn className="h-5 w-5 text-white" /> : <UserPlus className="h-5 w-5 text-white" />}
              </div>
              <div>
                <h2 className="font-jakarta text-lg font-bold text-text-primary">
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                </h2>
                <p className="font-inter text-[12px] text-text-muted">
                  {mode === 'signin' ? 'Welcome back to ArticleX' : 'Unlock private collections & editing'}
                </p>
              </div>
            </div>

            {/* Tab toggle */}
            <div className="mt-5 flex rounded-xl border p-1" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
              {(['signin', 'signup'] as Mode[]).map((m) => (
                <button key={m} type="button" data-cursor="pointer" onClick={() => { setMode(m); setError(null) }}
                  className={`flex-1 rounded-lg py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${mode === m ? 'text-white' : 'text-text-dim hover:text-text-muted'}`}
                  style={mode === m ? { background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' } : undefined}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">Display Name <span className="normal-case text-text-dim">(optional)</span></label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className={inputClass} style={{ borderColor: 'var(--border-subtle)' }} />
                </div>
              )}

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">Email</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null) }} onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit() }} placeholder="you@example.com" className={inputClass} style={{ borderColor: 'var(--border-subtle)' }} autoFocus />
              </div>

              {hasSupabase && (
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(null) }} onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit() }} placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'} className={`${inputClass} pr-10`} style={{ borderColor: 'var(--border-subtle)' }} />
                    <button type="button" data-cursor="pointer" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-inter text-[12px] text-red-400">{error}</motion.p>}
                {success && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-inter text-[12px] text-emerald-400">{success}</motion.p>}
              </AnimatePresence>

              <motion.button
                type="button" data-cursor="pointer" onClick={() => void handleSubmit()} disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-inter text-[14px] font-semibold text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                whileHover={submitting ? undefined : { scale: 1.02 }} whileTap={submitting ? undefined : { scale: 0.97 }}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    {[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-white" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />)}
                  </span>
                ) : mode === 'signin' ? <><LogIn className="h-4 w-4" /> Sign In</> : <><UserPlus className="h-4 w-4" /> Create Account</>}
              </motion.button>

              {!hasSupabase && <p className="text-center font-inter text-[11px] text-text-dim">Dev mode — no password required. Email stored in this browser only.</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
