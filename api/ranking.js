const BASES = [
  process.env.UPSTREAM_API_BASE,
  process.env.UPSTREAM_API_BASE_FALLBACK,
  'http://85.31.61.242:3066',
  'https://85.31.61.242:8003',
]
  .map((v) => String(v || '').trim().replace(/\/+$/, ''))
  .filter(Boolean)

const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.PROXY_TIMEOUT_MS || '15000', 10)
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
  let bestPayload = null
  let bestStatus = 200
  let lastError = null
  let lastTarget = null

  for (const base of BASES) {
    const targetUrl = `${base}/api/ranking${query}`
    lastTarget = targetUrl

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      let upstreamResponse
      let rawBody = ''
      try {
        upstreamResponse = await fetch(targetUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })
        rawBody = await upstreamResponse.text()
      } finally {
        clearTimeout(timeout)
      }

      if (!upstreamResponse || !upstreamResponse.ok) {
        lastError = new Error(`Upstream status ${upstreamResponse ? upstreamResponse.status : 'unknown'}`)
        continue
      }

      let payload
      try {
        payload = JSON.parse(rawBody)
      } catch {
        continue
      }

      const normalized = normalizePayload(payload)
      const hasProduto = payloadHasProduto(normalized)

      if (!bestPayload) {
        bestPayload = normalized
        bestStatus = upstreamResponse.status
      }

      // Se encontrou payload com produto_nome, para aqui.
      if (hasProduto) {
        res.status(upstreamResponse.status).json(normalized)
        return
      }
    } catch (error) {
      lastError = error
    }
  }

  if (!bestPayload) {
    res.status(502).json({
      ok: false,
      error: String(lastError?.message || 'Upstream request failed'),
      target: lastTarget,
      upstreams: BASES,
    })
    return
  }

  // Fallback: retorna melhor payload mesmo sem produto, para não quebrar o front.
  res.status(bestStatus).json(bestPayload)
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
