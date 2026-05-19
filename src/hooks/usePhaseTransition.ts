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
  const [showBuyoutLockout, setShowBuyoutLockout] = useState(false)
  const [buyoutContext, setBuyoutContext] = useState<{ company: string; amount: number } | null>(null)

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

  // handleRestart restarts the assessment. opts.mode defaults to "month_zero"
  // (full wipe — the legacy behaviour). Pass mode="continue" with an optional
  // targetStage to soft-restart while preserving prior answers (used when the
  // user picks "continue with current plan" from a checkpoint).
  async function handleRestart(
    onClear: () => void,
    opts?: { mode?: 'month_zero' | 'continue'; targetStage?: string }
  ) {
    setSubmitting(true)
    try {
      await api.assessments.restartAssessment(assessmentId, opts)
      // Only clear all timers on a hard restart — a continue-mode restart should
      // keep timer progress for stages the user has already entered.
      if (!opts || opts.mode !== 'continue') {
        STAGE_ORDER.forEach((s) => clearStageTimerKey(assessmentId, s))
      }
      setShowingScenario(false)
      setPhaseScenario(null)
      setShowRestartCheckpoint(false)
      onClear()
      await load()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to restart')
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
      setBuyoutContext({ company: buyoutCompany.trim(), amount: n })
      setShowBuyoutLockout(true)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  function dismissBuyoutLockout() {
    setShowBuyoutLockout(false)
    router.push(`/assessment/${assessmentId}/final-report`)
  }

  function triggerBuyoutLockout(company: string, amount: number) {
    setBuyoutContext({ company: (company || '').trim(), amount })
    setShowBuyoutLockout(true)
  }

  return {
    phaseScenario, setPhaseScenario,
    showingScenario, setShowingScenario,
    showRestartCheckpoint, setShowRestartCheckpoint,
    submitting, setSubmitting,
    submitError, setSubmitError,
    showBuyoutLockout, buyoutContext,
    handleScenarioSubmit,
    handleContinue,
    handleRestart,
    handleBuyoutSubmit,
    dismissBuyoutLockout,
    triggerBuyoutLockout,
  }
}
