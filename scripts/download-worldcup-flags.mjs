import { mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'

const projectRoot = process.cwd()
const publicDir = path.join(projectRoot, 'public', 'worldcup-flags')
const srcMapPath = path.join(projectRoot, 'src', 'worldcupFlagPaths.js')

const GAMES_URL = 'https://worldcup26.ir/get/games'
const COUNTRIES_NOW_URL = 'https://countriesnow.space/api/v0.1/countries/flag/images'

const FALLBACK_ISO2 = {
  'South Korea': 'KR',
  'Ivory Coast': 'CI',
  'Curaçao': 'CW',
  'Democratic Republic of the Congo': 'CD',
  Scotland: 'GB',
  England: 'GB',
}

const COUNTRY_NAME_ALIASES = {
  Scotland: 'United Kingdom',
  England: 'United Kingdom',
}

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeKey(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

async function downloadToFile(url, outputPath) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'image/png,image/*;q=0.8,*/*;q=0.5',
    },
  })
  if (!response.ok) {
    throw new Error(`Falha ao baixar ${url} (${response.status})`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(outputPath, buffer)
}

async function fetchCountriesNowFlag(country) {
  const response = await fetch(COUNTRIES_NOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country }),
  })

  const payload = await response.json().catch(() => null)
  const flagUrl = payload?.data?.flag?.trim() || payload?.flag?.trim() || ''

  if (!response.ok || !flagUrl) {
    throw new Error(`countriesnow falhou para ${country} (${response.status})`)
  }

  return flagUrl
}

async function fetchCountriesNowMetadata(country) {
  const response = await fetch(COUNTRIES_NOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country }),
  })

  const payload = await response.json().catch(() => null)
  const iso2 = payload?.data?.iso2?.trim() || ''
  return {
    ok: response.ok && Boolean(iso2),
    iso2,
  }
}

async function getGames() {
  const response = await fetch(GAMES_URL)
  const payload = await response.json()
  return Array.isArray(payload?.games) ? payload.games : []
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true })
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function main() {
  const games = await getGames()
  const rawCountries = Array.from(
    new Set(
      games.flatMap((game) => [
        game?.home_team_name_en || '',
        game?.away_team_name_en || '',
      ].filter(Boolean)),
    ),
  ).sort((a, b) => a.localeCompare(b))

  await ensureDir(publicDir)

  const flagPaths = {}
  const usedFiles = new Set()
  const report = []

  for (const rawName of rawCountries) {
    const canonicalName = COUNTRY_NAME_ALIASES[rawName] || rawName
    const fileBase = slugify(rawName)
    const localPngPath = path.join(publicDir, `${fileBase}.png`)

    let iso2 = ''
    try {
      const meta = await fetchCountriesNowMetadata(canonicalName)
      iso2 = meta.iso2
    } catch {
      iso2 = ''
    }

    if (!iso2) {
      iso2 = FALLBACK_ISO2[rawName] || FALLBACK_ISO2[canonicalName] || ''
    }

    if (!iso2) {
      report.push({ rawName, status: 'missing' })
      continue
    }

    const sourceUrl = `https://flagcdn.com/w320/${iso2.toLowerCase()}.png`
    await downloadToFile(sourceUrl, localPngPath)
    usedFiles.add(path.basename(localPngPath))
    flagPaths[normalizeKey(rawName)] = `/worldcup-flags/${path.basename(localPngPath)}`
    report.push({ rawName, status: 'ok', sourceUrl, file: path.basename(localPngPath) })
  }

  const mapFile = `export const WORLD_CUP_FLAG_PATHS = ${JSON.stringify(flagPaths, null, 2)}\n`
  await writeFile(srcMapPath, mapFile, 'utf8')

  const summary = {
    total: rawCountries.length,
    ok: report.filter((item) => item.status === 'ok').length,
    missing: report.filter((item) => item.status === 'missing').map((item) => item.rawName),
    files: Array.from(usedFiles).sort(),
  }

  await writeFile(path.join(projectRoot, 'worldcup-flag-download-report.json'), JSON.stringify(summary, null, 2), 'utf8')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
