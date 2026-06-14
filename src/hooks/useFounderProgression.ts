'use client'

// ============================================
// useFounderProgression — load + cache the founder's progression.
// Mirrors the simple load pattern used across the dashboard/profile.
// Returns data + loading/error + refresh + an optimistic updateHouse.
// ============================================

import { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/src/lib/api'
import type { FounderProgression, HouseConfig } from '@/src/types'

export interface UseFounderProgression {
  progression: FounderProgression | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateHouse: (patch: Partial<HouseConfig>) => Promise<void>
}

export function useFounderProgression(): UseFounderProgression {
  const [progression, setProgression] = useState<FounderProgression | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    try {
      const p = await api.progression.me()
      if (mounted.current) {
        setProgression(p)
        setError(null)
      }
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : 'Failed to load your progression')
      }
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    void load()
    return () => {
      mounted.current = false
    }
  }, [load])

  const refresh = useCallback(async () => {
    setLoading(true)
    await load()
  }, [load])

  const updateHouse = useCallback(async (patch: Partial<HouseConfig>) => {
    const house = await api.progression.updateHouse(patch)
    if (mounted.current) {
      setProgression((prev) => (prev ? { ...prev, house } : prev))
    }
  }, [])

  return { progression, loading, error, refresh, updateHouse }
}
