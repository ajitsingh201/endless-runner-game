import React, { useCallback, useState } from 'react'
import Game from './components/Game'
import Menu from './components/Menu'
import GameOver from './components/GameOver'
import UI from './components/UI'
import TouchControls from './components/TouchControls'
import Leaderboard from './components/Leaderboard'
import { useGameState, GAME_STATES } from './hooks/useGameState'
import { useLeaderboard } from './hooks/useLeaderboard'
import { resumeAudio } from './utils/sounds'
import { startMusic, stopMusic } from './utils/music'

export default function App() {
  const { gameState, score, coins, bestScore, startGame, endGame, addCoin, addScore } = useGameState()
  const { entries, addEntry, isTopScore } = useLeaderboard()
  const [gameKey, setGameKey] = useState(0)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [lastSavedName, setLastSavedName] = useState('')

  const handleStartGame = useCallback(() => {
    resumeAudio()
    startMusic()
    setGameKey(k => k + 1)
    startGame()
  }, [startGame])

  const handleGameOver = useCallback(() => {
    stopMusic()
    endGame(score)
  }, [endGame, score])

  const handleSaveScore = useCallback((name, finalScore, finalCoins) => {
    setLastSavedName(name)
    addEntry(name, finalScore, finalCoins)
  }, [addEntry])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {(gameState === GAME_STATES.PLAYING || gameState === GAME_STATES.GAMEOVER) && (
        <Game
          key={gameKey}
          onGameOver={handleGameOver}
          onAddCoin={addCoin}
          onAddScore={addScore}
        />
      )}

      {gameState === GAME_STATES.PLAYING && (
        <>
          <UI score={score} coins={coins} />
          <TouchControls />
        </>
      )}

      {gameState === GAME_STATES.MENU && (
        <Menu
          onStart={handleStartGame}
          bestScore={bestScore}
          onViewLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {gameState === GAME_STATES.GAMEOVER && (
        <GameOver
          score={score}
          coins={coins}
          bestScore={bestScore}
          onRestart={handleStartGame}
          onSaveScore={handleSaveScore}
          onViewLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {showLeaderboard && (
        <Leaderboard
          entries={entries}
          onClose={() => setShowLeaderboard(false)}
          highlightName={lastSavedName}
        />
      )}
    </div>
  )
}
