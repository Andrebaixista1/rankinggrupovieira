import { motion as Motion } from 'framer-motion'
import { pageMotion } from '../lib/motionVariants.js'

export default function SkeletonLoader({ prefersReducedMotion }) {
  return (
    <Motion.section
      key="skeleton"
      className="rank-card has-gradient"
      variants={prefersReducedMotion ? undefined : pageMotion}
      initial={prefersReducedMotion ? false : 'initial'}
      animate={prefersReducedMotion ? undefined : 'animate'}
      exit={prefersReducedMotion ? undefined : 'exit'}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="rank-head">
        <div>
          <div className="skeleton skeleton-eyebrow" />
          <div className="skeleton skeleton-title" />
        </div>
        <div className="rank-status">
          <img className="brand-logo" src="/logo-vieira-bolinha.webp" alt="VieiraCred" />
        </div>
      </div>

      <div className="rank-grid vendors-grid">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="rank-row with-avatar skeleton-row">
            <div className="rank-pos-wrap">
              <div className="skeleton skeleton-pos" />
              <div className="skeleton skeleton-avatar" />
            </div>
            <div className="rank-main">
              <div className="skeleton skeleton-name" />
              <div className="skeleton skeleton-meta" />
            </div>
            <div className="rank-metrics">
              <div className="skeleton skeleton-value" />
            </div>
          </div>
        ))}
      </div>

      <div className="rank-footer">
        <div className="progress">
          <div className="progress-bar paused" />
        </div>
        <div className="footer-row">
          <div className="skeleton skeleton-footnote" />
        </div>
      </div>
    </Motion.section>
  )
}
