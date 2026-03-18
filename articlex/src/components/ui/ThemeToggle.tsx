import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'

interface ThemeToggleProps {
  theme: 'dark' | 'light'
  onToggle: () => void
}

export const ThemeToggle = ({ theme, onToggle }: ThemeToggleProps) => {
  const isDark = theme === 'dark'

  return (
    <>
      <motion.button
        type="button"
        data-cursor="pointer"
        onClick={onToggle}
        className="articlex-theme-toggle fixed right-5 top-5 z-50 hidden h-10 w-10 items-center justify-center rounded-full border transition-colors lg:flex"
        style={{
          background: 'var(--glass-bg)',
          borderColor: 'var(--glass-border)',
          backdropFilter: 'blur(12px)',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <motion.div
          key={`desktop-${theme}`}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {isDark ? (
            <Sun className="h-[18px] w-[18px] text-amber-400" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-indigo-500" />
          )}
        </motion.div>
      </motion.button>

      <motion.button
        type="button"
        data-cursor="pointer"
        onClick={onToggle}
        className="articlex-theme-toggle absolute top-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border transition-colors lg:hidden"
        style={{
          background: 'var(--glass-bg)',
          borderColor: 'var(--glass-border)',
          backdropFilter: 'blur(12px)',
        }}
        whileTap={{ scale: 0.94 }}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <motion.div
          key={`mobile-${theme}`}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {isDark ? (
            <Sun className="h-[18px] w-[18px] text-amber-400" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-indigo-500" />
          )}
        </motion.div>
      </motion.button>
    </>
  )
}
