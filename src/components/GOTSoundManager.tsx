'use client'

import { useCallback, useRef } from 'react'
import { getAmbientStore, getSfxVolumeMultiplier, isWarRoomAudioMuted } from '@/src/hooks/useAmbientAudio'
import { playSynthSound, type SoundEvent } from '@/lib/audio/synthSounds'

/** Read per-channel SFX mute flag without subscribing to the store. */
function isSfxChannelMuted(): boolean {
  if (typeof window === 'undefined') return false
  try { return window.localStorage.getItem('wr_ch_sfx_muted') === 'true' } catch { return false }
}


// ============================================================
// GOT Sound Manager — orchestrates GoT-flavored SFX playback.
//
// Sound files (if present on disk) win; otherwise the rich
// procedural synthesis in lib/audio/synthSounds.ts plays. All
// playback routes through the shared AmbientAudioStore master
// gain so the single mute toggle silences everything.
// ============================================================

const GOT_AUDIO_MAP: Record<SoundEvent, string> = {
  dragon_roar: '/audio/got/dragon_roar.mp3',
  sword_clash: '/audio/got/sword_clash.mp3',
  horn_battle: '/audio/got/horn_battle.mp3',
  coin_drop: '/audio/got/coin_drop.mp3',
  chains: '/audio/got/chains.mp3',
  ravens_wings: '/audio/got/ravens_wings.mp3',
  triumph_fanfare: '/audio/got/triumph_fanfare.mp3',
  fire_crackle: '/audio/got/fire_crackle.mp3',
  throne_settle: '/audio/got/throne_settle.mp3',
  scroll_open: '/audio/got/scroll_open.mp3',
}

// Re-export so legacy callers that imported the type still resolve
export type { SoundEvent }

/**
 * Track which file paths have already 404'd so we don't keep retrying.
 *
 * Pre-seeded with every event because the legacy /audio/got/*.mp3 files
 * have not been generated yet — the synthesised fallback is the intended
 * source of audio for now. To restore MP3-first behaviour later (after
 * dropping real files at /audio/got/*.mp3), remove the initial entries.
 */
const knownMissing = new Set<SoundEvent>([
  'dragon_roar', 'sword_clash', 'horn_battle', 'coin_drop', 'chains',
  'ravens_wings', 'triumph_fanfare', 'fire_crackle', 'throne_settle', 'scroll_open',
])

/**
 * Synthesize a sound through the AmbientAudioStore's master gain
 * so mute + ambient volume + SFX volume all apply uniformly.
 */
function synthesizeSound(type: SoundEvent, volume: number) {
  if (typeof window === 'undefined') return
  const store = getAmbientStore()
  const ctx = store.getOrCreateContext()
  const dest = store.getSynthBus()
  if (!ctx || !dest) return
  // Honour SFX volume from settings store
  playSynthSound(ctx, dest, type, volume * getSfxVolumeMultiplier())
}

// ---- Hook ----

export function useGOTSound() {
  const enabled = useRef(true)

  const playSound = useCallback(async (event: SoundEvent, volume = 0.6) => {
    if (!enabled.current) return
    if (typeof window === 'undefined') return
    if (isWarRoomAudioMuted()) return
    if (isSfxChannelMuted()) return


    // If we already know the file is missing, skip the round-trip.
    if (knownMissing.has(event)) {
      synthesizeSound(event, volume)
      return
    }

    const filePath = GOT_AUDIO_MAP[event]

    try {
      const audio = new Audio(filePath)
      audio.volume = volume * getSfxVolumeMultiplier()

      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(), { once: true })
        audio.addEventListener('error', () => reject(), { once: true })
        audio.load()
      })

      audio.play().catch(() => {
        knownMissing.add(event)
        synthesizeSound(event, volume)
      })
    } catch {
      knownMissing.add(event)
      synthesizeSound(event, volume)
    }
  }, [])

  const setEnabled = useCallback((val: boolean) => {
    enabled.current = val
  }, [])

  return { playSound, setEnabled }
}

// ---- Standalone play utility (for non-hook contexts) ----
/**
 * @deprecated Prefer `audioManager.playSfx` from `lib/audio/audioManager.ts`
 * for new code. This function remains as the synth fallback target for
 * legacy SFX aliases when MP3 files are missing — do not delete.
 */
export function playGOTSound(event: SoundEvent, volume = 0.6) {
  if (typeof window === 'undefined') return
  // Same mute gate as the hook — respects the persisted MuteToggle preference.
  if (isWarRoomAudioMuted()) return
  if (isSfxChannelMuted()) return


  if (knownMissing.has(event)) {
    synthesizeSound(event, volume)
    return
  }

  const filePath = GOT_AUDIO_MAP[event]
  const audio = new Audio(filePath)
  audio.volume = volume * getSfxVolumeMultiplier()
  audio.play().catch(() => {
    knownMissing.add(event)
    synthesizeSound(event, volume)
  })
}
