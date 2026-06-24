import { resolveVenueId, formatLocalDate } from '../lib/stadiumUtils.js'

const ESPN_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260719'

const REQUEST_TIMEOUT_MS = 15000

function parseScore(raw) {
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  }
  if (raw && typeof raw === 'object') {
    if (typeof raw.value === 'number') return raw.value
    const n = Number(raw.displayValue)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function extractScorers(details, teamId) {
  if (!Array.isArray(details)) return ''
  return details
    .filter((d) => {
      const isGoal = (d?.type?.text || '').toLowerCase().includes('goal')
      return isGoal && String(d?.team?.id) === String(teamId)
    })
    .map((d) => {
      const player = d?.athletesInvolved?.[0]?.displayName || ''
      const clock = d?.clock?.displayValue || ''
      return player ? `${player} ${clock}'` : `${clock}'`
    })
    .join(', ')
}

function transformEspnPayload(payload) {
  const events = Array.isArray(payload?.events) ? payload.events : []

  const games = events.map((event) => {
    const competition = Array.isArray(event?.competitions) ? event.competitions[0] : null
    if (!competition) return null

    const competitors = Array.isArray(competition?.competitors) ? competition.competitors : []
    const home = competitors.find((c) => c.homeAway === 'home') || {}
    const away = competitors.find((c) => c.homeAway === 'away') || {}

    const venue = competition?.venue || null
    const stadiumId = resolveVenueId(venue)
    const localDate = formatLocalDate(event.date, stadiumId)

    const state = competition?.status?.type?.state || 'pre'
    const displayClock = competition?.status?.displayClock || ''
    const details = competition?.details || []

    const status = state === 'in' ? 'live' : state === 'post' ? 'finished' : 'scheduled'

    return {
      id: String(event.id || ''),
      home_team_name_en: home?.team?.displayName || '',
      away_team_name_en: away?.team?.displayName || '',
      home_score: parseScore(home?.score),
      away_score: parseScore(away?.score),
      local_date: localDate,
      status,
      game_status: status,
      time_elapsed: state === 'in' ? displayClock : '',
      stadium_id: stadiumId,
      home_scorers: extractScorers(details, home?.team?.id),
      away_scorers: extractScorers(details, away?.team?.id),
    }
  }).filter(Boolean)

  return { games }
}

export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: `Method ${req.method} not supported` })
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${ESPN_URL}&_t=${Date.now()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) {
      const rawBody = await response.text()
      res.status(response.status).send(rawBody)
      return
    }

    const payload = await response.json()
    res.status(200).json(transformEspnPayload(payload))
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: String(error?.message || 'Upstream request failed'),
    })
  } finally {
    clearTimeout(timeout)
  }
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
}
