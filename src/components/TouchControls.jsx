import React, { useState, useCallback } from 'react'

// Dispatch synthetic keyboard events so GameScene's useControls picks them up
function fireKey(code, type) {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }))
}

function TouchButton({ code, children, color = 'rgba(255,255,255,0.18)', holdable = false, style }) {
  const [pressed, setPressed] = useState(false)

  const onPress = useCallback((e) => {
    e.preventDefault()
    setPressed(true)
    fireKey(code, 'keydown')
  }, [code])

  const onRelease = useCallback((e) => {
    e.preventDefault()
    setPressed(false)
    fireKey(code, 'keyup')
  }, [code])

  return (
    <button
      onTouchStart={onPress}
      onTouchEnd={onRelease}
      onTouchCancel={onRelease}
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onMouseLeave={(e) => { if (pressed) onRelease(e) }}
      style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: pressed
          ? 'rgba(255,255,255,0.45)'
          : color,
        border: `2px solid ${pressed ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'}`,
        color: 'white',
        fontSize: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        backdropFilter: 'blur(6px)',
        transition: 'background 0.08s, border-color 0.08s, transform 0.08s',
        transform: pressed ? 'scale(0.92)' : 'scale(1)',
        boxShadow: pressed
          ? '0 0 16px rgba(255,255,255,0.3)'
          : '0 2px 8px rgba(0,0,0,0.4)',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export default function TouchControls() {
  // Only show on actual touch devices
  const isTouch = typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  if (!isTouch) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {/* Left lane */}
      <TouchButton code="ArrowLeft" style={{ pointerEvents: 'all' }}>
        ◀
      </TouchButton>

      {/* Jump + Slide stacked in center */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <TouchButton
          code="Space"
          color="rgba(78,205,196,0.28)"
          style={{ pointerEvents: 'all' }}
        >
          ↑
        </TouchButton>
        <TouchButton
          code="ArrowDown"
          holdable
          color="rgba(255,107,107,0.28)"
          style={{ pointerEvents: 'all' }}
        >
          ↓
        </TouchButton>
      </div>

      {/* Right lane */}
      <TouchButton code="ArrowRight" style={{ pointerEvents: 'all' }}>
        ▶
      </TouchButton>
    </div>
  )
}
