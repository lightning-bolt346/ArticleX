import { motion } from 'framer-motion'
import { Coffee } from 'lucide-react'
import { useState } from 'react'
import { TipModal } from './TipModal'

export const TipButton = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, type: 'spring', stiffness: 200, damping: 20 }}
        whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(124,58,237,0.25), 0 0 80px rgba(124,58,237,0.08)' }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full border px-5 py-3 font-inter text-[13px] font-medium text-text-primary shadow-lg backdrop-blur-xl transition-colors"
        style={{
          background: 'var(--glass-bg)',
          borderColor: 'var(--glass-border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 24px rgba(124,58,237,0.08)',
        }}
      >
        <Coffee className="h-4 w-4 text-accent-violet" />
        <span>Support ArticleX</span>
      </motion.button>

      <TipModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
