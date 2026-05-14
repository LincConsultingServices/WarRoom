'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/src/lib/api'
import { STAGE_ORDER } from '@/src/lib/constants'
import { clearStageTimerKey } from '@/src/hooks/useStageTimer'
import type { PhaseScenarioOut } from '@/src/types'

// ============================================
// usePhaseTransition — manages phase scenario display,
// restart-from-checkpoint logic, and buyout flow.
// Can be called independently to jump to any phase
// or trigger a restart without a full simulation reload.
// ============================================

export function usePhaseTransition(assessmentId: string, load: () => Promise<void>) {
  const router = useRouter()

  const [phaseScenario, setPhaseScenario] = useState<PhaseScenarioOut | null>(null)
  const [showingScenario, setShowingScenario] = useState(false)
  const [showRestartCheckpoint, setShowRestartCheckpoint] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  async function handleScenarioSubmit(response: string) {
    if (!phaseScenario) return
    await api.assessments.answerPhaseScenario(assessmentId, {
      fromStage: phaseScenario.fromStage,
      toStage: phaseScenario.toStage,
      response,
    })
    if (phaseScenario.isCheckpoint) {
      setShowRestartCheckpoint(true)
      return
    }
    setTimeout(async () => {
      setShowingScenario(false)
      setPhaseScenario(null)
      if (phaseScenario.toStage === 'STAGE_4_WARROOM') {
        router.push(`/assessment/${assessmentId}/war-room`)
        return
      }
      await load()
    }, 1500)
  }

  async function handleContinue() {
    setShowingScenario(false)
    setPhaseScenario(null)
    await load()
  }

  async function handleRestart(
    onClear: () => void
  ) {
    setSubmitting(true)
    try {
      await api.assessments.restartAssessment(assessmentId)
      STAGE_ORDER.forEach((s) => clearStageTimerKey(assessmentId, s))
      setShowingScenario(false)
      setPhaseScenario(null)
      setShowRestartCheckpoint(false)
      onClear()
      await load()
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to restart')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleBuyoutSubmit(buyoutCompany: string, buyoutAmount: string) {
    if (!buyoutCompany.trim() || !buyoutAmount.trim()) {
      setSubmitError('Please enter company name and amount.')
      return
    }
    const n = parseFloat(buyoutAmount)
    if (isNaN(n) || n <= 0) { setSubmitError('Please enter a valid amount.'); return }
    setSubmitting(true)
    try {
      await api.assessments.chooseBuyout(assessmentId, buyoutCompany, n)
      router.push(`/assessment/${assessmentId}/final-report`)
    } catch (err: any) {
      setSubmitError(err.message || 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    phaseScenario, setPhaseScenario,
    showingScenario, setShowingScenario,
    showRestartCheckpoint, setShowRestartCheckpoint,
    submitting, setSubmitting,
    submitError, setSubmitError,
    handleScenarioSubmit,
    handleContinue,
    handleRestart,
    handleBuyoutSubmit,
  }
}
