'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import type { Investor } from '@/src/types'
import { InvestorPortraitMedia } from './InvestorPortraitMedia'
import { DispositionMeter } from './DispositionMeter'
import { investorPortraitSrc } from '@/src/lib/investorAssets'
import {
  useInvestorPortraitState,
  type Sentiment,
} from '@/src/hooks/useInvestorPortraitState'

// ============================================================
// <ActiveInvestor /> — Left panel of the council chamber.
//
// Renders the investor currently holding the floor: large dramatic
// portrait (or its CSS-fallback state), display name + club badge,
// primary lens, bias trait, and the live disposition meter.
//
// State derives from the parent's signals — this component is
// purely presentational. It DOES NOT call the backend.
// ============================================================

interface ActiveInvestorProps {
  investor: Investor | null
  isSpeaking: boolean
  isAnswering: boolean
  isReacting: boolean
  isTransitioning?: boolean
  sentiment?: Sentiment
  /** 0-100. Falls back to a sentiment-derived default when undefined. */
  dispositionValue?: number
  className?: string
}

function sentimentToDisposition(sentiment: Sentiment): number {
  if (sentiment === 'impressed') return 78
  if (sentiment === 'skeptical') return 24
  return 50
}

export function ActiveInvestor({
  investor,
  isSpeaking,
  isAnswering,
  isReacting,
  isTransitioning = false,
  sentiment = 'neutral',
  dispositionValue,
  className,
}: ActiveInvestorProps) {
  const portrait = useInvestorPortraitState({
    isSpeaking,
    isAnswering,
    isReacting,
    isTransitioning,
    sentiment,
  })

  const dispoTarget = dispositionValue ?? sentimentToDisposition(sentiment)

  if (!investor) {
    return (
      <aside className={cn('flex h-full items-center justify-center text-foreground/50', className)}>
        <span className="font-display text-sm uppercase tracking-[0.2em]">
          The chamber stands silent…
        </span>
      </aside>
    )
  }

  return (
    <aside
      className={cn(
        'relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-md border border-border/60 bg-card/70 backdrop-blur-sm',
        className,
      )}
    >
      {/* Full-bleed portrait fills the whole panel — the investor dominates
          the left of the chamber. */}
      <InvestorPortraitMedia
        investorId={investor.id}
        name={investor.name}
        state={portrait.state}
        assetKey={portrait.assetKey}
        sentiment={portrait.sentiment}
        portraitOverrideUrl={investorPortraitSrc(investor)}
        fill
        className="!absolute inset-0 !rounded-none !border-0"
      />

      {/* Heraldic sigil watermark — top-right, above the portrait. Self-hides
          when the file is missing. */}
      <Image
        src={`/investors/${investor.id}/sigil.webp`}
        alt=""
        width={40}
        height={40}
        aria-hidden
        className="pointer-events-none absolute right-3 top-3 z-20 opacity-80 mix-blend-screen"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />

      {/* Metadata + disposition overlaid on a bottom scrim so the image stays full-height. */}
      <div
        className="relative z-10 mt-auto flex flex-col gap-2 px-4 pb-4 pt-12"
        style={{ background: 'linear-gradient(to top, rgba(8,6,4,0.92) 35%, rgba(8,6,4,0.55) 70%, transparent)' }}
      >
        <h2 className="font-display text-2xl font-semibold leading-tight tracking-wide text-white drop-shadow">
          {investor.name}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {investor.primary_lens && (
            <span className="inline-block w-fit rounded-sm border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-amber-300">
              {investor.primary_lens}
            </span>
          )}
          {investor.bias_trait_name && (
            <span className="text-xs italic text-white/70">
              <span className="font-semibold not-italic uppercase tracking-wider text-white/45">Bias:&nbsp;</span>
              {investor.bias_trait_name}
            </span>
          )}
        </div>
        <DispositionMeter value={dispoTarget} className="mt-1" />
      </div>
    </aside>
  )
}
