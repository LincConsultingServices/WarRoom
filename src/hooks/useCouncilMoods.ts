'use client'

import type { InvestorScorecard } from '@/src/types'
import type { CouncilMood } from '@/src/components/warroom/CouncilMemberCard'
import type { Sentiment } from './useInvestorPortraitState'

// ============================================================
// useCouncilMoods
// ----------------------------------------------------------------
// Derives a `Record<investorId, CouncilMood>` map from the
// per-investor scorecards returned by `GET /warroom/scorecard`,
// with the currently-speaking investor's mood overridden by
// the live sentiment from useFeedbackSentiment (Phase 5).
//
// Strength ordering of signals (strongest first):
//   1. Active investor + live sentiment override
//   2. dealDecision  (PRIORITY_1 → impressed,
//                     PRIORITY_2 → interested,
//                     WALK_OUT   → hostile)
//   3. redFlag flag  → skeptical
//   4. primaryScore  (≥75 impressed, ≥55 interested,
//                     ≥35 neutral, <35 hostile)
//   5. No scorecard yet → neutral (default starting posture)
//
// Pure derivation. No effects, no fetching — the parent owns
// the data refresh schedule (polling, on round complete, etc.).
// ============================================================

const PRIORITY_TO_MOOD: Record<string, CouncilMood> = {
  PRIORITY_1: 'impressed',
  PRIORITY_2: 'interested',
  WALK_OUT: 'hostile',
}

const SENTIMENT_TO_MOOD: Record<Sentiment, CouncilMood> = {
  impressed: 'impressed',
  skeptical: 'skeptical',
  neutral: 'interested',
}

export interface UseCouncilMoodsInputs {
  /** All scorecards delivered so far. Order doesn't matter. */
  scorecards: InvestorScorecard[] | undefined
  /** The investor whose turn it currently is. */
  activeInvestorId?: string | null
  /** Live sentiment for the active investor (from useFeedbackSentiment). */
  activeInvestorSentiment?: Sentiment
  /** Override the default starting mood for investors without scorecards. */
  defaultMood?: CouncilMood
}

export function deriveMoodFromScorecard(card: InvestorScorecard): CouncilMood {
  const fromDecision = PRIORITY_TO_MOOD[card.dealDecision]
  if (fromDecision) return fromDecision
  if (card.redFlag) return 'skeptical'
  if (card.primaryScore >= 75) return 'impressed'
  if (card.primaryScore >= 55) return 'interested'
  if (card.primaryScore >= 35) return 'neutral'
  return 'hostile'
}

export function useCouncilMoods({
  scorecards,
  activeInvestorId,
  activeInvestorSentiment,
  defaultMood = 'neutral',
}: UseCouncilMoodsInputs): Record<string, CouncilMood> {
  const map: Record<string, CouncilMood> = {}

  if (scorecards) {
    // Newest scorecard for each investor wins — preserve last-write-wins
    // semantics in case the backend returns multiple rows per investor over time.
    for (const card of scorecards) {
      if (!card?.investorId) continue
      map[card.investorId] = deriveMoodFromScorecard(card)
    }
  }

  // Active investor's live sentiment overrides whatever the scorecard says.
  // While they're being grilled their mood should reflect THIS moment, not
  // the last completed round.
  if (activeInvestorId && activeInvestorSentiment) {
    map[activeInvestorId] = SENTIMENT_TO_MOOD[activeInvestorSentiment]
  } else if (activeInvestorId && !map[activeInvestorId]) {
    map[activeInvestorId] = defaultMood
  }

  return map
}
