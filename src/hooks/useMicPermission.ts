'use client'

import { useEffect, useState } from 'react'

// ============================================
// useMicPermission — module-level singleton tracking whether the user has
// granted microphone access (or chosen text fallback) for this session.
//
// The chessboard page (and any other audio-driven flow) calls this once and
// renders <MicPermissionDialog open={needsPrompt} ... /> at the top. While
// `idle`, audio recorders should not be reachable; while `text-fallback`,
// callers render <textarea> branches instead of the mic UI.
// ============================================

export type MicPermissionState = 'idle' | 'granted' | 'denied' | 'text-fallback'

let cached: MicPermissionState = 'idle'
const listeners = new Set<(s: MicPermissionState) => void>()

function emit(next: MicPermissionState) {
  cached = next
  listeners.forEach((fn) => fn(next))
}

export function useMicPermission() {
  const [state, setLocal] = useState<MicPermissionState>(cached)

  useEffect(() => {
    listeners.add(setLocal)
    return () => {
      listeners.delete(setLocal)
    }
  }, [])

  return {
    state,
    needsPrompt: state === 'idle',
    granted: state === 'granted',
    isText: state === 'text-fallback',
    denied: state === 'denied',
    grant: () => emit('granted'),
    deny: () => emit('denied'),
    useText: () => emit('text-fallback'),
    reset: () => emit('idle'),
  }
}
