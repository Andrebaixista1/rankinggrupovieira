// Dados estáticos dos estádios da Copa 2026 — sem dependência externa.
// IDs correspondem ao STADIUM_TIMEZONE_MAP do App.jsx.
const COPA_2026_STADIUMS = [
  { id: '1', name_en: 'Estadio Azteca', city_en: 'Mexico City', country_en: 'Mexico', region: 'North America' },
  { id: '2', name_en: 'Estadio Akron', city_en: 'Guadalajara', country_en: 'Mexico', region: 'North America' },
  { id: '3', name_en: 'Estadio BBVA', city_en: 'Monterrey', country_en: 'Mexico', region: 'North America' },
  { id: '4', name_en: 'AT&T Stadium', city_en: 'Arlington', country_en: 'United States', region: 'Central' },
  { id: '5', name_en: 'NRG Stadium', city_en: 'Houston', country_en: 'United States', region: 'Central' },
  { id: '6', name_en: 'Mercedes-Benz Stadium', city_en: 'Atlanta', country_en: 'United States', region: 'Eastern' },
  { id: '7', name_en: 'Lincoln Financial Field', city_en: 'Philadelphia', country_en: 'United States', region: 'Eastern' },
  { id: '8', name_en: 'Hard Rock Stadium', city_en: 'Miami', country_en: 'United States', region: 'Eastern' },
  { id: '9', name_en: 'MetLife Stadium', city_en: 'East Rutherford', country_en: 'United States', region: 'Eastern' },
  { id: '10', name_en: 'Lumen Field', city_en: 'Seattle', country_en: 'United States', region: 'Western' },
  { id: '11', name_en: "Levi's Stadium", city_en: 'Santa Clara', country_en: 'United States', region: 'Western' },
  { id: '12', name_en: 'BMO Field', city_en: 'Toronto', country_en: 'Canada', region: 'Eastern' },
  { id: '13', name_en: 'BC Place', city_en: 'Vancouver', country_en: 'Canada', region: 'Western' },
  { id: '14', name_en: 'SoFi Stadium', city_en: 'Inglewood', country_en: 'United States', region: 'Western' },
  { id: '15', name_en: 'Arrowhead Stadium', city_en: 'Kansas City', country_en: 'United States', region: 'Central' },
  { id: '16', name_en: 'Gillette Stadium', city_en: 'Foxborough', country_en: 'United States', region: 'Eastern' },
]

export default function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: `Method ${req.method} not supported` })
    return
  }

  res.status(200).json({ stadiums: COPA_2026_STADIUMS })
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
}
