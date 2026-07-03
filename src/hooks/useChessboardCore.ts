'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/src/lib/api'
import { getPreparedPitchFromState } from '@/src/lib/helpers'
import type { AssessmentState, Investor } from '@/src/types'

// ============================================
// useChessboardCore — loads assessment state and investors,
// manages the active phase, and enforces dark theme.
// Can be used independently to bootstrap the Chessboard.
// ============================================

export type ChessboardPhase = 'LOADING' | 'PITCH' | 'INVESTOR_QA' | 'DEAL_RESULTS' | 'COMPLETE'

export function useChessboardCore(assessmentId: string) {
  const router = useRouter()

  const [phase, setPhase] = useState<ChessboardPhase>('LOADING')
  const [assessmentState, setAssessmentState] = useState<AssessmentState | null>(null)
  const [investors, setInvestors] = useState<Investor[]>([])
  const [error, setError] = useState('')

  const preparedPitch = useMemo(() => getPreparedPitchFromState(assessmentState), [assessmentState])

  // Force dark theme for Chessboard
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((state as any)?.assessment?.buyoutChosen) {
          router.push(`/assessment/${assessmentId}/final-report`)
          return
        }

        const selectedIds: string[] = (() => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const raw = (state as any)?.assessment?.selectedInvestors
            if (Array.isArray(raw)) return raw
            if (typeof raw === 'string') return JSON.parse(raw)
            return []
          } catch { return [] }
        })()

        // Chessboard always faces the full Council (all 7 investors).
        // Older assessments that captured only a 4-investor subset are
        // augmented up to the full list so the chamber renders correctly.
        const FULL_COUNCIL_SIZE = 7
        const filtered = selectedIds.length > 0
          ? investorList.filter((inv) => selectedIds.includes(inv.id))
          : investorList

        const finalList = filtered.length >= FULL_COUNCIL_SIZE
          ? filtered
          : investorList // legacy assessments → show everyone
        setInvestors(finalList)
        setPhase('PITCH')
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load Chessboard')
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
