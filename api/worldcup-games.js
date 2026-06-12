const UPSTREAM_URL = 'https://worldcup26.ir/get/games'

const configuredTimeoutMs = Number.parseInt(process.env.PROXY_TIMEOUT_MS || '', 10)
const REQUEST_TIMEOUT_MS = Number.isFinite(configuredTimeoutMs) && configuredTimeoutMs > 0
  ? Math.max(configuredTimeoutMs, 15000)
  : 15000

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

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(UPSTREAM_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    const rawBody = await response.text()
    if (!response.ok) {
      res.status(response.status).send(rawBody)
      return
    }

    res.status(response.status).send(rawBody)
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: String(error?.message || 'Upstream request failed'),
    })
  } finally {
    clearTimeout(timeout)
  }
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
}
