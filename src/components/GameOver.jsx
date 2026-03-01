import React, { useState } from 'react'

export default function GameOver({ score, coins, bestScore, onRestart, onSaveScore, onViewLeaderboard }) {
  const isNewBest = score >= bestScore
  const [name, setName] = useState(() => localStorage.getItem('playerName') || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    const trimmed = name.trim() || 'Anonymous'
    localStorage.setItem('playerName', trimmed)
    onSaveScore(trimmed, score, coins)
    setSaved(true)
    onViewLeaderboard()
  }

  const btnBase = {
    padding: '12px 32px',
    fontSize: 17,
    fontWeight: 'bold',
    border: 'none',
    borderRadius: 50,
    cursor: 'pointer',
    transition: 'transform 0.1s',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)',
      zIndex: 100,
      padding: 20,
    }}>
      <div style={{
        textAlign: 'center',
        color: 'white',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        padding: '36px 48px',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.1)',
        width: '100%',
        maxWidth: 400,
      }}>
        <h2 style={{ fontSize: 44, color: '#FF6B6B', marginBottom: 6 }}>GAME OVER</h2>

        {isNewBest && (
          <p style={{ color: '#FFE66D', fontSize: 18, marginBottom: 14, fontWeight: 'bold' }}>
            🎉 NEW BEST SCORE!
          </p>
        )}

        {/* Score summary */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 26, color: '#4ECDC4', marginBottom: 6 }}>
            Score: <strong>{score.toLocaleString()}</strong>
          </p>
          <p style={{ fontSize: 17, color: '#FFE66D', marginBottom: 4 }}>
            Coins: <strong>{coins}</strong>
          </p>
          {!isNewBest && (
            <p style={{ fontSize: 14, color: '#555', marginTop: 6 }}>
              Best: {bestScore.toLocaleString()}
            </p>
          )}
        </div>

        {/* Name input + save */}
        {!saved ? (
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Enter your name to save score</p>
            <input
              type="text"
              maxLength={16}
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.07)',
                color: 'white',
                fontSize: 16,
                outline: 'none',
                marginBottom: 10,
                boxSizing: 'border-box',
                textAlign: 'center',
              }}
              autoFocus
            />
            <button
              onClick={handleSave}
              style={{
                ...btnBase,
                width: '100%',
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                color: '#1a1a2e',
                boxShadow: '0 4px 16px rgba(255,215,0,0.35)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              🏆 SAVE SCORE
            </button>
          </div>
        ) : (
          <button
            onClick={onViewLeaderboard}
            style={{
              ...btnBase,
              width: '100%',
              marginBottom: 10,
              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
              color: '#1a1a2e',
              boxShadow: '0 4px 16px rgba(255,215,0,0.35)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            🏆 VIEW LEADERBOARD
          </button>
        )}

        {/* Play Again */}
        <button
          onClick={onRestart}
          style={{
            ...btnBase,
            width: '100%',
            background: 'linear-gradient(45deg, #4ECDC4, #44A3AA)',
            color: 'white',
            boxShadow: '0 4px 16px rgba(78,205,196,0.35)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  )
}
