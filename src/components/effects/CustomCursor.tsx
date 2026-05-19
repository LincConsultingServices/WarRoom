'use client'

/**
 * CustomCursor — gold-ring + precision-dot cursor overlay.
 *
 * Only activates on fine-pointer (mouse) devices.
 * The outer ring follows with a lerp lag for a "magnetic" luxury feel.
 * The inner dot snaps to the exact pointer position.
 *
 * Visual states:
 *   default   — gold ring at 55% opacity
 *   --hover   — expanded glow ring when over interactive elements
 *   --click   — ring + dot scale down on mousedown
 *
 * Respects prefers-reduced-motion: sets LERP = 1 (instant snap, no lag).
 * SSR-safe: returns null until effect confirms mouse device.
 */

import { useEffect, useRef, useState } from 'react'

const LERP_NORMAL = 0.12
const LERP_REDUCED = 1

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label, [data-interactive]'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [render, setRender] = useState(false)

  useEffect(() => {
    // Don't activate on touch / stylus / non-mouse devices
    if (!window.matchMedia('(pointer: fine)').matches) return

    setRender(true)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const LERP = reducedMotion ? LERP_REDUCED : LERP_NORMAL

    // Shared position refs — mutated every RAF, never cause re-renders
    const exact = { x: -100, y: -100 }
    const lagged = { x: -100, y: -100 }
    let raf: number

    // ── Mouse move: dot follows exactly ──────────────────────
    const onMove = (e: MouseEvent) => {
      exact.x = e.clientX
      exact.y = e.clientY
      // Dot is 6px → center offset 3px
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${exact.x - 3}px, ${exact.y - 3}px)`
      }
    }

    // ── RAF loop: ring follows with lag ───────────────────────
    const tick = () => {
      lagged.x += (exact.x - lagged.x) * LERP
      lagged.y += (exact.y - lagged.y) * LERP
      // Ring is 32px → center offset 16px
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${lagged.x - 16}px, ${lagged.y - 16}px)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // ── Hover state ───────────────────────────────────────────
    const onOver = (e: MouseEvent) => {
      const isInteractive = !!(e.target as Element).closest(INTERACTIVE_SELECTOR)
      ringRef.current?.classList.toggle('wr-cursor--hover', isInteractive)
      dotRef.current?.classList.toggle('wr-cursor--hover', isInteractive)
    }

    // ── Click state ───────────────────────────────────────────
    const onDown = () => {
      ringRef.current?.classList.add('wr-cursor--click')
      dotRef.current?.classList.add('wr-cursor--click')
    }
    const onUp = () => {
      ringRef.current?.classList.remove('wr-cursor--click')
      dotRef.current?.classList.remove('wr-cursor--click')
    }

    // ── Window leave / enter — hide cursor at edge ────────────
    const onDocLeave = () => {
      if (dotRef.current) dotRef.current.style.opacity = '0'
      if (ringRef.current) ringRef.current.style.opacity = '0'
    }
    const onDocEnter = () => {
      if (dotRef.current) dotRef.current.style.removeProperty('opacity')
      if (ringRef.current) ringRef.current.style.removeProperty('opacity')
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onDocLeave)
    document.documentElement.addEventListener('mouseenter', onDocEnter)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.documentElement.removeEventListener('mouseleave', onDocLeave)
      document.documentElement.removeEventListener('mouseenter', onDocEnter)
    }
  }, [])

  if (!render) return null

  return (
    <>
      {/* Outer trailing ring — laggy, decorative */}
      <div ref={ringRef} className="wr-cursor-ring" aria-hidden="true" />
      {/* Inner precision dot — snaps instantly */}
      <div ref={dotRef} className="wr-cursor-dot" aria-hidden="true" />
    </>
  )
}
