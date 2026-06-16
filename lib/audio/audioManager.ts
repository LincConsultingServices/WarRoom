/**
 * audioManager — the ONE place Howler is imported.
 *
 * Per CLAUDE.md: components must never import Howler directly.
 *
 * Responsibilities:
 *   - Own the SFX manifest (one-shot effects keyed by namespaced strings).
 *   - Wrap Howler.Howl for one-shots; fail-soft to GOTSoundManager synth
 *     fallbacks via LEGACY_SFX_ALIASES when an MP3 file 404s.
 *   - Delegate ambient track playback to the existing AmbientAudioStore
 *     singleton (src/hooks/useAmbientAudio.ts) so the single MuteToggle
 *     silences both layers.
 *   - Reuse MUTE_STORAGE_KEY from useAmbientAudio. Never introduce a
 *     second mute key.
 *
 * SSR-safe: every browser API access is guarded.
 */

import { Howl } from 'howler'
import { playGOTSound } from '@/src/components/GOTSoundManager'
import {
  getSfxVolumeMultiplier,
  isWarRoomAudioMuted,
  type AmbientScene,
} from '@/src/hooks/useAmbientAudio'

// ============================================================
// SFX manifest — paths follow the blueprint convention.
// Files don't exist on disk today; LEGACY_SFX_ALIASES routes to
// synth fallbacks so audio is audible during development.
// ============================================================

export const SFX_MANIFEST = {
  // UI Interactions
  'ui.click':           '/assets/audio/sfx/ui-click.mp3',
  'ui.hover':           '/assets/audio/sfx/ui-hover.mp3',
  'ui.select':          '/assets/audio/sfx/ui-select.mp3',
  'ui.error':           '/assets/audio/sfx/ui-error.mp3',

  // Navigation & Transitions
  'nav.page-enter':     '/assets/audio/sfx/page-enter.mp3',
  'nav.door-open':      '/assets/audio/sfx/door-open.mp3',

  // Simulation Events
  'sim.stage-begin':    '/assets/audio/sfx/stage-begin.mp3',
  'sim.stage-clear':    '/assets/audio/sfx/stage-clear.mp3',
  'sim.answer-submit':  '/assets/audio/sfx/answer-submit.mp3',
  'sim.mentor-enter':   '/assets/audio/sfx/mentor-enter.mp3',
  'sim.timer-low':      '/assets/audio/sfx/timer-low.mp3',
  'sim.timer-end':      '/assets/audio/sfx/timer-end.mp3',

  // War Room
  'wr.door-creak':      '/assets/audio/sfx/wr-door-creak.mp3',
  'wr.investor-enter':  '/assets/audio/sfx/wr-investor-enter.mp3',
  'wr.gavel':           '/assets/audio/sfx/wr-gavel.mp3',
  'wr.vote-lock':       '/assets/audio/sfx/wr-vote-lock.mp3',
  'wr.verdict':         '/assets/audio/sfx/wr-verdict.mp3',
  'wr.invest':          '/assets/audio/sfx/wr-invest.mp3',
  'wr.pass':            '/assets/audio/sfx/wr-pass.mp3',

  // Narrator
  'narrator.appear':    '/assets/audio/sfx/narrator-appear.mp3',
  'narrator.dismiss':   '/assets/audio/sfx/narrator-dismiss.mp3',
} as const

export type SfxKey = keyof typeof SFX_MANIFEST

// ============================================================
// Ambient — translate blueprint key → AmbientAudioStore scene
// ============================================================

export const AMBIENT_TRACKS = {
  'ambient.hall':        'warroom-lobby',
  'ambient.warroom':     'warroom-active',
  'ambient.deliberate':  'warroom-deliberation',
  'ambient.victory':     'verdict-ceremony',
} as const

export type AmbientKey = keyof typeof AMBIENT_TRACKS

// ============================================================
// Legacy synth fallbacks — used when an MP3 is missing.
// These names match the SoundEvent union in GOTSoundManager.
// ============================================================

type LegacySoundEvent =
  | 'dragon_roar'
  | 'sword_clash'
  | 'horn_battle'
  | 'coin_drop'
  | 'chains'
  | 'ravens_wings'
  | 'triumph_fanfare'
  | 'fire_crackle'
  | 'throne_settle'
  | 'scroll_open'

const LEGACY_SFX_ALIASES: Record<SfxKey, LegacySoundEvent> = {
  // UI
  'ui.click':           'sword_clash',
  'ui.hover':           'scroll_open',
  'ui.select':          'throne_settle',
  'ui.error':           'chains',

  // Navigation
  'nav.page-enter':     'horn_battle',
  'nav.door-open':      'throne_settle',

  // Simulation
  'sim.stage-begin':    'horn_battle',
  'sim.stage-clear':    'triumph_fanfare',
  'sim.answer-submit':  'coin_drop',
  'sim.mentor-enter':   'ravens_wings',
  'sim.timer-low':      'fire_crackle',
  'sim.timer-end':      'chains',

  // War Room
  'wr.door-creak':      'throne_settle',
  'wr.investor-enter':  'horn_battle',
  'wr.gavel':           'sword_clash',
  'wr.vote-lock':       'coin_drop',
  'wr.verdict':         'dragon_roar',
  'wr.invest':          'triumph_fanfare',
  'wr.pass':            'chains',

  // Narrator
  'narrator.appear':    'ravens_wings',
  'narrator.dismiss':   'scroll_open',
}

// ============================================================
// Volume defaults per SFX category
// ============================================================

const DEFAULT_VOLUMES: Record<SfxKey, number> = {
  'ui.click':           0.32,
  'ui.hover':           0.18,
  'ui.select':          0.28,
  'ui.error':           0.40,
  'nav.page-enter':     0.22,
  'nav.door-open':      0.45,
  'sim.stage-begin':    0.42,
  'sim.stage-clear':    0.48,
  'sim.answer-submit':  0.32,
  'sim.mentor-enter':   0.32,
  'sim.timer-low':      0.30,
  'sim.timer-end':      0.55,
  'wr.door-creak':      0.50,
  'wr.investor-enter':  0.42,
  'wr.gavel':           0.55,
  'wr.vote-lock':       0.40,
  'wr.verdict':         0.60,
  'wr.invest':          0.55,
  'wr.pass':            0.40,
  'narrator.appear':    0.22,
  'narrator.dismiss':   0.18,
}

// ============================================================
// Howl pool — lazy, per-key. fallbackFired flips the moment the
// browser tells us the file is unavailable so we don't keep
// attempting Howl playback that will never succeed.
// ============================================================

/**
 * Master switch — when true, every playSfx() routes directly to the
 * GOTSoundManager synth fallback and Howler is never asked to load an
 * MP3. The real /assets/audio/sfx/*.mp3 files have not been generated
 * yet (Gemini cannot synthesise SFX); flipping this to false makes
 * Howler try MP3s again once they are dropped on disk.
 */
const SKIP_MP3_LOOKUP = true

interface PooledHowl {
  howl: Howl
  fallbackFired: boolean
}

const howlPool = new Map<SfxKey, PooledHowl>()

function getOrCreateHowl(key: SfxKey): PooledHowl | null {
  if (typeof window === 'undefined') return null
  const existing = howlPool.get(key)
  if (existing) return existing

  const entry: PooledHowl = {
    howl: new Howl({
      src: [SFX_MANIFEST[key]],
      volume: DEFAULT_VOLUMES[key] ?? 0.3,
      html5: true,
      preload: false,
      onloaderror: () => {
        entry.fallbackFired = true
      },
      onplayerror: () => {
        entry.fallbackFired = true
      },
    }),
    fallbackFired: false,
  }
  howlPool.set(key, entry)
  return entry
}

// ============================================================
// Lazy AmbientAudioStore import — useAmbientAudio.ts exports the
// hook; we want the underlying store singleton via the same
// module's runtime side-effect. We re-derive a reference here via
// the hook module's getStore — but since getStore isn't exported,
// we use the public `unlock` / `setScene` callbacks by triggering
// the hook from a guarded helper. Instead: drive the store
// indirectly through DOM events the store already listens for
// (first pointerdown unlocks), and call setScene via a small
// internal helper module.
//
// Simpler: re-export setScene/unlock by importing the singleton
// accessor. AmbientAudioStore exports its instance only via the
// hook return value. For non-hook contexts we instead replicate
// the unlock + setScene calls through a tiny adapter:
// ============================================================

import { getAmbientStore } from '@/src/hooks/useAmbientAudio'

// ============================================================
// Public API
// ============================================================

export function isUnlocked(): boolean {
  if (typeof window === 'undefined') return false
  const store = getAmbientStore()
  return store.getSnapshot().unlocked
}

export function unlockAudio(): void {
  if (typeof window === 'undefined') return
  getAmbientStore().unlock()
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function setAmbientTrack(key: AmbientKey | null, _fadeMs?: number): void {
  if (typeof window === 'undefined') return
  const scene: AmbientScene = key ? AMBIENT_TRACKS[key] : null
  getAmbientStore().setScene(scene)
}

/**
 * SFX (one-shot sound effects) are disabled by request — the synthesised
 * effects didn't meet the bar. Narrator voice lines (playNarratorVoice in
 * narratorStore) and ambient tracks are unaffected; they take separate paths.
 * Flip this to false to re-enable one-shot SFX.
 */
const SFX_DISABLED = true

export function playSfx(key: SfxKey, volumeOverride?: number): void {
  if (typeof window === 'undefined') return
  if (SFX_DISABLED) return
  if (isWarRoomAudioMuted()) return

  const baseVolume = volumeOverride ?? DEFAULT_VOLUMES[key]

  // Skip MP3 lookup entirely while real SFX files don't exist on disk.
  // Synth fallback handles the SFX volume multiplier internally.
  if (SKIP_MP3_LOOKUP) {
    playGOTSound(LEGACY_SFX_ALIASES[key], baseVolume)
    return
  }

  const finalVolume = baseVolume * getSfxVolumeMultiplier()

  const pooled = getOrCreateHowl(key)
  if (!pooled) return

  // If a previous play/load fired the fallback, skip Howler and route
  // straight to the synth — repeated 404s are a waste. The synth path
  // applies the SFX volume multiplier internally, so pass the base.
  if (pooled.fallbackFired) {
    playGOTSound(LEGACY_SFX_ALIASES[key], baseVolume)
    return
  }

  try {
    pooled.howl.volume(finalVolume)
    pooled.howl.play()
  } catch {
    pooled.fallbackFired = true
    playGOTSound(LEGACY_SFX_ALIASES[key], baseVolume)
  }
}

export function preloadSfx(keys: SfxKey[]): void {
  if (typeof window === 'undefined') return
  // Nothing to preload when MP3 lookup is disabled — synth has no buffer step.
  if (SKIP_MP3_LOOKUP) return
  for (const key of keys) {
    const pooled = getOrCreateHowl(key)
    if (pooled && !pooled.fallbackFired) {
      try {
        pooled.howl.load()
      } catch {
        pooled.fallbackFired = true
      }
    }
  }
}

export const audioManager = {
  playSfx,
  preloadSfx,
  setAmbientTrack,
  unlockAudio,
  isUnlocked,
}
