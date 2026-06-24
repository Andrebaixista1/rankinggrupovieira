import { AnimatePresence, motion as Motion } from 'framer-motion'
import { SPOTLIGHT_LABELS } from '../lib/constants.js'

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } },
}

const shellVariants = {
  initial: { opacity: 0, y: 22, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, y: 10, scale: 0.99, transition: { duration: 0.16, ease: 'easeIn' } },
}

export default function SpotlightOverlay({ show, spotlightRow, spotlightRankingId, prefersReducedMotion, currencyFormatter }) {
  return (
    <AnimatePresence>
      {show && spotlightRow ? (
        <Motion.section
          key={`spotlight-${spotlightRankingId}`}
          className="spotlight-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Destaque do ranking ${SPOTLIGHT_LABELS[spotlightRankingId] || 'Grupo Vieira'}`}
          variants={prefersReducedMotion ? undefined : overlayVariants}
          initial={prefersReducedMotion ? false : 'initial'}
          animate={prefersReducedMotion ? undefined : 'animate'}
          exit={prefersReducedMotion ? undefined : 'exit'}
        >
          <Motion.div
            className="spotlight-shell"
            variants={prefersReducedMotion ? undefined : shellVariants}
            initial={prefersReducedMotion ? false : 'initial'}
            animate={prefersReducedMotion ? undefined : 'animate'}
            exit={prefersReducedMotion ? undefined : 'exit'}
          >
            <div className="spotlight-poster">
              <div className="spotlight-poster-art" aria-hidden="true" />
              <div className="spotlight-player-slot" aria-hidden="true">
                {spotlightRow.image ? (
                  <img src={spotlightRow.image} alt="" loading="eager" />
                ) : (
                  <div className="spotlight-player-fallback">
                    {spotlightRow.name ? spotlightRow.name.trim().charAt(0) : '1'}
                  </div>
                )}
              </div>
              <div className="spotlight-winner-card">
                <div className="spotlight-winner-copy">
                  <p className="spotlight-kicker">1º lugar</p>
                  <h2>{spotlightRow.name}</h2>
                  {spotlightRow.meta ? <p className="spotlight-meta">{spotlightRow.meta}</p> : null}
                  <strong>{currencyFormatter.format(Number.isFinite(spotlightRow.value) ? spotlightRow.value : 0)}</strong>
                </div>
              </div>
            </div>
          </Motion.div>
        </Motion.section>
      ) : null}
    </AnimatePresence>
  )
}
