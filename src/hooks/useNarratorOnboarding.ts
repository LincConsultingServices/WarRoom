'use client'

import { useEffect } from 'react'
import { useNarratorStore } from '@/src/state/narratorStore'
import { NARRATOR_SCRIPTS } from '@/lib/narrator/scripts'

interface UseNarratorOnboardingOptions {
  /** ms to wait after mount before the script begins. Default 1500. */
  delayMs?: number
  /** Skip entirely (e.g. when the user has opted out). */
  enabled?: boolean
}

/**
 * useNarratorOnboarding — phase-gated narrator trigger.
 *
 * On mount: if `localStorage.wr_onboarded_{phase}` is absent, queues
 * the `'{phase}.first-visit'` script after `delayMs` and writes the
 * flag. If present, queues `'{phase}.returning'`. Phases that don't
 * have a returning script stay silent for return visitors.
 *
 * Safe to call unconditionally — checks for missing scripts and
 * fails silent.
 */
export function useNarratorOnboarding(
  phase: string,
  { delayMs = 1500, enabled = true }: UseNarratorOnboardingOptions = {},
) {
  const speak = useNarratorStore((s) => s.speak)
  const hasCompletedOnboarding = useNarratorStore((s) => s.hasCompletedOnboarding)
  const markOnboardingComplete = useNarratorStore((s) => s.markOnboardingComplete)

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const firstVisitKey = `${phase}.first-visit`
    const returningKey = `${phase}.returning`
    const isFirstVisit = !hasCompletedOnboarding(phase)
    const scriptKey = isFirstVisit ? firstVisitKey : returningKey
    const lines = NARRATOR_SCRIPTS[scriptKey]
    if (!lines || lines.length === 0) return

    const timer = window.setTimeout(() => {
      speak(lines)
      if (isFirstVisit) {
        markOnboardingComplete(phase)
      }
    }, delayMs)

    return () => window.clearTimeout(timer)
    // Phase + enabled changes restart; speak / mark / hasCompleted are stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, enabled, delayMs])
}
