import { motion } from 'framer-motion'

const orbBaseClass =
  'absolute rounded-full pointer-events-none will-change-transform'

export const AuroraBackground = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className={orbBaseClass}
        style={{
          width: 700,
          height: 700,
          top: -200,
          left: -200,
          background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
          filter: 'blur(120px)',
          opacity: 'var(--aurora-opacity-1)',
        }}
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className={orbBaseClass}
        style={{
          width: 600,
          height: 600,
          bottom: -150,
          right: -100,
          background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
          filter: 'blur(100px)',
          opacity: 'var(--aurora-opacity-2)',
        }}
        animate={{ x: [0, -60, 30, 0], y: [0, 50, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className={orbBaseClass}
        style={{
          width: 500,
          height: 500,
          top: '40%',
          left: '35%',
          background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)',
          filter: 'blur(140px)',
          opacity: 'var(--aurora-opacity-3)',
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            `linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}
