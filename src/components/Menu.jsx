import React from 'react'

export default function Menu({ onStart, bestScore, onViewLeaderboard }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      zIndex: 100,
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{
          fontSize: '64px',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #FF6B6B, #FFE66D, #4ECDC4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px',
          textShadow: 'none',
          letterSpacing: '2px',
        }}>
          SUBWAY RUSH
        </h1>
        <p style={{ color: '#888', fontSize: '18px', marginBottom: '32px' }}>Endless Runner</p>

        {bestScore > 0 && (
          <p style={{ color: '#FFE66D', fontSize: '18px', marginBottom: '24px' }}>
            Best Score: {bestScore}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: '32px', justifyContent: 'center' }}>
          <button
            onClick={onStart}
            style={{
              padding: '16px 48px',
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(255, 107, 107, 0.5)',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            PLAY
          </button>
          <button
            onClick={onViewLeaderboard}
            style={{
              padding: '16px 20px',
              fontSize: '22px',
              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
              color: '#1a1a2e',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            title="Leaderboard"
          >
            🏆
          </button>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '20px 32px',
          fontSize: '14px',
          color: '#aaa',
          lineHeight: '2',
        }}>
          <div>&#8592; &#8594; / A D &nbsp; Change Lane</div>
          <div>&#8593; / Space &nbsp;&nbsp;&nbsp; Jump</div>
          <div>&#8595; / S &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Slide</div>
        </div>
      </div>
    </div>
  )
}
