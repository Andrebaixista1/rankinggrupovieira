import { useEffect, useLayoutEffect, useRef } from 'react'
import GameRow from './GameRow.jsx'

const VISIBLE_COUNT = 3
const SCROLL_SPEED_PX_PER_SEC = 28 // velocidade suave do auto-scroll
const EDGE_PAUSE_MS = 2000 // pausa ao chegar no topo/fim antes de inverter

export default function GamesScroller({ games, stadiumsById, prefersReducedMotion }) {
  const viewportRef = useRef(null)
  const trackRef = useRef(null)

  // Define a altura do viewport para caber exatamente VISIBLE_COUNT jogos.
  useLayoutEffect(() => {
    const track = trackRef.current
    const viewport = viewportRef.current
    if (!track || !viewport) return undefined

    const measure = () => {
      const rows = track.querySelectorAll('.game-row')
      if (!rows.length) return
      const count = Math.min(VISIBLE_COUNT, rows.length)
      const gap = parseFloat(getComputedStyle(track).rowGap) || 0
      let height = 0
      for (let i = 0; i < count; i += 1) height += rows[i].offsetHeight
      height += gap * (count - 1)
      viewport.style.height = `${Math.ceil(height)}px`
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [games])

  // Auto-scroll vai-e-volta (ping-pong) suave. NÃO respeita prefers-reduced-motion:
  // rolar é essencial para exibir todos os jogos (3 por vez), não é enfeite. TVs/kiosks
  // costumam ter "reduzir movimento" ligado, o que esconderia metade dos jogos.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return undefined

    let raf = 0
    let last = 0
    let direction = 1
    let pauseUntil = 0
    // Acumulador próprio em float: scrollTop do DOM trunca incrementos sub-pixel,
    // então mantemos a posição aqui e só escrevemos no scrollTop.
    let position = 0

    const step = (timestamp) => {
      if (!last) last = timestamp
      const delta = timestamp - last
      last = timestamp

      const max = viewport.scrollHeight - viewport.clientHeight
      if (max > 1 && timestamp >= pauseUntil) {
        position += direction * SCROLL_SPEED_PX_PER_SEC * (delta / 1000)
        if (position >= max) {
          position = max
          direction = -1
          pauseUntil = timestamp + EDGE_PAUSE_MS
        } else if (position <= 0) {
          position = 0
          direction = 1
          pauseUntil = timestamp + EDGE_PAUSE_MS
        }
        viewport.scrollTop = position
      }
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [games])

  return (
    <div className="games-scroll-viewport" ref={viewportRef}>
      <div className="games-table-body is-scroller" ref={trackRef}>
        {games.map((game, index) => (
          <GameRow
            key={`${game?.id || index}-${game?.local_date || index}`}
            game={game}
            index={index}
            stadiumsById={stadiumsById}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </div>
    </div>
  )
}
