import { motion as Motion } from 'framer-motion'
import { rowMotion } from '../lib/motionVariants.js'
import { resolveCountryDisplayName, resolveWorldCupFlagUrl } from '../lib/countryUtils.js'
import { resolveStadiumTimeZone, formatTimeInTimeZone, formatGameClock, formatGameStatus } from '../lib/gameUtils.js'
import { STADIUM_TIMEZONE_MAP } from '../../lib/stadiumUtils.js'

function Flag({ flagUrl, teamName }) {
  if (!flagUrl) return null
  return (
    <img
      className="game-flag"
      aria-label={`Bandeira de ${teamName}`}
      src={flagUrl}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  )
}

export default function GameRow({ game, index, stadiumsById, prefersReducedMotion }) {
  const homeTeamRaw = game?.home_team_name || game?.home_team_name_en || game?.home_team || 'Mandante'
  const awayTeamRaw = game?.away_team_name || game?.away_team_name_en || game?.away_team || 'Visitante'
  const homeTeam = resolveCountryDisplayName(homeTeamRaw)
  const awayTeam = resolveCountryDisplayName(awayTeamRaw)
  const homeScore = Number.isFinite(Number(game?.home_score)) ? Number(game.home_score) : 0
  const awayScore = Number.isFinite(Number(game?.away_score)) ? Number(game.away_score) : 0

  const stadium = stadiumsById[String(game?.stadium_id)] || null
  const stadiumName = stadium?.name_en || stadium?.fifa_name || 'Estádio não informado'
  const stadiumCity = stadium?.city_en ? ` • ${stadium.city_en}` : ''

  const sourceTimeZone = resolveStadiumTimeZone(stadium) || STADIUM_TIMEZONE_MAP[String(game?.stadium_id)] || ''
  const brTime = sourceTimeZone ? formatTimeInTimeZone(game?.local_date, sourceTimeZone) : formatGameClock(game?.local_date)

  const homeFlagUrl = resolveWorldCupFlagUrl(game?.home_team_name_en || '')
  const awayFlagUrl = resolveWorldCupFlagUrl(game?.away_team_name_en || '')
  const statusLabel = formatGameStatus(game)
  const statusClass = statusLabel === 'Encerrado' ? 'is-finished' : statusLabel === 'Ao vivo' ? 'is-live' : 'is-scheduled'

  return (
    <Motion.article
      key={`${game?.id || game?._id || index}-${game?.local_date || index}`}
      className="game-row"
      style={{ '--delay': `${index * 80}ms` }}
      variants={prefersReducedMotion ? undefined : rowMotion}
      initial={prefersReducedMotion ? false : 'initial'}
      animate={prefersReducedMotion ? undefined : 'animate'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      transition={{ duration: 0.34, ease: 'easeOut' }}
    >
      <div className="game-time">
        {brTime}
        {sourceTimeZone ? <span className="game-time-tz"> BRT</span> : null}
      </div>
      <div className="game-side home">
        <span className="game-team">
          <Flag flagUrl={homeFlagUrl} teamName={homeTeam} />
          <span>{homeTeam}</span>
        </span>
        <span className="game-goals">{homeScore}</span>
      </div>
      <div className="game-separator" aria-hidden="true">x</div>
      <div className="game-side away">
        <span className="game-goals">{awayScore}</span>
        <span className="game-team">
          <span>{awayTeam}</span>
          <Flag flagUrl={awayFlagUrl} teamName={awayTeam} />
        </span>
      </div>
      <div className="game-details">
        <span className="game-stadium">{stadiumName}{stadiumCity}</span>
        {sourceTimeZone ? <span className="game-timezone-hint">Horário de Brasília</span> : null}
      </div>
      <div className={`game-status ${statusClass}`}>{statusLabel}</div>
    </Motion.article>
  )
}
