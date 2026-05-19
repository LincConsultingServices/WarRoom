'use client'

import { useEffect, useRef, useState } from 'react'
// STAGE_DURATIONS imported by callers; not needed here

// ---- Key helpers ----

export function getStageTimerKey(assessmentId: string | undefined, stageId: string): string {
  return `timer_${assessmentId || 'unknown'}_${stageId}`
}

export function clearStageTimerKey(assessmentId: string | undefined, stageId: string) {
  localStorage.removeItem(getStageTimerKey(assessmentId, stageId))
  localStorage.removeItem(`timer_${stageId}`)
}

// ---- Hook ----

export interface StageTimerResult {
  display: string
  expired: boolean
  isWarning: boolean
  remaining: number
}

export function useStageTimer(
  assessmentId: string | undefined,
  stageId: string | undefined,
  durationMinutes: number,
  running: boolean
): StageTimerResult {
  const [remaining, setRemaining] = useState(durationMinutes * 60)
  const [expired, setExpired] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!stageId || !running) return

    const storageKey = getStageTimerKey(assessmentId, stageId)
    const legacyKey = `timer_${stageId}`

    // Drop legacy stage-only timer key to avoid stale carry-over between assessments.
    localStorage.removeItem(legacyKey)

    let startTime = parseInt(localStorage.getItem(storageKey) || '0', 10)
    if (!startTime) {
      startTime = Date.now()
      localStorage.setItem(storageKey, startTime.toString())
    }

    const durationMs = durationMinutes * 60 * 1000

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const rem = Math.max(0, durationMs - elapsed)
      setRemaining(Math.ceil(rem / 1000))
      if (rem <= 0) {
        setExpired(true)
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [assessmentId, stageId, durationMinutes, running])

  // Reset on stage change
  useEffect(() => {
    setExpired(false)
    setRemaining(durationMinutes * 60)
  }, [stageId, durationMinutes])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const isWarning = remaining < 60 && remaining > 0

  return { display, expired, isWarning, remaining }
}
