import { resolveVenueId, formatLocalDate } from '../../lib/stadiumUtils.js'
import { formatApiDateKey, resolveGameSortTime } from './gameUtils.js'

function normalizeEspnEvent(event) {
  const competition = Array.isArray(event?.competitions) ? event.competitions[0] : null
  if (!competition) return null

  const competitors = Array.isArray(competition?.competitors) ? competition.competitors : []
  const home = competitors.find((c) => c.homeAway === 'home') || {}
  const away = competitors.find((c) => c.homeAway === 'away') || {}

  const venue = competition?.venue || null
  const stadiumId = resolveVenueId(venue)
  const localDate = formatLocalDate(event?.date, stadiumId)

  const state = competition?.status?.type?.state || 'pre'
  const displayClock = competition?.status?.displayClock || ''
  const details = Array.isArray(competition?.details) ? competition.details : []
  const status = state === 'in' ? 'live' : state === 'post' ? 'finished' : 'scheduled'

  const scoreNum = (raw) => {
    if (typeof raw === 'number') return raw
    if (typeof raw === 'string') { const n = Number(raw); return Number.isFinite(n) ? n : 0 }
    if (raw && typeof raw === 'object') {
      if (typeof raw.value === 'number') return raw.value
      const n = Number(raw.displayValue); return Number.isFinite(n) ? n : 0
    }
    return 0
  }

  const extractScorers = (teamId) =>
    details
      .filter((d) => (d?.type?.text || '').toLowerCase().includes('goal') && String(d?.team?.id) === String(teamId))
      .map((d) => {
        const player = d?.athletesInvolved?.[0]?.displayName || ''
        const clock = d?.clock?.displayValue || ''
        return player ? `${player} ${clock}'` : `${clock}'`
      })
      .join(', ')

  return {
    id: String(event?.id || ''),
    home_team_name_en: home?.team?.displayName || '',
    away_team_name_en: away?.team?.displayName || '',
    home_score: scoreNum(home?.score),
    away_score: scoreNum(away?.score),
    local_date: localDate,
    status,
    game_status: status,
    time_elapsed: state === 'in' ? displayClock : '',
    stadium_id: stadiumId,
    home_scorers: extractScorers(home?.team?.id),
    away_scorers: extractScorers(away?.team?.id),
  }
}

export function filterTodayGames(payload, referenceDate = new Date()) {
  let games
  if (Array.isArray(payload?.games)) {
    games = payload.games
  } else if (Array.isArray(payload?.events)) {
    games = payload.events.map(normalizeEspnEvent).filter(Boolean)
  } else {
    games = []
  }

  const todayKey = formatApiDateKey(referenceDate)
  return games
    .filter((game) => String(game?.local_date || '').startsWith(todayKey))
    .sort((a, b) => resolveGameSortTime(a) - resolveGameSortTime(b))
}
