import { useState, useCallback } from 'react'

const LS_KEY = 'leaderboard_v1'
const MAX_ENTRIES = 10

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') }
  catch { return [] }
}

export function useLeaderboard() {
  const [entries, setEntries] = useState(load)

  const addEntry = useCallback((name, score, coins) => {
    const entry = {
      name: (name.trim() || 'Anonymous').slice(0, 16),
      score,
      coins,
      date: new Date().toLocaleDateString(),
    }
    const updated = [...load(), entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ENTRIES)
    localStorage.setItem(LS_KEY, JSON.stringify(updated))
    setEntries(updated)
  }, [])

  // True if score would make it onto the board
  const isTopScore = useCallback((score) => {
    const current = load()
    return current.length < MAX_ENTRIES || score > (current[current.length - 1]?.score ?? 0)
  }, [])

  return { entries, addEntry, isTopScore }
}
