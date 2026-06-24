export const STADIUM_TIMEZONE_MAP = {
  '1': 'America/Mexico_City',
  '2': 'America/Mexico_City',
  '3': 'America/Monterrey',
  '4': 'America/Chicago',
  '5': 'America/Chicago',
  '6': 'America/New_York',
  '7': 'America/New_York',
  '8': 'America/New_York',
  '9': 'America/New_York',
  '10': 'America/Los_Angeles',
  '11': 'America/Los_Angeles',
  '12': 'America/Toronto',
  '13': 'America/Vancouver',
  '14': 'America/Los_Angeles',
  '15': 'America/Chicago',
  '16': 'America/New_York',
}

export function resolveVenueId(venue) {
  if (!venue) return null
  const name = (venue.fullName || '').toLowerCase()
  const city = (venue.address?.city || '').toLowerCase().split(',')[0].trim()

  if (name.includes('azteca') || name.includes('banorte') || city === 'mexico city' || city === 'ciudad de méxico') return '1'
  if (name.includes('akron') || city === 'guadalajara') return '2'
  if (name.includes('bbva') || city === 'guadalupe' || city === 'monterrey') return '3'
  if (name.includes('at&t') || city === 'arlington') return '4'
  if (name.includes('nrg') || city === 'houston') return '5'
  if (name.includes('mercedes-benz') || city === 'atlanta') return '6'
  if (name.includes('lincoln financial') || city === 'philadelphia') return '7'
  if (name.includes('hard rock') || city === 'miami gardens' || city === 'miami') return '8'
  if (name.includes('metlife') || city === 'east rutherford') return '9'
  if (name.includes('lumen') || city === 'seattle') return '10'
  if (name.includes("levi's") || city === 'santa clara') return '11'
  if (name.includes('bmo') || city === 'toronto') return '12'
  if (name.includes('bc place') || city === 'vancouver') return '13'
  if (name.includes('sofi') || city === 'inglewood') return '14'
  if (name.includes('arrowhead') || city === 'kansas city') return '15'
  if (name.includes('gillette') || city === 'foxborough') return '16'
  return null
}

export function formatLocalDate(isoDate, stadiumId) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return ''

  const tz = STADIUM_TIMEZONE_MAP[stadiumId] || 'UTC'
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d).reduce((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value
      return acc
    }, {})
    return `${parts.month}/${parts.day}/${parts.year} ${parts.hour}:${parts.minute}`
  } catch {
    return ''
  }
}
