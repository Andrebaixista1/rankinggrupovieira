import { aggregateSaldo } from '../lib/europa5Stats.js'

const SALDO_URL = 'https://app.apivieiracred.com.br/webhook/api/saldo'
const REQUEST_TIMEOUT_MS = 15000

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
    const response = await fetch(`${SALDO_URL}?_t=${Date.now()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) {
      res.status(response.status).json({ ok: false, error: `Upstream ${response.status}` })
      return
    }
    const raw = await response.json()
    res.status(200).json(aggregateSaldo(raw))
  } catch (error) {
    res.status(502).json({ ok: false, error: String(error?.message || 'Upstream request failed') })
  } finally {
    clearTimeout(timeout)
  }
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
}
