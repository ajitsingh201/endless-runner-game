import { useEffect, useRef } from 'react'

const SWIPE_MIN = 35  // px — minimum distance to register as a swipe

export function useControls() {
  const keys = useRef({})
  const justPressed = useRef({})
  const touchStart = useRef(null)

  useEffect(() => {
    // ── Keyboard ─────────────────────────────────────────────────────────────
    const onKeyDown = (e) => {
      if (!keys.current[e.code]) {
        justPressed.current[e.code] = true
      }
      keys.current[e.code] = true
      e.preventDefault()
    }
    const onKeyUp = (e) => {
      keys.current[e.code] = false
    }

    // ── Touch swipes ─────────────────────────────────────────────────────────
    // Small tap on a button → dx/dy < SWIPE_MIN → ignored here (button handles it)
    const onTouchStart = (e) => {
      const t = e.touches[0]
      touchStart.current = { x: t.clientX, y: t.clientY }
    }

    const onTouchEnd = (e) => {
      if (!touchStart.current) return
      const t = e.changedTouches[0]
      const dx = t.clientX - touchStart.current.x
      const dy = t.clientY - touchStart.current.y
      touchStart.current = null

      const ax = Math.abs(dx)
      const ay = Math.abs(dy)
      if (ax < SWIPE_MIN && ay < SWIPE_MIN) return   // too short → not a swipe

      if (ax >= ay) {
        // Horizontal swipe → lane change
        justPressed.current[dx > 0 ? 'ArrowRight' : 'ArrowLeft'] = true
      } else if (dy < 0) {
        // Swipe up → jump
        justPressed.current['Space'] = true
      } else {
        // Swipe down → slide (hold the key for 120ms so the game loop picks it up)
        keys.current['ArrowDown'] = true
        setTimeout(() => { keys.current['ArrowDown'] = false }, 120)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [])

  const consumeJustPressed = (code) => {
    if (justPressed.current[code]) {
      justPressed.current[code] = false
      return true
    }
    return false
  }

  return { keys: keys.current, consumeJustPressed }
}
