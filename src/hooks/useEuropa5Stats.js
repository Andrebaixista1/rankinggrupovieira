import { useEffect, useRef, useState } from 'react'
import { EUROPA5_STATS_API_URL, EUROPA5_POLL_INTERVAL } from '../lib/constants.js'
import { fetchJson } from '../lib/api.js'
import { aggregateSaldo } from '../../lib/europa5Stats.js'

// Normaliza ambos os formatos: em dev o proxy devolve o array bruto do /saldo;
// em prod o serverless já devolve { bases, volume } agregado.
function normalize(payload) {
  if (Array.isArray(payload)) return aggregateSaldo(payload)
  if (payload && Array.isArray(payload.bases)) return payload
  return aggregateSaldo([])
}

export function useEuropa5Stats({ active }) {
  const [stats, setStats] = useState(null)
  const [ready, setReady] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!active) return undefined

    let cancelled = false
    const load = async () => {
      try {
        const payload = await fetchJson(EUROPA5_STATS_API_URL, { retries: 2, retryDelayMs: 800 })
        if (cancelled || !isMountedRef.current) return
        setStats(normalize(payload))
        setReady(true)
      } catch (error) {
        if (cancelled || !isMountedRef.current) return
        console.error('Falha ao carregar dados do Europa5:', error)
      }
    }

    load()
    const interval = setInterval(load, EUROPA5_POLL_INTERVAL)
    return () => { cancelled = true; clearInterval(interval) }
  }, [active])

  return { europa5Stats: stats, europa5Ready: ready }
}
