'use client'

/**
 * narratorStore — Zustand store for the Oracle/Narrator subsystem.
 *
 * Manages: dialogue queue, current mood, spotlight target, visibility,
 * onboarding completion flags. Plays `narrator.appear` SFX through the
 * audioManager on each new line.
 *
 * SSR-safe — localStorage access is guarded.
 */

import { create } from 'zustand'
import { audioManager } from '@/lib/audio/audioManager'

export type NarratorMood =
  | 'idle'
  | 'speaking'
  | 'pointing'
  | 'celebrating'
  | 'warning'
  | 'whispering'

export interface NarratorLine {
  text: string
  mood?: NarratorMood
  /** ms to display before auto-advancing. 0 = wait for user. */
  duration?: number
  /** Element ID to spotlight while this line is active. */
  highlight?: string
  /** SFX key to play when this line begins (defaults to `narrator.appear`). */
  sfx?: string
  /** ms to wait before this line starts (after the prior one ends). */
  delay?: number
}

interface NarratorState {
  isVisible: boolean
  isAnimating: boolean
  currentDialogue: NarratorLine | null
  currentMood: NarratorMood
  targetElementId: string | null
  queue: NarratorLine[]
  isMuted: boolean
  onboardedPhases: Record<string, true>

  speak: (line: NarratorLine | NarratorLine[]) => void
  queueLines: (lines: NarratorLine[]) => void
  clearQueue: () => void
  nextLine: () => void
  pointAt: (elementId: string, dialogue: string, mood?: NarratorMood) => void
  dismiss: () => void
  toggleMute: () => void
  markOnboardingComplete: (phase: string) => void
  hasCompletedOnboarding: (phase: string) => boolean
}

const ONBOARDING_KEY_PREFIX = 'wr_onboarded_'
const NARRATOR_MUTE_KEY = 'wr_narrator_muted'

function loadOnboardedPhases(): Record<string, true> {
  if (typeof window === 'undefined') return {}
  const out: Record<string, true> = {}
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(ONBOARDING_KEY_PREFIX) && window.localStorage.getItem(k) === 'true') {
        out[k.slice(ONBOARDING_KEY_PREFIX.length)] = true
      }
    }
  } catch {
    /* localStorage unavailable */
  }
  return out
}

function loadNarratorMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(NARRATOR_MUTE_KEY) === 'true'
  } catch {
    return false
  }
}

export const useNarratorStore = create<NarratorState>((set, get) => ({
  isVisible: false,
  isAnimating: false,
  currentDialogue: null,
  currentMood: 'idle',
  targetElementId: null,
  queue: [],
  isMuted: loadNarratorMuted(),
  onboardedPhases: loadOnboardedPhases(),

  speak: (line) => {
    const incoming = Array.isArray(line) ? line : [line]
    if (incoming.length === 0) return
    const [first, ...rest] = incoming
    if (!get().isMuted) {
      audioManager.playSfx((first.sfx as never) ?? 'narrator.appear')
    }
    set({
      isVisible: true,
      isAnimating: true,
      currentDialogue: first,
      currentMood: first.mood ?? 'speaking',
      targetElementId: first.highlight ?? null,
      queue: rest,
    })
  },

  queueLines: (lines) => {
    if (lines.length === 0) return
    set((state) => ({ queue: [...state.queue, ...lines] }))
    if (!get().currentDialogue) {
      get().nextLine()
    }
  },

  clearQueue: () => set({ queue: [] }),

  nextLine: () => {
    const { queue, isMuted } = get()
    if (queue.length === 0) {
      set({
        currentDialogue: null,
        currentMood: 'idle',
        targetElementId: null,
        isAnimating: false,
      })
      return
    }
    const [next, ...rest] = queue
    if (!isMuted) {
      audioManager.playSfx((next.sfx as never) ?? 'narrator.appear')
    }
    set({
      isVisible: true,
      isAnimating: true,
      currentDialogue: next,
      currentMood: next.mood ?? 'speaking',
      targetElementId: next.highlight ?? null,
      queue: rest,
    })
  },

  pointAt: (elementId, dialogue, mood = 'pointing') => {
    if (!get().isMuted) {
      audioManager.playSfx('narrator.appear')
    }
    set({
      isVisible: true,
      isAnimating: true,
      currentDialogue: { text: dialogue, mood },
      currentMood: mood,
      targetElementId: elementId,
      queue: [],
    })
  },

  dismiss: () => {
    if (!get().isMuted) {
      audioManager.playSfx('narrator.dismiss')
    }
    set({
      isVisible: false,
      isAnimating: false,
      currentDialogue: null,
      currentMood: 'idle',
      targetElementId: null,
      queue: [],
    })
  },

  toggleMute: () => {
    const next = !get().isMuted
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(NARRATOR_MUTE_KEY, String(next))
      } catch {
        /* ignore */
      }
    }
    set({ isMuted: next })
  },

  markOnboardingComplete: (phase) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ONBOARDING_KEY_PREFIX + phase, 'true')
      } catch {
        /* ignore */
      }
    }
    set((state) => ({
      onboardedPhases: { ...state.onboardedPhases, [phase]: true },
    }))
  },

  hasCompletedOnboarding: (phase) => Boolean(get().onboardedPhases[phase]),
}))
