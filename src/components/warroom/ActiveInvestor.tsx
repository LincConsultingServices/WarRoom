'use client'

import { cn } from '@/lib/utils'
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
// portrait (or its CSS-fallback state), Cinzel name + house badge,
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
        'relative flex h-full flex-col gap-4 rounded-md border border-border/60 bg-card/70 p-5 backdrop-blur-sm',
        className,
      )}
    >
      {/* Heraldic sigil watermark — top-right corner of the panel. The image
          tag self-hides if the file is missing, so older investors without a
          generated sigil simply render without it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/investors/${investor.id}/sigil.webp`}
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-3 top-3 z-10 h-9 w-9 opacity-70 mix-blend-screen"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />

      <InvestorPortraitMedia
        investorId={investor.id}
        name={investor.name}
        state={portrait.state}
        assetKey={portrait.assetKey}
        sentiment={portrait.sentiment}
        portraitOverrideUrl={investorPortraitSrc(investor)}
      />

      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-xl font-semibold leading-tight tracking-wide text-foreground">
          {investor.name}
        </h2>
        {investor.primary_lens && (
          <span className="inline-block w-fit rounded-sm border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-amber-300">
            {investor.primary_lens}
          </span>
        )}
        {investor.bias_trait_name && (
          <p className="text-xs italic text-foreground/65">
            <span className="font-semibold not-italic uppercase tracking-wider text-foreground/40">
              Bias:&nbsp;
            </span>
            {investor.bias_trait_name}
          </p>
        )}
      </div>

      <DispositionMeter value={dispoTarget} className="mt-auto" />
    </aside>
  )
}
