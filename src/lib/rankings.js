import {
  PORTABILIDADE_PRODUCTS,
  NOVO_PRODUCTS,
  CLT_PRODUCTS,
} from './constants.js'
import {
  normalizeMeta,
  formatName,
  normalizeKey,
  formatVendorNameWithCompany,
  formatVendorNameOnly,
  formatAfterColon,
  formatCountLabel,
  parseNumericValue,
  hasRowValue,
  rowHasKey,
  resolveImageValue,
} from './formatters.js'

export const baseRankings = [
  { id: 'vendedores', kicker: 'VENDAS', title: 'Ranking TOP 10 Vendedor', subtitle: 'Hoje', description: 'Resultado do dia atual.', limit: 10, rows: [] },
  { id: 'supervisores', kicker: 'OPERACAO', title: 'Ranking TOP 5 Supervisor', subtitle: 'Hoje', description: 'Resultado do dia atual.', limit: 5, rows: [] },
  { id: 'gerentes', kicker: 'GESTAO', title: 'Ranking Grupo', subtitle: 'Hoje', description: 'Resultado do dia atual.', limit: null, rows: [] },
  { id: 'portabilidade', kicker: 'VENDAS', title: 'Ranking TOP 10 Portabilidade', subtitle: 'Hoje', description: 'Resultado do dia atual.', limit: 10, rows: [] },
  { id: 'novo', kicker: 'VENDAS', title: 'Ranking TOP 10 Novo', subtitle: 'Hoje', description: 'Resultado do dia atual.', limit: 10, rows: [] },
  { id: 'clt', kicker: 'VENDAS', title: 'Ranking TOP 10 CLT', subtitle: 'Hoje', description: 'Resultado do dia atual.', limit: 10, rows: [] },
  { id: 'worldcup-games', kicker: 'MUNDIAL', title: 'Jogos de Hoje - Ao Vivo', subtitle: 'Hoje', description: 'Tabela dos jogos e placares do dia.', limit: null, rows: [] },
  { id: 'europa5', kicker: 'PLATAFORMA', title: 'Nova Europa 5', subtitle: 'Consultas', description: 'Consultas inteligentes em 4 bases.', limit: null, rows: [] },
]

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
      map.set(rawName, { name: displayName, meta: metaValue, value, count: 1, image: imageValue })
      return
    }

    const current = map.get(rawName)
    current.value += value
    current.count += 1
    if (!current.image && imageValue) current.image = imageValue
    if (metaValue) {
      if (!current.meta) current.meta = metaValue
      else if (current.meta !== metaValue) current.meta = multiLabel
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

export function collectArrays(payload, bucket = []) {
  if (Array.isArray(payload)) { bucket.push(payload); return bucket }
  if (!payload || typeof payload !== 'object') return bucket
  Object.values(payload).forEach((value) => collectArrays(value, bucket))
  return bucket
}

export function extractRowsPayload(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (typeof payload === 'string') {
    try { return extractRowsPayload(JSON.parse(payload)) } catch { return [] }
  }
  if (payload && typeof payload === 'object') {
    const values = Object.values(payload)
    if (values.length && values.every((v) => v && typeof v === 'object')) return values
  }
  const candidates = [payload.rows, payload.data, payload.result, payload.items, payload.payload]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
    if (candidate && typeof candidate === 'object') {
      const values = Object.values(candidate)
      if (values.length && values.every((v) => v && typeof v === 'object')) return values
    }
  }
  const nested = collectArrays(payload)
  if (nested.length) return nested[0]
  return []
}

export function looksLikeRawRows(rows) {
  return Array.isArray(rows)
    && rows.some((row) => rowHasKey(row, 'vendedor_nome') && rowHasKey(row, 'equipe_nome') && rowHasKey(row, 'franquia_nome'))
}

export function extractRankingLists(payload) {
  if (!payload || typeof payload !== 'object') return null
  const arrays = collectArrays(payload)
  if (!arrays.length) return null
  if (arrays.some((arr) => looksLikeRawRows(arr))) return null

  const vendedores = arrays.find((arr) => arr.some((row) => rowHasKey(row, 'vendedor_nome')))
  const equipes = arrays.find((arr) =>
    arr.some((row) => rowHasKey(row, 'equipe_nome') && rowHasKey(row, 'franquia_nome') && !rowHasKey(row, 'vendedor_nome')),
  )
  const franquias = arrays.find((arr) =>
    arr.some((row) =>
      rowHasKey(row, 'franquia_nome')
      && (rowHasKey(row, 'qtde_vendedor_nome') || rowHasKey(row, 'qtde_vendedor') || rowHasKey(row, 'qtde_propostas') || rowHasKey(row, 'qtde_proposta') || rowHasKey(row, 'quantidade_propostas') || rowHasKey(row, 'propostas')),
    ),
  ) || arrays.find((arr) =>
    arr.some((row) => rowHasKey(row, 'franquia_nome') && !rowHasKey(row, 'equipe_nome') && !rowHasKey(row, 'vendedor_nome')),
  )

  if (!vendedores && !equipes && !franquias) return null
  return { vendedores, equipes, franquias }
}

function assembleRankings(rowsById) {
  return baseRankings.map((ranking) => {
    const sourceRows = rowsById?.[ranking.id] || []
    const rows = Number.isFinite(ranking.limit) ? sourceRows.slice(0, ranking.limit) : sourceRows
    return { ...ranking, rows }
  })
}

export function preserveWorldCupRanking(rankings) {
  const next = Array.isArray(rankings) ? rankings.filter(Boolean) : []
  if (next.find((r) => r.id === 'worldcup-games')) return next
  const base = baseRankings.find((r) => r.id === 'worldcup-games')
  return base ? [...next, { ...base }] : next
}

export function buildRankingsFromRows(rows) {
  const safeRows = Array.isArray(rows) ? rows : []
  const vendorKey = resolveRowKey(safeRows, ['vendedor_nome', 'vendedor', 'nome_vendedor', 'vendedorName', 'nome']) || 'vendedor_nome'
  const equipeKey = resolveRowKey(safeRows, ['equipe_nome', 'equipe', 'nome_equipe']) || 'equipe_nome'
  const franquiaKey = resolveRowKey(safeRows, ['franquia_nome', 'franquia', 'nome_franquia', 'equipe_nome', 'equipe']) || 'franquia_nome'
  const valueKey = resolveRowKey(safeRows, ['valor_referencia', 'soma_valor_referencia', 'valor', 'total', 'valor_total']) || 'soma_valor_referencia'
  const productKey = resolveRowKey(safeRows, ['produto_nome', 'produto', 'nome_produto', 'produtoName']) || 'produto_nome'
  const imageKey = resolveRowKey(safeRows, ['imagem_perfil_url', 'imagem_perfil', 'imagemPerfil', 'imagem', 'foto', 'avatar', 'profile_image']) || 'imagem_perfil'

  const vendedores = buildGroups(safeRows, vendorKey, equipeKey, { multiLabel: 'VARIAS EQUIPES', nameFormatter: formatVendorNameWithCompany, metaFormatter: formatName, valueKey, imageKey })
  const supervisores = buildGroups(safeRows, equipeKey, franquiaKey, { multiLabel: 'VARIAS FRANQUIAS', nameFormatter: formatAfterColon, metaFormatter: formatName, valueKey })
  const gerentes = buildGroups(safeRows, franquiaKey, 'empresa', { multiLabel: 'VARIAS EMPRESAS', metaFormatter: (v) => (v ? String(v).toUpperCase() : ''), valueKey })
    .map((item) => ({ ...item, meta: formatCountLabel(item.count) }))

  const portabilidade = buildGroups(filterRowsByProduct(safeRows, productKey, PORTABILIDADE_SET), vendorKey, equipeKey, { multiLabel: 'VARIAS EQUIPES', nameFormatter: formatVendorNameOnly, metaFormatter: formatName, valueKey, imageKey })
  const novo = buildGroups(filterRowsByProduct(safeRows, productKey, NOVO_SET), vendorKey, equipeKey, { multiLabel: 'VARIAS EQUIPES', nameFormatter: formatVendorNameOnly, metaFormatter: formatName, valueKey, imageKey })
  const clt = buildGroups(filterRowsByProduct(safeRows, productKey, CLT_SET), vendorKey, equipeKey, { multiLabel: 'VARIAS EQUIPES', nameFormatter: formatVendorNameOnly, metaFormatter: formatName, valueKey, imageKey })

  return assembleRankings({ vendedores, portabilidade, novo, clt, supervisores, gerentes })
}

export function buildRankingsFromLists(lists) {
  if (!lists) return baseRankings

  const makeRows = (list, config) => {
    const safeList = Array.isArray(list) ? list : []
    return safeList.map((item) => {
      const rawName = item?.[config.nameKey]
      const name = config.nameFormatter ? config.nameFormatter(rawName) : formatName(rawName)
      if (!name) return null
      const value = parseNumericValue(item?.[config.valueKey] ?? item?.valor_referencia ?? item?.soma_valor_referencia ?? item?.valor ?? item?.total)
      const image = resolveImageValue(item, config.imageKey ? [config.imageKey] : [])
      let meta = ''
      if (config.count) {
        const countValue = item?.qtde_vendedor_nome ?? item?.qtde_vendedor ?? item?.qtde_propostas ?? item?.qtde_proposta ?? item?.quantidade_propostas ?? item?.propostas
        meta = formatCountLabel(countValue)
      } else if (config.metaKey) {
        meta = formatName(item?.[config.metaKey])
      }
      return { name, meta, value, image }
    }).filter(Boolean).sort((a, b) => b.value - a.value)
  }

  const vendedores = makeRows(lists.vendedores, { nameKey: 'vendedor_nome', metaKey: 'equipe_nome', valueKey: 'valor_referencia', nameFormatter: formatVendorNameWithCompany, imageKey: 'imagem_perfil' })
  const supervisores = makeRows(lists.equipes, { nameKey: 'equipe_nome', metaKey: 'franquia_nome', valueKey: 'valor_referencia', nameFormatter: formatAfterColon })
  const gerentes = makeRows(lists.franquias, { nameKey: 'franquia_nome', valueKey: 'valor_referencia', count: true })

  return assembleRankings({ vendedores, portabilidade: [], novo: [], clt: [], supervisores, gerentes })
}
