import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import './App.css'

import { COPA_2026_STADIUMS_BY_ID } from '../lib/stadiumData.js'
import { ROTATION_INTERVAL } from './lib/constants.js'
import { formatApiDateKey } from './lib/gameUtils.js'
import { baseRankings, preserveWorldCupRanking } from './lib/rankings.js'

import { useRankingData } from './hooks/useRankingData.js'
import { useWorldCupGames } from './hooks/useWorldCupGames.js'
import { useSpotlight } from './hooks/useSpotlight.js'
import { useGoalModal } from './hooks/useGoalModal.js'

import IntroScreen from './components/IntroScreen.jsx'
import SkeletonLoader from './components/SkeletonLoader.jsx'
import RankCard from './components/RankCard.jsx'
import SpotlightOverlay from './components/SpotlightOverlay.jsx'
import GoalModal from './components/GoalModal.jsx'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

function App() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [cycleKey, setCycleKey] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const activeIndexRef = useRef(0)
  const prefersReducedMotion = useReducedMotion()

  // Clock tick every minute (for "today" key recalculation)
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Ranking data
  const { rankings, setRankings, isLoading, hasData, hasTimeout, fetchData, isMountedRef } = useRankingData()
  const rankingsRef = useRef(rankings)

  // Ensure worldcup-games entry is always present in rankings list
  useEffect(() => {
    if (!rankings.some((r) => r.id === 'worldcup-games')) {
      setRankings((prev) => preserveWorldCupRanking(prev))
    }
  }, [rankings, setRankings])

  const current = rankings[activeIndex] || baseRankings[0]
  const todayKey = formatApiDateKey(now)

  // ESPN games polling
  const { worldCupGamesLoading, worldCupGamesReady, worldCupGamesError } = useWorldCupGames({
    currentId: current.id,
    todayKey,
    isMountedRef,
    setRankings,
  })

  // Spotlight overlay
  const { showSpotlight, spotlightRankingId, spotlightRow, openSpotlightForRanking, closeSpotlight } = useSpotlight()

  // Goal modal + GSAP animation
  const { showGoalModal, goalEvents, closeGoalModal, goalModalShellRef } = useGoalModal({
    currentId: current.id,
    currentRows: current.rows,
    worldCupGamesReady,
    prefersReducedMotion,
  })

  // Sync refs to state for use inside timer callbacks (evita reiniciar timers em updates de dados)
  useEffect(() => { activeIndexRef.current = activeIndex }, [activeIndex])
  useEffect(() => { rankingsRef.current = rankings }, [rankings])

  // Intro timer — 5 seconds on first load
  useEffect(() => {
    if (!showIntro) return undefined
    const timer = setTimeout(() => {
      setShowIntro(false)
      activeIndexRef.current = 0
      setActiveIndex(0)
      setCycleKey((prev) => prev + 1)
    }, 5000)
    return () => clearTimeout(timer)
  }, [showIntro])

  // Trigger spotlight when ranking changes
  useEffect(() => {
    if (showIntro || isLoading || !hasData) { closeSpotlight(); return undefined }
    if (showSpotlight || spotlightRankingId === current.id) return undefined
    openSpotlightForRanking(current)
  }, [
    closeSpotlight,
    current,
    hasData,
    isLoading,
    openSpotlightForRanking,
    showIntro,
    showSpotlight,
    spotlightRankingId,
  ])

  // Auto-rotation
  const canRotate = hasData && !isLoading && !isPaused && !showIntro && !showGoalModal
    && (current.id !== 'worldcup-games' || worldCupGamesReady)

  useEffect(() => {
    if (!hasData || showIntro || isPaused || showSpotlight || showGoalModal) return undefined

    // Lê `rankings` via ref: o polling de jogos atualiza a lista a cada 30s e não
    // deve reiniciar este timer (senão a aba de jogos nunca avança de página).
    const timer = setTimeout(() => {
      const list = rankingsRef.current.length ? rankingsRef.current : baseRankings
      const nextIndex = (activeIndexRef.current + 1) % list.length
      const nextRanking = list[nextIndex] || baseRankings[nextIndex] || baseRankings[0]
      activeIndexRef.current = nextIndex
      setActiveIndex(nextIndex)
      setCycleKey((prev) => prev + 1)
      openSpotlightForRanking(nextRanking)

      if (nextIndex === 0) {
        setShowIntro(true)
        fetchData()
      }
    }, ROTATION_INTERVAL)

    return () => clearTimeout(timer)
  }, [activeIndex, fetchData, hasData, isPaused, openSpotlightForRanking, showGoalModal, showIntro, showSpotlight])

  // Keyboard: Escape closes modals
  useEffect(() => {
    if (!showSpotlight && !showGoalModal) return undefined
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { closeSpotlight(); closeGoalModal() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeGoalModal, closeSpotlight, showGoalModal, showSpotlight])

  const handleNext = useCallback(() => {
    if (!hasData) return
    const next = (activeIndexRef.current + 1) % rankings.length
    activeIndexRef.current = next
    setActiveIndex(next)
    setCycleKey((prev) => prev + 1)
    openSpotlightForRanking(rankings[next] || baseRankings[0])
  }, [hasData, openSpotlightForRanking, rankings])

  const handlePrev = useCallback(() => {
    if (!hasData) return
    const next = (activeIndexRef.current - 1 + rankings.length) % rankings.length
    activeIndexRef.current = next
    setActiveIndex(next)
    setCycleKey((prev) => prev + 1)
    openSpotlightForRanking(rankings[next] || baseRankings[0])
  }, [hasData, openSpotlightForRanking, rankings])

  const handleTogglePause = useCallback(() => setIsPaused((prev) => !prev), [])

  return (
    <div className="app">
      <main className="board">
        <AnimatePresence mode="wait">
          {showIntro ? (
            <IntroScreen key="intro" prefersReducedMotion={prefersReducedMotion} />
          ) : isLoading && !hasData ? (
            <SkeletonLoader key="skeleton" prefersReducedMotion={prefersReducedMotion} />
          ) : (
            <RankCard
              key={current.id}
              current={current}
              isLoading={isLoading}
              hasData={hasData}
              hasTimeout={hasTimeout}
              worldCupGamesLoading={worldCupGamesLoading}
              worldCupGamesReady={worldCupGamesReady}
              worldCupGamesError={worldCupGamesError}
              isPaused={isPaused}
              showIntro={showIntro}
              canRotate={canRotate}
              cycleKey={cycleKey}
              prefersReducedMotion={prefersReducedMotion}
              stadiumsById={COPA_2026_STADIUMS_BY_ID}
              currencyFormatter={currencyFormatter}
              onPrev={handlePrev}
              onNext={handleNext}
              onTogglePause={handleTogglePause}
              now={now}
            />
          )}
        </AnimatePresence>

        <SpotlightOverlay
          show={showSpotlight}
          spotlightRow={spotlightRow}
          spotlightRankingId={spotlightRankingId}
          prefersReducedMotion={prefersReducedMotion}
          currencyFormatter={currencyFormatter}
        />

        <GoalModal
          show={showGoalModal}
          goalEvents={goalEvents}
          goalModalShellRef={goalModalShellRef}
          prefersReducedMotion={prefersReducedMotion}
        />
      </main>
    </div>
  )
}

export default App
