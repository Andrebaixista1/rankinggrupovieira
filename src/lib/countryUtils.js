import { WORLD_CUP_FLAG_PATHS } from '../worldcupFlagPaths.js'

export const COUNTRY_ALIAS_MAP = {
  'cote d ivoire': "Côte d'Ivoire",
  'cote divoire': "Côte d'Ivoire",
  'ivory coast': "Côte d'Ivoire",
  'south korea': 'Korea, Republic of',
  korea: 'Korea, Republic of',
  'north korea': "Korea, Democratic People's Republic of",
  'czech republic': 'Czech Republic',
  czechia: 'Czech Republic',
  'bosnia and herzegovina': 'Bosnia and Herzegovina',
  'bosnia herzegovina': 'Bosnia and Herzegovina',
  'korea republic': 'Korea, Republic of',
  'united states': 'United States',
  usa: 'United States',
  'united states of america': 'United States',
  'democratic republic of the congo': 'Congo, The Democratic Republic of the',
  'republic of the congo': 'Congo',
  'congo dr': 'Congo, The Democratic Republic of the',
  'dr congo': 'Congo, The Democratic Republic of the',
  'cape verde': 'Cabo Verde',
  'saudi arabia': 'Saudi Arabia',
  'new zealand': 'New Zealand',
  'ivory coast ': "Côte d'Ivoire",
  turkiye: 'Turkey',
  turkey: 'Turkey',
}

export const COUNTRY_DISPLAY_CODE_MAP = new Map([
  ["Côte d'Ivoire", 'CI'],
  ['Korea, Republic of', 'KR'],
  ["Korea, Democratic People's Republic of", 'KP'],
  ['Czech Republic', 'CZ'],
  ['Bosnia and Herzegovina', 'BA'],
  ['United States', 'US'],
  ['Congo, The Democratic Republic of the', 'CD'],
  ['Congo', 'CG'],
  ['Cabo Verde', 'CV'],
  ['Saudi Arabia', 'SA'],
  ['New Zealand', 'NZ'],
  ['Mexico', 'MX'],
  ['Canada', 'CA'],
  ['Argentina', 'AR'],
  ['Brazil', 'BR'],
  ['Uruguay', 'UY'],
  ['Chile', 'CL'],
  ['Colombia', 'CO'],
  ['Ecuador', 'EC'],
  ['Peru', 'PE'],
  ['Paraguay', 'PY'],
  ['Bolivia', 'BO'],
  ['Venezuela', 'VE'],
  ['South Africa', 'ZA'],
  ['Morocco', 'MA'],
  ['Algeria', 'DZ'],
  ['Tunisia', 'TN'],
  ['Egypt', 'EG'],
  ['Ghana', 'GH'],
  ['Nigeria', 'NG'],
  ['Senegal', 'SN'],
  ['Cameroon', 'CM'],
  ['Costa Rica', 'CR'],
  ['Panama', 'PA'],
  ['Honduras', 'HN'],
  ['Guatemala', 'GT'],
  ['El Salvador', 'SV'],
  ['Jamaica', 'JM'],
  ['Trinidad and Tobago', 'TT'],
  ['Haiti', 'HT'],
  ['Dominican Republic', 'DO'],
  ['Japan', 'JP'],
  ['China', 'CN'],
  ['Chinese Taipei', 'TW'],
  ['Australia', 'AU'],
  ['Iran', 'IR'],
  ['Iraq', 'IQ'],
  ['Qatar', 'QA'],
  ['UAE', 'AE'],
  ['United Arab Emirates', 'AE'],
  ['Oman', 'OM'],
  ['Kyrgyz Republic', 'KG'],
  ['Kyrgyzstan', 'KG'],
  ['Uzbekistan', 'UZ'],
  ['Kazakhstan', 'KZ'],
  ['Thailand', 'TH'],
  ['Vietnam', 'VN'],
  ['Indonesia', 'ID'],
  ['Philippines', 'PH'],
  ['India', 'IN'],
  ['Turkey', 'TR'],
  ['Türkiye', 'TR'],
  ['North Macedonia', 'MK'],
  ['Macedonia', 'MK'],
  ['Serbia', 'RS'],
  ['Croatia', 'HR'],
  ['Slovenia', 'SI'],
  ['Slovakia', 'SK'],
  ['Montenegro', 'ME'],
  ['Albania', 'AL'],
  ['Romania', 'RO'],
  ['Bulgaria', 'BG'],
  ['Greece', 'GR'],
  ['Portugal', 'PT'],
  ['Spain', 'ES'],
  ['France', 'FR'],
  ['Germany', 'DE'],
  ['England', 'GB'],
  ['Scotland', 'GB'],
  ['Wales', 'GB'],
  ['Northern Ireland', 'GB'],
  ['Netherlands', 'NL'],
  ['Belgium', 'BE'],
  ['Switzerland', 'CH'],
  ['Austria', 'AT'],
  ['Italy', 'IT'],
  ['Poland', 'PL'],
  ['Denmark', 'DK'],
  ['Norway', 'NO'],
  ['Sweden', 'SE'],
  ['Finland', 'FI'],
  ['Iceland', 'IS'],
  ['Ireland', 'IE'],
  ['Luxembourg', 'LU'],
  ['Liechtenstein', 'LI'],
  ['Monaco', 'MC'],
  ['Andorra', 'AD'],
  ['Malta', 'MT'],
  ['Cyprus', 'CY'],
])

export function normalizeCountryKey(value) {
  return String(value || '')
    .normalize('NFD')            // decompõe pré-compostos: ç → c + ◌̧, ü → u + ◌̈
    .replace(/[̀-ͯ]/g, '') // remove os diacríticos combinantes
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function resolveCountryName(name) {
  const normalized = normalizeCountryKey(name)
  return COUNTRY_ALIAS_MAP[normalized] || String(name || '').replace(/\s+/g, ' ').trim()
}

// Nomes que o Intl.DisplayNames não resolve corretamente para o contexto de futebol.
// Inglaterra/Escócia/Gales/Irlanda do Norte são seleções próprias, não "Reino Unido".
const PT_DISPLAY_OVERRIDES = {
  'Czech Republic': 'República Tcheca',
  England: 'Inglaterra',
  Scotland: 'Escócia',
  Wales: 'País de Gales',
  'Northern Ireland': 'Irlanda do Norte',
}

export function resolveCountryDisplayName(name) {
  const canonicalName = resolveCountryName(name)
  if (PT_DISPLAY_OVERRIDES[canonicalName]) return PT_DISPLAY_OVERRIDES[canonicalName]
  const regionCode = COUNTRY_DISPLAY_CODE_MAP.get(canonicalName)
  if (!regionCode || typeof Intl.DisplayNames !== 'function') return canonicalName
  try {
    const displayNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' })
    return displayNames.of(regionCode) || canonicalName
  } catch {
    return canonicalName
  }
}

export function resolveWorldCupFlagUrl(countryName) {
  const directKey = normalizeCountryKey(countryName)
  if (WORLD_CUP_FLAG_PATHS[directKey]) return WORLD_CUP_FLAG_PATHS[directKey]
  // ESPN usa nomes diferentes ("Czechia", "Bosnia-Herzegovina"): tenta o nome canônico.
  const canonicalKey = normalizeCountryKey(resolveCountryName(countryName))
  return WORLD_CUP_FLAG_PATHS[canonicalKey] || ''
}
