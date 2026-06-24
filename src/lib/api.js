export function buildRequestUrl(baseUrl) {
  if (!baseUrl) return ''
  const joiner = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${joiner}t=${Date.now()}`
}

async function fetchJsonOnce(baseUrl) {
  const requestUrl = buildRequestUrl(baseUrl)
  if (!requestUrl) throw new Error('URL da API não definida')
  const response = await fetch(requestUrl, { cache: 'no-store' })
  const text = await response.text()
  if (!response.ok) throw new Error(`Erro ao buscar ranking: ${response.status}`)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Resposta da API não é JSON válido')
  }
}

function delay(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms) })
}

export async function fetchJson(baseUrl, options = {}) {
  const retries = Number.isFinite(options.retries) ? Math.max(0, options.retries) : 0
  const retryDelayMs = Number.isFinite(options.retryDelayMs) ? Math.max(0, options.retryDelayMs) : 0
  let lastError

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchJsonOnce(baseUrl)
    } catch (error) {
      lastError = error
      if (attempt >= retries) break
      if (retryDelayMs > 0) await delay(retryDelayMs)
    }
  }

  throw lastError
}
