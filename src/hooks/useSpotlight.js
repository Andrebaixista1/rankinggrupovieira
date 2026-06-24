import { useCallback, useEffect, useRef, useState } from 'react'
import { SPOTLIGHT_DURATION } from '../lib/constants.js'

const SPOTLIGHT_SKIP_IDS = new Set(['supervisores', 'gerentes', 'worldcup-games'])

export function useSpotlight() {
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [spotlightRankingId, setSpotlightRankingId] = useState('')
  const [spotlightRow, setSpotlightRow] = useState(null)
  const timerRef = useRef(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  const closeSpotlight = useCallback(() => {
    clearTimer()
    setShowSpotlight(false)
    setSpotlightRow(null)
  }, [clearTimer])

  const openSpotlightForRanking = useCallback((ranking) => {
    clearTimer()
    if (!ranking?.rows?.length || SPOTLIGHT_SKIP_IDS.has(ranking.id)) {
      closeSpotlight()
      return
    }
    setSpotlightRankingId(ranking.id)
    setSpotlightRow(ranking.rows[0])
    setShowSpotlight(true)
    timerRef.current = setTimeout(() => {
      setShowSpotlight(false)
      setSpotlightRow(null)
      timerRef.current = null
    }, SPOTLIGHT_DURATION)
  }, [clearTimer, closeSpotlight])

  useEffect(() => () => clearTimer(), [clearTimer])

  return {
    showSpotlight,
    spotlightRankingId,
    spotlightRow,
    openSpotlightForRanking,
    closeSpotlight,
  }
}
