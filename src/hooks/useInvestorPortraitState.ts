'use client'

import { useEffect, useState } from 'react'
import type { InvestorAssetKey } from '@/src/lib/investorAssets'

// ============================================================
// useInvestorPortraitState
// ----------------------------------------------------------------
// Derives the active investor's "performance state" — which media
// asset to show right now — from the parent's pitch-loop signals.
//
// Single source of truth so the portrait media, disposition meter,
// council roster aura, and any other reactive UI agree on what
// the investor is doing this very second.
//
// States:
//   IDLE      — between turns; show still portrait
//   SPEAKING  — investor question audio is playing / question revealing
//   WAITING   — user is recording / typing their answer
//   REACTING  — AI feedback streaming back; sub-mode depends on sentiment
//   NEXT      — fading out before transitioning to a different investor
//
// The hook outputs the matching `InvestorAssetKey` so consumers
// can ask the asset resolver for the right file without duplicating
// mapping logic.
// ============================================================

export type PortraitState = 'IDLE' | 'SPEAKING' | 'WAITING' | 'REACTING' | 'NEXT'

export type Sentiment = 'impressed' | 'skeptical' | 'neutral'

export interface InvestorPortraitInputs {
  /** True while the investor's TTS audio is playing or the question is animating in. */
  isSpeaking: boolean
  /** True while the user is recording / typing their answer. */
  isAnswering: boolean
  /** True while we're awaiting / streaming the AI feedback. */
  isReacting: boolean
  /** True for the brief moment between active investors. */
  isTransitioning: boolean
  /** Sentiment from `useFeedbackSentiment` while REACTING. Ignored otherwise. */
  sentiment?: Sentiment
}

export interface PortraitDescriptor {
  state: PortraitState
  /** Key that <InvestorPortraitMedia/> + getInvestorAssetUrl() consume. */
  assetKey: InvestorAssetKey
  /** Convenience flag for consumers like the disposition meter. */
  sentiment: Sentiment
}

// Resolve current state from inputs. Priority: NEXT > SPEAKING > REACTING > WAITING > IDLE.
function resolveState(inputs: InvestorPortraitInputs): PortraitState {
  if (inputs.isTransitioning) return 'NEXT'
  if (inputs.isSpeaking) return 'SPEAKING'
  if (inputs.isReacting) return 'REACTING'
  if (inputs.isAnswering) return 'WAITING'
  return 'IDLE'
}

function resolveAssetKey(state: PortraitState, sentiment: Sentiment): InvestorAssetKey {
  switch (state) {
    case 'SPEAKING':
      return 'speaking'
    case 'WAITING':
      return 'thinking'
    case 'REACTING':
      if (sentiment === 'impressed') return 'impressed'
      if (sentiment === 'skeptical') return 'skeptical'
      return 'thinking'
    case 'NEXT':
    case 'IDLE':
    default:
      return 'portrait'
  }
}

export function useInvestorPortraitState(inputs: InvestorPortraitInputs): PortraitDescriptor {
  const sentiment: Sentiment = inputs.sentiment ?? 'neutral'
  const state = resolveState(inputs)
  const assetKey = resolveAssetKey(state, sentiment)
  return { state, assetKey, sentiment }
}

/**
 * Variant that smooths state churn — useful in production to avoid the portrait
 * blinking between WAITING/SPEAKING during a flaky audio probe. Only commits a
 * new state after it has held for `debounceMs`.
 */
export function useDebouncedInvestorPortraitState(
  inputs: InvestorPortraitInputs,
  debounceMs = 140,
): PortraitDescriptor {
  const live = useInvestorPortraitState(inputs)
  const [debounced, setDebounced] = useState<PortraitDescriptor>(live)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(live), debounceMs)
    return () => window.clearTimeout(t)
  }, [live.state, live.assetKey, live.sentiment, debounceMs, live])

  return debounced
}
