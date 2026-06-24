import { AnimatePresence, motion as Motion } from 'framer-motion'
import { GOAL_FIREWORK_PARTICLES } from '../lib/constants.js'

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } },
}

const shellVariants = {
  initial: { opacity: 0, y: 18, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease: 'easeOut' } },
  exit: { opacity: 0, y: 10, scale: 0.99, transition: { duration: 0.16, ease: 'easeIn' } },
}

export default function GoalModal({ show, goalEvents, goalModalShellRef, prefersReducedMotion }) {
  return (
    <AnimatePresence>
      {show && goalEvents.length ? (
        <Motion.section
          key="goal-modal"
          className="spotlight-overlay goal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Gols ao vivo"
          variants={prefersReducedMotion ? undefined : overlayVariants}
          initial={prefersReducedMotion ? false : 'initial'}
          animate={prefersReducedMotion ? undefined : 'animate'}
          exit={prefersReducedMotion ? undefined : 'exit'}
        >
          <div className="goal-fireworks" aria-hidden="true">
            <div className="goal-callout">GOOOL!</div>
            {GOAL_FIREWORK_PARTICLES.map((particle) => (
              <span
                className="goal-firework-spark"
                data-angle={particle.angle}
                data-distance={particle.distance}
                key={particle.id}
              />
            ))}
          </div>
          <Motion.div
            ref={goalModalShellRef}
            className="goal-modal-shell"
            variants={prefersReducedMotion ? undefined : shellVariants}
            initial={prefersReducedMotion ? false : 'initial'}
            animate={prefersReducedMotion ? undefined : 'animate'}
            exit={prefersReducedMotion ? undefined : 'exit'}
          >
            <div className="goal-modal-card">
              <p className="goal-modal-kicker">Gol ao vivo</p>
              <h2>Atualização do placar</h2>
              <div className="goal-list">
                {goalEvents.map((goal) => (
                  <article className="goal-item" key={goal.id}>
                    <span className="goal-minute">{goal.minuteLabel || 'Gol'}</span>
                    <div className="goal-copy">
                      <strong>{goal.player}</strong>
                      <span>{goal.teamName}</span>
                      <small>{goal.matchLabel}</small>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Motion.div>
        </Motion.section>
      ) : null}
    </AnimatePresence>
  )
}
