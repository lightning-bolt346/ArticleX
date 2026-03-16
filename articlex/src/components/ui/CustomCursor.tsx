import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export const CustomCursor = () => {
  const [enabled, setEnabled] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)')
    setEnabled(mediaQuery.matches)

    const onMouseMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY })
    }

    if (mediaQuery.matches) {
      window.addEventListener('mousemove', onMouseMove)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  if (!enabled) {
    return null
  }

  return (
    <motion.div
      className="pointer-events-none fixed z-[998] h-4 w-4 rounded-full border border-accent-violet/70"
      animate={{
        x: position.x - 8,
        y: position.y - 8,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 32, mass: 0.2 }}
    />
  )
}
