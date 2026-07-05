'use client'

/**
 * voiceTurn — shared turn-taking gate between the Grandmaster narrator and
 * investor TTS lines. Exactly one of them may be audibly speaking at a time;
 * whichever wants to start next waits for the other to finish.
 *
 * A speaker never waits on itself: a new line from the same speaker always
 * cuts off that speaker's own prior line immediately (self-interruption is
 * expected — e.g. the narrator advancing to its next queued line).
 */

export type VoiceSpeaker = 'narrator' | 'investor'

let activeSpeaker: VoiceSpeaker | null = null
let activeAudio: HTMLAudioElement | null = null
const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((fn) => fn())
}

/** Registers `audio` as the currently-speaking voice channel. Call right as
 *  playback starts. The turn is released automatically when the clip ends
 *  or is paused (including being replaced by a new clip from the same
 *  speaker). */
export function claimVoiceTurn(speaker: VoiceSpeaker, audio: HTMLAudioElement): void {
  activeSpeaker = speaker
  activeAudio = audio
  const release = () => {
    audio.removeEventListener('ended', release)
    audio.removeEventListener('pause', release)
    if (activeAudio === audio) {
      activeSpeaker = null
      activeAudio = null
    }
    notify()
  }
  audio.addEventListener('ended', release)
  audio.addEventListener('pause', release)
}

/** Resolves once no OTHER speaker currently holds the turn. Re-checks on
 *  every release so a same-speaker hand-off (old line pausing right as a
 *  new one from that speaker claims the turn) never lets the other party
 *  sneak in between. */
export function waitForTurn(speaker: VoiceSpeaker): Promise<void> {
  if (!activeSpeaker || activeSpeaker === speaker) return Promise.resolve()
  return new Promise((resolve) => {
    const check = () => {
      if (!activeSpeaker || activeSpeaker === speaker) {
        listeners.delete(check)
        resolve()
      }
    }
    listeners.add(check)
  })
}
