import { useEffect, useRef, useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { pageMotion } from '../lib/motionVariants.js'
import { EUROPA5_ROTATION_INTERVAL } from '../lib/constants.js'
import ControlIcon from './ControlIcon.jsx'
import europa5Video from '../assets/Europa5 Comercial.mp4'

export default function Europa5Card({
  current, isPaused, canRotate, cycleKey,
  onPrev, onNext, onTogglePause, onVideoEnded,
}) {
  const videoRef = useRef(null)
  const [durationMs, setDurationMs] = useState(EUROPA5_ROTATION_INTERVAL)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isPaused) video.pause()
    else video.play().catch(() => {})
  }, [isPaused])

  return (
    <Motion.section
      key={current.id}
      className="rank-card e5-video-card"
      variants={pageMotion}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.42, ease: 'easeOut' }}
    >
      <video
        ref={videoRef}
        className="e5-video"
        src={europa5Video}
        autoPlay
        muted
        playsInline
        onEnded={onVideoEnded}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.target.duration)) setDurationMs(e.target.duration * 1000)
        }}
      />

      <div className="e5-video-footer">
        <div className="progress">
          {canRotate ? (
            <div key={`${cycleKey}-${durationMs}`} className="progress-bar" style={{ '--rotation-duration': `${durationMs}ms` }} />
          ) : (
            <div className="progress-bar paused" />
          )}
        </div>
        <div className="footer-row">
          <p className="footnote accent">Nova Europa 5 · europa5.vercel.app</p>
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
