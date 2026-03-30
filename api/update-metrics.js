const BASES = [
  process.env.UPSTREAM_METRICS_API_BASE,
  'http://85.31.61.242:3099',
]
  .map((value) => String(value || '').trim().replace(/\/+$/, ''))
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

  let lastError = null
  let lastTarget = null

  for (const base of BASES) {
    const targetUrl = `${base}/`
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

      try {
        const payload = JSON.parse(rawBody)
        res.status(upstreamResponse.status).json(payload)
        return
      } catch {
        res.status(upstreamResponse.status).send(rawBody)
        return
      }
    } catch (error) {
      lastError = error
    }
  }

  res.status(502).json({
    ok: false,
    error: String(lastError?.message || 'Upstream request failed'),
    target: lastTarget,
    upstreams: BASES,
  })
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
}
