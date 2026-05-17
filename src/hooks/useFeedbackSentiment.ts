'use client'

import type { Sentiment } from './useInvestorPortraitState'

// ============================================================
// useFeedbackSentiment
// ----------------------------------------------------------------
// Lightweight keyword-based sentiment classifier that runs over
// the REVEALED portion of an AI feedback string. Paired with
// useTypewriterReveal it lets the investor's portrait and the
// disposition meter "react" as the verdict reveals — without
// any new backend call.
//
// Output:
//   { score: -1..1, label: 'impressed'|'skeptical'|'neutral', confidence: 0..1 }
//
// Heuristic — bag of cues. NOT a replacement for proper sentiment
// analysis, but the backend's text is constrained enough that
// these cues track the founder's perceived performance reliably.
//
// Tuning: keep the lists short and high-signal so misfires
// (negation, sarcasm) don't dominate.
// ============================================================

const POSITIVE_CUES = [
  'excellent', 'strong', 'impressed', 'impressive', 'sharp', 'clarity',
  'brilliant', 'confident', 'conviction', 'persuasive', 'compelling',
  'ready', 'well-prepared', 'well prepared', 'thoughtful', 'sound',
  'credible', 'astute', 'insightful', 'commendable',
]

const NEGATIVE_CUES = [
  'weak', 'unclear', 'concern', 'concerned', 'fail', 'failed', 'doubt',
  'doubtful', 'wrong', 'dangerous', 'naive', 'naïve', 'missing', 'vague',
  'contradiction', 'contradict', 'inconsistent', 'shallow', 'risky',
  'unconvinced', 'unconvincing', 'unprepared', 'evasive', 'reckless',
]

// Words that flip the polarity of an adjacent cue. Tiny window —
// only check the token immediately preceding a hit.
const NEGATORS = new Set(['not', "isn't", 'no', 'never', 'lacks', 'lacking'])

export interface FeedbackSentimentResult {
  score: number
  label: Sentiment
  /** 0..1 — proportional to total hits over text length. */
  confidence: number
  positiveHits: number
  negativeHits: number
}

const NEUTRAL: FeedbackSentimentResult = {
  score: 0,
  label: 'neutral',
  confidence: 0,
  positiveHits: 0,
  negativeHits: 0,
}

export function analyseFeedbackSentiment(text: string): FeedbackSentimentResult {
  if (!text || !text.trim()) return NEUTRAL

  const lower = text.toLowerCase()

  // Tokenise for negation lookup (cheap split — Unicode-safe enough for this use)
  const tokens = lower.split(/[^a-zçëé']+/i).filter(Boolean)

  // For each cue, count occurrences (substring match — handles bigrams like "well prepared")
  // and check if the previous token negates it.
  let positiveHits = 0
  let negativeHits = 0

  const countCue = (cue: string): number => {
    if (!cue) return 0
    let count = 0
    let from = 0
    while (true) {
      const idx = lower.indexOf(cue, from)
      if (idx === -1) break
      // Word boundary check — avoid matching "strongly" via "strong"? Actually we WANT to
      // match "strongly" too, so we don't enforce a trailing boundary. We do enforce a
      // leading boundary so we don't match "instrumental" via "strong".
      const before = idx === 0 ? ' ' : lower[idx - 1]
      if (/[a-z]/.test(before)) {
        from = idx + cue.length
        continue
      }
      count += 1
      from = idx + cue.length
    }
    return count
  }

  for (const cue of POSITIVE_CUES) {
    const hits = countCue(cue)
    if (!hits) continue
    // Cheap negation check — does any "not X" appear?
    const negated = NEGATORS.has(prevTokenOfCue(tokens, cue))
    if (negated) negativeHits += hits
    else positiveHits += hits
  }
  for (const cue of NEGATIVE_CUES) {
    const hits = countCue(cue)
    if (!hits) continue
    const negated = NEGATORS.has(prevTokenOfCue(tokens, cue))
    if (negated) positiveHits += hits
    else negativeHits += hits
  }

  const total = positiveHits + negativeHits
  if (total === 0) return NEUTRAL

  const raw = (positiveHits - negativeHits) / total
  // Clamp + small dead zone so a single hit doesn't flip the verdict
  let label: Sentiment = 'neutral'
  if (raw >= 0.34) label = 'impressed'
  else if (raw <= -0.34) label = 'skeptical'

  // Confidence rises with total signal but caps quickly
  const confidence = Math.min(1, total / 4)

  return {
    score: raw,
    label,
    confidence,
    positiveHits,
    negativeHits,
  }
}

// First token before the first occurrence of cue in the tokenised text.
// Returns '' when no preceding token exists or cue isn't present.
function prevTokenOfCue(tokens: string[], cue: string): string {
  const firstWord = cue.split(' ')[0]
  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i] === firstWord) return tokens[i - 1]
  }
  return ''
}

/**
 * Hook form — pure derivation, no state. Re-runs every render
 * but the implementation is O(text length × cue count); negligible
 * for feedback strings under ~2KB.
 */
export function useFeedbackSentiment(text: string): FeedbackSentimentResult {
  return analyseFeedbackSentiment(text)
}
