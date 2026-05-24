'use client'

/**
 * CustomCursor — gold-ring + precision-dot cursor overlay.
 *
 * Only activates on fine-pointer (mouse) devices, and only when the
 * user hasn't explicitly disabled it via Settings → Appearance.
 *
 * The outer ring follows with a small lerp lag for a "magnetic" feel
 * (kept small — too much lag makes clicking feel imprecise).
 * The inner dot snaps to the exact pointer position and stays
 * exactly there during clicks — it is the precision indicator.
 *
 * Visual states:
 *   default   — gold ring at 55% opacity
 *   --hover   — expanded glow ring when over interactive elements
 *   --click   — ring scales down for tactile feedback; dot stays put
 *
 * Respects prefers-reduced-motion: sets LERP = 1 (instant snap, no lag).
 * SSR-safe: returns null until effect confirms mouse device.
 *
 * Importantly: this component toggles `body.wr-cursor-active` so the
 * native cursor is hidden ONLY when our cursor is actually rendering.
 * If this component is disabled or unmounted, the OS cursor returns.
 */

import { useEffect, useRef, useState } from 'react'

// A more responsive lag — the previous 0.12 felt like 500ms to catch
// up which made the cursor look like it was still moving when you
// clicked. 0.35 keeps a hint of trail without losing precision.
const LERP_NORMAL = 0.35
const LERP_REDUCED = 1

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label, [data-interactive]'

export const CURSOR_DISABLED_STORAGE_KEY = 'warroom_cursor_disabled'

/** Cheap synchronous read of the user's cursor preference. */
function isCursorDisabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(CURSOR_DISABLED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [render, setRender] = useState(false)

  useEffect(() => {
    // Don't activate on touch / stylus / non-mouse devices
    if (!window.matchMedia('(pointer: fine)').matches) return

    // User explicitly disabled the custom cursor
    if (isCursorDisabled()) return

    setRender(true)
    document.body.classList.add('wr-cursor-active')

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

    // Listen for cross-tab / settings changes to the disabled preference
    const onStorage = (e: StorageEvent) => {
      if (e.key === CURSOR_DISABLED_STORAGE_KEY && e.newValue === 'true') {
        // Tear down — easiest is to ask the user to reload, but we can
        // just stop rendering the visuals and restore the native cursor.
        setRender(false)
        document.body.classList.remove('wr-cursor-active')
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      cancelAnimationFrame(raf)
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
