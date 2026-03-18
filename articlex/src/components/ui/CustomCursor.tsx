import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

export const CustomCursor = () => {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return false
    return window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 1024
  })
  const [isPointer, setIsPointer] = useState(false)
  const [isPreviewArea, setIsPreviewArea] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const smoothX = useSpring(cursorX, { stiffness: 280, damping: 30 })
  const smoothY = useSpring(cursorY, { stiffness: 280, damping: 30 })

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
      cursorX.set(event.clientX)
      cursorY.set(event.clientY)
    }

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        setIsPointer(false)
        return
      }
      const semanticPointerTarget = Boolean(target.closest('a,button,input,textarea,select,summary,[role="button"]'))
      const customPointerTarget = Boolean(target.closest('[data-cursor="pointer"]'))
      const previewAreaTarget = Boolean(target.closest('[data-cursor-area="preview"]'))
      setIsPointer(semanticPointerTarget || customPointerTarget)
      setIsPreviewArea(previewAreaTarget)
    }

    const onLeave = () => {
      setHasMoved(false)
      setIsPointer(false)
      setIsPreviewArea(false)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseover', onMouseOver)
    window.addEventListener('mouseleave', onLeave)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseover', onMouseOver)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [cursorX, cursorY, enabled])

  if (!enabled) return null

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[11000] rounded-full"
      style={{
        x: smoothX,
        y: smoothY,
        width: 28,
        height: 28,
        marginLeft: -14,
        marginTop: -14,
        background: '#ffffff',
        mixBlendMode: 'difference',
      }}
      animate={{ opacity: hasMoved ? 0.95 : 0, scale: isPreviewArea ? (isPointer ? 0.86 : 0.72) : (isPointer ? 1.18 : 1) }}
      transition={{ duration: 0.16 }}
    />
  )
}
