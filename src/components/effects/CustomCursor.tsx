'use client'

/**
 * CustomCursor — chess piece cursor with canvas-based silver particle trail.
 *
 * Renders a minimal chess knight SVG at the pointer hot-spot.
 * A full-viewport canvas draws silver/gold motes that drift upward.
 * Only activates on fine-pointer (mouse) devices.
 */

import { useEffect, useRef } from 'react'

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label, [data-interactive]'

export const CURSOR_DISABLED_STORAGE_KEY = 'chessboard_cursor_disabled'

function isCursorDisabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(CURSOR_DISABLED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

interface Mote {
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  size: number
  life: number
  decay: number
  silver: boolean
}

const MOTE_POOL_MAX = 24
const SPAWN_RATE = 0.35

function spawnMote(x: number, y: number, hovering: boolean): Mote {
  const angle = Math.random() * Math.PI * 2
  const speed = 0.4 + Math.random() * (hovering ? 1.4 : 0.9)
  return {
    x: x + (Math.random() - 0.5) * 8,
    y: y + (Math.random() - 0.5) * 6,
    vx: Math.cos(angle) * speed * 0.45,
    vy: -speed * (0.6 + Math.random() * 0.4),
    ax: (Math.random() - 0.5) * 0.04,
    size: 0.5 + Math.random() * (hovering ? 1.3 : 0.9),
    life: 0,
    decay: 0.014 + Math.random() * 0.016,
    silver: Math.random() > 0.4,
  }
}

export function CustomCursor() {
  const arrowRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (isCursorDisabled()) return

    document.body.classList.add('wr-cursor-active')

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    let mx = -200, my = -200
    let hovering = false
    let clicking = false
    const motes: Mote[] = []
    let spawnAcc = 0
    let rafId = 0

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      const el = arrowRef.current
      if (el) el.style.transform = `translate(${mx}px, ${my}px)`
    }
    const onOver = (e: MouseEvent) => {
      hovering = !!(e.target as Element).closest(INTERACTIVE_SELECTOR)
      arrowRef.current?.classList.toggle('wr-cursor--hover', hovering)
    }
    const onDown = () => { clicking = true; arrowRef.current?.classList.add('wr-cursor--click') }
    const onUp = () => { clicking = false; arrowRef.current?.classList.remove('wr-cursor--click') }
    const onDocLeave = () => { if (arrowRef.current) arrowRef.current.style.opacity = '0' }
    const onDocEnter = () => { if (arrowRef.current) arrowRef.current.style.removeProperty('opacity') }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onDocLeave)
    document.documentElement.addEventListener('mouseenter', onDocEnter)

    const onStorage = (e: StorageEvent) => {
      if (e.key === CURSOR_DISABLED_STORAGE_KEY && e.newValue === 'true') {
        document.body.classList.remove('wr-cursor-active')
        cancelAnimationFrame(rafId)
      }
    }
    window.addEventListener('storage', onStorage)

    function tick() {
      rafId = requestAnimationFrame(tick)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const rate = SPAWN_RATE * (clicking ? 2.5 : hovering ? 1.8 : 1)
      spawnAcc += rate
      while (spawnAcc >= 1 && motes.length < MOTE_POOL_MAX) {
        motes.push(spawnMote(mx + 5, my + 8, hovering))
        spawnAcc -= 1
      }
      spawnAcc = Math.min(spawnAcc, rate)

      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i]
        m.life += m.decay
        if (m.life >= 1) { motes.splice(i, 1); continue }

        m.vx += m.ax
        m.vx *= 0.988
        m.vy *= 0.993
        m.x += m.vx
        m.y += m.vy

        const alpha = Math.sin(m.life * Math.PI) * 0.7
        const radius = m.size * (1 - m.life * 0.5)

        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, radius * 2.5)
        if (m.silver) {
          grad.addColorStop(0, `rgba(220, 220, 220, ${alpha})`)
          grad.addColorStop(0.5, `rgba(180, 180, 180, ${alpha * 0.6})`)
          grad.addColorStop(1, `rgba(160, 160, 160, 0)`)
        } else {
          grad.addColorStop(0, `rgba(220, 190, 100, ${alpha})`)
          grad.addColorStop(0.5, `rgba(200, 168, 74, ${alpha * 0.6})`)
          grad.addColorStop(1, `rgba(180, 148, 54, 0)`)
        }

        ctx.beginPath()
        ctx.arc(m.x, m.y, radius * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }
    }

    tick()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('storage', onStorage)
      document.documentElement.removeEventListener('mouseleave', onDocLeave)
      document.documentElement.removeEventListener('mouseenter', onDocEnter)
      document.body.classList.remove('wr-cursor-active')
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          pointerEvents: 'none', zIndex: 9998,
        }}
      />
      {/* Chess piece cursor — knight silhouette */}
      <div
        ref={arrowRef}
        className="wr-cursor"
        aria-hidden="true"
        style={{ transform: 'translate(-200px, -200px)' }}
      >
        <svg
          viewBox="0 0 24 28"
          width={32}
          height={36}
          aria-hidden="true"
          className="wr-cursor__arrow"
        >
          <defs>
            <linearGradient id="wrCursorSilver" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#d4d4d4" />
              <stop offset="70%" stopColor="#a0a0a0" />
              <stop offset="100%" stopColor="#7a7a7a" />
            </linearGradient>
          </defs>
          {/* Pawn shape */}
          <path
            d="M12,2a3,3,0,1,0,3,3A3,3,0,0,0,12,2Zm0,5A3.16,3.16,0,0,0,9,9c0,2,1,4.42,1,7H8v2h8V16H14c0-2.58,1-5,1-7A3.16,3.16,0,0,0,12,7ZM7,19v2H17V19Z"
            fill="url(#wrCursorSilver)"
            stroke="rgba(0,0,0,0.8)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  )
}
