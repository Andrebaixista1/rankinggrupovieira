import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import gsap from 'gsap'
import { pageMotion, gridMotion, rowMotion } from '../lib/motionVariants.js'
import { ROTATION_INTERVAL } from '../lib/constants.js'
import { EUROPA5_BASES } from '../../lib/europa5Stats.js'
import ControlIcon from './ControlIcon.jsx'

const numberFormatter = new Intl.NumberFormat('pt-BR')
const BENEFITS_DELAY_MS = 2600
const STEPS_PHASE_MS = 15000

const BENEFITS = [
  'Consultas atualizadas em tempo real',
  'Melhor organização',
  'Multi consultas',
  'E muito mais',
]

const STEPS = [
  { title: 'Acesse europa5.vercel.app', desc: null },
  { title: 'Clique em "Recuperar senha"', desc: null },
  { title: 'Primeiro acesso?', desc: 'Use o mesmo login do New Corban' },
  { title: 'Já tem login?', desc: 'Informe login e WhatsApp e receba sua nova senha' },
]

const rightContainer = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.13, delayChildren: 0.7 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
}
const rightItem = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.36, ease: 'easeOut' } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.16 } },
}

function CountUp({ value, animate, className }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (!animate) { el.textContent = numberFormatter.format(Math.round(value)); return undefined }
    const obj = { v: 0 }
    const tween = gsap.to(obj, {
      v: value, duration: 1.6, ease: 'power2.out',
      onUpdate: () => { el.textContent = numberFormatter.format(Math.round(obj.v)) },
    })
    return () => tween.kill()
  }, [value, animate])
  return <span ref={ref} className={className}>{numberFormatter.format(0)}</span>
}

function Globe() {
  return (
    <svg className="e5-globe-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="url(#e5g)" strokeWidth="2" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="url(#e5g)" strokeWidth="2" />
      <path d="M2 12h20" stroke="url(#e5g)" strokeWidth="2" />
      <defs>
        <linearGradient id="e5g" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#007AFF" />
          <stop offset="1" stopColor="#00C7FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function BaseCard({ base, stat, index }) {
  const capacidade = stat?.capacidade ?? base.capacidade ?? 0
  return (
    <Motion.article
      className={`e5-base e5-base-${base.key}`}
      style={{ '--delay': `${index * 90}ms` }}
      variants={rowMotion}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <span className="e5-base-mark" aria-hidden="true">{base.nome.charAt(0)}</span>
      <div className="e5-base-num">
        {base.ilimitado ? <span className="e5-inf">∞</span> : <CountUp value={capacidade} animate />}
      </div>
      <div className="e5-base-label">{base.nome}</div>
      <div className="e5-base-desc">{base.desc}</div>
    </Motion.article>
  )
}

function BenefitsModal({ phase }) {
  const shellRef = useRef(null)

  // Entrada do card/globo/marca (uma vez). A lista da direita é animada pelo Framer.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .fromTo('.e5-benefits-overlay', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 })
        .fromTo('.e5-benefits-card', { autoAlpha: 0, scale: 0.92, y: 22 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.4 }, '-=0.08')
        .fromTo('.e5-globe', { scale: 0, rotate: -120, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.15')
        .fromTo('.e5-benefits-brand', { x: 96 }, { x: 0, duration: 0.55 }, '-=0.25')
        .fromTo('.e5-brand-name', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.3 }, '-=0.4')
        .fromTo('.e5-brand-sub', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, '-=0.18')
    }, shellRef)
    return () => ctx.revert()
  }, [])

  return (
    <div className="e5-benefits-overlay" ref={shellRef}>
      <div className="e5-benefits-card">
        <div className="e5-benefits-brand">
          <div className="e5-globe"><Globe /></div>
          <div className="e5-brand-name">Europa 5</div>
          <div className="e5-brand-sub">{phase === 'steps' ? 'Como criar seu acesso' : 'Plataforma de consultas'}</div>
        </div>

        <div className="e5-modal-right">
          <AnimatePresence mode="wait">
            {phase === 'benefits' ? (
              <Motion.ul key="benefits" className="e5-benefits-list" variants={rightContainer} initial="initial" animate="animate" exit="exit">
                {BENEFITS.map((text) => (
                  <Motion.li className="e5-benefit" key={text} variants={rightItem}>
                    <span className="e5-benefit-check" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.3L19 7" /></svg>
                    </span>
                    <span>{text}</span>
                  </Motion.li>
                ))}
              </Motion.ul>
            ) : (
              <Motion.ol key="steps" className="e5-steps" variants={rightContainer} initial="initial" animate="animate" exit="exit">
                {STEPS.map((step, i) => (
                  <Motion.li className="e5-step" key={step.title} variants={rightItem}>
                    <span className="e5-step-num" aria-hidden="true">{i + 1}</span>
                    <span className="e5-step-text">
                      <span className="e5-step-title">{step.title}</span>
                      {step.desc ? <span className="e5-step-desc">{step.desc}</span> : null}
                    </span>
                  </Motion.li>
                ))}
              </Motion.ol>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default function Europa5Card({
  current, stats, ready, isPaused, canRotate, cycleKey,
  onPrev, onNext, onTogglePause,
}) {
  const bases = stats?.bases || EUROPA5_BASES
  const statByKey = bases.reduce((acc, b) => { acc[b.key] = b; return acc }, {})
  const volume = stats?.volume || { consultas_realizadas: 0, capacidade_total: 0 }
  const animate = ready

  // Sequência: números → (2.6s) modal de benefícios → (15s) passo a passo de acesso.
  const [showBenefits, setShowBenefits] = useState(false)
  const [phase, setPhase] = useState('benefits')
  useEffect(() => {
    const t1 = setTimeout(() => setShowBenefits(true), BENEFITS_DELAY_MS)
    const t2 = setTimeout(() => setPhase('steps'), STEPS_PHASE_MS)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <Motion.section
      key={current.id}
      className="rank-card has-gradient e5-card"
      variants={pageMotion}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.42, ease: 'easeOut' }}
    >
      <div className="rank-head">
        <div>
          <p className="eyebrow">{current.kicker}</p>
          <h1>Nova Europa 5</h1>
        </div>
        <div className="rank-status">
          <div className="status-pills" aria-label="Plataforma de consultas">
            <span className="status-pill status-pill-active">Consultas</span>
            <span className="status-pill">VieiraCred</span>
          </div>
          <img className="brand-logo" src="/logo-vieira-copa.png" alt="VieiraCred" />
        </div>
      </div>

      <div className="e5-body">
        <p className="e5-tagline">CPF, benefício, saldo e contratos em segundos — em 4 bases integradas.</p>

        <Motion.div className="e5-bases" variants={gridMotion} initial="initial" animate="animate">
          {EUROPA5_BASES.map((base, index) => (
            <BaseCard key={base.key} base={base} stat={statByKey[base.key]} index={index} />
          ))}
        </Motion.div>

        <div className="e5-volume">
          <div className="e5-stat">
            <div className="e5-stat-num"><CountUp value={volume.consultas_realizadas} animate={animate} /></div>
            <div className="e5-stat-label">consultas processadas</div>
          </div>
          <div className="e5-stat-sep" aria-hidden="true" />
          <div className="e5-stat">
            <div className="e5-stat-num e5-stat-cap"><CountUp value={volume.capacidade_total} animate={animate} /></div>
            <div className="e5-stat-label">capacidade disponível</div>
          </div>
          <div className="e5-stat-sep" aria-hidden="true" />
          <div className="e5-stat">
            <div className="e5-stat-num">4</div>
            <div className="e5-stat-label">bases integradas</div>
          </div>
        </div>
      </div>

      {showBenefits ? <BenefitsModal phase={phase} /> : null}

      <div className="rank-footer">
        <div className="progress">
          {canRotate ? (
            <div key={cycleKey} className="progress-bar" style={{ '--rotation-duration': `${ROTATION_INTERVAL}ms` }} />
          ) : (
            <div className="progress-bar paused" />
          )}
        </div>
        <div className="footer-row">
          <p className="footnote accent">Fonte: Nova Europa 5 · app.apivieiracred.com.br · atualizado em tempo real</p>
          <div className="nav-controls" aria-label="Controles do ranking">
            <button type="button" className="nav-btn" onClick={onPrev} aria-label="Voltar"><ControlIcon type="prev" /></button>
            <button type="button" className="nav-btn" onClick={onTogglePause} aria-label="Pausar ou continuar"><ControlIcon type={isPaused ? 'play' : 'pause'} /></button>
            <button type="button" className="nav-btn" onClick={onNext} aria-label="Próximo"><ControlIcon type="next" /></button>
          </div>
        </div>
      </div>
    </Motion.section>
  )
}
