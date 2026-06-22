const ESPN_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260719'

const REQUEST_TIMEOUT_MS = 15000

// Copa 2026 venues → hardcoded ID (mesmos IDs do STADIUM_TIMEZONE_MAP no App.jsx)
const STADIUM_TIMEZONES = {
  '1': 'America/Mexico_City',
  '2': 'America/Mexico_City',
  '3': 'America/Monterrey',
  '4': 'America/Chicago',
  '5': 'America/Chicago',
  '6': 'America/New_York',
  '7': 'America/New_York',
  '8': 'America/New_York',
  '9': 'America/New_York',
  '10': 'America/Los_Angeles',
  '11': 'America/Los_Angeles',
  '12': 'America/Toronto',
  '13': 'America/Vancouver',
  '14': 'America/Los_Angeles',
  '15': 'America/Chicago',
  '16': 'America/New_York',
}

function resolveVenueId(venue) {
  if (!venue) return null
  const name = (venue.fullName || '').toLowerCase()
  const city = (venue.address?.city || '').toLowerCase().split(',')[0].trim()

  if (name.includes('azteca') || name.includes('banorte') || city === 'mexico city' || city === 'ciudad de méxico') return '1'
  if (name.includes('akron') || city === 'guadalajara') return '2'
  if (name.includes('bbva') || city === 'guadalupe' || city === 'monterrey') return '3'
  if (name.includes('at&t') || city === 'arlington') return '4'
  if (name.includes('nrg') || city === 'houston') return '5'
  if (name.includes('mercedes-benz') || city === 'atlanta') return '6'
  if (name.includes('lincoln financial') || city === 'philadelphia') return '7'
  if (name.includes('hard rock') || city === 'miami gardens' || city === 'miami') return '8'
  if (name.includes('metlife') || city === 'east rutherford') return '9'
  if (name.includes('lumen') || city === 'seattle') return '10'
  if (name.includes("levi's") || city === 'santa clara') return '11'
  if (name.includes('bmo') || city === 'toronto') return '12'
  if (name.includes('bc place') || city === 'vancouver') return '13'
  if (name.includes('sofi') || city === 'inglewood') return '14'
  if (name.includes('arrowhead') || city === 'kansas city') return '15'
  if (name.includes('gillette') || city === 'foxborough') return '16'

  return null
}

function formatLocalDate(isoDate, stadiumId) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return ''

  const tz = STADIUM_TIMEZONES[stadiumId] || 'UTC'

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(d).reduce((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value
      return acc
    }, {})
    return `${parts.month}/${parts.day}/${parts.year} ${parts.hour}:${parts.minute}`
  } catch {
    return ''
  }
}

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
