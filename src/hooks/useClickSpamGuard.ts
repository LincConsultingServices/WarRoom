'use client'

import { useCallback, useRef, useState } from 'react'

// ============================================
// useClickSpamGuard — tracks rapid / uniform option selection.
//
// Two independent signals (either can fire on a single selection):
//   • Burst:  3+ selections within a 800ms rolling window.
//   • Floor:  rolling-mean time-per-question across the last 5 selections
//             falls below 1500ms (i.e. user is clicking through too fast).
//
// The hook exposes a derived `spamPercent` (suspicious / total * 100) and a
// boolean `shouldShowWarning` flag (≥ 40%) so callers can pop a modal at
// end-of-phase. The backend recomputes the percentage server-side as the
// source of truth — these client-side values are advisory only.
// ============================================

const BURST_WINDOW_MS = 800
const BURST_THRESHOLD = 3
const FLOOR_WINDOW = 5
const FLOOR_MIN_AVG_MS = 1500
const WARNING_THRESHOLD = 40

export type ClickSpamGuardMetrics = {
  burstEvents: number
  floorEvents: number
  totalSelections: number
  spamPercent: number
}

export function useClickSpamGuard() {
  const timestampsRef = useRef<number[]>([])
  const [metrics, setMetrics] = useState<ClickSpamGuardMetrics>({
    burstEvents: 0,
    floorEvents: 0,
    totalSelections: 0,
    spamPercent: 0,
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const recordSelection = useCallback((_questionId?: string) => {
    const now = Date.now()
    timestampsRef.current.push(now)

    const burstStart = now - BURST_WINDOW_MS
    const burstCount = timestampsRef.current.filter((t) => t >= burstStart).length
    const burstTripped = burstCount >= BURST_THRESHOLD

    let floorTripped = false
    const ts = timestampsRef.current
    if (ts.length >= FLOOR_WINDOW) {
      const recent = ts.slice(-FLOOR_WINDOW)
      const span = recent[recent.length - 1] - recent[0]
      const avg = span / (FLOOR_WINDOW - 1)
      floorTripped = avg < FLOOR_MIN_AVG_MS
    }

    setMetrics((prev) => {
      const total = prev.totalSelections + 1
      const burstEvents = prev.burstEvents + (burstTripped ? 1 : 0)
      const floorEvents = prev.floorEvents + (floorTripped ? 1 : 0)
      const suspicious = burstEvents + floorEvents
      const spamPercent = total === 0 ? 0 : Math.min(100, (suspicious / total) * 100)
      return { burstEvents, floorEvents, totalSelections: total, spamPercent }
    })
  }, [])

  const reset = useCallback(() => {
    timestampsRef.current = []
    setMetrics({ burstEvents: 0, floorEvents: 0, totalSelections: 0, spamPercent: 0 })
  }, [])

  return {
    recordSelection,
    reset,
    metrics,
    spamPercent: metrics.spamPercent,
    shouldShowWarning: metrics.spamPercent >= WARNING_THRESHOLD,
  }
}
