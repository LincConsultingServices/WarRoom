'use client'

import { useEffect, useSyncExternalStore } from 'react'

// ============================================================
// useAmbientAudio — singleton crossfading ambient layer.
//   - One AudioContext, one master gain.
//   - HTMLAudioElement per scene (lazy-loaded, preload="none").
//   - Crossfade between scenes via per-scene GainNodes.
//   - Respects browser autoplay policy: AudioContext is created
//     but only resumed on first user gesture.
//   - Persists mute preference in localStorage.
//   - Fails soft when an audio file is missing — never throws,
//     never blocks the UI.
// ============================================================

export type AmbientScene =
  | 'warroom-lobby'
  | 'warroom-active'
  | 'warroom-deliberation'
  | 'verdict-ceremony'
  | null

const SCENE_FILES: Record<Exclude<AmbientScene, null>, string> = {
  'warroom-lobby': '/sfx/ambient-warroom-loop.mp3',
  'warroom-active': '/sfx/ambient-warroom-loop.mp3',
  'warroom-deliberation': '/sfx/ambient-deliberation.mp3',
  'verdict-ceremony': '/sfx/ambient-verdict.mp3',
}

const SCENE_TARGET_VOLUME: Record<Exclude<AmbientScene, null>, number> = {
  'warroom-lobby': 0.12,
  'warroom-active': 0.18,
  'warroom-deliberation': 0.22,
  'verdict-ceremony': 0.28,
}

// Shared with GOTSoundManager so the single MuteToggle silences both the
// ambient layer AND one-shot SFX. Exported so non-hook code can read the
// flag without instantiating the hook.
export const MUTE_STORAGE_KEY = 'warroom_audio_muted'

/** Cheap synchronous read of the persisted mute preference.
 *  Safe to call from anywhere (SSR-safe; defaults to false). */
export function isWarRoomAudioMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const CROSSFADE_MS = 1200

interface SceneTrack {
  audio: HTMLAudioElement
  source: MediaElementAudioSourceNode | null
  gain: GainNode
  unavailable: boolean
}

interface AmbientState {
  scene: AmbientScene
  isMuted: boolean
  unlocked: boolean
}

class AmbientAudioStore {
  private listeners = new Set<() => void>()
  private state: AmbientState = { scene: null, isMuted: false, unlocked: false }
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private tracks = new Map<Exclude<AmbientScene, null>, SceneTrack>()
  private pendingScene: AmbientScene = null
  private unlockHandler: (() => void) | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(MUTE_STORAGE_KEY)
        this.state = { ...this.state, isMuted: stored === 'true' }
      } catch {
        // localStorage may be unavailable (private mode, etc.) — keep default
      }
    }
  }

  getSnapshot = (): AmbientState => this.state

  subscribe = (l: () => void): (() => void) => {
    this.listeners.add(l)
    return () => {
      this.listeners.delete(l)
    }
  }

  private emit() {
    this.listeners.forEach((l) => l())
  }

  private update(patch: Partial<AmbientState>) {
    this.state = { ...this.state, ...patch }
    this.emit()
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (this.ctx) return this.ctx
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    try {
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.state.isMuted ? 0 : 1
      this.master.connect(this.ctx.destination)
    } catch {
      this.ctx = null
      this.master = null
    }
    return this.ctx
  }

  installUnlockListener() {
    if (typeof window === 'undefined') return
    if (this.unlockHandler) return
    const unlock = () => {
      this.unlock()
    }
    this.unlockHandler = unlock
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
  }

  unlock = (): void => {
    const ctx = this.ensureContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {
        /* iOS safari may reject — silent */
      })
    }
    if (!this.state.unlocked) {
      this.update({ unlocked: true })
    }
    if (this.pendingScene) {
      const next = this.pendingScene
      this.pendingScene = null
      this.setScene(next)
    }
  }

  private getOrCreateTrack(scene: Exclude<AmbientScene, null>): SceneTrack | null {
    const ctx = this.ensureContext()
    if (!ctx || !this.master) return null
    const existing = this.tracks.get(scene)
    if (existing) return existing

    const audio = new Audio()
    audio.src = SCENE_FILES[scene]
    audio.loop = true
    audio.crossOrigin = 'anonymous'
    audio.preload = 'auto'

    const track: SceneTrack = {
      audio,
      source: null,
      gain: ctx.createGain(),
      unavailable: false,
    }
    track.gain.gain.value = 0
    track.gain.connect(this.master)

    audio.addEventListener('error', () => {
      track.unavailable = true
      track.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05)
    })

    try {
      track.source = ctx.createMediaElementSource(audio)
      track.source.connect(track.gain)
    } catch {
      // createMediaElementSource can throw if the same element is wired twice — fail soft
    }

    this.tracks.set(scene, track)
    return track
  }

  setScene = (scene: AmbientScene): void => {
    if (this.state.scene === scene) return
    if (!this.state.unlocked) {
      this.pendingScene = scene
      this.update({ scene })
      return
    }
    const ctx = this.ensureContext()
    if (!ctx) return

    // Fade everything else down, fade target up
    const now = ctx.currentTime
    this.tracks.forEach((t) => {
      t.gain.gain.cancelScheduledValues(now)
      t.gain.gain.setTargetAtTime(0, now, CROSSFADE_MS / 4000)
      if (!t.audio.paused) {
        window.setTimeout(() => {
          if (t.gain.gain.value < 0.01) t.audio.pause()
        }, CROSSFADE_MS + 100)
      }
    })

    if (scene) {
      const track = this.getOrCreateTrack(scene)
      if (track && !track.unavailable) {
        const target = this.state.isMuted ? 0 : SCENE_TARGET_VOLUME[scene]
        track.audio.play().catch(() => {
          // autoplay rejected — likely not yet unlocked; user will tap soon
        })
        track.gain.gain.cancelScheduledValues(now)
        track.gain.gain.setTargetAtTime(target, now, CROSSFADE_MS / 4000)
      }
    }

    this.update({ scene })
  }

  setMuted = (muted: boolean): void => {
    if (this.state.isMuted === muted) return
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted))
    } catch {
      /* ignore */
    }
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime
      this.master.gain.cancelScheduledValues(now)
      this.master.gain.setTargetAtTime(muted ? 0 : 1, now, 0.2)
    }
    this.update({ isMuted: muted })
  }

  toggleMute = (): void => {
    this.setMuted(!this.state.isMuted)
  }
}

let storeSingleton: AmbientAudioStore | null = null
function getStore(): AmbientAudioStore {
  if (!storeSingleton) storeSingleton = new AmbientAudioStore()
  return storeSingleton
}

const noopSubscribe = () => () => {}
const noopSnapshot = (): AmbientState => ({ scene: null, isMuted: false, unlocked: false })

export function useAmbientAudio() {
  const store = typeof window === 'undefined' ? null : getStore()

  const state = useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    store ? store.getSnapshot : noopSnapshot,
    noopSnapshot,
  )

  useEffect(() => {
    if (!store) return
    store.installUnlockListener()
  }, [store])

  return {
    scene: state.scene,
    isMuted: state.isMuted,
    unlocked: state.unlocked,
    setScene: store ? store.setScene : () => {},
    setMuted: store ? store.setMuted : () => {},
    toggleMute: store ? store.toggleMute : () => {},
    unlock: store ? store.unlock : () => {},
  }
}
