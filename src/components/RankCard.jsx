import { motion as Motion } from 'framer-motion'
import { pageMotion, gridMotion } from '../lib/motionVariants.js'
import { ROTATION_INTERVAL } from '../lib/constants.js'
import { sortGamesByClosestTime } from '../lib/gameUtils.js'
import RankRow from './RankRow.jsx'
import GamesScroller from './GamesScroller.jsx'
import ControlIcon from './ControlIcon.jsx'

export default function RankCard({
  current,
  isLoading,
  hasData,
  hasTimeout,
  worldCupGamesLoading,
  worldCupGamesReady,
  worldCupGamesError,
  isPaused,
  showIntro,
  canRotate,
  cycleKey,
  prefersReducedMotion,
  stadiumsById,
  currencyFormatter,
  onPrev,
  onNext,
  onTogglePause,
  now,
}) {
  const isBeforeStart = now.getHours() < 9
  const isWorldCup = current.id === 'worldcup-games'

  const visibleRows = isWorldCup
    ? sortGamesByClosestTime(current.rows, stadiumsById)
    : current.rows

  const totalValue = current.rows.reduce((sum, row) => sum + (Number.isFinite(row.value) ? row.value : 0), 0)
  const safeTotalValue = Number.isFinite(totalValue) ? totalValue : 0

  const vendorGridIds = ['vendedores', 'portabilidade', 'novo', 'clt', 'gerentes']

  return (
    <Motion.section
      key={current.id}
      className={`rank-card has-gradient${isWorldCup ? ' games-card' : ''}`}
      variants={prefersReducedMotion ? undefined : pageMotion}
      initial={prefersReducedMotion ? false : 'initial'}
      animate={prefersReducedMotion ? undefined : 'animate'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      transition={{ duration: 0.42, ease: 'easeOut' }}
    >
      <div className="rank-head">
        <div>
          <p className="eyebrow">{current.kicker}</p>
          <h1>{current.title}</h1>
        </div>
        <div className="rank-status">
          <div className="status-pills" aria-label="Contexto visual do tema">
            <span className="status-pill status-pill-active">{isWorldCup ? 'Ao vivo' : 'Ranking'}</span>
            <span className="status-pill">VieiraCred</span>
          </div>
          <img className="brand-logo" src="/logo-vieira-bolinha.webp" alt="VieiraCred" />
        </div>
      </div>

      <Motion.div
        className={`rank-grid${vendorGridIds.includes(current.id) ? ' vendors-grid' : ''}${isWorldCup ? ' games-grid' : ''}`}
        variants={prefersReducedMotion ? undefined : gridMotion}
        initial={prefersReducedMotion ? false : 'initial'}
        animate={prefersReducedMotion ? undefined : 'animate'}
      >
        {isWorldCup ? (
          visibleRows.length === 0 ? (
            <div className="empty-state">
              {worldCupGamesLoading || (!worldCupGamesReady && !worldCupGamesError)
                ? 'Carregando os jogos de hoje...'
                : worldCupGamesError
                  ? 'Não foi possível carregar os jogos da ESPN.'
                  : 'Nenhum jogo de hoje foi encontrado.'}
            </div>
          ) : (
            <div className="games-table is-scroller">
              <GamesScroller
                games={visibleRows}
                stadiumsById={stadiumsById}
                prefersReducedMotion={prefersReducedMotion}
              />
            </div>
          )
        ) : current.rows.length === 0 ? (
          <div className="empty-state">
            {isBeforeStart
              ? 'Estamos aguardando as primeiras vendas do dia. Bora movimentar o ranking!'
              : hasTimeout
                ? 'Não foi possível carregar os dados. Verifique a API/Backend ou acione o time de planejamento.'
                : 'Aguardando dados da API...'}
          </div>
        ) : (
          current.rows.map((row, index) => (
            <RankRow
              key={`${current.id}-${row.name}`}
              row={row}
              index={index}
              currentId={current.id}
              safeTotalValue={safeTotalValue}
              currencyFormatter={currencyFormatter}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))
        )}
      </Motion.div>

      <div className="rank-footer">
        <div className="progress">
          {canRotate ? (
            <div
              key={cycleKey}
              className="progress-bar"
              style={{ '--rotation-duration': `${ROTATION_INTERVAL}ms` }}
            />
          ) : (
            <div className="progress-bar paused" />
          )}
        </div>
        <div className="footer-row">
          <p className="footnote accent">
            {isWorldCup
              ? 'Fonte: ESPN API (site.api.espn.com) · horários convertidos para Brasília'
              : 'Filtro utilizado no New Corban: Formalizado => Hoje; Pequenas diferenças podem ocorrer devido ao atraso da API.'}
          </p>
          {!showIntro ? (
            <div className="nav-controls" aria-label="Controles do ranking">
              <Motion.button
                type="button"
                className="nav-btn"
                onClick={onPrev}
                aria-label="Voltar ranking"
                whileHover={prefersReducedMotion ? undefined : { y: -1, scale: 1.06 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
              >
                <ControlIcon type="prev" />
              </Motion.button>
              <Motion.button
                type="button"
                className="nav-btn"
                onClick={onTogglePause}
                aria-label="Pausar ou continuar"
                whileHover={prefersReducedMotion ? undefined : { y: -1, scale: 1.06, rotateZ: 4 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
              >
                <ControlIcon type={isPaused ? 'play' : 'pause'} />
              </Motion.button>
              <Motion.button
                type="button"
                className="nav-btn"
                onClick={onNext}
                aria-label="Próximo ranking"
                whileHover={prefersReducedMotion ? undefined : { y: -1, scale: 1.06, rotateX: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
              >
                <ControlIcon type="next" />
              </Motion.button>
            </div>
          ) : null}
        </div>
      </div>
    </Motion.section>
  )
}
