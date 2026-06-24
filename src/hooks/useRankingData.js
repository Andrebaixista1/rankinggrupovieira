import { useCallback, useEffect, useRef, useState } from 'react'
import { PRIMARY_API_URL } from '../lib/constants.js'
import { fetchJson } from '../lib/api.js'
import {
  baseRankings,
  extractRowsPayload,
  looksLikeRawRows,
  extractRankingLists,
  buildRankingsFromRows,
  buildRankingsFromLists,
  preserveWorldCupRanking,
} from '../lib/rankings.js'

export function useRankingData() {
  const [rankings, setRankings] = useState(baseRankings)
  const [isLoading, setIsLoading] = useState(true)
  const [hasTimeout, setHasTimeout] = useState(false)
  const isMountedRef = useRef(true)
  const fetchInFlightRef = useRef(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const fetchData = useCallback(() => {
    if (fetchInFlightRef.current) return fetchInFlightRef.current

    const request = (async () => {
      try {
        setIsLoading(true)
        const data = await fetchJson(PRIMARY_API_URL)
        const rowsPayload = extractRowsPayload(data)
        const lists = extractRankingLists(data)
        const updated = looksLikeRawRows(rowsPayload)
          ? buildRankingsFromRows(rowsPayload)
          : (lists ? buildRankingsFromLists(lists) : buildRankingsFromRows(rowsPayload))
        if (isMountedRef.current) {
          setRankings(preserveWorldCupRanking(updated))
        }
        return true
      } catch (error) {
        console.error('Falha ao carregar ranking:', error)
        return false
      } finally {
        if (isMountedRef.current) setIsLoading(false)
        fetchInFlightRef.current = null
      }
    })()

    fetchInFlightRef.current = request
    return request
  }, [])

  const hasData = rankings.some((item) => item.rows.length > 0)

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (hasData) {
      if (hasTimeout) setHasTimeout(false)
      return undefined
    }
    const timer = setTimeout(() => {
      if (isMountedRef.current) setHasTimeout(true)
    }, 5 * 60 * 1000)
    return () => clearTimeout(timer)
  }, [hasData, hasTimeout])

  return { rankings, setRankings, isLoading, hasData, hasTimeout, fetchData, isMountedRef }
}
