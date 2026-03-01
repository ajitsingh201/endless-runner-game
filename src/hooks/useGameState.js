import { useState, useRef, useCallback } from 'react'

export const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER',
}

export function useGameState() {
  const [gameState, setGameState] = useState(GAME_STATES.MENU)
  const [score, setScore] = useState(0)
  const [coins, setCoins] = useState(0)
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('bestScore') || '0')
  })

  const startGame = useCallback(() => {
    setScore(0)
    setCoins(0)
    setGameState(GAME_STATES.PLAYING)
  }, [])

  const endGame = useCallback((finalScore) => {
    setGameState(GAME_STATES.GAMEOVER)
    if (finalScore > bestScore) {
      setBestScore(finalScore)
      localStorage.setItem('bestScore', finalScore.toString())
    }
  }, [bestScore])

  const addCoin = useCallback(() => {
    setCoins(c => c + 1)
    setScore(s => s + 10)
  }, [])

  const addScore = useCallback((amount) => {
    setScore(s => s + amount)
  }, [])

  return {
    gameState,
    score,
    coins,
    bestScore,
    startGame,
    endGame,
    addCoin,
    addScore,
  }
}
