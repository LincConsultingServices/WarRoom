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
import { useAudioStore } from '@/src/state/audioStore'

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
  /** Pre-recorded voiceover MP3 path (e.g. `/audio/narrator/landing-first-visit-01-idle.mp3`). When set, it
   *  is played in addition to the appear SFX so the Oracle actually speaks. */
  voiceUrl?: string
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
    // Check the per-channel key first (set by AudioControls), then the legacy key.
    const ch = window.localStorage.getItem('wr_ch_narrator_muted')
    if (ch !== null) return ch === 'true'
    return window.localStorage.getItem(NARRATOR_MUTE_KEY) === 'true'
  } catch {
    return false
  }
}

// Shared HTMLAudioElement for narrator voiceovers. One instance so a new line
// instantly cancels any in-flight playback (no overlapping voices).
let narratorAudio: HTMLAudioElement | null = null

function playNarratorVoice(url: string | undefined): void {
  if (!url || typeof window === 'undefined') return
  try {
    if (narratorAudio) {
      narratorAudio.pause()
      narratorAudio.currentTime = 0
    } else {
      narratorAudio = new Audio()
      narratorAudio.preload = 'auto'
    }
    narratorAudio.src = url
    narratorAudio.volume = 0.85
    // Autoplay can be rejected before the first user gesture — fail silently.
    void narratorAudio.play().catch(() => { /* gated by browser */ })
  } catch {
    /* never throw from the store */
  }
}

function stopNarratorVoice(): void {
  if (narratorAudio) {
    try {
      narratorAudio.pause()
      narratorAudio.currentTime = 0
    } catch {
      /* ignore */
    }
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
    // Narrator SFX respects the global SFX channel
    useAudioStore.getState().playSfx((first.sfx as never) ?? 'narrator.appear')

    // Narrator Voice respects the Narrator channel
    if (!get().isMuted) {
      playNarratorVoice(first.voiceUrl)
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
      stopNarratorVoice()
      set({
        currentDialogue: null,
        currentMood: 'idle',
        targetElementId: null,
        isAnimating: false,
      })
      return
    }
    const [next, ...rest] = queue
    useAudioStore.getState().playSfx((next.sfx as never) ?? 'narrator.appear')
    if (!isMuted) {
      playNarratorVoice(next.voiceUrl)
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
    useAudioStore.getState().playSfx('narrator.appear')
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
    useAudioStore.getState().playSfx('narrator.dismiss')
    set({
      isVisible: false,
      isAnimating: false,
      currentDialogue: null,
      currentMood: 'idle',
      targetElementId: null,
      queue: [],
    })
    stopNarratorVoice()
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
