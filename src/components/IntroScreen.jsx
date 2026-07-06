import { motion as Motion } from 'framer-motion'
import { pageMotion, introContentMotion, introItemMotion } from '../lib/motionVariants.js'

export default function IntroScreen({ prefersReducedMotion }) {
  return (
    <Motion.section
      key="intro"
      className="rank-card intro-screen has-gradient"
      variants={prefersReducedMotion ? undefined : pageMotion}
      initial={prefersReducedMotion ? false : 'initial'}
      animate={prefersReducedMotion ? undefined : 'animate'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <Motion.div
        className="intro-content"
        variants={prefersReducedMotion ? undefined : introContentMotion}
        initial={prefersReducedMotion ? false : 'initial'}
        animate={prefersReducedMotion ? undefined : 'animate'}
        exit={prefersReducedMotion ? undefined : 'exit'}
      >
        <Motion.p className="intro-title" variants={prefersReducedMotion ? undefined : introItemMotion}>
          Ranking Formalizado Grupo Vieira
        </Motion.p>
        <Motion.div className="intro-logo" variants={prefersReducedMotion ? undefined : introItemMotion}>
          <img src="/logo-vieira-bolinha.webp" alt="VieiraCred" />
        </Motion.div>
        <Motion.p className="intro-subtitle" variants={prefersReducedMotion ? undefined : introItemMotion}>
          Preparando os rankings...
        </Motion.p>
      </Motion.div>
    </Motion.section>
  )
}
