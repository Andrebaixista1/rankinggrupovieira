const BASES = [
  process.env.UPSTREAM_API_BASE,
  process.env.UPSTREAM_API_BASE_FALLBACK,
  'https://85.31.61.242:8003',
  'http://85.31.61.242:3066',
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
  let upstreamResponse = null
  let lastError = null
  let lastTarget = null

  for (const base of BASES) {
    const targetUrl = `${base}/api/ranking${query}`
    lastTarget = targetUrl

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      try {
        upstreamResponse = await fetch(targetUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeout)
      }

      if (upstreamResponse) break
    } catch (error) {
      lastError = error
    }
  }

  if (!upstreamResponse) {
    res.status(502).json({
      ok: false,
      error: String(lastError?.message || 'Upstream request failed'),
      target: lastTarget,
      upstreams: BASES,
    })
    return
  }

  const body = await upstreamResponse.text()
  res.status(upstreamResponse.status)
  res.setHeader('Content-Type', upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8')
  res.send(body)
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
}
