export const COPA_2026_STADIUMS = [
  { id: '1', name_en: 'Estadio Banorte', city_en: 'Mexico City', country_en: 'Mexico', region: 'North America' },
  { id: '2', name_en: 'Estadio Akron', city_en: 'Guadalajara', country_en: 'Mexico', region: 'North America' },
  { id: '3', name_en: 'Estadio BBVA', city_en: 'Guadalupe', country_en: 'Mexico', region: 'North America' },
  { id: '4', name_en: 'AT&T Stadium', city_en: 'Arlington', country_en: 'United States', region: 'Central' },
  { id: '5', name_en: 'NRG Stadium', city_en: 'Houston', country_en: 'United States', region: 'Central' },
  { id: '6', name_en: 'Mercedes-Benz Stadium', city_en: 'Atlanta', country_en: 'United States', region: 'Eastern' },
  { id: '7', name_en: 'Lincoln Financial Field', city_en: 'Philadelphia', country_en: 'United States', region: 'Eastern' },
  { id: '8', name_en: 'Hard Rock Stadium', city_en: 'Miami Gardens', country_en: 'United States', region: 'Eastern' },
  { id: '9', name_en: 'MetLife Stadium', city_en: 'East Rutherford', country_en: 'United States', region: 'Eastern' },
  { id: '10', name_en: 'Lumen Field', city_en: 'Seattle', country_en: 'United States', region: 'Western' },
  { id: '11', name_en: "Levi's Stadium", city_en: 'Santa Clara', country_en: 'United States', region: 'Western' },
  { id: '12', name_en: 'BMO Field', city_en: 'Toronto', country_en: 'Canada', region: 'Eastern' },
  { id: '13', name_en: 'BC Place', city_en: 'Vancouver', country_en: 'Canada', region: 'Western' },
  { id: '14', name_en: 'SoFi Stadium', city_en: 'Inglewood', country_en: 'United States', region: 'Western' },
  { id: '15', name_en: 'GEHA Field at Arrowhead Stadium', city_en: 'Kansas City', country_en: 'United States', region: 'Central' },
  { id: '16', name_en: 'Gillette Stadium', city_en: 'Foxborough', country_en: 'United States', region: 'Eastern' },
]

export const COPA_2026_STADIUMS_BY_ID = COPA_2026_STADIUMS.reduce((acc, s) => {
  acc[s.id] = s
  return acc
}, {})
