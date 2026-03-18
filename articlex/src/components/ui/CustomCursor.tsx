import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

const TEXT_HOVER_SELECTOR = 'p,span,h1,h2,h3,h4,h5,h6,li,blockquote,strong,em,a,label,small'

export const CustomCursor = () => {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return false
    return window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 1024
  })
  const [isPointer, setIsPointer] = useState(false)
  const [isTextHover, setIsTextHover] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const dotX = useMotionValue(-100)
  const dotY = useMotionValue(-100)
  const ringX = useSpring(dotX, { stiffness: 200, damping: 28 })
  const ringY = useSpring(dotY, { stiffness: 200, damping: 28 })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)')
    const updateEligibility = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const canEnable = !isTouchDevice && mediaQuery.matches && window.innerWidth >= 1024
      setEnabled(canEnable)
    }

    const onViewportChange = () => updateEligibility()
    mediaQuery.addEventListener('change', onViewportChange)
    window.addEventListener('resize', onViewportChange)

    return () => {
      mediaQuery.removeEventListener('change', onViewportChange)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('custom-cursor-enabled', enabled)
    return () => {
      document.body.classList.remove('custom-cursor-enabled')
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const onMouseMove = (event: MouseEvent) => {
      setHasMoved(true)
      dotX.set(event.clientX)
      dotY.set(event.clientY)
    }

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        setIsPointer(false)
        setIsTextHover(false)
        return
      }
      const isPointerTarget = Boolean(target.closest('[data-cursor="pointer"]'))
      const isInPreviewSurface = Boolean(target.closest('[data-cursor-invert="off"]'))
      const isTextualTarget = Boolean(target.closest(TEXT_HOVER_SELECTOR))
      setIsPointer(isPointerTarget)
      setIsTextHover(isTextualTarget && !isInPreviewSurface)
    }

    const onLeave = () => {
      setHasMoved(false)
      setIsPointer(false)
      setIsTextHover(false)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseover', onMouseOver)
    window.addEventListener('mouseleave', onLeave)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseover', onMouseOver)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [dotX, dotY, enabled])

  if (!enabled) return null

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-50 h-2 w-2 rounded-full"
        style={{ x: dotX, y: dotY, background: 'var(--cursor-dot)' }}
        animate={{ opacity: isPointer || isTextHover ? 0 : hasMoved ? 1 : 0, scale: isPointer ? 0.5 : 1 }}
        transition={{ duration: 0.15 }}
      />
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-50 rounded-full border"
        style={{ x: ringX, y: ringY, width: 32, height: 32, marginLeft: -16, marginTop: -16, borderWidth: 1.5, borderColor: 'var(--cursor-ring)' }}
        animate={{ opacity: hasMoved && !isTextHover ? 1 : 0, scale: isPointer ? 1.25 : 1, backgroundColor: isPointer ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0)' }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-50 rounded-full"
        style={{
          x: ringX,
          y: ringY,
          width: 34,
          height: 34,
          marginLeft: -17,
          marginTop: -17,
          background: '#fff',
          mixBlendMode: 'difference',
        }}
        animate={{ opacity: hasMoved && isTextHover ? 0.95 : 0, scale: hasMoved && isTextHover ? 1 : 0.65 }}
        transition={{ duration: 0.16 }}
      />
    </>
  )
}
