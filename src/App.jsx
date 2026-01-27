import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const baseRankings = [
  {
    id: 'vendedores',
    kicker: 'Vendas',
    title: 'Ranking TOP 10 Vendedores',
    subtitle: 'Hoje',
    description: 'Resultado do dia atual.',
    limit: 10,
    rows: [],
  },
  {
    id: 'supervisores',
    kicker: 'Operacao',
    title: 'Ranking TOP 5 Supervisores',
    subtitle: 'Hoje',
    description: 'Resultado do dia atual.',
    limit: 5,
    rows: [],
  },
  {
    id: 'gerentes',
    kicker: 'Gestao',
    title: 'Ranking Gerentes',
    subtitle: 'Hoje',
    description: 'Resultado do dia atual.',
    limit: 5,
    rows: [],
  },
]

const ENV_API_URL = buildApiUrl(import.meta.env.VITE_API_URL)
const PRIMARY_API_URL = '/api/ranking'
const ROTATION_INTERVAL = 30000
const RETRY_INTERVAL_NO_DATA = 5000

function buildApiUrl(raw) {
  if (!raw) return ''
  const trimmed = String(raw).trim()
  if (!trimmed) return ''
  if (/\/api\/ranking$/i.test(trimmed)) return trimmed
  if (trimmed.includes('/api/')) return trimmed
  const normalized = trimmed.replace(/\/+$/, '')
  return `${normalized}/api/ranking`
}

function buildRequestUrl(baseUrl) {
  if (!baseUrl) return ''
  const joiner = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${joiner}t=${Date.now()}`
}

const FALLBACK_API_URL = ENV_API_URL && ENV_API_URL !== PRIMARY_API_URL
  ? ENV_API_URL
  : ''

async function fetchJson(baseUrl) {
  const requestUrl = buildRequestUrl(baseUrl)
  if (!requestUrl) {
    throw new Error('URL da API nao definida')
  }
  const response = await fetch(requestUrl, { cache: 'no-store' })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Erro ao buscar ranking: ${response.status}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Resposta da API nao e JSON valido')
  }
}

function normalizeMeta(value) {
  if (!value) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function formatName(value) {
  const normalized = normalizeMeta(value)
  return normalized ? normalized.toUpperCase() : ''
}

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

function rowHasKey(row, key) {
  return Boolean(row && typeof row === 'object' && Object.prototype.hasOwnProperty.call(row, key) && hasRowValue(row[key]))
}

function buildGroups(rows, groupKey, metaKey, options = {}) {
  const {
    multiLabel = 'VARIOS',
    metaFormatter,
    nameFormatter,
    valueKey = 'soma_valor_referencia',
  } = options
  const map = new Map()

  rows.forEach((row) => {
    const rawName = row?.[groupKey]
    if (!rawName) return
    const displayName = nameFormatter ? nameFormatter(rawName) : rawName
    const rawMeta = row?.[metaKey]
    const metaValue = metaFormatter ? metaFormatter(rawMeta) : normalizeMeta(rawMeta)
    const value = parseNumericValue(row?.[valueKey])

    if (!map.has(rawName)) {
      map.set(rawName, {
        name: displayName,
        meta: metaValue,
        value,
        count: 1,
      })
      return
    }

    const current = map.get(rawName)
    current.value += value
    current.count += 1
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

function assembleRankings({ vendedores, supervisores, gerentes }) {
  const addBadge = (list) =>
    list.map((item, index) => ({
      ...item,
      badge: index === 0 ? 'Melhor resultado do dia' : undefined,
    }))

  return [
    {
      ...baseRankings[0],
      rows: addBadge(vendedores.slice(0, baseRankings[0].limit)),
    },
    {
      ...baseRankings[1],
      rows: addBadge(supervisores.slice(0, baseRankings[1].limit)),
    },
    {
      ...baseRankings[2],
      rows: addBadge(gerentes.slice(0, baseRankings[2].limit)),
    },
  ]
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
  ]) || 'franquia_nome'
  const valueKey = resolveRowKey(safeRows, [
    'valor_referencia',
    'soma_valor_referencia',
    'valor',
    'total',
    'valor_total',
  ]) || 'soma_valor_referencia'

  const vendedores = buildGroups(safeRows, vendorKey, equipeKey, {
    multiLabel: 'VARIAS EQUIPES',
    nameFormatter: formatVendorNameWithCompany,
    metaFormatter: formatName,
    valueKey,
  })
  const supervisores = buildGroups(safeRows, equipeKey, franquiaKey, {
    multiLabel: 'VARIAS FRANQUIAS',
    nameFormatter: formatName,
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

  return assembleRankings({ vendedores, supervisores, gerentes })
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
      return { name, meta, value }
    }).filter(Boolean)

    return rows.sort((a, b) => b.value - a.value)
  }

  const vendedores = makeRows(lists.vendedores, {
    nameKey: 'vendedor_nome',
    metaKey: 'equipe_nome',
    valueKey: 'valor_referencia',
    nameFormatter: formatVendorNameWithCompany,
  })
  const supervisores = makeRows(lists.equipes, {
    nameKey: 'equipe_nome',
    metaKey: 'franquia_nome',
    valueKey: 'valor_referencia',
  })
  const gerentes = makeRows(lists.franquias, {
    nameKey: 'franquia_nome',
    valueKey: 'valor_referencia',
    count: true,
  })

  return assembleRankings({ vendedores, supervisores, gerentes })
}

function App() {
  const [rankings, setRankings] = useState(baseRankings)
  const [activeIndex, setActiveIndex] = useState(0)
  const [cycleKey, setCycleKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasTimeout, setHasTimeout] = useState(false)
  const isMountedRef = useRef(true)
  const hasLoadedRef = useRef(false)
  const fetchInFlightRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (fetchInFlightRef.current) return
    fetchInFlightRef.current = true
    try {
      setIsLoading(true)
      let data
      try {
        data = await fetchJson(PRIMARY_API_URL)
      } catch (error) {
        if (FALLBACK_API_URL && FALLBACK_API_URL !== PRIMARY_API_URL) {
          data = await fetchJson(FALLBACK_API_URL)
        } else {
          throw error
        }
      }
      const rowsPayload = extractRowsPayload(data)
      const lists = extractRankingLists(data)
      const updated = looksLikeRawRows(rowsPayload)
        ? buildRankingsFromRows(rowsPayload)
        : (lists ? buildRankingsFromLists(lists) : buildRankingsFromRows(rowsPayload))
      if (isMountedRef.current) {
        setRankings(updated)
        hasLoadedRef.current = true
      }
    } catch (error) {
      console.error('Falha ao carregar ranking:', error)
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
      fetchInFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const current = rankings[activeIndex] || baseRankings[0]
  const hasData = rankings.some((item) => item.rows.length > 0)
  const canRotate = hasData && !isLoading
  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })

  useEffect(() => {
    if (isLoading || !hasData) {
      return undefined
    }

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % rankings.length
        if (next === 0 && hasLoadedRef.current) {
          fetchData()
        }
        return next
      })
      setCycleKey((prev) => prev + 1)
    }, ROTATION_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchData, hasData, isLoading, rankings.length])

  useEffect(() => {
    if (hasData) {
      return undefined
    }

    const interval = setInterval(() => {
      fetchData()
    }, RETRY_INTERVAL_NO_DATA)

    return () => clearInterval(interval)
  }, [fetchData, hasData])

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

  return (
    <div className="app">
      <main className="board">
        <section key={current.id} className="rank-card">
          <div className="rank-head">
            <div>
              <p className="eyebrow">{current.kicker}</p>
              <h1>{current.title}</h1>
            </div>
            <div className="rank-status">
              <img className="brand-logo" src="/logo-vieira.webp" alt="VieiraCred" />
            </div>
          </div>

          <div className={`rank-grid${current.id === 'vendedores' ? ' vendors-grid' : ''}`}>
            {current.rows.length === 0 ? (
              <div className="empty-state">
                {hasTimeout
                  ? 'Nao foi possivel carregar os dados. Verifique a API/Backend ou acione o time de planejamento.'
                  : 'Aguardando dados da API...'}
              </div>
            ) : (
              current.rows.map((row, index) => {
                const next = current.rows[index + 1]
                const trendValue = next ? ((row.value - next.value) / next.value) * 100 : null
                const trendText =
                  trendValue === null
                    ? null
                    : `${trendValue >= 0 ? '+' : ''}${Math.round(trendValue)}%`
                const trendClass = trendValue !== null && trendValue < 0 ? 'down' : 'up'
                const isPodium = index < 3
                const isLeader = index === 0
                return (
                  <article
                    key={`${current.id}-${row.name}`}
                    className={`rank-row${isPodium ? ' podium' : ''}${isLeader ? ' leader' : ''}`}
                    style={{ '--delay': `${index * 80}ms` }}
                  >
                    <div className="rank-pos">{String(index + 1).padStart(2, '0')}</div>
                    <div className="rank-main">
                      <div className="rank-name">{row.name}</div>
                      {row.meta ? <div className="rank-meta">{row.meta}</div> : null}
                    </div>
                    <div className="rank-metrics">
                      <div className="rank-value">{currencyFormatter.format(row.value)}</div>
                      {trendText ? (
                        <div className={`rank-trend ${trendClass}`}>{trendText}</div>
                      ) : null}
                    </div>
                    {row.badge ? <div className="rank-badge">{row.badge}</div> : null}
                  </article>
                )
              })
            )}
          </div>

          <div className="rank-footer">
            <div className="progress">
              {canRotate ? (
                <div key={cycleKey} className="progress-bar" />
              ) : (
                <div className="progress-bar paused" />
              )}
            </div>
            <p className="footnote">
              Dados atualizados automaticamente via API.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
