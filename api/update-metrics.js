const BASES = [
  process.env.UPSTREAM_METRICS_API_BASE,
  'http://85.31.61.242:3099',
]
  .map((value) => String(value || '').trim().replace(/\/+$/, ''))
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

  const candidates = await Promise.allSettled(
    BASES.map((base) => fetchMetricsCandidate(base)),
  )

  const successful = candidates
    .filter((entry) => entry.status === 'fulfilled')
    .map((entry) => entry.value)

  const fallbackCandidate = successful[0]
  if (fallbackCandidate) {
    res.status(fallbackCandidate.status).json(fallbackCandidate.payload)
    return
  }

  const lastError = candidates.find((entry) => entry.status === 'rejected')?.reason
  res.status(200).json({
    ok: false,
    fallback: true,
    combined: {
      avg_of_averages_fmt: 'Sem dado',
    },
    generated_at: new Date().toISOString(),
    error: String(lastError?.message || 'Upstream request failed'),
    upstreams: BASES,
  })
}

async function fetchMetricsCandidate(base) {
  const targetUrl = `${base}/`
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

    return {
      status: response.status,
      payload,
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
