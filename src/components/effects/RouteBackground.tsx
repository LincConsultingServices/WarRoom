'use client'

import { useEffect, useState } from 'react'
import { ASSET_REGISTRY } from '@/lib/assets/assetRegistry'

type BgKey = keyof typeof ASSET_REGISTRY.backgrounds

interface RouteBackgroundProps {
  /** Which background plate to render. Keys come from ASSET_REGISTRY.backgrounds. */
  bg: BgKey
  /**
   * Optional brightness override (0..1). Defaults to 0.35 per
   * ASSETS_REQUIRED.md so gold/ivory copy remains legible.
   */
  brightness?: number
}

/**
 * <RouteBackground /> — full-viewport fixed background plate.
 *
 * Probes the image at mount; renders it only when the browser
 * successfully decoded it, so a missing file shows the existing
 * CSS gradient fallback the page already provides.
 *
 * Sits at z-index -10 behind every other layer. Pointer-events
 * disabled so it never captures clicks.
 */
export function RouteBackground({ bg, brightness = 0.35 }: RouteBackgroundProps) {
  const src = ASSET_REGISTRY.backgrounds[bg]
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setLoaded(true)
    }
    img.onerror = () => {
      if (!cancelled) setFailed(true)
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  if (failed || !loaded) return null

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage: `url("${src}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: `brightness(${brightness})`,
        }}
      />
      {/* Cinematic vignette — CSS radial gradient from transparent center to black edges */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 40%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.85) 100%)',
          mixBlendMode: 'multiply',
        }}
      />
    </>
  )
}
