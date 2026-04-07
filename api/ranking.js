const BASES = [
  process.env.UPSTREAM_API_BASE,
  process.env.UPSTREAM_API_BASE_FALLBACK,
  'http://127.0.0.1:3066',
  'http://0.0.0.0:3066',
  'http://177.153.62.236:3066',
  'http://85.31.61.242:3066',
  'https://85.31.61.242:8003',
]
  .map((v) => String(v || '').trim().replace(/\/+$/, ''))
  .filter(Boolean)

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
  const candidates = await Promise.allSettled(
    BASES.map((base) => fetchRankingCandidate(base, query)),
  )

  const successful = candidates
    .filter((entry) => entry.status === 'fulfilled')
    .map((entry) => entry.value)

  const productCandidate = successful.find((candidate) => candidate.hasProduto)
  if (productCandidate) {
    res.status(productCandidate.status).json(productCandidate.payload)
    return
  }

  const fallbackCandidate = successful[0]
  if (fallbackCandidate) {
    res.status(fallbackCandidate.status).json(fallbackCandidate.payload)
    return
  }

  const lastError = candidates.find((entry) => entry.status === 'rejected')?.reason
  res.status(200).json({
    ok: false,
    fallback: true,
    error: String(lastError?.message || 'Upstream request failed'),
    upstreams: BASES,
  })
}

async function fetchRankingCandidate(base, query) {
  const targetUrl = `${base}/api/ranking${query}`
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
      hasProduto: payloadHasProduto(normalized),
    }
  } finally {
    clearTimeout(timeout)
  }
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
