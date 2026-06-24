import { STADIUM_TIMEZONE_MAP } from '../../lib/stadiumUtils.js'
import { normalizeCountryKey, resolveCountryDisplayName } from './countryUtils.js'
import { normalizeMeta } from './formatters.js'

export function formatApiDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

export function parseGameDateTime(localDate) {
  if (!localDate || typeof localDate !== 'string') return Number.NaN
  const [datePart = '', timePart = '00:00'] = localDate.trim().split(' ')
  const [month = '', day = '', year = ''] = datePart.split('/')
  const parsed = new Date(`${year}-${month}-${day}T${timePart}:00`)
  return Number.isNaN(parsed.getTime()) ? Number.NaN : parsed.getTime()
}

export function formatGameClock(localDate) {
  if (!localDate || typeof localDate !== 'string') return '--:--'
  return localDate.trim().split(' ')[1] || '--:--'
}

function parseLocalDateTimeParts(localDate) {
  if (!localDate || typeof localDate !== 'string') return null
  const [datePart = '', timePart = '00:00'] = localDate.trim().split(' ')
  const [month = '', day = '', year = ''] = datePart.split('/')
  const [hour = '00', minute = '00'] = timePart.split(':')
  const parsed = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: 0,
  }
  if (Object.values(parsed).some((v, i) => i < 4 && !Number.isFinite(v))) return null
  return parsed
}

export function parseGameDateTimeInTimeZone(localDate, timeZone) {
  const parts = parseLocalDateTimeParts(localDate)
  if (!parts || !timeZone) return parseGameDateTime(localDate)

  const utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  const resolved = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcGuess)).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value
    return acc
  }, {})

  const zonedAsUtc = Date.UTC(
    Number(resolved.year),
    Number(resolved.month) - 1,
    Number(resolved.day),
    Number(resolved.hour),
    Number(resolved.minute),
    Number(resolved.second),
  )
  return utcGuess - (zonedAsUtc - utcGuess)
}

export function formatTimeInTimeZone(localDate, timeZone) {
  if (!parseLocalDateTimeParts(localDate) || !timeZone) return formatGameClock(localDate)
  const adjustedUtc = parseGameDateTimeInTimeZone(localDate, timeZone)
  if (!Number.isFinite(adjustedUtc)) return formatGameClock(localDate)
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(adjustedUtc))
}

export function resolveStadiumTimeZone(stadium) {
  const country = normalizeCountryKey(stadium?.country_en)
  const region = normalizeCountryKey(stadium?.region)
  const city = normalizeCountryKey(stadium?.city_en)

  if (country === 'mexico') return 'America/Mexico_City'
  if (country === 'canada') {
    return region === 'western' || city.includes('vancouver') ? 'America/Vancouver' : 'America/Toronto'
  }
  if (country === 'united states') {
    if (city.includes('seattle') || city.includes('los angeles') || city.includes('santa clara') || city.includes('inglewood') || city.includes('bay area')) {
      return 'America/Los_Angeles'
    }
    if (city.includes('houston') || city.includes('dallas') || city.includes('arlington') || city.includes('kansas city')) {
      return 'America/Chicago'
    }
    return 'America/New_York'
  }
  return ''
}

export function formatGameStatus(game) {
  const rawStatus = normalizeMeta(game?.status || game?.game_status || game?.match_status)
    .toLowerCase()
    .replace(/['"'`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  const elapsed = String(game?.time_elapsed || '').trim()

  if (['finished', 'ended', 'complete', 'closed', 'encerrado'].includes(rawStatus)) return 'Encerrado'
  if (['live', 'in progress', 'ongoing', 'inplay', 'ao vivo'].includes(rawStatus)) return 'Ao vivo'
  if (['notstarted', 'not started', 'scheduled', 'not begun', 'programado'].includes(rawStatus)) return 'Não iniciado'
  if (String(game?.finished).toLowerCase() === 'true') return 'Encerrado'
  if (String(game?.started).toLowerCase() === 'true') return 'Ao vivo'

  if (elapsed) {
    const ne = elapsed.toLowerCase().replace(/['"'`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
    if (['finished', 'ended', 'complete', 'closed'].includes(ne)) return 'Encerrado'
    if (['notstarted', 'not started', 'scheduled', 'not begun'].includes(ne)) return 'Não iniciado'
    if (['live', 'in progress', 'ongoing', 'inplay'].includes(ne)) return 'Ao vivo'
    return `${elapsed}'`
  }
  return 'Não iniciado'
}

export function isLiveGame(game) {
  return formatGameStatus(game) === 'Ao vivo'
}

export function parseGoalMinute(value) {
  const match = String(value || '').match(/(\d+)(?:\s*\+\s*(\d+))?\s*'/)
  if (!match) return { label: '', value: -1 }
  const base = Number.parseInt(match[1], 10)
  const stoppage = Number.parseInt(match[2] || '0', 10)
  return { label: `${base}${stoppage ? `+${stoppage}` : ''}'`, value: base + stoppage / 100 }
}

export function parseScorerEntries(value) {
  const rawValue = String(value ?? '').trim()
  if (!rawValue || rawValue.toLowerCase() === 'null') return []
  const normalized = rawValue
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/^\{/, '')
    .replace(/\}$/, '')
  const quoted = [...normalized.matchAll(/"([^"]+)"/g)].map((m) => m[1])
  const entries = quoted.length ? quoted : normalized.split(',')
  return entries
    .map((e) => e.replace(/^["']|["']$/g, '').trim())
    .filter(Boolean)
    .map((e) => {
      const minute = parseGoalMinute(e)
      const player = e.replace(/\s+\d+(?:\s*\+\s*\d+)?\s*'.*$/, '').trim()
      return { player: player || e, minuteLabel: minute.label, minuteValue: minute.value }
    })
}

export function collectLiveGoalEvents(games) {
  const events = []
  games.filter(isLiveGame).forEach((game) => {
    const homeTeam = resolveCountryDisplayName(game?.home_team_name || game?.home_team_name_en || game?.home_team || 'Mandante')
    const awayTeam = resolveCountryDisplayName(game?.away_team_name || game?.away_team_name_en || game?.away_team || 'Visitante')
    const homeScore = Number.isFinite(Number(game?.home_score)) ? Number(game.home_score) : 0
    const awayScore = Number.isFinite(Number(game?.away_score)) ? Number(game.away_score) : 0
    const gameId = String(game?.id || game?._id || `${homeTeam}-${awayTeam}-${game?.local_date || ''}`)
    const matchLabel = `${homeTeam} ${homeScore} x ${awayScore} ${awayTeam}`

    parseScorerEntries(game?.home_scorers).forEach((goal, index) => {
      events.push({ ...goal, id: `${gameId}-home-${goal.player}-${goal.minuteLabel}-${index}`, gameId, teamName: homeTeam, matchLabel, side: 'home', sourceIndex: events.length })
    })
    parseScorerEntries(game?.away_scorers).forEach((goal, index) => {
      events.push({ ...goal, id: `${gameId}-away-${goal.player}-${goal.minuteLabel}-${index}`, gameId, teamName: awayTeam, matchLabel, side: 'away', sourceIndex: events.length })
    })
  })
  return events.sort((a, b) => {
    if (b.minuteValue !== a.minuteValue) return b.minuteValue - a.minuteValue
    return b.sourceIndex - a.sourceIndex
  })
}

export function buildGoalEventsSignature(events) {
  return events.map((e) => `${e.gameId}:${e.side}:${e.player}:${e.minuteLabel}`).join('|')
}

export function resolveGameSortTime(game, stadiumsById = {}) {
  const stadium = stadiumsById[String(game?.stadium_id)] || null
  const tz = resolveStadiumTimeZone(stadium) || STADIUM_TIMEZONE_MAP[String(game?.stadium_id)] || ''
  return tz
    ? parseGameDateTimeInTimeZone(game?.local_date, tz)
    : parseGameDateTime(game?.local_date)
}

export function sortGamesByClosestTime(games, stadiumsById = {}) {
  return [...games].sort((a, b) => {
    const ta = resolveGameSortTime(a, stadiumsById)
    const tb = resolveGameSortTime(b, stadiumsById)
    if (!Number.isFinite(ta) && !Number.isFinite(tb)) return 0
    if (!Number.isFinite(ta)) return 1
    if (!Number.isFinite(tb)) return -1
    return ta - tb
  })
}
