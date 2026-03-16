import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

export const CustomCursor = () => {
  const [enabled, setEnabled] = useState(false)
  const [isPointer, setIsPointer] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const dotX = useMotionValue(-100)
  const dotY = useMotionValue(-100)
  const ringX = useSpring(dotX, { stiffness: 200, damping: 28 })
  const ringY = useSpring(dotY, { stiffness: 200, damping: 28 })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)')
    const canEnable = mediaQuery.matches && window.innerWidth >= 768
    setEnabled(canEnable)

    const onMouseMove = (event: MouseEvent) => {
      setHasMoved(true)
      dotX.set(event.clientX)
      dotY.set(event.clientY)
    }

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        setIsPointer(false)
        return
      }

      setIsPointer(Boolean(target.closest('[data-cursor="pointer"]')))
    }

    if (canEnable) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseover', onMouseOver)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseover', onMouseOver)
    }
  }, [dotX, dotY])

  if (!enabled) {
    return null
  }

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-50 h-2 w-2 rounded-full bg-white"
        style={{ x: dotX, y: dotY }}
        animate={{
          opacity: isPointer ? 0 : hasMoved ? 1 : 0,
          scale: isPointer ? 0.5 : 1,
        }}
        transition={{ duration: 0.15 }}
      />
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-50 rounded-full border"
        style={{
          x: ringX,
          y: ringY,
          width: 32,
          height: 32,
          marginLeft: -16,
          marginTop: -16,
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.4)',
        }}
        animate={{
          opacity: hasMoved ? 1 : 0,
          scale: isPointer ? 1.25 : 1,
          backgroundColor: isPointer ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0)',
        }}
        transition={{ duration: 0.2 }}
      />
    </>
  )
}
