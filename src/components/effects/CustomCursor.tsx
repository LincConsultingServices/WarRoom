'use client'

/**
 * CustomCursor — standard pointer-arrow cursor, chess gold/brass themed,
 * with a canvas-based silver/gold particle trail.
 *
 * Renders a normal arrow-cursor silhouette (not a chess piece) tinted with
 * the app's gold/brass palette, at the pointer hot-spot. A full-viewport
 * canvas draws silver/gold motes that drift upward. Only activates on
 * fine-pointer (mouse) devices.
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
      {/* Standard arrow cursor, chess gold/brass themed */}
      <div
        ref={arrowRef}
        className="wr-cursor"
        aria-hidden="true"
        style={{ transform: 'translate(-200px, -200px)' }}
      >
        <svg
          viewBox="0 0 24 24"
          width={24}
          height={24}
          aria-hidden="true"
          className="wr-cursor__arrow"
        >
          <defs>
            <linearGradient id="wrCursorGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff3d6" />
              <stop offset="35%" stopColor="var(--wr-gold-bright)" />
              <stop offset="75%" stopColor="var(--wr-gold)" />
              <stop offset="100%" stopColor="var(--wr-electrum)" />
            </linearGradient>
          </defs>
          {/* Standard pointer-arrow silhouette */}
          <path
            d="m4 4 7.07 17 2.51-7.39L21 11.07Z"
            fill="url(#wrCursorGold)"
            stroke="rgba(0,0,0,0.75)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  )
}
