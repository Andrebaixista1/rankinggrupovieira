const BASES = [
  process.env.UPSTREAM_METRICS_API_BASE,
  'http://177.153.62.236:3032/status',
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
    .map((entry) => normalizeMetricsCandidate(entry.value))

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
      avg_of_averages_fmt: '00:00',
    },
    avg_of_averages_fmt: '00:00',
    generated_at: new Date().toISOString(),
    error: String(lastError?.message || 'Upstream request failed'),
    upstreams: BASES,
  })
}

async function fetchMetricsCandidate(base) {
  const targetUrl = buildMetricsTargetUrl(base)
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
      payload: normalizeMetricsPayload(payload),
    }
  } finally {
    clearTimeout(timeout)
  }
}

function buildMetricsTargetUrl(base) {
  const trimmed = String(base || '').trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  if (/\/status$/i.test(trimmed) || /\/api\/update-metrics$/i.test(trimmed)) return trimmed
  return `${trimmed}/status`
}

function normalizeMetricsCandidate(candidate) {
  if (!candidate || typeof candidate !== 'object') return candidate
  const isRealData = isRealMetricsPayload(candidate.payload)
  return {
    ...candidate,
    isRealData,
    payload: isRealData ? candidate.payload : normalizeMetricsPayload(candidate.payload),
  }
}

function normalizeMetricsPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      combined: {
        avg_of_averages_fmt: '00:00',
      },
      avg_of_averages_fmt: '00:00',
    }
  }

  if (isPm2StatusPayload(payload)) {
    return normalizePm2StatusPayload(payload)
  }

  const label = getAverageLabel(payload)
  if (isRealAverageLabel(label)) {
    return payload
  }

  const nextPayload = {
    ...payload,
    combined: {
      ...(payload.combined && typeof payload.combined === 'object' ? payload.combined : {}),
      avg_of_averages_fmt: '00:00',
    },
  }

  if ('avg_of_averages_fmt' in nextPayload) {
    nextPayload.avg_of_averages_fmt = '00:00'
  }

  return nextPayload
}

function getAverageLabel(payload) {
  const cycleDurationFromMs = formatDurationFromMs(
    payload?.averageCycleDurationMs ?? payload?.lastCycleDurationMs,
  )
  return String(
    payload?.combined?.avg_of_averages_fmt
    || payload?.avg_of_averages_fmt
    || payload?.avgOfAveragesFmt
    || payload?.media_total_fmt
    || payload?.averageCycleDuration
    || payload?.lastCycleDuration
    || cycleDurationFromMs
    || '',
  ).trim()
}

function isRealAverageLabel(value) {
  const normalized = String(value || '').trim()
  return Boolean(
    normalized
      && normalized !== '00:00'
      && normalized !== '00:00:00'
      && normalized !== '--:--',
  )
}

function isRealMetricsPayload(payload) {
  return isRealAverageLabel(getAverageLabel(payload))
}

function isPm2StatusPayload(payload) {
  if (!payload || typeof payload !== 'object') return false
  return (
    Object.prototype.hasOwnProperty.call(payload, 'cycleNumber')
    || Object.prototype.hasOwnProperty.call(payload, 'averageCycleDuration')
    || Object.prototype.hasOwnProperty.call(payload, 'averageCycleDurationMs')
    || Object.prototype.hasOwnProperty.call(payload, 'lastCycleDuration')
  )
}

function normalizePm2StatusPayload(payload) {
  const averageLabel = getAverageLabel(payload)
  const normalizedLabel = isRealAverageLabel(averageLabel) ? averageLabel : '00:00'
  const generatedAt = payload?.lastUpdatedAt || new Date().toISOString()
  return {
    ok: true,
    source: 'pm2-status',
    combined: {
      avg_of_averages_fmt: normalizedLabel,
    },
    avg_of_averages_fmt: normalizedLabel,
    generated_at: generatedAt,
    cycle: {
      number: payload?.cycleNumber ?? null,
      completed: payload?.completedCycles ?? null,
      state: payload?.cycleState ?? null,
      lastError: payload?.lastError ?? null,
      nextRunAt: payload?.nextRunAt ?? null,
    },
  }
}

function formatDurationFromMs(value) {
  const ms = Number(value)
  if (!Number.isFinite(ms) || ms <= 0) return ''
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds,
    ).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
}
