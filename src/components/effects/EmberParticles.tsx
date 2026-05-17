'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface EmberParticlesProps {
  className?: string
  density?: number
  speed?: number
  hueShift?: number
}

interface Ember {
  x: number
  y: number
  size: number
  vy: number
  vx: number
  life: number
  maxLife: number
  hue: number
}

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

export function EmberParticles({
  className,
  density = 40,
  speed = 1,
  hueShift = 0,
}: EmberParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia(reducedMotionQuery).matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let embers: Ember[] = []
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const { width, height } = parent.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = (initial = false): Ember => {
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      const maxLife = 2400 + Math.random() * 2600
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + Math.random() * 20,
        size: 1 + Math.random() * 2.4,
        vy: -(0.15 + Math.random() * 0.45) * speed,
        vx: (Math.random() - 0.5) * 0.25 * speed,
        life: 0,
        maxLife,
        hue: 28 + Math.random() * 22 + hueShift,
      }
    }

    const populate = () => {
      embers = Array.from({ length: density }, () => spawn(true))
    }

    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(48, now - last)
      last = now
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      for (let i = 0; i < embers.length; i++) {
        const e = embers[i]
        e.life += dt
        e.x += e.vx * (dt / 16)
        e.y += e.vy * (dt / 16)
        e.vx += (Math.random() - 0.5) * 0.02
        const t = e.life / e.maxLife
        const alpha = Math.max(0, Math.sin(Math.PI * Math.min(1, t)))
        const glow = e.size * 4
        const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, glow)
        grad.addColorStop(0, `hsla(${e.hue}, 95%, 65%, ${alpha * 0.85})`)
        grad.addColorStop(0.4, `hsla(${e.hue - 6}, 90%, 50%, ${alpha * 0.35})`)
        grad.addColorStop(1, `hsla(${e.hue - 10}, 90%, 40%, 0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(e.x, e.y, glow, 0, Math.PI * 2)
        ctx.fill()

        if (e.life >= e.maxLife || e.y < -20) {
          embers[i] = spawn(false)
        }
      }

      raf = requestAnimationFrame(frame)
    }

    resize()
    populate()
    raf = requestAnimationFrame(frame)

    const ro = new ResizeObserver(() => {
      resize()
      populate()
    })
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [density, speed, hueShift])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
    />
  )
}
