'use client'

import { useEffect, useSyncExternalStore } from 'react'
import {
  ProceduralAmbientEngine,
  type ProceduralScene,
} from '@/lib/audio/proceduralAmbient'

// ============================================================
// useAmbientAudio — singleton crossfading ambient layer.
//   - One AudioContext, one master gain.
//   - HTMLAudioElement per scene (lazy-loaded, preload="none").
//   - Crossfade between scenes via per-scene GainNodes.
//   - When an MP3 is missing, the procedural ambient engine
//     (lib/audio/proceduralAmbient.ts) generates a GoT-flavored
//     bed in its place — so the war room is never silent.
//   - Respects browser autoplay policy: AudioContext is created
//     but only resumed on first user gesture.
//   - Persists mute + per-channel volume preferences in
//     localStorage.
//   - Fails soft when an audio file is missing — never throws,
//     never blocks the UI.
// ============================================================

export type AmbientScene =
  | 'chessboard-lobby'
  | 'chessboard-active'
  | 'chessboard-deliberation'
  | 'verdict-ceremony'
  | null

const SCENE_FILES: Record<Exclude<AmbientScene, null>, string> = {
  'chessboard-lobby': '/sfx/ambient-chessboard-loop.mp3',
  'chessboard-active': '/sfx/ambient-chessboard-loop.mp3',
  'chessboard-deliberation': '/sfx/ambient-deliberation.mp3',
  'verdict-ceremony': '/sfx/ambient-verdict.mp3',
}

/**
 * Master switch — when true, skip the network probe for ambient MP3s
 * entirely. The real /sfx/*.mp3 files have not been generated yet
 * (Gemini cannot synthesise music). Flip to false when real MP3s exist.
 */
const SKIP_AMBIENT_MP3_LOOKUP = true

const DISABLE_PROCEDURAL_AMBIENT = false

const SCENE_TARGET_VOLUME: Record<Exclude<AmbientScene, null>, number> = {
  'chessboard-lobby': 0.12,
  'chessboard-active': 0.18,
  'chessboard-deliberation': 0.22,
  'verdict-ceremony': 0.28,
}

// Shared with GOTSoundManager so the single MuteToggle silences both the
// ambient layer AND one-shot SFX. Exported so non-hook code can read the
// flag without instantiating the hook.
export const MUTE_STORAGE_KEY = 'chessboard_audio_muted'
export const AMBIENT_VOL_STORAGE_KEY = 'chessboard_ambient_volume'
export const SFX_VOL_STORAGE_KEY = 'chessboard_sfx_volume'

/** Cheap synchronous read of the persisted mute preference.
 *  Safe to call from anywhere (SSR-safe; defaults to false). */
export function isChessboardAudioMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Read the persisted SFX volume multiplier (0..1). */
export function getSfxVolumeMultiplier(): number {
  if (typeof window === 'undefined') return 1
  try {
    const v = window.localStorage.getItem(SFX_VOL_STORAGE_KEY)
    if (v === null) return 1
    const parsed = parseFloat(v)
    return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 1
  } catch {
    return 1
  }
}

/** Read the persisted ambient volume multiplier (0..1). */
export function getAmbientVolumeMultiplier(): number {
  if (typeof window === 'undefined') return 1
  try {
    const v = window.localStorage.getItem(AMBIENT_VOL_STORAGE_KEY)
    if (v === null) return 1
    const parsed = parseFloat(v)
    return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 1
  } catch {
    return 1
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
  ambientVolume: number
  sfxVolume: number
}

export class AmbientAudioStore {
  private listeners = new Set<() => void>()
  private state: AmbientState = {
    scene: null,
    isMuted: false,
    unlocked: false,
    ambientVolume: 1,
    sfxVolume: 1,
  }
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  /** Dedicated bus for SFX synth — sits between SFX and master so
   *  ambient volume changes don't affect SFX. */
  private sfxBus: GainNode | null = null
  /** Dedicated bus for ambient (MP3 + procedural) — separate gain
   *  so ambient volume slider only attenuates ambient. */
  private ambientBus: GainNode | null = null
  private tracks = new Map<Exclude<AmbientScene, null>, SceneTrack>()
  private procedural: ProceduralAmbientEngine | null = null
  private pendingScene: AmbientScene = null
  private unlockHandler: (() => void) | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(MUTE_STORAGE_KEY)
        const a = window.localStorage.getItem(AMBIENT_VOL_STORAGE_KEY)
        const s = window.localStorage.getItem(SFX_VOL_STORAGE_KEY)
        this.state = {
          ...this.state,
          isMuted: stored === 'true',
          ambientVolume: a !== null ? clamp01(parseFloat(a)) : 1,
          sfxVolume: s !== null ? clamp01(parseFloat(s)) : 1,
        }
      } catch {
        // localStorage may be unavailable — keep defaults
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

      this.sfxBus = this.ctx.createGain()
      this.sfxBus.gain.value = 1
      this.sfxBus.connect(this.master)

      this.ambientBus = this.ctx.createGain()
      this.ambientBus.gain.value = this.state.ambientVolume
      this.ambientBus.connect(this.master)
    } catch {
      this.ctx = null
      this.master = null
      this.sfxBus = null
      this.ambientBus = null
    }
    return this.ctx
  }

  /** Public accessor for the AudioContext (used by synth SFX). */
  getOrCreateContext(): AudioContext | null {
    return this.ensureContext()
  }

  /** Public accessor for the SFX bus (where synth SFX should connect). */
  getSynthBus(): GainNode | null {
    this.ensureContext()
    return this.sfxBus
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
      // Important: a pendingScene was stored BEFORE unlock and state.scene
      // already equals it, so calling setScene(pendingScene) would short-
      // circuit on the equality guard. Reset state.scene first so the
      // actual playback path runs.
      const next = this.pendingScene
      this.pendingScene = null
      this.state = { ...this.state, scene: null }
      this.setScene(next)
    }
  }

  private getOrCreateTrack(scene: Exclude<AmbientScene, null>): SceneTrack | null {
    const ctx = this.ensureContext()
    if (!ctx || !this.ambientBus) return null
    const existing = this.tracks.get(scene)
    if (existing) return existing

    // Short-circuit when MP3 lookup is disabled: register a stub "unavailable"
    // track and let the procedural engine drive the scene. Avoids 404s.
    if (SKIP_AMBIENT_MP3_LOOKUP) {
      const audio = new Audio() // no .src — never makes a network request
      const track: SceneTrack = {
        audio,
        source: null,
        gain: ctx.createGain(),
        unavailable: true,
      }
      track.gain.gain.value = 0
      track.gain.connect(this.ambientBus)
      this.tracks.set(scene, track)
      this.activateProcedural(scene)
      return track
    }

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
    track.gain.connect(this.ambientBus)

    // Probe the file with HEAD ahead of time — gives us a reliable signal
    // (the HTMLAudio 'error' event is flaky for some missing-file scenarios
    // when the server returns HTML instead of audio bytes).
    void fetch(SCENE_FILES[scene], { method: 'HEAD' })
      .then((r) => {
        if (!r.ok) throw new Error('missing')
        const ct = r.headers.get('content-type') || ''
        if (!ct.startsWith('audio/')) throw new Error('not-audio')
      })
      .catch(() => {
        track.unavailable = true
        track.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05)
        this.activateProcedural(scene)
      })

    audio.addEventListener('error', () => {
      track.unavailable = true
      track.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05)
      this.activateProcedural(scene)
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

  private ensureProcedural(): ProceduralAmbientEngine | null {
    const ctx = this.ensureContext()
    if (!ctx || !this.ambientBus) return null
    if (this.procedural) return this.procedural
    this.procedural = new ProceduralAmbientEngine(ctx, this.ambientBus)
    return this.procedural
  }

  private activateProcedural(scene: Exclude<AmbientScene, null>): void {
    if (DISABLE_PROCEDURAL_AMBIENT) return
    const engine = this.ensureProcedural()
    if (!engine) return
    engine.setScene(scene as ProceduralScene)
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
        // If procedural was running for a prior unavailable scene, fade
        // it out to avoid doubling the ambient bed.
        if (this.procedural) this.procedural.setScene(null)
      } else {
        // No file available for this scene yet → use procedural
        this.activateProcedural(scene)
      }
    } else if (this.procedural) {
      this.procedural.setScene(null)
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

  setAmbientVolume = (value: number): void => {
    const v = clamp01(value)
    try {
      window.localStorage.setItem(AMBIENT_VOL_STORAGE_KEY, String(v))
    } catch {
      /* ignore */
    }
    if (this.ambientBus && this.ctx) {
      const now = this.ctx.currentTime
      this.ambientBus.gain.cancelScheduledValues(now)
      this.ambientBus.gain.setTargetAtTime(v, now, 0.12)
    }
    this.update({ ambientVolume: v })
  }

  setSfxVolume = (value: number): void => {
    const v = clamp01(value)
    try {
      window.localStorage.setItem(SFX_VOL_STORAGE_KEY, String(v))
    } catch {
      /* ignore */
    }
    if (this.sfxBus && this.ctx) {
      const now = this.ctx.currentTime
      this.sfxBus.gain.cancelScheduledValues(now)
      this.sfxBus.gain.setTargetAtTime(v, now, 0.12)
    }
    this.update({ sfxVolume: v })
  }
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 1
  return Math.max(0, Math.min(1, v))
}

let storeSingleton: AmbientAudioStore | null = null
function getStore(): AmbientAudioStore {
  if (!storeSingleton) storeSingleton = new AmbientAudioStore()
  return storeSingleton
}

/**
 * Internal: accessor for the AmbientAudioStore singleton, used by
 * non-hook contexts (e.g. `lib/audio/audioManager.ts`). Prefer the
 * `useAmbientAudio()` hook for React components.
 */
export function getAmbientStore(): AmbientAudioStore {
  return getStore()
}

const noopSubscribe = () => () => {}
// Stable identity is required — useSyncExternalStore detects equality
// via reference and will warn / loop if a fresh object is returned each
// call.
const NOOP_SNAPSHOT: AmbientState = Object.freeze({
  scene: null,
  isMuted: false,
  unlocked: false,
  ambientVolume: 1,
  sfxVolume: 1,
}) as AmbientState
const noopSnapshot = (): AmbientState => NOOP_SNAPSHOT

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
    ambientVolume: state.ambientVolume,
    sfxVolume: state.sfxVolume,
    setScene: store ? store.setScene : () => {},
    setMuted: store ? store.setMuted : () => {},
    toggleMute: store ? store.toggleMute : () => {},
    unlock: store ? store.unlock : () => {},
    setAmbientVolume: store ? store.setAmbientVolume : () => {},
    setSfxVolume: store ? store.setSfxVolume : () => {},
  }
}
