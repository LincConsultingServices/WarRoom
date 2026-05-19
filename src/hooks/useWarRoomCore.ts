'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/src/lib/api'
import { getPreparedPitchFromState } from '@/src/lib/helpers'
import type { AssessmentState, Investor } from '@/src/types'

// ============================================
// useWarRoomCore — loads assessment state and investors,
// manages the active phase, and enforces dark theme.
// Can be used independently to bootstrap the War Room.
// ============================================

export type WarRoomPhase = 'LOADING' | 'PITCH' | 'INVESTOR_QA' | 'DEAL_RESULTS' | 'COMPLETE'

export function useWarRoomCore(assessmentId: string) {
  const router = useRouter()

  const [phase, setPhase] = useState<WarRoomPhase>('LOADING')
  const [assessmentState, setAssessmentState] = useState<AssessmentState | null>(null)
  const [investors, setInvestors] = useState<Investor[]>([])
  const [error, setError] = useState('')

  const preparedPitch = getPreparedPitchFromState(assessmentState)

  // Force dark theme for War Room
  useEffect(() => {
    document.documentElement.classList.add('dark')
    return () => { document.documentElement.classList.remove('dark') }
  }, [])

  // Load assessment + investors
  useEffect(() => {
    const load = async () => {
      try {
        const [state, investorList] = await Promise.all([
          api.assessments.get(assessmentId),
          api.config.getInvestors(),
        ])
        setAssessmentState(state)

        // Redirect to report if buyout was already chosen
        if ((state as any)?.assessment?.buyoutChosen) {
          router.push(`/assessment/${assessmentId}/final-report`)
          return
        }

        const selectedIds: string[] = (() => {
          try {
            const raw = (state as any)?.assessment?.selectedInvestors
            if (Array.isArray(raw)) return raw
            if (typeof raw === 'string') return JSON.parse(raw)
            return []
          } catch { return [] }
        })()

        const filtered = selectedIds.length > 0
          ? investorList.filter((inv) => selectedIds.includes(inv.id))
          : investorList

        // Fallback: if ID matching yielded nothing, use the full list
        setInvestors(filtered.length > 0 ? filtered : investorList)
        setPhase('PITCH')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load War Room')
        setPhase('PITCH')
      }
    }
    load()
  }, [assessmentId, router])

  return {
    phase, setPhase,
    assessmentState,
    investors,
    error, setError,
    preparedPitch,
  }
}
