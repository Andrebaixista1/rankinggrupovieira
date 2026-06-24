import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GOAL_MODAL_DURATION } from '../lib/constants.js'
import { collectLiveGoalEvents, buildGoalEventsSignature } from '../lib/gameUtils.js'

export function useGoalModal({ currentId, currentRows, worldCupGamesReady, prefersReducedMotion }) {
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalEvents, setGoalEvents] = useState([])
  const timerRef = useRef(null)
  const shellRef = useRef(null)
  const lastSignatureRef = useRef('')

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  const closeGoalModal = useCallback(() => {
    clearTimer()
    setShowGoalModal(false)
    setGoalEvents([])
  }, [clearTimer])

  useEffect(() => {
    if (currentId !== 'worldcup-games' || !worldCupGamesReady || !currentRows.length) {
      closeGoalModal()
      lastSignatureRef.current = ''
      return undefined
    }

    const liveGoalEvents = collectLiveGoalEvents(currentRows)
    const nextSignature = buildGoalEventsSignature(liveGoalEvents)

    if (!nextSignature) {
      closeGoalModal()
      lastSignatureRef.current = ''
      return undefined
    }

    if (nextSignature === lastSignatureRef.current) return undefined

    lastSignatureRef.current = nextSignature
    clearTimer()
    setGoalEvents(liveGoalEvents)
    setShowGoalModal(true)

    timerRef.current = setTimeout(() => {
      setShowGoalModal(false)
      setGoalEvents([])
      timerRef.current = null
    }, GOAL_MODAL_DURATION)

    return undefined
  }, [clearTimer, closeGoalModal, currentId, currentRows, worldCupGamesReady])

  useEffect(() => {
    if (!showGoalModal || !goalEvents.length || prefersReducedMotion) return undefined

    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .set('.goal-firework-spark', { autoAlpha: 0, x: 0, y: 0, scale: 0.4 })
        .fromTo('.goal-callout', { autoAlpha: 0, y: 16, scale: 0.82 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: 'back.out(1.6)' }, 0.02)
        .to('.goal-firework-spark', { autoAlpha: 1, scale: 1, duration: 0.08, stagger: 0.012 }, 0.04)
        .to('.goal-firework-spark', {
          x: (_, t) => Math.cos((Number(t.dataset.angle) * Math.PI) / 180) * Number(t.dataset.distance),
          y: (_, t) => Math.sin((Number(t.dataset.angle) * Math.PI) / 180) * Number(t.dataset.distance),
          autoAlpha: 0,
          scale: 0,
          duration: 0.62,
          stagger: 0.012,
          ease: 'power2.out',
        }, 0.06)
        .to('.goal-callout', { autoAlpha: 0, y: -10, scale: 1.08, duration: 0.28, ease: 'power2.in' }, 0.82)
        .fromTo('.goal-modal-card', { autoAlpha: 0, y: 34, scale: 0.92, rotateX: 8, transformOrigin: '50% 55%' }, { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, duration: 0.34 }, 0.12)
        .fromTo('.goal-modal-kicker, .goal-modal-card h2', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.05 }, '-=0.16')
        .fromTo('.goal-item', { autoAlpha: 0, y: 20, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, stagger: 0.07 }, '-=0.1')
        .fromTo('.goal-minute', { scale: 0.65, rotate: -6 }, { scale: 1, rotate: 0, duration: 0.32, stagger: 0.07, ease: 'back.out(1.8)' }, '-=0.26')
    }, shellRef)

    return () => ctx.revert()
  }, [goalEvents.length, prefersReducedMotion, showGoalModal])

  useEffect(() => () => clearTimer(), [clearTimer])

  return { showGoalModal, goalEvents, closeGoalModal, goalModalShellRef: shellRef }
}
