import { motion as Motion } from 'framer-motion'
import { rowMotion } from '../lib/motionVariants.js'

export default function RankRow({ row, index, currentId, safeTotalValue, currencyFormatter, prefersReducedMotion }) {
  const rowValue = Number.isFinite(row.value) ? row.value : 0
  const share = safeTotalValue > 0 ? Math.round((rowValue / safeTotalValue) * 100) : 0
  const showAvatar = ['vendedores', 'portabilidade', 'novo', 'clt'].includes(currentId)
  const trophyClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''

  return (
    <Motion.article
      key={`${currentId}-${row.name}`}
      className={`rank-row${trophyClass ? ' podium' : ''}${showAvatar ? ' with-avatar' : ''}`}
      style={{ '--delay': `${index * 80}ms` }}
      variants={prefersReducedMotion ? undefined : rowMotion}
      initial={prefersReducedMotion ? false : 'initial'}
      animate={prefersReducedMotion ? undefined : 'animate'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      transition={{ duration: 0.34, ease: 'easeOut' }}
      whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.01, rotateX: 1.5, rotateY: -1 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.995 }}
    >
      <div className="rank-pos-wrap">
        <div className="rank-pos">{String(index + 1).padStart(2, '0')}</div>
        {trophyClass ? (
          <span className={`rank-trophy ${trophyClass}`} aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
              <path d="M7 2h10v2h3v3a5 5 0 0 1-5 5h-1.1A6 6 0 0 1 13 14.92V17h3v2H8v-2h3v-2.08A6 6 0 0 1 10.1 12H9a5 5 0 0 1-5-5V4h3V2zm0 4H6v1a3 3 0 0 0 3 3h.17A6 6 0 0 1 7 6zm11 0a6 6 0 0 1-2.17 4H15a3 3 0 0 0 3-3V6zm-9-2v2a4 4 0 1 0 8 0V4H9z" />
            </svg>
          </span>
        ) : null}
        {showAvatar ? (
          <div className="rank-avatar">
            {row.image ? (
              <img src={row.image} alt={row.name} loading="lazy" />
            ) : (
              <div className="rank-avatar-fallback">{row.name ? row.name.trim().charAt(0) : ''}</div>
            )}
          </div>
        ) : null}
      </div>
      <div className="rank-main">
        <div className="rank-name">{row.name}</div>
        {row.meta ? <div className="rank-meta">{row.meta}</div> : null}
      </div>
      <div className="rank-metrics">
        <div className="rank-value">{currencyFormatter.format(rowValue)}</div>
        <div className="rank-trend up">{share}%</div>
      </div>
    </Motion.article>
  )
}
