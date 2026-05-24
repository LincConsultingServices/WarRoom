'use client'

/**
 * audioStore — Zustand facade over `lib/audio/audioManager.ts`.
 *
 * Mirrors the unified mute / unlock / ambient / volume state into
 * a React-subscribable store so components can react to changes
 * without threading the audio manager through props.
 *
 * Source of truth is still the AmbientAudioStore singleton in
 * `src/hooks/useAmbientAudio.ts` — this store subscribes to it
 * and forwards updates. Writes delegate to that singleton too,
 * so settings persisted in localStorage win on reload.
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

type Channel = 'ambient' | 'sfx' | 'voice'

interface AudioState {
  isMasterMuted: boolean
  isAudioUnlocked: boolean
  currentAmbientTrack: AmbientKey | null
  ambientVolume: number
  sfxVolume: number
  voiceVolume: number

  unlockAudio: () => void
  setAmbientTrack: (key: AmbientKey | null, fadeMs?: number) => void
  playSfx: (key: SfxKey, volumeOverride?: number) => void
  toggleMasterMute: () => void
  setMasterMuted: (muted: boolean) => void
  setVolume: (channel: Channel, value: number) => void
}

const initial = {
  isMasterMuted: typeof window === 'undefined' ? false : isWarRoomAudioMuted(),
  isAudioUnlocked: false,
  currentAmbientTrack: null as AmbientKey | null,
  ambientVolume: typeof window === 'undefined' ? 1 : getAmbientVolumeMultiplier(),
  sfxVolume: typeof window === 'undefined' ? 1 : getSfxVolumeMultiplier(),
  voiceVolume: 0.7,
}

export const useAudioStore = create<AudioState>((set) => ({
  ...initial,

  unlockAudio: () => {
    audioManager.unlockAudio()
  },

  setAmbientTrack: (key, fadeMs) => {
    audioManager.setAmbientTrack(key, fadeMs)
    set({ currentAmbientTrack: key })
  },

  playSfx: (key, volumeOverride) => {
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
    if (channel === 'voice') set({ voiceVolume: clamped })
  },
}))

/**
 * Bridge the AmbientAudioStore singleton's snapshots into Zustand.
 * Runs once on first import in the browser. SSR-safe.
 */
if (typeof window !== 'undefined') {
  const store = getAmbientStore()
  // Seed initial state from the singleton (covers the case where the
  // user already unlocked / muted on a prior page).
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
