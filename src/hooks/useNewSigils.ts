'use client'

// ============================================
// useNewSigils — detect sigils earned since the founder last saw them.
//
// Keeps a "seen" set in localStorage. On the FIRST run (no set yet) it
// silently seeds the set with whatever the founder already has, so the
// progression launch never spams existing users with a wall of reveals.
// Thereafter, any sigil not in the seen set is returned as "new" for a
// one-time cinematic reveal; acknowledge() marks them seen.
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react'
import type { EarnedSigil } from '@/src/types'

const SEEN_KEY = 'warroom_seen_sigils'

function readSeen(): string[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SEEN_KEY)
    return raw ? (JSON.parse(raw) as string[]) : null
  } catch {
    return null
  }
}

function writeSeen(ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids))
  } catch {
    /* ignore */
  }
}

export interface UseNewSigils {
  newSigils: EarnedSigil[]
  acknowledge: () => void
}

export function useNewSigils(sigils: EarnedSigil[] | undefined): UseNewSigils {
  const [newSigils, setNewSigils] = useState<EarnedSigil[]>([])
  const evaluated = useRef(false)

  useEffect(() => {
    if (!sigils || evaluated.current) return
    evaluated.current = true

    const seen = readSeen()
    if (seen == null) {
      // First run after launch — treat everything as already known.
      writeSeen(sigils.map((s) => s.id))
      return
    }
    const seenSet = new Set(seen)
    const fresh = sigils.filter((s) => !seenSet.has(s.id))
    if (fresh.length) setNewSigils(fresh)
  }, [sigils])

  const acknowledge = useCallback(() => {
    if (sigils) writeSeen(sigils.map((s) => s.id))
    setNewSigils([])
  }, [sigils])

  return { newSigils, acknowledge }
}
