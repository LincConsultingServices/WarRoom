import type { NarratorMood } from '@/src/state/narratorStore'

/**
 * FEATURE_INTROS — first-hover Grandmaster explanations, keyed by feature.
 *
 * The first time the founder hovers (or focuses) an important control, the
 * Grandmaster steps in, spotlights it, and explains what it does — once. After
 * that the feature stays silent (a `wr_feat_<key>` localStorage flag is set).
 *
 * Wired via `useFeatureIntro(key)` (src/hooks/useFeatureIntro.ts), which
 * reuses the existing narrator (`speak` → spotlight + voiceover). Voiceover
 * files follow `/audio/narrator/feature-<key>-01-<mood>.mp3` and are
 * fail-soft (silent until supplied — see ASSETS_REQUIRED.md).
 *
 * This map is append-only: add a key here, then spread `useFeatureIntro(key)`
 * onto the control. Copy stays in-world (the Grandmaster's voice).
 */
export interface FeatureIntro {
  text: string
  mood?: NarratorMood
}

export const FEATURE_INTROS: Record<string, FeatureIntro> = {
  // ── Dashboard / entry ─────────────────────────────────────────
  'dashboard-begin': {
    text: 'Beyond this door lies the Trial, founder. Press on when your resolve is steeled.',
    mood: 'pointing',
  },
  'assessment-start': {
    text: 'Seal your oath and enter the tournament. Nine stages stand between you and the War Room.',
    mood: 'pointing',
  },

  // ── Stage simulation ──────────────────────────────────────────
  'stage-submit': {
    text: 'When your testimony is ready, deliver it to the Board. They weigh every word.',
    mood: 'pointing',
  },
  'mentor-block': {
    text: 'Your mentors whisper counsel here. Call on your seconds wisely — you hold only a few.',
    mood: 'whispering',
  },

  // ── Chessboard ──────────────────────────────────────────────────
  'chessboard-pitch-record': {
    text: 'Raise your voice, founder. Sixty seconds to set the chamber alight with your pitch.',
    mood: 'warning',
  },
  'chessboard-investor-mic': {
    text: 'Speak your answer aloud. The investor listens for conviction, not polish.',
    mood: 'pointing',
  },

  // ── Negotiation ───────────────────────────────────────────────
  'negotiation-offer': {
    text: 'An offer on the table. Open it to barter — more coin often costs more of your runway.',
    mood: 'pointing',
  },

  // ── Transition ────────────────────────────────────────────────
  'snapshot-continue': {
    text: 'The next round awaits. Press on to face what unfolds.',
    mood: 'pointing',
  },
}

export type FeatureIntroKey = keyof typeof FEATURE_INTROS
