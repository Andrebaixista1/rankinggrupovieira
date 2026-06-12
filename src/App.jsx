import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { WORLD_CUP_FLAG_PATHS } from './worldcupFlagPaths'
import './App.css'

const pageMotion = {
  initial: { opacity: 0, y: 26, rotateX: 10, rotateY: -6, scale: 0.975 },
  animate: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -18, rotateX: -8, rotateY: 4, scale: 0.985 },
}

const introContentMotion = {
  initial: { opacity: 0, y: 18, rotateX: 8, rotateY: -4 },
  animate: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    transition: {
      delay: 0.12,
      duration: 0.55,
      ease: 'easeOut',
      staggerChildren: 0.12,
    },
  },
  exit: { opacity: 0, y: -10, rotateX: -6, rotateY: 3 },
}

const introItemMotion = {
  initial: { opacity: 0, y: 12, z: -8 },
  animate: { opacity: 1, y: 0, z: 0 },
  exit: { opacity: 0, y: -8, z: -8 },
}

const gridMotion = {
  animate: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.08,
    },
  },
}

const rowMotion = {
  initial: { opacity: 0, x: -18, rotateY: -10, rotateX: 4, z: -20 },
  animate: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    rotateX: 0,
    z: 0,
  },
  exit: { opacity: 0, x: 18, rotateY: 10, rotateX: -4, z: -20 },
}

const baseRankings = [
  {
    id: 'vendedores',
    kicker: 'VENDAS',
    title: 'Ranking TOP 10 Vendedor',
    subtitle: 'Hoje',
    description: 'Resultado do dia atual.',
    limit: 10,
    rows: [],
  },
  {
    id: 'supervisores',
    kicker: 'OPERACAO',
    title: 'Ranking TOP 5 Supervisor',
    subtitle: 'Hoje',
    description: 'Resultado do dia atual.',
    limit: 5,
    rows: [],
  },
  {
    id: 'gerentes',
    kicker: 'GESTAO',
    title: 'Ranking Grupo',
    subtitle: 'Hoje',
    description: 'Resultado do dia atual.',
    limit: null,
    rows: [],
  },
  {
    id: 'portabilidade',
    kicker: 'VENDAS',
    title: 'Ranking TOP 10 Portabilidade',
    subtitle: 'Hoje',
    description: 'Resultado do dia atual.',
    limit: 10,
    rows: [],
  },
  {
    id: 'novo',
    kicker: 'VENDAS',
    title: 'Ranking TOP 10 Novo',
    subtitle: 'Hoje',
    description: 'Resultado do dia atual.',
    limit: 10,
    rows: [],
  },
  {
    id: 'clt',
    kicker: 'VENDAS',
    title: 'Ranking TOP 10 CLT',
    subtitle: 'Hoje',
    description: 'Resultado do dia atual.',
    limit: 10,
    rows: [],
  },
  {
    id: 'worldcup-games',
    kicker: 'MUNDIAL',
    title: 'Jogos de Hoje - Ao Vivo',
    subtitle: 'Hoje',
    description: 'Tabela dos jogos e placares do dia.',
    limit: null,
    rows: [],
  },
]

function ControlIcon({ type }) {
  if (type === 'prev') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.5 5.5 9 12l6.5 6.5-1.4 1.4L6.2 12l7.9-7.9 1.4 1.4z" />
      </svg>
    )
  }

  if (type === 'pause') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 5h3v14H7V5zm7 0h3v14h-3V5z" />
      </svg>
    )
  }

  if (type === 'play') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 5.5v13l11-6.5-11-6.5z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8.5 5.5 1.4-1.4L17.8 12l-7.9 7.9-1.4-1.4L14.5 12 8.5 5.5z" />
    </svg>
  )
}

const DIRECT_PRIMARY_API_URL = 'https://app.apivieiracred.com.br/webhook/ranking'
const PRIMARY_API_URL = import.meta.env.PROD ? '/api/ranking' : DIRECT_PRIMARY_API_URL
const WORLD_CUP_GAMES_API_URL = import.meta.env.PROD ? '/api/worldcup-games' : '/api/worldcup-games'
const WORLD_CUP_STADIUMS_API_URL = '/api/worldcup-stadiums'
const ROTATION_INTERVAL = 30000
const WORLD_CUP_GAMES_POLL_INTERVAL = 30000
const WORLD_CUP_API_RETRY_COUNT = 2
const WORLD_CUP_API_RETRY_DELAY_MS = 900
const GOAL_MODAL_DURATION = 7000
const GOAL_FIREWORK_PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  id: `goal-spark-${index}`,
  angle: index * 20,
  distance: 104 + ((index % 4) * 26),
}))
const PORTABILIDADE_PRODUCTS = [
  'PORTABILIDADE',
]
const NOVO_PRODUCTS = [
  'NOVO',
]
const CLT_PRODUCTS = [
  'CLT',
]
const SPOTLIGHT_LABELS = {
  vendedores: 'Vendedores',
  portabilidade: 'Portabilidade',
  novo: 'Novo',
  clt: 'CLT',
}
const IMAGE_FIELD_CANDIDATES = [
  'imagem_perfil_url',
  'imagem_perfil',
  'imagemPerfil',
  'imagem',
  'foto',
  'avatar',
  'profile_image',
]
const COUNTRY_ALIAS_MAP = {
  'cote d ivoire': "Côte d'Ivoire",
  'cote divoire': "Côte d'Ivoire",
  'ivory coast': "Côte d'Ivoire",
  'south korea': 'Korea, Republic of',
  korea: 'Korea, Republic of',
  'north korea': "Korea, Democratic People's Republic of",
  'czech republic': 'Czech Republic',
  'bosnia and herzegovina': 'Bosnia and Herzegovina',
  'united states': 'United States',
  usa: 'United States',
  'united states of america': 'United States',
  'democratic republic of the congo': 'Congo, The Democratic Republic of the',
  'republic of the congo': 'Congo',
  'cape verde': 'Cabo Verde',
  'saudi arabia': 'Saudi Arabia',
  'new zealand': 'New Zealand',
  'ivory coast ': "Côte d'Ivoire",
}
const COUNTRY_DISPLAY_CODE_MAP = new Map([
  ['Côte d\'Ivoire', 'CI'],
  ['Korea, Republic of', 'KR'],
  ['Korea, Democratic People\'s Republic of', 'KP'],
  ['Czech Republic', 'CZ'],
  ['Bosnia and Herzegovina', 'BA'],
  ['United States', 'US'],
  ['Congo, The Democratic Republic of the', 'CD'],
  ['Congo', 'CG'],
  ['Cabo Verde', 'CV'],
  ['Saudi Arabia', 'SA'],
  ['New Zealand', 'NZ'],
  ['Mexico', 'MX'],
  ['Canada', 'CA'],
  ['Argentina', 'AR'],
  ['Brazil', 'BR'],
  ['Uruguay', 'UY'],
  ['Chile', 'CL'],
  ['Colombia', 'CO'],
  ['Ecuador', 'EC'],
  ['Peru', 'PE'],
  ['Paraguay', 'PY'],
  ['Bolivia', 'BO'],
  ['Venezuela', 'VE'],
  ['South Africa', 'ZA'],
  ['Morocco', 'MA'],
  ['Algeria', 'DZ'],
  ['Tunisia', 'TN'],
  ['Egypt', 'EG'],
  ['Ghana', 'GH'],
  ['Nigeria', 'NG'],
  ['Senegal', 'SN'],
  ['Cameroon', 'CM'],
  ['Costa Rica', 'CR'],
  ['Panama', 'PA'],
  ['Honduras', 'HN'],
  ['Guatemala', 'GT'],
  ['El Salvador', 'SV'],
  ['Jamaica', 'JM'],
  ['Trinidad and Tobago', 'TT'],
  ['Haiti', 'HT'],
  ['Dominican Republic', 'DO'],
  ['Japan', 'JP'],
  ['China', 'CN'],
  ['Chinese Taipei', 'TW'],
  ['Australia', 'AU'],
  ['Iran', 'IR'],
  ['Iraq', 'IQ'],
  ['Qatar', 'QA'],
  ['UAE', 'AE'],
  ['United Arab Emirates', 'AE'],
  ['Oman', 'OM'],
  ['Kyrgyz Republic', 'KG'],
  ['Kyrgyzstan', 'KG'],
  ['Uzbekistan', 'UZ'],
  ['Kazakhstan', 'KZ'],
  ['Thailand', 'TH'],
  ['Vietnam', 'VN'],
  ['Indonesia', 'ID'],
  ['Philippines', 'PH'],
  ['India', 'IN'],
  ['Turkey', 'TR'],
  ['Türkiye', 'TR'],
  ['North Macedonia', 'MK'],
  ['Macedonia', 'MK'],
  ['Serbia', 'RS'],
  ['Croatia', 'HR'],
  ['Slovenia', 'SI'],
  ['Slovakia', 'SK'],
  ['Montenegro', 'ME'],
  ['Albania', 'AL'],
  ['Romania', 'RO'],
  ['Bulgaria', 'BG'],
  ['Greece', 'GR'],
  ['Portugal', 'PT'],
  ['Spain', 'ES'],
  ['France', 'FR'],
  ['Germany', 'DE'],
  ['England', 'GB'],
  ['Scotland', 'GB'],
  ['Wales', 'GB'],
  ['Northern Ireland', 'GB'],
  ['Netherlands', 'NL'],
  ['Belgium', 'BE'],
  ['Switzerland', 'CH'],
  ['Austria', 'AT'],
  ['Italy', 'IT'],
  ['Poland', 'PL'],
  ['Denmark', 'DK'],
  ['Norway', 'NO'],
  ['Sweden', 'SE'],
  ['Finland', 'FI'],
  ['Iceland', 'IS'],
  ['Ireland', 'IE'],
  ['Luxembourg', 'LU'],
  ['Liechtenstein', 'LI'],
  ['Monaco', 'MC'],
  ['Andorra', 'AD'],
  ['Malta', 'MT'],
  ['Cyprus', 'CY'],
])
function buildRequestUrl(baseUrl) {
  if (!baseUrl) return ''
  const joiner = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${joiner}t=${Date.now()}`
}

function formatApiDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

function parseGameDateTime(localDate) {
  if (!localDate || typeof localDate !== 'string') return Number.NaN
  const [datePart = '', timePart = '00:00'] = localDate.trim().split(' ')
  const [month = '', day = '', year = ''] = datePart.split('/')
  const normalized = `${year}-${month}-${day}T${timePart}:00`
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? Number.NaN : parsed.getTime()
}

function formatGameClock(localDate) {
  if (!localDate || typeof localDate !== 'string') return '--:--'
  const parts = localDate.trim().split(' ')
  return parts[1] || '--:--'
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
  if (Object.values(parsed).some((value, index) => index < 4 && !Number.isFinite(value))) {
    return null
  }
  return parsed
}

function formatTimeInTimeZone(localDate, timeZone) {
  const parts = parseLocalDateTimeParts(localDate)
  if (!parts || !timeZone) return formatGameClock(localDate)

  const utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const resolved = formatter.formatToParts(new Date(utcGuess)).reduce((acc, part) => {
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
  const adjustedUtc = utcGuess - (zonedAsUtc - utcGuess)

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(adjustedUtc))
}

function normalizeCountryKey(value) {
  return normalizeMeta(value)
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function resolveCountryName(name) {
  const normalized = normalizeCountryKey(name)
  return COUNTRY_ALIAS_MAP[normalized] || normalizeMeta(name)
}

function resolveCountryDisplayName(name) {
  const canonicalName = resolveCountryName(name)
  if (canonicalName === 'Czech Republic') {
    return 'República Tcheca'
  }
  const regionCode = COUNTRY_DISPLAY_CODE_MAP.get(canonicalName)

  if (!regionCode || typeof Intl.DisplayNames !== 'function') {
    return canonicalName
  }

  try {
    const displayNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' })
    return displayNames.of(regionCode) || canonicalName
  } catch {
    return canonicalName
  }
}

function resolveWorldCupFlagUrl(countryName) {
  const normalizedCountryKey = normalizeCountryKey(countryName)
  return WORLD_CUP_FLAG_PATHS[normalizedCountryKey] || ''
}

function resolveStadiumTimeZone(stadium) {
  const country = normalizeCountryKey(stadium?.country_en)
  const region = normalizeCountryKey(stadium?.region)
  const city = normalizeCountryKey(stadium?.city_en)

  if (country === 'mexico') return 'America/Mexico_City'
  if (country === 'canada') {
    if (region === 'western' || city.includes('vancouver')) return 'America/Vancouver'
    return 'America/Toronto'
  }
  if (country === 'united states') {
    if (
      city.includes('seattle')
      || city.includes('los angeles')
      || city.includes('santa clara')
      || city.includes('san francisco')
      || city.includes('inglewood')
      || city.includes('bay area')
    ) {
      return 'America/Los_Angeles'
    }
    if (
      city.includes('houston')
      || city.includes('dallas')
      || city.includes('arlington')
      || city.includes('kansas city')
    ) {
      return 'America/Chicago'
    }
    return 'America/New_York'
  }

  return ''
}

function formatGameStatus(game) {
  const rawStatus = normalizeMeta(game?.status || game?.game_status || game?.match_status)
    .toLowerCase()
    .replace(/['"’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  const elapsed = String(game?.time_elapsed || '').trim()
  if (
    rawStatus === 'finished'
    || rawStatus === 'ended'
    || rawStatus === 'complete'
    || rawStatus === 'closed'
    || rawStatus === 'encerrado'
  ) {
    return 'Encerrado'
  }
  if (
    rawStatus === 'live'
    || rawStatus === 'in progress'
    || rawStatus === 'ongoing'
    || rawStatus === 'inplay'
    || rawStatus === 'ao vivo'
  ) {
    return 'Ao vivo'
  }
  if (
    rawStatus === 'notstarted'
    || rawStatus === 'not started'
    || rawStatus === 'scheduled'
    || rawStatus === 'not begun'
    || rawStatus === 'programado'
  ) {
    return 'Não iniciado'
  }
  if (String(game?.finished).toLowerCase() === 'true') {
    return 'Encerrado'
  }
  if (String(game?.started).toLowerCase() === 'true') {
    return 'Ao vivo'
  }
  if (elapsed) {
    const normalizedElapsed = elapsed
      .toLowerCase()
      .replace(/['"’`]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()

    if (
      normalizedElapsed === 'finished'
      || normalizedElapsed === 'ended'
      || normalizedElapsed === 'complete'
      || normalizedElapsed === 'closed'
    ) {
      return 'Encerrado'
    }

    if (
      normalizedElapsed === 'notstarted'
      || normalizedElapsed === 'not started'
      || normalizedElapsed === 'scheduled'
      || normalizedElapsed === 'not begun'
    ) {
      return 'Não iniciado'
    }

    if (normalizedElapsed === 'live' || normalizedElapsed === 'in progress' || normalizedElapsed === 'ongoing' || normalizedElapsed === 'inplay') {
      return 'Ao vivo'
    }

    return `${elapsed}'`
  }
  return 'Não iniciado'
}

function isLiveGame(game) {
  return formatGameStatus(game) === 'Ao vivo'
}

function parseGoalMinute(value) {
  const match = String(value || '').match(/(\d+)(?:\s*\+\s*(\d+))?\s*'/)
  if (!match) {
    return { label: '', value: -1 }
  }

  const baseMinute = Number.parseInt(match[1], 10)
  const stoppageMinute = Number.parseInt(match[2] || '0', 10)
  return {
    label: `${baseMinute}${stoppageMinute ? `+${stoppageMinute}` : ''}'`,
    value: baseMinute + (stoppageMinute / 100),
  }
}

function parseScorerEntries(value) {
  const rawValue = String(value ?? '').trim()
  if (!rawValue || rawValue.toLowerCase() === 'null') {
    return []
  }

  const normalizedValue = rawValue
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/^\{/, '')
    .replace(/\}$/, '')

  const quotedEntries = [...normalizedValue.matchAll(/"([^"]+)"/g)].map((match) => match[1])
  const rawEntries = quotedEntries.length ? quotedEntries : normalizedValue.split(',')

  return rawEntries
    .map((entry) => entry.replace(/^["']|["']$/g, '').trim())
    .filter(Boolean)
    .map((entry) => {
      const minute = parseGoalMinute(entry)
      const player = entry
        .replace(/\s+\d+(?:\s*\+\s*\d+)?\s*'.*$/, '')
        .trim()

      return {
        player: player || entry,
        minuteLabel: minute.label,
        minuteValue: minute.value,
      }
    })
}

function collectLiveGoalEvents(games) {
  const events = []

  games
    .filter(isLiveGame)
    .forEach((game) => {
      const homeTeam = resolveCountryDisplayName(game?.home_team_name || game?.home_team_name_en || game?.home_team || 'Mandante')
      const awayTeam = resolveCountryDisplayName(game?.away_team_name || game?.away_team_name_en || game?.away_team || 'Visitante')
      const homeScore = Number.isFinite(Number(game?.home_score)) ? Number(game.home_score) : 0
      const awayScore = Number.isFinite(Number(game?.away_score)) ? Number(game.away_score) : 0
      const gameId = String(game?.id || game?._id || `${homeTeam}-${awayTeam}-${game?.local_date || ''}`)
      const matchLabel = `${homeTeam} ${homeScore} x ${awayScore} ${awayTeam}`

      parseScorerEntries(game?.home_scorers).forEach((goal, index) => {
        events.push({
          ...goal,
          id: `${gameId}-home-${goal.player}-${goal.minuteLabel}-${index}`,
          gameId,
          teamName: homeTeam,
          matchLabel,
          side: 'home',
          sourceIndex: events.length,
        })
      })

      parseScorerEntries(game?.away_scorers).forEach((goal, index) => {
        events.push({
          ...goal,
          id: `${gameId}-away-${goal.player}-${goal.minuteLabel}-${index}`,
          gameId,
          teamName: awayTeam,
          matchLabel,
          side: 'away',
          sourceIndex: events.length,
        })
      })
    })

  return events.sort((left, right) => {
    if (right.minuteValue !== left.minuteValue) {
      return right.minuteValue - left.minuteValue
    }

    return right.sourceIndex - left.sourceIndex
  })
}

function buildGoalEventsSignature(events) {
  return events
    .map((event) => `${event.gameId}:${event.side}:${event.player}:${event.minuteLabel}`)
    .join('|')
}

function filterTodayGames(payload, referenceDate = new Date()) {
  const games = Array.isArray(payload?.games) ? payload.games : []
  const todayKey = formatApiDateKey(referenceDate)

  return games
    .filter((game) => String(game?.local_date || '').startsWith(todayKey))
    .sort((left, right) => {
      const leftTime = parseGameDateTime(left?.local_date)
      const rightTime = parseGameDateTime(right?.local_date)
      return leftTime - rightTime
    })
}

async function fetchJsonOnce(baseUrl) {
  const requestUrl = buildRequestUrl(baseUrl)
  if (!requestUrl) {
    throw new Error('URL da API não definida')
  }
  const response = await fetch(requestUrl, { cache: 'no-store' })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Erro ao buscar ranking: ${response.status}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Resposta da API não é JSON válido')
  }
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function fetchJson(baseUrl, options = {}) {
  const retries = Number.isFinite(options.retries) ? Math.max(0, options.retries) : 0
  const retryDelayMs = Number.isFinite(options.retryDelayMs) ? Math.max(0, options.retryDelayMs) : 0
  let lastError

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchJsonOnce(baseUrl)
    } catch (error) {
      lastError = error
      if (attempt >= retries) break
      if (retryDelayMs > 0) {
        await delay(retryDelayMs)
      }
    }
  }

  throw lastError
}

function normalizeMeta(value) {
  if (!value) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function formatName(value) {
  const normalized = normalizeMeta(value)
  return normalized ? normalized.toUpperCase() : ''
}

function normalizeKey(value) {
  const normalized = normalizeMeta(value)
  if (!normalized) return ''
  return normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

const SUPERVISOR_NAME_CORRECTIONS = new Map(
  [
    ['FREIRAS DO EVERTON', 'EVERTON NUNES'],
  ].map(([from, to]) => [normalizeKey(from), to]),
)

function formatPersonName(value) {
  if (!value) return ''
  const cleaned = String(value).replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  const parts = cleaned.split(' ').filter(Boolean)
  if (parts.length === 1) {
    return parts[0].toUpperCase()
  }
  const first = parts[0]
  const last = parts[parts.length - 1]
  return `${first.toUpperCase()} ${last.toUpperCase()}`
}

function formatVendorNameWithCompany(value) {
  if (!value) return ''
  const raw = String(value)
  const [before, ...rest] = raw.split('/')
  const name = formatPersonName(before)
  const company = rest.length ? formatName(rest.join('/')) : ''
  if (company) {
    return name ? `${name} / ${company}` : company
  }
  return name
}

function formatVendorNameOnly(value) {
  if (!value) return ''
  const raw = String(value)
  const [before] = raw.split('/')
  return formatPersonName(before)
}

function formatAfterColon(value) {
  if (!value) return ''
  const raw = String(value)
  const parts = raw.split(':')
  const tail = parts.length > 1 ? parts.slice(1).join(':') : raw
  const corrected = SUPERVISOR_NAME_CORRECTIONS.get(normalizeKey(tail))
  if (corrected) return corrected
  return formatName(tail)
}

function formatCountLabel(value) {
  const count = Math.round(parseNumericValue(value))
  if (!count) return '0 propostas'
  return count === 1 ? '1 proposta' : `${count} propostas`
}

function parseNumericValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (!value) return 0
  const raw = String(value).trim()
  if (!raw) return 0
  const sanitized = raw.replace(/\s+/g, '').replace(/[R$\u00A0]/g, '')
  if (sanitized.includes(',') && sanitized.includes('.')) {
    const normalized = sanitized.replace(/\./g, '').replace(',', '.')
    return Number(normalized) || 0
  }
  if (sanitized.includes(',')) {
    return Number(sanitized.replace(',', '.')) || 0
  }
  return Number(sanitized) || 0
}

function hasRowValue(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'number') return Number.isFinite(value)
  return String(value).trim().length > 0
}

function resolveImageValue(payload, preferredKeys = []) {
  const keys = [...preferredKeys, ...IMAGE_FIELD_CANDIDATES]
  for (const key of keys) {
    if (!key) continue
    const value = normalizeMeta(payload?.[key])
    if (value) return value
  }
  return ''
}

function rowHasKey(row, key) {
  return Boolean(row && typeof row === 'object' && Object.prototype.hasOwnProperty.call(row, key) && hasRowValue(row[key]))
}

function buildGroups(rows, groupKey, metaKey, options = {}) {
  const {
    multiLabel = 'VARIOS',
    metaFormatter,
    nameFormatter,
    valueKey = 'soma_valor_referencia',
    imageKey,
  } = options
  const map = new Map()

  rows.forEach((row) => {
    const rawName = row?.[groupKey]
    if (!rawName) return
    const displayName = nameFormatter ? nameFormatter(rawName) : rawName
    const rawMeta = row?.[metaKey]
    const metaValue = metaFormatter ? metaFormatter(rawMeta) : normalizeMeta(rawMeta)
    const value = parseNumericValue(row?.[valueKey])
    const imageValue = resolveImageValue(row, imageKey ? [imageKey] : [])

    if (!map.has(rawName)) {
      map.set(rawName, {
        name: displayName,
        meta: metaValue,
        value,
        count: 1,
        image: imageValue,
      })
      return
    }

    const current = map.get(rawName)
    current.value += value
    current.count += 1
    if (!current.image && imageValue) {
      current.image = imageValue
    }
    if (metaValue) {
      if (!current.meta) {
        current.meta = metaValue
      } else if (current.meta !== metaValue) {
        current.meta = multiLabel
      }
    }
  })

  return Array.from(map.values()).sort((a, b) => b.value - a.value)
}

function resolveRowKey(rows, candidates) {
  if (!Array.isArray(rows)) return ''
  for (const key of candidates) {
    if (rows.some((row) => rowHasKey(row, key))) return key
  }
  return ''
}

function buildProductSet(items) {
  return new Set(items.map((item) => normalizeKey(item)))
}

const PORTABILIDADE_SET = buildProductSet(PORTABILIDADE_PRODUCTS)
const NOVO_SET = buildProductSet(NOVO_PRODUCTS)
const CLT_SET = buildProductSet(CLT_PRODUCTS)

function filterRowsByProduct(rows, productKey, allowedSet) {
  if (!Array.isArray(rows) || !productKey || !allowedSet) return []
  return rows.filter((row) => {
    const value = row?.[productKey]
    if (!value) return false
    return allowedSet.has(normalizeKey(value))
  })
}

function collectArrays(payload, bucket = []) {
  if (Array.isArray(payload)) {
    bucket.push(payload)
    return bucket
  }
  if (!payload || typeof payload !== 'object') return bucket
  Object.values(payload).forEach((value) => {
    collectArrays(value, bucket)
  })
  return bucket
}

function extractRowsPayload(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (typeof payload === 'string') {
    try {
      return extractRowsPayload(JSON.parse(payload))
    } catch {
      return []
    }
  }
  if (payload && typeof payload === 'object') {
    const values = Object.values(payload)
    if (values.length && values.every((value) => value && typeof value === 'object')) {
      return values
    }
  }
  const candidates = [
    payload.rows,
    payload.data,
    payload.result,
    payload.items,
    payload.payload,
  ]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
    if (candidate && typeof candidate === 'object') {
      const values = Object.values(candidate)
      if (values.length && values.every((value) => value && typeof value === 'object')) {
        return values
      }
    }
  }
  const nestedArrays = collectArrays(payload)
  if (nestedArrays.length) return nestedArrays[0]
  return []
}

function looksLikeRawRows(rows) {
  return Array.isArray(rows)
    && rows.some((row) => rowHasKey(row, 'vendedor_nome')
      && rowHasKey(row, 'equipe_nome')
      && rowHasKey(row, 'franquia_nome'))
}

function extractRankingLists(payload) {
  if (!payload || typeof payload !== 'object') return null
  const arrays = collectArrays(payload)
  if (!arrays.length) return null
  if (arrays.some((arr) => looksLikeRawRows(arr))) return null

  const vendedores = arrays.find((arr) => arr.some((row) => rowHasKey(row, 'vendedor_nome')))
  const equipes = arrays.find((arr) =>
    arr.some((row) =>
      rowHasKey(row, 'equipe_nome')
      && rowHasKey(row, 'franquia_nome')
      && !rowHasKey(row, 'vendedor_nome'),
    ),
  )
  const franquias = arrays.find((arr) =>
    arr.some((row) =>
      rowHasKey(row, 'franquia_nome')
      && (rowHasKey(row, 'qtde_vendedor_nome')
        || rowHasKey(row, 'qtde_vendedor')
        || rowHasKey(row, 'qtde_propostas')
        || rowHasKey(row, 'qtde_proposta')
        || rowHasKey(row, 'quantidade_propostas')
        || rowHasKey(row, 'propostas')),
    ),
  ) || arrays.find((arr) =>
    arr.some((row) =>
      rowHasKey(row, 'franquia_nome')
      && !rowHasKey(row, 'equipe_nome')
      && !rowHasKey(row, 'vendedor_nome'),
    ),
  )

  if (!vendedores && !equipes && !franquias) return null
  return { vendedores, equipes, franquias }
}

function assembleRankings(rowsById) {
  return baseRankings.map((ranking) => {
    const sourceRows = rowsById?.[ranking.id] || []
    const rows = Number.isFinite(ranking.limit)
      ? sourceRows.slice(0, ranking.limit)
      : sourceRows
    return { ...ranking, rows }
  })
}

function preserveWorldCupRanking(rankings) {
  const nextRankings = Array.isArray(rankings) ? rankings.filter(Boolean) : []
  const existingWorldCup = nextRankings.find((ranking) => ranking.id === 'worldcup-games')
  if (existingWorldCup) {
    return nextRankings
  }

  const worldCupBase = baseRankings.find((ranking) => ranking.id === 'worldcup-games')
  if (!worldCupBase) return nextRankings

  return [...nextRankings, { ...worldCupBase }]
}

function buildRankingsFromRows(rows) {
  const safeRows = Array.isArray(rows) ? rows : []
  const vendorKey = resolveRowKey(safeRows, [
    'vendedor_nome',
    'vendedor',
    'nome_vendedor',
    'vendedorName',
    'nome',
  ]) || 'vendedor_nome'
  const equipeKey = resolveRowKey(safeRows, [
    'equipe_nome',
    'equipe',
    'nome_equipe',
  ]) || 'equipe_nome'
  const franquiaKey = resolveRowKey(safeRows, [
    'franquia_nome',
    'franquia',
    'nome_franquia',
    'equipe_nome',
    'equipe',
  ]) || 'franquia_nome'
  const valueKey = resolveRowKey(safeRows, [
    'valor_referencia',
    'soma_valor_referencia',
    'valor',
    'total',
    'valor_total',
  ]) || 'soma_valor_referencia'
  const productKey = resolveRowKey(safeRows, [
    'produto_nome',
    'produto',
    'nome_produto',
    'produtoName',
  ]) || 'produto_nome'
  const imageKey = resolveRowKey(safeRows, [
    'imagem_perfil_url',
    'imagem_perfil',
    'imagemPerfil',
    'imagem',
    'foto',
    'avatar',
    'profile_image',
  ]) || 'imagem_perfil'

  const vendedores = buildGroups(safeRows, vendorKey, equipeKey, {
    multiLabel: 'VARIAS EQUIPES',
    nameFormatter: formatVendorNameWithCompany,
    metaFormatter: formatName,
    valueKey,
    imageKey,
  })
  const supervisores = buildGroups(safeRows, equipeKey, franquiaKey, {
    multiLabel: 'VARIAS FRANQUIAS',
    nameFormatter: formatAfterColon,
    metaFormatter: formatName,
    valueKey,
  })
  const gerentes = buildGroups(safeRows, franquiaKey, 'empresa', {
    multiLabel: 'VARIAS EMPRESAS',
    metaFormatter: (value) => (value ? String(value).toUpperCase() : ''),
    valueKey,
  }).map((item) => ({
    ...item,
    meta: formatCountLabel(item.count),
  }))

  const portRows = filterRowsByProduct(safeRows, productKey, PORTABILIDADE_SET)
  const portabilidade = buildGroups(portRows, vendorKey, equipeKey, {
    multiLabel: 'VARIAS EQUIPES',
    nameFormatter: formatVendorNameOnly,
    metaFormatter: formatName,
    valueKey,
    imageKey,
  })

  const novoRows = filterRowsByProduct(safeRows, productKey, NOVO_SET)
  const novo = buildGroups(novoRows, vendorKey, equipeKey, {
    multiLabel: 'VARIAS EQUIPES',
    nameFormatter: formatVendorNameOnly,
    metaFormatter: formatName,
    valueKey,
    imageKey,
  })

  const cltRows = filterRowsByProduct(safeRows, productKey, CLT_SET)
  const clt = buildGroups(cltRows, vendorKey, equipeKey, {
    multiLabel: 'VARIAS EQUIPES',
    nameFormatter: formatVendorNameOnly,
    metaFormatter: formatName,
    valueKey,
    imageKey,
  })

  return assembleRankings({
    vendedores,
    portabilidade,
    novo,
    clt,
    supervisores,
    gerentes,
  })
}

function buildRankingsFromLists(lists) {
  if (!lists) return baseRankings
  const makeRows = (list, config) => {
    const safeList = Array.isArray(list) ? list : []
    const rows = safeList.map((item) => {
      const rawName = item?.[config.nameKey]
      const name = config.nameFormatter ? config.nameFormatter(rawName) : formatName(rawName)
      if (!name) return null
      const value = parseNumericValue(
        item?.[config.valueKey]
          ?? item?.valor_referencia
          ?? item?.soma_valor_referencia
          ?? item?.valor
          ?? item?.total,
      )
      const image = resolveImageValue(item, config.imageKey ? [config.imageKey] : [])
      let meta = ''
      if (config.count) {
        const countValue =
          item?.qtde_vendedor_nome
          ?? item?.qtde_vendedor
          ?? item?.qtde_propostas
          ?? item?.qtde_proposta
          ?? item?.quantidade_propostas
          ?? item?.propostas
        meta = formatCountLabel(countValue)
      } else if (config.metaKey) {
        meta = formatName(item?.[config.metaKey])
      }
      return { name, meta, value, image }
    }).filter(Boolean)

    return rows.sort((a, b) => b.value - a.value)
  }

  const vendedores = makeRows(lists.vendedores, {
    nameKey: 'vendedor_nome',
    metaKey: 'equipe_nome',
    valueKey: 'valor_referencia',
    nameFormatter: formatVendorNameWithCompany,
    imageKey: 'imagem_perfil',
  })
  const supervisores = makeRows(lists.equipes, {
    nameKey: 'equipe_nome',
    metaKey: 'franquia_nome',
    valueKey: 'valor_referencia',
    nameFormatter: formatAfterColon,
  })
  const gerentes = makeRows(lists.franquias, {
    nameKey: 'franquia_nome',
    valueKey: 'valor_referencia',
    count: true,
  })

  return assembleRankings({
    vendedores,
    portabilidade: [],
    novo: [],
    clt: [],
    supervisores,
    gerentes,
  })
}

function App() {
  const [rankings, setRankings] = useState(baseRankings)
  const [activeIndex, setActiveIndex] = useState(0)
  const [cycleKey, setCycleKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasTimeout, setHasTimeout] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [showIntro, setShowIntro] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const isMountedRef = useRef(true)
  const hasLoadedRef = useRef(false)
  const fetchInFlightRef = useRef(null)
  const activeIndexRef = useRef(0)
  const spotlightTimerRef = useRef(null)
  const goalModalTimerRef = useRef(null)
  const goalModalShellRef = useRef(null)
  const lastGoalSignatureRef = useRef('')
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [spotlightRankingId, setSpotlightRankingId] = useState('')
  const [spotlightRow, setSpotlightRow] = useState(null)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalEvents, setGoalEvents] = useState([])
  const [worldCupGamesLoading, setWorldCupGamesLoading] = useState(false)
  const [worldCupGamesReady, setWorldCupGamesReady] = useState(false)
  const [worldCupGamesError, setWorldCupGamesError] = useState(false)
  const [worldCupStadiumsById, setWorldCupStadiumsById] = useState({})
  const [worldCupStadiumsReady, setWorldCupStadiumsReady] = useState(false)
  const [worldCupStadiumsError, setWorldCupStadiumsError] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const previousRankingIdRef = useRef('')

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    if (rankings.some((ranking) => ranking.id === 'worldcup-games')) {
      return undefined
    }

    setRankings((prev) => preserveWorldCupRanking(prev))
    return undefined
  }, [rankings])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchData = useCallback(() => {
    if (fetchInFlightRef.current) return fetchInFlightRef.current

    const request = (async () => {
      try {
        setIsLoading(true)
        let data
        data = await fetchJson(PRIMARY_API_URL)
        const rowsPayload = extractRowsPayload(data)
        const lists = extractRankingLists(data)
        const updated = looksLikeRawRows(rowsPayload)
          ? buildRankingsFromRows(rowsPayload)
          : (lists ? buildRankingsFromLists(lists) : buildRankingsFromRows(rowsPayload))
        if (isMountedRef.current) {
          setRankings(preserveWorldCupRanking(updated))
          hasLoadedRef.current = true
        }
        return true
      } catch (error) {
        console.error('Falha ao carregar ranking:', error)
        return false
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
        fetchInFlightRef.current = null
      }
    })()

    fetchInFlightRef.current = request
    return request
  }, [])

  useEffect(() => {
    // Carrega dados da API na primeira inicialização
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!showIntro) return undefined
    const timer = setTimeout(() => {
      setShowIntro(false)
      activeIndexRef.current = 0
      setActiveIndex(0)
      setCycleKey((prev) => prev + 1)
    }, 5000)

    return () => clearTimeout(timer)
  }, [showIntro])

  const current = rankings[activeIndex] || baseRankings[0]
  const todayKey = formatApiDateKey(now)

  useEffect(() => {
    const previousRankingId = previousRankingIdRef.current
    previousRankingIdRef.current = current.id

    if (current.id !== 'worldcup-games') {
      return undefined
    }

    if (previousRankingId === 'worldcup-games') {
      return undefined
    }

    setWorldCupGamesLoading(false)
    setWorldCupGamesReady(false)
    setWorldCupGamesError(false)
    setWorldCupStadiumsById({})
    setWorldCupStadiumsReady(false)
    setWorldCupStadiumsError(false)
  }, [current.id])

  useEffect(() => {
    if (current.id !== 'worldcup-games') return undefined

    let cancelled = false
    let requestInFlight = false

    const loadGames = async () => {
      if (requestInFlight) return
      requestInFlight = true
      setWorldCupGamesLoading(true)
      setWorldCupGamesError(false)

      try {
        const payload = await fetchJson(WORLD_CUP_GAMES_API_URL, {
          retries: WORLD_CUP_API_RETRY_COUNT,
          retryDelayMs: WORLD_CUP_API_RETRY_DELAY_MS,
        })
        if (cancelled || !isMountedRef.current) return

        const todayGames = filterTodayGames(payload, new Date())
        const gamesRanking = {
          ...baseRankings.find((ranking) => ranking.id === 'worldcup-games'),
          rows: todayGames,
        }

        setRankings((prev) => [...prev.filter((ranking) => ranking.id !== 'worldcup-games'), gamesRanking])
        setWorldCupGamesReady(true)
        setWorldCupGamesError(false)
      } catch (error) {
        if (cancelled || !isMountedRef.current) return
        console.error('Falha ao carregar jogos:', error)
        setWorldCupGamesReady(false)
        setWorldCupGamesError(true)
      } finally {
        requestInFlight = false
        if (!cancelled && isMountedRef.current) {
          setWorldCupGamesLoading(false)
        }
      }
    }

    loadGames()
    const interval = setInterval(loadGames, WORLD_CUP_GAMES_POLL_INTERVAL)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [current.id, todayKey])

  useEffect(() => {
    if (current.id !== 'worldcup-games' || worldCupStadiumsReady) return undefined

    let cancelled = false

    const loadStadiums = async () => {
      setWorldCupStadiumsError(false)

      try {
        const payload = await fetchJson(WORLD_CUP_STADIUMS_API_URL, {
          retries: WORLD_CUP_API_RETRY_COUNT,
          retryDelayMs: WORLD_CUP_API_RETRY_DELAY_MS,
        })
        if (cancelled || !isMountedRef.current) return

        const stadiums = Array.isArray(payload?.stadiums) ? payload.stadiums : []
        const nextMap = stadiums.reduce((acc, stadium) => {
          if (stadium?.id != null) {
            acc[String(stadium.id)] = stadium
          }
          return acc
        }, {})

        setWorldCupStadiumsById(nextMap)
        setWorldCupStadiumsReady(true)
      } catch (error) {
        if (!cancelled) {
          console.error('Falha ao carregar estádios:', error)
          setWorldCupStadiumsError(true)
        }
      }
    }

    loadStadiums()

    return () => {
      cancelled = true
    }
  }, [current.id, worldCupStadiumsReady])

  const hasData = rankings.some((item) => item.rows.length > 0)
  const canRotate = hasData && !isLoading && !isPaused && !showIntro && !showGoalModal && (current.id !== 'worldcup-games' || worldCupGamesReady)
  const totalValue = current.rows.reduce(
    (sum, row) => sum + (Number.isFinite(row.value) ? row.value : 0),
    0,
  )
  const safeTotalValue = Number.isFinite(totalValue) ? totalValue : 0
  const isBeforeStart = now.getHours() < 9
  const spotlightDuration = 5000

  const clearSpotlightTimer = useCallback(() => {
    if (spotlightTimerRef.current) {
      clearTimeout(spotlightTimerRef.current)
      spotlightTimerRef.current = null
    }
  }, [])

  const clearGoalModalTimer = useCallback(() => {
    if (goalModalTimerRef.current) {
      clearTimeout(goalModalTimerRef.current)
      goalModalTimerRef.current = null
    }
  }, [])

  const closeSpotlight = useCallback(() => {
    clearSpotlightTimer()
    setShowSpotlight(false)
    setSpotlightRow(null)
  }, [clearSpotlightTimer])

  const closeGoalModal = useCallback(() => {
    clearGoalModalTimer()
    setShowGoalModal(false)
    setGoalEvents([])
  }, [clearGoalModalTimer])

  const openSpotlightForRanking = useCallback((ranking) => {
    clearSpotlightTimer()

    if (!ranking?.rows?.length || ranking.id === 'supervisores' || ranking.id === 'gerentes' || ranking.id === 'worldcup-games') {
      closeSpotlight()
      return
    }

    const topRow = ranking.rows[0]
    setSpotlightRankingId(ranking.id)
    setSpotlightRow(topRow)
    setShowSpotlight(true)

    spotlightTimerRef.current = setTimeout(() => {
      setShowSpotlight(false)
      setSpotlightRow(null)
      spotlightTimerRef.current = null
    }, spotlightDuration)
  }, [clearSpotlightTimer, closeSpotlight, spotlightDuration])

  useEffect(() => {
    return () => {
      clearSpotlightTimer()
    }
  }, [clearSpotlightTimer])

  useEffect(() => {
    return () => {
      clearGoalModalTimer()
    }
  }, [clearGoalModalTimer])

  useEffect(() => {
    if (current.id !== 'worldcup-games' || !worldCupGamesReady || !current.rows.length) {
      closeGoalModal()
      lastGoalSignatureRef.current = ''
      return undefined
    }

    const liveGoalEvents = collectLiveGoalEvents(current.rows)
    const nextSignature = buildGoalEventsSignature(liveGoalEvents)

    if (!nextSignature) {
      closeGoalModal()
      lastGoalSignatureRef.current = ''
      return undefined
    }

    if (nextSignature === lastGoalSignatureRef.current) {
      return undefined
    }

    lastGoalSignatureRef.current = nextSignature
    clearGoalModalTimer()
    setGoalEvents(liveGoalEvents)
    setShowGoalModal(true)

    goalModalTimerRef.current = setTimeout(() => {
      setShowGoalModal(false)
      setGoalEvents([])
      goalModalTimerRef.current = null
    }, GOAL_MODAL_DURATION)

    return undefined
  }, [
    clearGoalModalTimer,
    closeGoalModal,
    current.id,
    current.rows,
    worldCupGamesReady,
  ])

  useEffect(() => {
    if (!showGoalModal || !goalEvents.length || prefersReducedMotion) return undefined

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })

      timeline
        .set('.goal-firework-spark', { autoAlpha: 0, x: 0, y: 0, scale: 0.4 })
        .fromTo(
          '.goal-callout',
          { autoAlpha: 0, y: 16, scale: 0.82 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: 'back.out(1.6)' },
          0.02,
        )
        .to(
          '.goal-firework-spark',
          { autoAlpha: 1, scale: 1, duration: 0.08, stagger: 0.012 },
          0.04,
        )
        .to(
          '.goal-firework-spark',
          {
            x: (_index, target) => {
              const angle = (Number(target.dataset.angle) * Math.PI) / 180
              return Math.cos(angle) * Number(target.dataset.distance)
            },
            y: (_index, target) => {
              const angle = (Number(target.dataset.angle) * Math.PI) / 180
              return Math.sin(angle) * Number(target.dataset.distance)
            },
            autoAlpha: 0,
            scale: 0,
            duration: 0.62,
            stagger: 0.012,
            ease: 'power2.out',
          },
          0.06,
        )
        .to(
          '.goal-callout',
          { autoAlpha: 0, y: -10, scale: 1.08, duration: 0.28, ease: 'power2.in' },
          0.82,
        )
        .fromTo(
          '.goal-modal-card',
          { autoAlpha: 0, y: 34, scale: 0.92, rotateX: 8, transformOrigin: '50% 55%' },
          { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, duration: 0.34 },
          0.12,
        )
        .fromTo(
          '.goal-modal-kicker, .goal-modal-card h2',
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.05 },
          '-=0.16',
        )
        .fromTo(
          '.goal-item',
          { autoAlpha: 0, y: 20, scale: 0.97 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, stagger: 0.07 },
          '-=0.1',
        )
        .fromTo(
          '.goal-minute',
          { scale: 0.65, rotate: -6 },
          { scale: 1, rotate: 0, duration: 0.32, stagger: 0.07, ease: 'back.out(1.8)' },
          '-=0.26',
        )
    }, goalModalShellRef)

    return () => ctx.revert()
  }, [goalEvents.length, prefersReducedMotion, showGoalModal])

  useEffect(() => {
    if (showIntro || isLoading || !hasData) {
      closeSpotlight()
      return undefined
    }

    if (showSpotlight || spotlightRankingId === current.id) {
      return undefined
    }

    openSpotlightForRanking(current)
  }, [
    clearSpotlightTimer,
    closeSpotlight,
    current,
    hasData,
    isLoading,
    openSpotlightForRanking,
    showIntro,
    showSpotlight,
    spotlightRankingId,
  ])

  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
  const renderRow = (row, index) => {
    const rowValue = Number.isFinite(row.value) ? row.value : 0
    const share = safeTotalValue > 0 ? Math.round((rowValue / safeTotalValue) * 100) : 0
    const trendText = `${share}%`
    const showAvatar = ['vendedores', 'portabilidade', 'novo', 'clt'].includes(current.id)
    const avatarInitial = row.name ? row.name.trim().charAt(0) : ''
    const trophyClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''

    return (
      <Motion.article
        key={`${current.id}-${row.name}`}
        className={`rank-row${trophyClass ? ' podium' : ''}${showAvatar ? ' with-avatar' : ''}`}
        style={{ '--delay': `${index * 80}ms` }}
        variants={prefersReducedMotion ? undefined : rowMotion}
        initial={prefersReducedMotion ? false : 'initial'}
        animate={prefersReducedMotion ? undefined : 'animate'}
        exit={prefersReducedMotion ? undefined : 'exit'}
        transition={{ duration: 0.34, ease: 'easeOut' }}
        whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.01, rotateX: 1.5, rotateY: -1 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.995 }}
      >
        <div className="rank-pos-wrap">
          <div className="rank-pos">{String(index + 1).padStart(2, '0')}</div>
          {trophyClass ? (
            <span className={`rank-trophy ${trophyClass}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                <path d="M7 2h10v2h3v3a5 5 0 0 1-5 5h-1.1A6 6 0 0 1 13 14.92V17h3v2H8v-2h3v-2.08A6 6 0 0 1 10.1 12H9a5 5 0 0 1-5-5V4h3V2zm0 4H6v1a3 3 0 0 0 3 3h.17A6 6 0 0 1 7 6zm11 0a6 6 0 0 1-2.17 4H15a3 3 0 0 0 3-3V6zm-9-2v2a4 4 0 1 0 8 0V4H9z" />
              </svg>
            </span>
          ) : null}
          {showAvatar ? (
            <div className="rank-avatar">
              {row.image ? (
                <img src={row.image} alt={row.name} loading="lazy" />
              ) : (
                <div className="rank-avatar-fallback">{avatarInitial}</div>
              )}
            </div>
          ) : null}
        </div>
        <div className="rank-main">
          <div className="rank-name">{row.name}</div>
          {row.meta ? <div className="rank-meta">{row.meta}</div> : null}
        </div>
        <div className="rank-metrics">
          <div className="rank-value">{currencyFormatter.format(rowValue)}</div>
          <div className="rank-trend up">{trendText}</div>
        </div>
      </Motion.article>
    )
  }

  const renderGameRow = (game, index) => {
    const homeTeamRaw = game?.home_team_name || game?.home_team_name_en || game?.home_team || 'Mandante'
    const awayTeamRaw = game?.away_team_name || game?.away_team_name_en || game?.away_team || 'Visitante'
    const homeTeam = resolveCountryDisplayName(homeTeamRaw)
    const awayTeam = resolveCountryDisplayName(awayTeamRaw)
    const homeScore = Number.isFinite(Number(game?.home_score)) ? Number(game.home_score) : 0
    const awayScore = Number.isFinite(Number(game?.away_score)) ? Number(game.away_score) : 0
    const stadium = worldCupStadiumsById[String(game?.stadium_id)] || null
    const stadiumName = stadium?.name_en || stadium?.fifa_name || 'Estádio não informado'
    const stadiumCity = stadium?.city_en ? ` • ${stadium.city_en}` : ''
    const sourceTimeZone = resolveStadiumTimeZone(stadium)
    const saoPauloTime = sourceTimeZone
      ? formatTimeInTimeZone(game?.local_date, sourceTimeZone)
      : formatGameClock(game?.local_date)
    const gameTime = saoPauloTime
    const homeFlagUrl = resolveWorldCupFlagUrl(game?.home_team_name_en || '')
    const awayFlagUrl = resolveWorldCupFlagUrl(game?.away_team_name_en || '')
    const statusLabel = formatGameStatus(game)
    const statusClass = statusLabel === 'Encerrado'
      ? 'is-finished'
      : statusLabel === 'Ao vivo'
        ? 'is-live'
        : 'is-scheduled'
    const renderFlag = (flagUrl, teamName) => (
      flagUrl ? (
        <img
          className="game-flag"
          aria-label={`Bandeira de ${teamName}`}
          src={flagUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : null
    )

    return (
      <Motion.article
        key={`${game?.id || game?._id || index}-${game?.local_date || index}`}
        className="game-row"
        style={{ '--delay': `${index * 80}ms` }}
        variants={prefersReducedMotion ? undefined : rowMotion}
        initial={prefersReducedMotion ? false : 'initial'}
        animate={prefersReducedMotion ? undefined : 'animate'}
        exit={prefersReducedMotion ? undefined : 'exit'}
        transition={{ duration: 0.34, ease: 'easeOut' }}
      >
        <div className="game-time">{gameTime}</div>
        <div className="game-side home">
          <span className="game-team">
            {renderFlag(homeFlagUrl, homeTeam)}
            <span>{homeTeam}</span>
          </span>
          <span className="game-goals">{homeScore}</span>
        </div>
        <div className="game-separator" aria-hidden="true">x</div>
        <div className="game-side away">
          <span className="game-goals">{awayScore}</span>
          <span className="game-team">
            <span>{awayTeam}</span>
            {renderFlag(awayFlagUrl, awayTeam)}
          </span>
        </div>
        <div className="game-details">
          <span className="game-stadium">{stadiumName}{stadiumCity}</span>
        </div>
        <div className={`game-status ${statusClass}`}>
          {statusLabel}
        </div>
      </Motion.article>
    )
  }

  useEffect(() => {
    if (!hasData || showIntro || isPaused || showSpotlight || showGoalModal) {
      return undefined
    }

    const timer = setTimeout(() => {
      const nextIndex = (activeIndexRef.current + 1) % rankings.length
      const nextRanking = rankings[nextIndex] || baseRankings[nextIndex] || baseRankings[0]
      activeIndexRef.current = nextIndex
      setActiveIndex(nextIndex)
      setCycleKey((prev) => prev + 1)
      openSpotlightForRanking(nextRanking)

      if (nextIndex === 0) {
        // Completou uma volta: reinicia a intro e atualiza os dados
        setShowIntro(true)
        fetchData()
      }
    }, ROTATION_INTERVAL)

    return () => clearTimeout(timer)
  }, [activeIndex, fetchData, hasData, isPaused, openSpotlightForRanking, rankings, showGoalModal, showIntro, showSpotlight])

  useEffect(() => {
    if (hasData) {
      if (hasTimeout) setHasTimeout(false)
      return undefined
    }

    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setHasTimeout(true)
      }
    }, 5 * 60 * 1000)

    return () => clearTimeout(timer)
  }, [hasData, hasTimeout])

  const handleNext = () => {
    if (!hasData) return
    const next = (activeIndexRef.current + 1) % rankings.length
    const nextRanking = rankings[next] || baseRankings[next] || baseRankings[0]
    activeIndexRef.current = next
    setActiveIndex(next)
    setCycleKey((prev) => prev + 1)
    openSpotlightForRanking(nextRanking)
  }

  const handlePrev = () => {
    if (!hasData) return
    const next = (activeIndexRef.current - 1 + rankings.length) % rankings.length
    const nextRanking = rankings[next] || baseRankings[next] || baseRankings[0]
    activeIndexRef.current = next
    setActiveIndex(next)
    setCycleKey((prev) => prev + 1)
    openSpotlightForRanking(nextRanking)
  }

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev)
  }

  useEffect(() => {
    if (!showSpotlight && !showGoalModal) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeSpotlight()
        closeGoalModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeGoalModal, closeSpotlight, showGoalModal, showSpotlight])

  return (
    <div className="app">
      <main className="board">
        <AnimatePresence mode="wait">
        {showIntro ? (
          <Motion.section
            key="intro"
            className="rank-card intro-screen has-gradient"
            variants={prefersReducedMotion ? undefined : pageMotion}
            initial={prefersReducedMotion ? false : 'initial'}
            animate={prefersReducedMotion ? undefined : 'animate'}
            exit={prefersReducedMotion ? undefined : 'exit'}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <Motion.div
              className="intro-content"
              variants={prefersReducedMotion ? undefined : introContentMotion}
              initial={prefersReducedMotion ? false : 'initial'}
              animate={prefersReducedMotion ? undefined : 'animate'}
              exit={prefersReducedMotion ? undefined : 'exit'}
            >
              <Motion.p className="intro-title" variants={prefersReducedMotion ? undefined : introItemMotion}>Ranking Formalizado Grupo Vieira</Motion.p>
              <Motion.div className="intro-logo" variants={prefersReducedMotion ? undefined : introItemMotion}>
                <img src="/logo-vieira-copa.png" alt="VieiraCred" />
              </Motion.div>
              <Motion.p className="intro-subtitle" variants={prefersReducedMotion ? undefined : introItemMotion}>Temporada Copa do Mundo. Preparando os rankings...</Motion.p>
            </Motion.div>
          </Motion.section>
        ) : (
        <Motion.section
          key={current.id}
          className="rank-card has-gradient"
          variants={prefersReducedMotion ? undefined : pageMotion}
          initial={prefersReducedMotion ? false : 'initial'}
          animate={prefersReducedMotion ? undefined : 'animate'}
          exit={prefersReducedMotion ? undefined : 'exit'}
          transition={{ duration: 0.42, ease: 'easeOut' }}
        >
          <div className="rank-head">
            <div>
              <p className="eyebrow">{current.kicker}</p>
              <h1>{current.title}</h1>
            </div>
            <div className="rank-status">
              <div className="status-pills" aria-label="Contexto visual do tema">
                <span className="status-pill status-pill-active">{current.id === 'worldcup-games' ? 'Ao vivo' : 'Copa do Mundo'}</span>
                <span className="status-pill">VieiraCred</span>
              </div>
              <img className="brand-logo" src="/logo-vieira-copa.png" alt="VieiraCred" />
            </div>
          </div>

          <Motion.div
            className={`rank-grid${['vendedores', 'portabilidade', 'novo', 'clt', 'gerentes'].includes(current.id) ? ' vendors-grid' : ''}${current.id === 'worldcup-games' ? ' games-grid' : ''}`}
            variants={prefersReducedMotion ? undefined : gridMotion}
            initial={prefersReducedMotion ? false : 'initial'}
            animate={prefersReducedMotion ? undefined : 'animate'}
          >
            {current.id === 'worldcup-games' ? (
              current.rows.length === 0 ? (
                <div className="empty-state">
                  {worldCupGamesLoading || (!worldCupGamesReady && !worldCupGamesError)
                    ? 'Carregando os jogos de hoje...'
                    : worldCupGamesError
                      ? 'Não foi possível carregar os jogos da API worldcup26.ir.'
                      : 'Nenhum jogo de hoje foi encontrado.'}
                </div>
              ) : (
                <div className="games-table">
                  <div className="games-table-body">
                    {current.rows.map((game, index) => renderGameRow(game, index))}
                  </div>
                </div>
              )
            ) : current.rows.length === 0 ? (
              <div className="empty-state">
                {isBeforeStart
                  ? 'Estamos aguardando as primeiras vendas do dia. Bora movimentar o ranking!'
                  : hasTimeout
                    ? 'Não foi possível carregar os dados. Verifique a API/Backend ou acione o time de planejamento.'
                    : 'Aguardando dados da API...'}
              </div>
            ) : (
              current.rows.map((row, index) => renderRow(row, index))
            )}
          </Motion.div>

          <div className="rank-footer">
            <div className="progress">
              {canRotate ? (
                <div
                  key={cycleKey}
                  className="progress-bar"
                  style={{ '--rotation-duration': `${ROTATION_INTERVAL}ms` }}
                />
              ) : (
                <div className="progress-bar paused" />
              )}
            </div>
            <div className="footer-row">
              <p className="footnote accent">
                {current.id === 'worldcup-games'
                  ? `Fonte: worldcup26.ir/get/games + worldcup26.ir/get/stadiums${worldCupStadiumsError ? ' | alguns estádios podem não carregar' : ''}`
                  : 'Filtro utilizado no New Corban: Formalizado => Hoje; Pequenas diferenças podem ocorrer devido ao atraso da API.'}
              </p>
              {!showIntro ? (
                <div className="nav-controls" aria-label="Controles do ranking">
                  <Motion.button
                    type="button"
                    className="nav-btn"
                    onClick={handlePrev}
                    aria-label="Voltar ranking"
                    whileHover={prefersReducedMotion ? undefined : { y: -1, scale: 1.06 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                  >
                    <ControlIcon type="prev" />
                  </Motion.button>
                  <Motion.button
                    type="button"
                    className="nav-btn"
                    onClick={handleTogglePause}
                    aria-label="Pausar ou continuar"
                    whileHover={prefersReducedMotion ? undefined : { y: -1, scale: 1.06, rotateZ: 4 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                  >
                    <ControlIcon type={isPaused ? 'play' : 'pause'} />
                  </Motion.button>
                  <Motion.button
                    type="button"
                    className="nav-btn"
                    onClick={handleNext}
                    aria-label="Próximo ranking"
                    whileHover={prefersReducedMotion ? undefined : { y: -1, scale: 1.06, rotateX: -2 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                  >
                    <ControlIcon type="next" />
                  </Motion.button>
                </div>
              ) : null}
            </div>
          </div>
        </Motion.section>
        )}
        </AnimatePresence>

        <AnimatePresence>
          {showSpotlight && spotlightRow ? (
            <Motion.section
              key={`spotlight-${spotlightRankingId}`}
              className="spotlight-overlay"
              role="dialog"
              aria-modal="true"
              aria-label={`Destaque do ranking ${SPOTLIGHT_LABELS[spotlightRankingId] || 'Grupo Vieira'}`}
              variants={prefersReducedMotion ? undefined : {
                initial: { opacity: 0 },
                animate: {
                  opacity: 1,
                  transition: { duration: 0.18, ease: 'easeOut' },
                },
                exit: {
                  opacity: 0,
                  transition: { duration: 0.14, ease: 'easeIn' },
                },
              }}
              initial={prefersReducedMotion ? false : 'initial'}
              animate={prefersReducedMotion ? undefined : 'animate'}
              exit={prefersReducedMotion ? undefined : 'exit'}
            >
              <Motion.div
                className="spotlight-shell"
                variants={prefersReducedMotion ? undefined : {
                  initial: { opacity: 0, y: 22, scale: 0.985 },
                  animate: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.28, ease: 'easeOut' },
                  },
                  exit: {
                    opacity: 0,
                    y: 10,
                    scale: 0.99,
                    transition: { duration: 0.16, ease: 'easeIn' },
                  },
                }}
                initial={prefersReducedMotion ? false : 'initial'}
                animate={prefersReducedMotion ? undefined : 'animate'}
                exit={prefersReducedMotion ? undefined : 'exit'}
              >
                <div className="spotlight-poster">
                  <div className="spotlight-poster-art" aria-hidden="true" />

                  <div className="spotlight-player-slot" aria-hidden="true">
                    {spotlightRow.image ? (
                      <img src={spotlightRow.image} alt="" loading="eager" />
                    ) : (
                      <div className="spotlight-player-fallback">
                        {spotlightRow.name ? spotlightRow.name.trim().charAt(0) : '1'}
                      </div>
                    )}
                  </div>

                  <div className="spotlight-winner-card">
                    <div className="spotlight-winner-copy">
                      <p className="spotlight-kicker">1º lugar</p>
                      <h2>{spotlightRow.name}</h2>
                      {spotlightRow.meta ? <p className="spotlight-meta">{spotlightRow.meta}</p> : null}
                      <strong>{currencyFormatter.format(Number.isFinite(spotlightRow.value) ? spotlightRow.value : 0)}</strong>
                    </div>
                  </div>

                </div>
              </Motion.div>
            </Motion.section>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {showGoalModal && goalEvents.length ? (
            <Motion.section
              key="goal-modal"
              className="spotlight-overlay goal-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="Gols ao vivo"
              variants={prefersReducedMotion ? undefined : {
                initial: { opacity: 0 },
                animate: {
                  opacity: 1,
                  transition: { duration: 0.18, ease: 'easeOut' },
                },
                exit: {
                  opacity: 0,
                  transition: { duration: 0.14, ease: 'easeIn' },
                },
              }}
              initial={prefersReducedMotion ? false : 'initial'}
              animate={prefersReducedMotion ? undefined : 'animate'}
              exit={prefersReducedMotion ? undefined : 'exit'}
            >
              <div className="goal-fireworks" aria-hidden="true">
                <div className="goal-callout">GOOOL!</div>
                {GOAL_FIREWORK_PARTICLES.map((particle) => (
                  <span
                    className="goal-firework-spark"
                    data-angle={particle.angle}
                    data-distance={particle.distance}
                    key={particle.id}
                  />
                ))}
              </div>
              <Motion.div
                ref={goalModalShellRef}
                className="goal-modal-shell"
                variants={prefersReducedMotion ? undefined : {
                  initial: { opacity: 0, y: 18, scale: 0.985 },
                  animate: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.26, ease: 'easeOut' },
                  },
                  exit: {
                    opacity: 0,
                    y: 10,
                    scale: 0.99,
                    transition: { duration: 0.16, ease: 'easeIn' },
                  },
                }}
                initial={prefersReducedMotion ? false : 'initial'}
                animate={prefersReducedMotion ? undefined : 'animate'}
                exit={prefersReducedMotion ? undefined : 'exit'}
              >
                <div className="goal-modal-card">
                  <p className="goal-modal-kicker">Gol ao vivo</p>
                  <h2>Atualização do placar</h2>
                  <div className="goal-list">
                    {goalEvents.map((goal) => (
                      <article className="goal-item" key={goal.id}>
                        <span className="goal-minute">{goal.minuteLabel || 'Gol'}</span>
                        <div className="goal-copy">
                          <strong>{goal.player}</strong>
                          <span>{goal.teamName}</span>
                          <small>{goal.matchLabel}</small>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </Motion.div>
            </Motion.section>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App



