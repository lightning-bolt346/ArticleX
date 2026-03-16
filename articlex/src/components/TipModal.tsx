import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Heart, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface TipModalProps {
  open: boolean
  onClose: () => void
}

const PRESETS = [49, 99, 199, 499] as const

export const TipModal = ({ open, onClose }: TipModalProps) => {
  const [selected, setSelected] = useState<number>(99)
  const [custom, setCustom] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const [success, setSuccess] = useState(false)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setSuccess(false)
      setPaying(false)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (success) {
      const timer = window.setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 3500)
      return () => window.clearTimeout(timer)
    }
  }, [success, onClose])

  const amount = custom ? (parseInt(customValue) || 0) : selected
  const isValid = amount >= 10

  const handlePay = () => {
    if (!isValid || paying) return

    const key = import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!key || !window.Razorpay) {
      setSuccess(true)
      return
    }

    setPaying(true)

    const options: RazorpayOptions = {
      key,
      amount: amount * 100,
      currency: 'INR',
      name: 'ArticleX',
      description: 'Support the creator ☕',
      handler: () => {
        setPaying(false)
        setSuccess(true)
      },
      prefill: {},
      notes: { purpose: 'tip' },
      theme: { color: '#7c3aed' },
      modal: {
        ondismiss: () => setPaying(false),
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const selectPreset = (val: number) => {
    setCustom(false)
    setSelected(val)
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--card-border)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, rgba(124,58,237,0.15), transparent 60%)' }} />

            <div className="relative p-6">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-text-muted transition-colors hover:bg-accent-violet/10 hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>

              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-6 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                    >
                      <CheckCircle2 className="h-14 w-14 text-green-500" />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4 font-jakarta text-xl font-bold text-text-primary"
                    >
                      Thank you so much!
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-2 font-inter text-sm text-text-muted"
                    >
                      Your support keeps ArticleX free for everyone.
                    </motion.p>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-accent-violet" />
                      <h3 className="font-jakarta text-xl font-bold text-text-primary">
                        Support this project <span className="text-accent-violet">✦</span>
                      </h3>
                    </div>
                    <p className="mt-2 font-inter text-[13px] text-text-muted">
                      100% goes to the creator. No signup needed.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {PRESETS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => selectPreset(val)}
                          className={`rounded-xl border px-4 py-2.5 font-mono text-sm font-medium transition-all ${
                            !custom && selected === val
                              ? 'border-transparent bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] text-white shadow-lg shadow-accent-violet/20'
                              : 'border-border-subtle text-text-muted hover:border-accent-violet/30 hover:text-text-primary'
                          }`}
                          style={!custom && selected === val ? {} : { background: 'var(--badge-bg)' }}
                        >
                          ₹{val}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => { setCustom(true); setCustomValue('') }}
                        className={`rounded-xl border px-4 py-2.5 font-inter text-sm font-medium transition-all ${
                          custom
                            ? 'border-transparent bg-[linear-gradient(135deg,#7c3aed,#06b6d4)] text-white shadow-lg shadow-accent-violet/20'
                            : 'border-border-subtle text-text-muted hover:border-accent-violet/30 hover:text-text-primary'
                        }`}
                        style={custom ? {} : { background: 'var(--badge-bg)' }}
                      >
                        Custom
                      </button>
                    </div>

                    <AnimatePresence>
                      {custom && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <input
                            type="number"
                            min={10}
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            placeholder="Enter amount (min ₹10)"
                            className="mt-3 w-full rounded-xl border bg-transparent px-4 py-3 font-mono text-sm text-text-primary outline-none transition-colors placeholder:text-text-dim focus:border-accent-violet"
                            style={{ borderColor: 'var(--border-subtle)' }}
                            autoFocus
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="button"
                      onClick={handlePay}
                      disabled={!isValid || paying}
                      className="mt-5 w-full rounded-xl py-3.5 font-inter text-[15px] font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: isValid ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : 'var(--badge-bg)',
                      }}
                      whileHover={isValid ? { scale: 1.02, boxShadow: '0 0 32px rgba(124,58,237,0.3)' } : undefined}
                      whileTap={isValid ? { scale: 0.98 } : undefined}
                    >
                      {paying ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          />
                          Processing...
                        </span>
                      ) : (
                        `Pay ₹${amount} with Razorpay`
                      )}
                    </motion.button>

                    <p className="mt-3 text-center font-inter text-[11px] text-text-dim">
                      Secure payment via Razorpay · UPI · Cards · Wallets
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modal, document.body)
}
