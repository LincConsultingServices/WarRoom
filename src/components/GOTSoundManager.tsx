'use client'

import { useCallback, useRef } from 'react'
import { isWarRoomAudioMuted } from '@/src/hooks/useAmbientAudio'

// ============================================================
// GOT Sound Manager — plays Web Audio synthesized sounds
// since we don't have actual GOT audio files yet.
// When the user drops GOT audio files into /public/audio/got/
// those will be used instead via the file paths.
// ============================================================

type SoundEvent =
  | 'dragon_roar'     // phase transition, dramatic moments
  | 'sword_clash'     // crisis / war room intensity
  | 'horn_battle'     // start of a new stage
  | 'coin_drop'       // revenue update / positive result
  | 'chains'          // negative result / failure
  | 'ravens_wings'    // narrator / overlay appears
  | 'triumph_fanfare' // stage complete / deal accepted
  | 'fire_crackle'    // ambient / loading
  | 'throne_settle'   // panel selection complete
  | 'scroll_open'     // question appears

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

// Fallback: synthesize sounds with Web Audio API when files don't exist
function synthesizeSound(ctx: AudioContext, type: SoundEvent) {
  const now = ctx.currentTime

  if (type === 'coin_drop') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15)
    gain.gain.setValueAtTime(0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    osc.start(now)
    osc.stop(now + 0.4)
    return
  }

  if (type === 'sword_clash') {
    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2))
    }
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1200
    source.buffer = buffer
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.5, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    source.start(now)
    return
  }

  if (type === 'horn_battle') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.setValueAtTime(180, now + 0.2)
    osc.frequency.setValueAtTime(140, now + 0.5)
    gain.gain.setValueAtTime(0.0, now)
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05)
    gain.gain.setValueAtTime(0.3, now + 0.5)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9)
    osc.start(now)
    osc.stop(now + 0.9)
    return
  }

  if (type === 'triumph_fanfare') {
    const notes = [261.63, 329.63, 392.0, 523.25]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.connect(gain)
      gain.connect(ctx.destination)
      const t = now + i * 0.12
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.0, t)
      gain.gain.linearRampToValueAtTime(0.25, t + 0.05)
      gain.gain.setValueAtTime(0.25, t + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.start(t)
      osc.stop(t + 0.35)
    })
    return
  }

  if (type === 'ravens_wings') {
    // Low flutter noise
    const bufferSize = ctx.sampleRate * 0.4
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate
      data[i] = Math.sin(t * 30) * (Math.random() * 0.3) * Math.exp(-t * 3)
    }
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = buffer
    source.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.3, now)
    source.start(now)
    return
  }

  if (type === 'chains') {
    const bufferSize = ctx.sampleRate * 0.5
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate
      const env = Math.sin(t * Math.PI / 0.5) * 0.5
      data[i] = (Math.random() * 2 - 1) * env * 0.4
    }
    const source = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 800
    const gain = ctx.createGain()
    source.buffer = buffer
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.4, now)
    source.start(now)
    return
  }

  // Default: short click
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = 600
  gain.gain.setValueAtTime(0.2, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
  osc.start(now)
  osc.stop(now + 0.1)
}

// ---- Hook ----

export function useGOTSound() {
  const audioCtx = useRef<AudioContext | null>(null)
  const enabled = useRef(true)

  const getCtx = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioCtx.current
  }, [])

  const playSound = useCallback(async (event: SoundEvent, volume = 0.6) => {
    if (!enabled.current) return
    if (typeof window === 'undefined') return
    // Honour the shared War Room mute toggle — same localStorage flag the
    // ambient audio layer uses, so MuteToggle silences EVERYTHING.
    if (isWarRoomAudioMuted()) return

    const filePath = GOT_AUDIO_MAP[event]

    // Try loading the audio file first
    try {
      const audio = new Audio(filePath)
      audio.volume = volume

      // Test if file exists by trying to load
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(), { once: true })
        audio.addEventListener('error', () => reject(), { once: true })
        audio.load()
      })

      audio.play().catch(() => {
        // fallback to synthesis
        synthesizeSound(getCtx(), event)
      })
    } catch {
      // File doesn't exist — use Web Audio synthesis
      try {
        synthesizeSound(getCtx(), event)
      } catch {
        // Audio not available
      }
    }
  }, [getCtx])

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
  const filePath = GOT_AUDIO_MAP[event]

  const audio = new Audio(filePath)
  audio.volume = volume
  audio.play().catch(() => {
    // Synthesize fallback
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      synthesizeSound(ctx, event)
    } catch { /* noop */ }
  })
}
