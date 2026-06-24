export function normalizeMeta(value) {
  if (!value) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

export function formatName(value) {
  const normalized = normalizeMeta(value)
  return normalized ? normalized.toUpperCase() : ''
}

export function normalizeKey(value) {
  const normalized = normalizeMeta(value)
  if (!normalized) return ''
  return normalized
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
}

export const SUPERVISOR_NAME_CORRECTIONS = new Map(
  [['FREIRAS DO EVERTON', 'EVERTON NUNES']].map(([from, to]) => [
    from
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase(),
    to,
  ]),
)

export function formatPersonName(value) {
  if (!value) return ''
  const cleaned = String(value).replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  const parts = cleaned.split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0].toUpperCase()
  return `${parts[0].toUpperCase()} ${parts[parts.length - 1].toUpperCase()}`
}

export function formatVendorNameWithCompany(value) {
  if (!value) return ''
  const [before, ...rest] = String(value).split('/')
  const name = formatPersonName(before)
  const company = rest.length ? formatName(rest.join('/')) : ''
  if (company) return name ? `${name} / ${company}` : company
  return name
}

export function formatVendorNameOnly(value) {
  if (!value) return ''
  const [before] = String(value).split('/')
  return formatPersonName(before)
}

export function formatAfterColon(value) {
  if (!value) return ''
  const raw = String(value)
  const parts = raw.split(':')
  const tail = parts.length > 1 ? parts.slice(1).join(':') : raw
  const corrected = SUPERVISOR_NAME_CORRECTIONS.get(normalizeKey(tail))
  if (corrected) return corrected
  return formatName(tail)
}

export function parseNumericValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (!value) return 0
  const raw = String(value).trim()
  if (!raw) return 0
  const sanitized = raw.replace(/\s+/g, '').replace(/[R$ ]/g, '')
  if (sanitized.includes(',') && sanitized.includes('.')) {
    return Number(sanitized.replace(/\./g, '').replace(',', '.')) || 0
  }
  if (sanitized.includes(',')) return Number(sanitized.replace(',', '.')) || 0
  return Number(sanitized) || 0
}

export function formatCountLabel(value) {
  const count = Math.round(parseNumericValue(value))
  if (!count) return '0 propostas'
  return count === 1 ? '1 proposta' : `${count} propostas`
}

export function hasRowValue(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'number') return Number.isFinite(value)
  return String(value).trim().length > 0
}

export function rowHasKey(row, key) {
  return Boolean(
    row
    && typeof row === 'object'
    && Object.prototype.hasOwnProperty.call(row, key)
    && hasRowValue(row[key]),
  )
}

const IMAGE_FIELD_CANDIDATES = [
  'imagem_perfil_url',
  'imagem_perfil',
  'imagemPerfil',
  'imagem',
  'foto',
  'avatar',
  'profile_image',
]

export function resolveImageValue(payload, preferredKeys = []) {
  const keys = [...preferredKeys, ...IMAGE_FIELD_CANDIDATES]
  for (const key of keys) {
    if (!key) continue
    const value = normalizeMeta(payload?.[key])
    if (value) return value
  }
  return ''
}
