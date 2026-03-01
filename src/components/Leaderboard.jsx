import React from 'react'

const MEDAL = ['🥇', '🥈', '🥉']

const RANK_COLOR = ['#FFD700', '#C0C0C0', '#CD7F32']

function RankCell({ rank }) {
  if (rank <= 3) return (
    <span style={{ fontSize: 22 }}>{MEDAL[rank - 1]}</span>
  )
  return (
    <span style={{ color: '#666', fontWeight: 'bold', fontSize: 15 }}>#{rank}</span>
  )
}

export default function Leaderboard({ entries, onClose, highlightName }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '20px',
      }}
    >
      {/* Panel — stop click from bubbling to backdrop */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24,
          padding: '32px 28px',
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ color: '#FFD700', fontSize: 28, fontWeight: 'bold', letterSpacing: 1 }}>
            🏆 LEADERBOARD
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: 36, height: 36,
              color: 'white', fontSize: 18,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {entries.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '32px 0', fontSize: 16 }}>
            No scores yet. Play a game!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Column headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 90px 60px',
              gap: 8,
              padding: '0 12px 8px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              color: '#555',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              <span></span>
              <span>Name</span>
              <span style={{ textAlign: 'right' }}>Score</span>
              <span style={{ textAlign: 'right' }}>Coins</span>
            </div>

            {entries.map((entry, i) => {
              const rank = i + 1
              const isHighlight = entry.name === highlightName
              return (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 90px 60px',
                    gap: 8,
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: rank === 1
                      ? 'rgba(255,215,0,0.08)'
                      : isHighlight
                        ? 'rgba(78,205,196,0.12)'
                        : 'rgba(255,255,255,0.03)',
                    border: rank === 1
                      ? '1px solid rgba(255,215,0,0.25)'
                      : isHighlight
                        ? '1px solid rgba(78,205,196,0.3)'
                        : '1px solid transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <RankCell rank={rank} />
                  </div>

                  <div>
                    <div style={{
                      color: rank <= 3 ? RANK_COLOR[rank - 1] : 'white',
                      fontWeight: rank <= 3 ? 'bold' : 'normal',
                      fontSize: 15,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {entry.name}
                    </div>
                    <div style={{ color: '#444', fontSize: 11, marginTop: 1 }}>{entry.date}</div>
                  </div>

                  <div style={{
                    textAlign: 'right',
                    color: rank <= 3 ? RANK_COLOR[rank - 1] : '#4ECDC4',
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}>
                    {entry.score.toLocaleString()}
                  </div>

                  <div style={{ textAlign: 'right', color: '#FFD700', fontSize: 14 }}>
                    {entry.coins}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
