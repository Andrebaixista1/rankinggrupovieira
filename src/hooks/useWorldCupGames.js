import { useEffect, useRef, useState } from 'react'
import {
  WORLD_CUP_GAMES_API_URL,
  WORLD_CUP_GAMES_POLL_INTERVAL,
  WORLD_CUP_API_RETRY_COUNT,
  WORLD_CUP_API_RETRY_DELAY_MS,
} from '../lib/constants.js'
import { fetchJson } from '../lib/api.js'
import { filterTodayGames } from '../lib/espnUtils.js'
import { baseRankings } from '../lib/rankings.js'

export function useWorldCupGames({ currentId, todayKey, isMountedRef, setRankings }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const previousIdRef = useRef('')

  // Reset state when leaving the worldcup tab
  useEffect(() => {
    const prevId = previousIdRef.current
    previousIdRef.current = currentId

    if (currentId !== 'worldcup-games') return undefined
    if (prevId === 'worldcup-games') return undefined

    setIsLoading(false)
    setIsReady(false)
    setHasError(false)
  }, [currentId])

  useEffect(() => {
    if (currentId !== 'worldcup-games') return undefined

    let cancelled = false
    let requestInFlight = false

    const loadGames = async () => {
      if (requestInFlight) return
      requestInFlight = true
      setIsLoading(true)
      setHasError(false)

      try {
        const payload = await fetchJson(WORLD_CUP_GAMES_API_URL, {
          retries: WORLD_CUP_API_RETRY_COUNT,
          retryDelayMs: WORLD_CUP_API_RETRY_DELAY_MS,
        })
        if (cancelled || !isMountedRef.current) return

        const todayGames = filterTodayGames(payload, new Date())
        const gamesRanking = {
          ...baseRankings.find((r) => r.id === 'worldcup-games'),
          rows: todayGames,
        }

        setRankings((prev) => [
          ...prev.filter((r) => r.id !== 'worldcup-games'),
          gamesRanking,
        ])
        setIsReady(true)
        setHasError(false)
      } catch (error) {
        if (cancelled || !isMountedRef.current) return
        console.error('Falha ao carregar jogos:', error)
        setIsReady(false)
        setHasError(true)
      } finally {
        requestInFlight = false
        if (!cancelled && isMountedRef.current) setIsLoading(false)
      }
    }

    loadGames()
    const interval = setInterval(loadGames, WORLD_CUP_GAMES_POLL_INTERVAL)
    return () => { cancelled = true; clearInterval(interval) }
  }, [currentId, isMountedRef, setRankings, todayKey])

  return { worldCupGamesLoading: isLoading, worldCupGamesReady: isReady, worldCupGamesError: hasError }
}
