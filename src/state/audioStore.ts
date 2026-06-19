'use client'

/**
 * audioStore — Zustand facade over `lib/audio/audioManager.ts`.
 * Per-channel mute flags:
 *   isAmbientMuted  — sound theme / background ambience
 *   isSfxMuted      — one-shot SFX (sword clash, coin drop, etc.)
 *   isNarratorMuted — narrator SFX cues + narrator voiceover lines
 *   isVoiceMuted    — investor voice lines (TTS audio from backend)
 * Default: ambient, SFX, narrator muted; voice lines ON.
 */

import { create } from 'zustand'
import {
  audioManager,
  type AmbientKey,
  type SfxKey,
} from '@/lib/audio/audioManager'
import {
  getAmbientStore,
  getAmbientVolumeMultiplier,
  getSfxVolumeMultiplier,
  isWarRoomAudioMuted,
} from '@/src/hooks/useAmbientAudio'

const CH_SFX_KEY      = 'wr_ch_sfx_muted'
const CH_AMBIENT_KEY  = 'wr_ch_ambient_muted'
const CH_NARRATOR_KEY = 'wr_ch_narrator_muted'
const CH_VOICE_KEY    = 'wr_ch_voice_muted'
const VOICE_VOL_KEY   = 'wr_voice_volume'

const DEFAULT_VOICE_VOLUME = 0.7

function loadBool(key: string, defaultVal: boolean): boolean {
  if (typeof window === 'undefined') return defaultVal
  try {
    const v = window.localStorage.getItem(key)
    if (v === null) return defaultVal
    return v === 'true'
  } catch { return defaultVal }
}

function saveBool(key: string, val: boolean): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(key, String(val)) } catch { /* ignore */ }
}

function loadFloat(key: string, defaultVal: number): number {
  if (typeof window === 'undefined') return defaultVal
  try {
    const v = window.localStorage.getItem(key)
    if (v === null) return defaultVal
    const parsed = parseFloat(v)
    return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : defaultVal
  } catch { return defaultVal }
}

export function isVoiceLineMuted(): boolean {
  return loadBool(CH_VOICE_KEY, false)
}

/** Cheap synchronous read of the persisted voice-line volume (0..1).
 *  Returns 0 when the voice channel is muted, so callers can use it as a
 *  single effective-gain value. Safe to call from non-hook contexts. */
export function getVoiceLineVolume(): number {
  if (isVoiceLineMuted()) return 0
  return loadFloat(VOICE_VOL_KEY, DEFAULT_VOICE_VOLUME)
}

type Channel = 'ambient' | 'sfx' | 'voice'

interface AudioState {
  isMasterMuted: boolean
  isAudioUnlocked: boolean
  currentAmbientTrack: AmbientKey | null
  ambientVolume: number
  sfxVolume: number
  voiceVolume: number
  isSfxMuted: boolean
  isAmbientMuted: boolean
  isNarratorMuted: boolean
  isVoiceMuted: boolean

  unlockAudio: () => void
  setAmbientTrack: (key: AmbientKey | null, fadeMs?: number) => void
  playSfx: (key: SfxKey, volumeOverride?: number) => void
  toggleMasterMute: () => void
  setMasterMuted: (muted: boolean) => void
  setVolume: (channel: Channel, value: number) => void
  toggleSfxMute: () => void
  toggleAmbientMute: () => void
  toggleNarratorMute: () => void
  toggleVoiceMute: () => void
}

const initial = {
  isMasterMuted:   typeof window === 'undefined' ? false : isWarRoomAudioMuted(),
  isAudioUnlocked: false,
  currentAmbientTrack: null as AmbientKey | null,
  ambientVolume:   typeof window === 'undefined' ? 1 : getAmbientVolumeMultiplier(),
  sfxVolume:       typeof window === 'undefined' ? 1 : getSfxVolumeMultiplier(),
  voiceVolume:     loadFloat(VOICE_VOL_KEY, DEFAULT_VOICE_VOLUME),
  isSfxMuted:      loadBool(CH_SFX_KEY,      true),
  isAmbientMuted:  loadBool(CH_AMBIENT_KEY,   true),
  isNarratorMuted: loadBool(CH_NARRATOR_KEY,  true),
  isVoiceMuted:    loadBool(CH_VOICE_KEY,     false),
}

if (typeof window !== 'undefined') {
  if (initial.isSfxMuted)     getAmbientStore().setSfxVolume(0)
  if (initial.isAmbientMuted) getAmbientStore().setAmbientVolume(0)
}

export const useAudioStore = create<AudioState>((set, get) => ({
  ...initial,

  unlockAudio: () => { audioManager.unlockAudio() },

  setAmbientTrack: (key, fadeMs) => {
    audioManager.setAmbientTrack(key, fadeMs)
    set({ currentAmbientTrack: key })
  },

  playSfx: (key, volumeOverride) => {
    if (get().isSfxMuted) return
    audioManager.playSfx(key, volumeOverride)
  },

  toggleMasterMute: () => {
    if (typeof window === 'undefined') return
    const store = getAmbientStore()
    store.toggleMute()
    set({ isMasterMuted: store.getSnapshot().isMuted })
  },

  setMasterMuted: (muted) => {
    if (typeof window === 'undefined') return
    const store = getAmbientStore()
    store.setMuted(muted)
    set({ isMasterMuted: store.getSnapshot().isMuted })
  },

  setVolume: (channel, value) => {
    const clamped = Math.max(0, Math.min(1, value))
    if (channel === 'ambient') {
      if (typeof window !== 'undefined') getAmbientStore().setAmbientVolume(clamped)
      set({ ambientVolume: clamped })
    }
    if (channel === 'sfx') {
      if (typeof window !== 'undefined') getAmbientStore().setSfxVolume(clamped)
      set({ sfxVolume: clamped })
    }
    if (channel === 'voice') {
      if (typeof window !== 'undefined') {
        try { window.localStorage.setItem(VOICE_VOL_KEY, String(clamped)) } catch { /* ignore */ }
      }
      set({ voiceVolume: clamped })
    }
  },

  toggleSfxMute: () => {
    const next = !get().isSfxMuted
    saveBool(CH_SFX_KEY, next)
    if (typeof window !== 'undefined') {
      getAmbientStore().setSfxVolume(next ? 0 : get().sfxVolume)
    }
    set({ isSfxMuted: next })
  },

  toggleAmbientMute: () => {
    const next = !get().isAmbientMuted
    saveBool(CH_AMBIENT_KEY, next)
    if (typeof window !== 'undefined') {
      getAmbientStore().setAmbientVolume(next ? 0 : get().ambientVolume)
    }
    set({ isAmbientMuted: next })
  },

  toggleNarratorMute: () => {
    const next = !get().isNarratorMuted
    saveBool(CH_NARRATOR_KEY, next)
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem('wr_narrator_muted', String(next)) } catch { /* ignore */ }
    }
    set({ isNarratorMuted: next })
  },

  toggleVoiceMute: () => {
    const next = !get().isVoiceMuted
    saveBool(CH_VOICE_KEY, next)
    set({ isVoiceMuted: next })
  },
}))

if (typeof window !== 'undefined') {
  const store = getAmbientStore()
  const seed = store.getSnapshot()
  useAudioStore.setState({
    isMasterMuted: seed.isMuted,
    isAudioUnlocked: seed.unlocked,
    ambientVolume: seed.ambientVolume,
    sfxVolume: seed.sfxVolume,
  })
  store.subscribe(() => {
    const snap = store.getSnapshot()
    useAudioStore.setState({
      isMasterMuted: snap.isMuted,
      isAudioUnlocked: snap.unlocked,
      ambientVolume: snap.ambientVolume,
      sfxVolume: snap.sfxVolume,
    })
  })
}