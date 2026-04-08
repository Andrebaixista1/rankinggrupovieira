const BASES = Array.from(
  new Set(
    [
      process.env.UPSTREAM_API_BASE,
      process.env.UPSTREAM_API_BASE_FALLBACK,
      'http://177.153.62.236:3066',
      'http://85.31.61.242:3066',
      'https://85.31.61.242:8003',
    ]
      .map((value) => String(value || '').trim().replace(/\/+$/, ''))
      .filter(Boolean),
  ),
)

const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.PROXY_TIMEOUT_MS || '8000', 10)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0'

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

  const query = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  let fallbackCandidate = null
  let lastError = null

  for (const base of BASES) {
    try {
      const candidate = await fetchRankingCandidate(base, query)
      if (payloadHasRankingData(candidate.payload)) {
        res.status(candidate.status).json(candidate.payload)
        return
      }
      if (!fallbackCandidate) {
        fallbackCandidate = candidate
      }
    } catch (error) {
      lastError = error
    }
  }

  if (fallbackCandidate) {
    res.status(fallbackCandidate.status).json(fallbackCandidate.payload)
    return
  }

  res.status(200).json({
    ok: false,
    fallback: true,
    error: String(lastError?.message || 'Upstream request failed'),
    upstreams: BASES,
  })
}

async function fetchRankingCandidate(base, query) {
  const targetUrl = buildRankingTargetUrl(base, query)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    const rawBody = await response.text()

    if (!response.ok) {
      throw new Error(`Upstream status ${response.status}`)
    }

    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      throw new Error('Upstream returned invalid JSON')
    }

    const normalized = normalizePayload(payload)
    return {
      status: response.status,
      payload: normalized,
    }
  } finally {
    clearTimeout(timeout)
  }
}

function buildRankingTargetUrl(base, query = '') {
  const trimmed = String(base || '').trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  if (/\/api\/ranking$/i.test(trimmed)) return `${trimmed}${query}`
  return `${trimmed}/api/ranking${query}`
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
}

function normalizePayload(payload) {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.rows)) return payload.rows
    if (Array.isArray(payload.data)) return payload.data
  }
  return payload
}

function payloadHasProduto(payload) {
  if (!Array.isArray(payload)) return false
  return payload.some((row) => {
    if (!row || typeof row !== 'object') return false
    return (
      Object.prototype.hasOwnProperty.call(row, 'produto_nome') ||
      Object.prototype.hasOwnProperty.call(row, 'produto') ||
      Object.prototype.hasOwnProperty.call(row, 'produtoNome')
    )
  })
}

function payloadHasRankingData(payload) {
  return payloadHasProduto(payload) || payloadHasRows(payload)
}

function payloadHasRows(payload, seen = new Set()) {
  if (Array.isArray(payload)) {
    return payload.some((row) => row && typeof row === 'object')
  }

  if (!payload || typeof payload !== 'object' || seen.has(payload)) {
    return false
  }
  seen.add(payload)

  const directCandidates = [payload.rows, payload.data, payload.result, payload.items]
  if (directCandidates.some((value) => Array.isArray(value) && value.some((row) => row && typeof row === 'object'))) {
    return true
  }

  return Object.values(payload).some((value) => payloadHasRows(value, seen))
}
