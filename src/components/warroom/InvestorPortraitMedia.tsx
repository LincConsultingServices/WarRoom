'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  getInvestorAssetUrl,
  type InvestorAssetKey,
  type ResolvedInvestorAsset,
} from '@/src/lib/investorAssets'
import type { PortraitState, Sentiment } from '@/src/hooks/useInvestorPortraitState'
import { AssetPlaceholder } from '@/src/components/effects/AssetPlaceholder'

// ============================================================
// <InvestorPortraitMedia />
// ----------------------------------------------------------------
// Renders the right media (video / image / SVG) for the active
// investor + portrait state, and falls back to a CSS-treated still
// when the requested asset (`speaking.webm`, `thinking.webm`, …)
// isn't on disk.
//
// Asset resolution:
//   1. Ask the resolver for the active `assetKey` (e.g. 'speaking').
//   2. If found → render <video>/<img>.
//   3. If not found → fall back to the portrait still + a CSS class
//      that matches the state's *feel*:
//        SPEAKING → warm pulse + glow
//        WAITING  → dim + slow float
//        REACTING.impressed → emerald glow
//        REACTING.skeptical → amber/red vignette
//        IDLE / NEXT → calm still
//
// Off-screen <video> elements are paused via IntersectionObserver
// to keep the page light when the chamber scrolls.
// ============================================================

interface InvestorPortraitMediaProps {
  investorId: string
  /** Investor name / fallback monogram source. */
  name: string
  state: PortraitState
  assetKey: InvestorAssetKey
  sentiment?: Sentiment
  className?: string
  /** Optional override for the portrait still. */
  portraitOverrideUrl?: string | null
  /** Fill the parent's height instead of a fixed 3:4 box (cinematic full-bleed). */
  fill?: boolean
}

interface ResolvedPair {
  active: ResolvedInvestorAsset
  portrait: ResolvedInvestorAsset
}

const EMPTY_PAIR: ResolvedPair = {
  active: { url: null, kind: 'fallback' },
  portrait: { url: null, kind: 'fallback' },
}

export function InvestorPortraitMedia({
  investorId,
  name,
  state,
  assetKey,
  sentiment = 'neutral',
  className,
  portraitOverrideUrl,
  fill = false,
}: InvestorPortraitMediaProps) {
  const [resolved, setResolved] = useState<ResolvedPair>(EMPTY_PAIR)
  const [portraitFailed, setPortraitFailed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Resolve the active asset + the portrait still in parallel.
  useEffect(() => {
    setPortraitFailed(false)
    let cancelled = false
    Promise.all([
      getInvestorAssetUrl(investorId, assetKey),
      getInvestorAssetUrl(investorId, 'portrait'),
    ]).then(([active, portrait]) => {
      if (cancelled) return
      setResolved({ active, portrait })
    })
    return () => {
      cancelled = true
    }
  }, [investorId, assetKey])

  // Pause off-screen videos to save CPU + bandwidth.
  useEffect(() => {
    const el = containerRef.current
    const video = videoRef.current
    if (!el || !video) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              /* autoplay rejected — fine */
            })
          } else {
            video.pause()
          }
        }
      },
      { threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [resolved.active.url])

  const portraitUrl = portraitOverrideUrl ?? resolved.portrait.url
  const treatmentClass = fallbackTreatmentClass(state, sentiment)

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden rounded-md border border-border bg-card',
        fill ? 'h-full' : 'aspect-[3/4]',
        treatmentClass,
        className,
      )}
      data-portrait-state={state}
      data-portrait-sentiment={sentiment}
    >
      {resolved.active.kind === 'video' && resolved.active.url ? (
        <video
          ref={videoRef}
          key={resolved.active.url}
          src={resolved.active.url}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      ) : resolved.active.kind === 'gif' && resolved.active.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved.active.url}
          alt={`${name}, ${describeState(state, sentiment)}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : portraitUrl && !portraitFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={portraitUrl}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setPortraitFailed(true)}
        />
      ) : (
        <>
          <FallbackMonogram name={name} />
          <AssetPlaceholder
            kind="image"
            label={`${name} portrait`}
            path={`public/investors/${investorId}/portrait.{webp,jpg,png}`}
            formatHint="3:4 · 720×960+ · ≤300KB"
            className="bg-[color:var(--color-warroom-obsidian)]/60"
          />
        </>
      )}

      {/* Treatment overlays per state — these layer on top of the portrait
          when the per-state asset is missing, giving the still a "mood" */}
      {state === 'REACTING' && sentiment === 'skeptical' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 35%, rgba(220, 38, 38, 0.28) 100%)',
          }}
        />
      )}
      {state === 'REACTING' && sentiment === 'impressed' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 ring-1 ring-emerald-400/50"
          style={{
            boxShadow: 'inset 0 0 60px rgba(16,185,129,0.25), 0 0 30px rgba(16,185,129,0.18)',
          }}
        />
      )}
      {state === 'SPEAKING' && resolved.active.kind === 'fallback' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 ring-1 ring-amber-300/50"
          style={{
            boxShadow: 'inset 0 0 70px rgba(245,158,11,0.18), 0 0 24px rgba(245,158,11,0.15)',
          }}
        />
      )}
    </div>
  )
}

function describeState(state: PortraitState, sentiment: Sentiment): string {
  if (state === 'SPEAKING') return 'speaking'
  if (state === 'WAITING') return 'considering your answer'
  if (state === 'REACTING') return sentiment
  if (state === 'NEXT') return 'preparing to yield the floor'
  return 'in repose'
}

function fallbackTreatmentClass(state: PortraitState, sentiment: Sentiment): string {
  if (state === 'WAITING') return 'opacity-80'
  if (state === 'SPEAKING') return 'animate-pulse [animation-duration:3s]'
  if (state === 'REACTING' && sentiment === 'impressed') return ''
  if (state === 'REACTING' && sentiment === 'skeptical') return ''
  return ''
}

function FallbackMonogram({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted via-card to-muted/40">
      <span className="font-display text-6xl font-bold tracking-wider text-foreground/40">
        {initials || '?'}
      </span>
    </div>
  )
}
