import React from 'react'

export default function UI({ score, coins }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '12px',
        padding: '8px 16px',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
      }}>
        {score}
      </div>
      <div style={{
        background: 'rgba(0,0,0,0.5)',
        borderRadius: '12px',
        padding: '8px 16px',
        color: '#FFE66D',
        fontSize: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '24px' }}>&#9679;</span>
        <span style={{ fontWeight: 'bold' }}>{coins}</span>
      </div>
    </div>
  )
}
