'use client'

import { useCallback, useMemo } from 'react'
import { useNarratorStore } from '@/src/state/narratorStore'
import { FEATURE_INTROS } from '@/lib/narrator/featureIntros'

// ============================================================
// useFeatureIntro — first-hover Oracle explanation for a control.
//
// Spread the returned props onto any interactive element:
//
//   const intro = useFeatureIntro('mentor-block')
//   <div {...intro}> … </div>
//
// On the FIRST hover/focus (per device, tracked in localStorage), the
// Oracle speaks the matching line from FEATURE_INTROS and spotlights
// the element. Every visit after that is silent. Respects the narrator
// mute flag and only fires on fine-pointer (mouse) devices for hover —
// focus always works for keyboard users.
// ============================================================

const FEATURE_FLAG_PREFIX = 'wr_feat_'

interface UseFeatureIntroOptions {
  /** Override the element id (e.g. to reuse an existing spotlight target). */
  elementId?: string
  /** Skip entirely (e.g. control not yet ready / disabled). */
  enabled?: boolean
}

function hasSeen(key: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(FEATURE_FLAG_PREFIX + key) === 'true'
  } catch {
    return true
  }
}

function markSeen(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(FEATURE_FLAG_PREFIX + key, 'true')
  } catch {
    /* ignore */
  }
}

export function useFeatureIntro(key: string, options: UseFeatureIntroOptions = {}) {
  const { elementId, enabled = true } = options
  const id = elementId ?? `feature-intro-${key}`

  const trigger = useCallback(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return
    const intro = FEATURE_INTROS[key]
    if (!intro) return
    if (hasSeen(key)) return
    if (useNarratorStore.getState().isMuted) return

    markSeen(key)
    const mood = intro.mood ?? 'pointing'
    // Reading time scales with line length; clamp to a sane window.
    const duration = Math.min(9000, Math.max(4500, intro.text.length * 55))
    useNarratorStore.getState().speak([
      {
        text: intro.text,
        mood,
        highlight: id,
        duration,
        voiceUrl: `/audio/narrator/feature-${key}-01-${mood}.mp3`,
      },
    ])
  }, [key, id, enabled])

  const onMouseEnter = useCallback(() => {
    // Hover intros only for mouse users; touch users get them via focus/tap.
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return
    trigger()
  }, [trigger])

  return useMemo(
    () => ({ id, onMouseEnter, onFocus: trigger }),
    [id, onMouseEnter, trigger],
  )
}
