import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion'
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
const UPDATE_METRICS_API_URL = '/api/update-metrics'
const ROTATION_INTERVAL = 30000
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
function buildRequestUrl(baseUrl) {
  if (!baseUrl) return ''
  const joiner = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${joiner}t=${Date.now()}`
}

const UPDATE_METRICS_TIMEOUT_MS = 7000
const UPDATE_METRICS_CACHE_KEY = 'rankinggrupovieira:update-metrics-cache'
const DEFAULT_UPDATE_METRICS = { averageLabel: '00:00', isReady: false }

async function fetchJson(baseUrl) {
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

function withTimeout(promise, timeoutMs) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch(() => {
        clearTimeout(timer)
        resolve(null)
      })
  })
}

function loadCachedUpdateMetrics() {
  if (typeof window === 'undefined') {
    return DEFAULT_UPDATE_METRICS
  }

  try {
    const raw = window.localStorage.getItem(UPDATE_METRICS_CACHE_KEY)
    if (!raw) return DEFAULT_UPDATE_METRICS
    const parsed = JSON.parse(raw)
    const averageLabel = normalizeMeta(parsed?.averageLabel)
    if (!isRealUpdateMetricLabel(averageLabel)) {
      return DEFAULT_UPDATE_METRICS
    }
    return { averageLabel, isReady: true }
  } catch {
    return DEFAULT_UPDATE_METRICS
  }
}

function saveCachedUpdateMetrics(metrics) {
  if (typeof window === 'undefined') return
  if (!metrics?.isReady || !isRealUpdateMetricLabel(metrics.averageLabel)) return
  try {
    window.localStorage.setItem(UPDATE_METRICS_CACHE_KEY, JSON.stringify(metrics))
  } catch {
    // Ignore storage errors.
  }
}

function clearCachedUpdateMetrics() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(UPDATE_METRICS_CACHE_KEY)
  } catch {
    // Ignore storage errors.
  }
}

function normalizeMeta(value) {
  if (!value) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function isRealUpdateMetricLabel(value) {
  const normalized = normalizeMeta(value)
  return Boolean(
    normalized
      && normalized !== '00:00'
      && normalized !== '00:00:00'
      && normalized !== '--:--',
  )
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

function findDeepFieldValue(payload, keys, seen = new Set()) {
  if (!payload || typeof payload !== 'object' || seen.has(payload)) return ''
  seen.add(payload)

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = findDeepFieldValue(item, keys, seen)
      if (found) return found
    }
    return ''
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key) && hasRowValue(payload[key])) {
      return payload[key]
    }
  }

  for (const value of Object.values(payload)) {
    const found = findDeepFieldValue(value, keys, seen)
    if (found) return found
  }

  return ''
}

function extractUpdateMetrics(payload) {
  const cycleDurationFromMs = formatDurationFromMs(
    payload?.averageCycleDurationMs ?? payload?.lastCycleDurationMs,
  )
  const averageLabel = normalizeMeta(
    payload?.combined?.avg_of_averages_fmt
    || findDeepFieldValue(payload, ['avg_of_averages_fmt', 'avgOfAveragesFmt', 'media_total_fmt'])
    || payload?.averageCycleDuration
    || payload?.lastCycleDuration
    || cycleDurationFromMs,
  )

  if (!isRealUpdateMetricLabel(averageLabel)) {
    return DEFAULT_UPDATE_METRICS
  }

  return { averageLabel, isReady: true }
}

function formatDurationFromMs(value) {
  const ms = Number(value)
  if (!Number.isFinite(ms) || ms <= 0) return ''
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
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

function getFutPosition(rankingId) {
  if (rankingId === 'vendedores') return 'VND'
  if (rankingId === 'portabilidade') return 'PRT'
  if (rankingId === 'novo') return 'NV'
  if (rankingId === 'clt') return 'CLT'
  if (rankingId === 'supervisores') return 'SUP'
  if (rankingId === 'gerentes') return 'GER'
  return 'VND'
}

function formatFutValue(value) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return '0'
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace('.0', '')}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace('.0', '')}K`
  }
  return String(num)
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
  const [, setUpdateMetrics] = useState(() => loadCachedUpdateMetrics())
  const isMountedRef = useRef(true)
  const hasLoadedRef = useRef(false)
  const fetchInFlightRef = useRef(null)
  const activeIndexRef = useRef(0)
  const spotlightTimerRef = useRef(null)
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [spotlightRankingId, setSpotlightRankingId] = useState('')
  const [spotlightRow, setSpotlightRow] = useState(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

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
        const metricsPromise = withTimeout(
          fetchJson(UPDATE_METRICS_API_URL),
          UPDATE_METRICS_TIMEOUT_MS,
        )
        data = await fetchJson(PRIMARY_API_URL)
        const rowsPayload = extractRowsPayload(data)
        const lists = extractRankingLists(data)
        const updated = looksLikeRawRows(rowsPayload)
          ? buildRankingsFromRows(rowsPayload)
          : (lists ? buildRankingsFromLists(lists) : buildRankingsFromRows(rowsPayload))
        if (isMountedRef.current) {
          setRankings(updated)
          hasLoadedRef.current = true
        }
        const metricsData = await metricsPromise
        if (isMountedRef.current) {
          const nextMetrics = extractUpdateMetrics(metricsData || data)
          setUpdateMetrics(() => {
            if (nextMetrics.isReady) {
              saveCachedUpdateMetrics(nextMetrics)
            } else {
              clearCachedUpdateMetrics()
            }
            return nextMetrics
          })
          return nextMetrics.isReady
        }
        return false
      } catch (error) {
        console.error('Falha ao carregar ranking:', error)
        if (isMountedRef.current) {
          clearCachedUpdateMetrics()
          setUpdateMetrics(DEFAULT_UPDATE_METRICS)
        }
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
  const hasData = rankings.some((item) => item.rows.length > 0)
  const canRotate = hasData && !isLoading && !isPaused && !showIntro
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

  const closeSpotlight = useCallback(() => {
    clearSpotlightTimer()
    setShowSpotlight(false)
    setSpotlightRow(null)
  }, [clearSpotlightTimer])

  const openSpotlightForRanking = useCallback((ranking) => {
    clearSpotlightTimer()

    if (!ranking?.rows?.length || ranking.id === 'supervisores' || ranking.id === 'gerentes') {
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

  useEffect(() => {
    if (!hasData || showIntro || isPaused || showSpotlight) {
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
  }, [activeIndex, fetchData, hasData, isPaused, openSpotlightForRanking, rankings, showIntro, showSpotlight])

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
    if (!showSpotlight) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeSpotlight()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeSpotlight, showSpotlight])

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
                <span className="status-pill status-pill-active">Copa do Mundo</span>
                <span className="status-pill">VieiraCred</span>
              </div>
              <img className="brand-logo" src="/logo-vieira-copa.png" alt="VieiraCred" />
            </div>
          </div>

          <Motion.div
            className={`rank-grid${['vendedores', 'portabilidade', 'novo', 'clt', 'gerentes'].includes(current.id) ? ' vendors-grid' : ''}`}
            variants={prefersReducedMotion ? undefined : gridMotion}
            initial={prefersReducedMotion ? false : 'initial'}
            animate={prefersReducedMotion ? undefined : 'animate'}
          >
            {current.rows.length === 0 ? (
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
              <p className="footnote accent">Filtro utilizado no New Corban: <strong>Formalizado =&gt; Hoje</strong>; Pequenas diferenças podem ocorrer devido ao atraso da API.</p>
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
      </main>
    </div>
  )
}

export default App



