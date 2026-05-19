'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/src/lib/api'
import type { AssessmentState, EvaluationReport, Investor, InvestorScorecard } from '@/src/types'
import { VerdictCeremony } from '@/src/components/verdict/VerdictCeremony'
import { EmberDriftBackdrop } from '@/src/components/verdict/EmberDriftBackdrop'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'

// ============================================================
// /assessment/[id]/verdict
// ----------------------------------------------------------------
// Cinematic verdict ceremony route. Plays once after the War Room
// completes — bridges between `/war-room` and the existing
// `/final-report` page (which stays untouched for data continuity).
//
// Data dependencies (all existing endpoints, no new API contracts):
//   • GET /assessments/:id              → AssessmentState (selected investors)
//   • GET /config/investors             → Investor[]
//   • GET /assessments/:id/warroom/scorecard → InvestorScorecard[]
//   • GET /assessments/:id/report       → EvaluationReport
//
// The report fetch is best-effort — if it 404s (report not yet
// generated), the ceremony falls back to a default archetype line.
// Scorecards are NOT optional — without them there's nothing to
// reveal, so we show a graceful loading/error state.
// ============================================================

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; investors: Investor[]; scorecards: InvestorScorecard[]; report: EvaluationReport | null }
  | { kind: 'error'; message: string }

export default function VerdictPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params?.assessmentId as string
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  // ── Narrator — verdict ceremony onboarding ──
  useNarratorOnboarding('verdict')

  useEffect(() => {
    if (!assessmentId) return
    let cancelled = false

    const load = async () => {
      try {
        const [assessmentState, allInvestors, scorecards] = await Promise.all([
          api.assessments.get(assessmentId) as Promise<AssessmentState>,
          api.config.getInvestors() as Promise<Investor[]>,
          api.assessments.getScorecard(assessmentId) as Promise<InvestorScorecard[]>,
        ])

        const selectedIds: string[] = assessmentState?.assessment?.selectedInvestors ?? []
        const selected = selectedIds.length > 0
          ? allInvestors.filter((inv) => selectedIds.includes(inv.id))
          : allInvestors

        // Report is optional — don't block the ceremony if it 404s.
        let report: EvaluationReport | null = null
        try {
          report = (await api.assessments.getReport(assessmentId)) as EvaluationReport
        } catch {
          report = null
        }

        if (cancelled) return
        setState({
          kind: 'ready',
          investors: selected,
          scorecards,
          report,
        })
      } catch (err) {
        if (cancelled) return
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Failed to load the verdict.',
        })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [assessmentId])

  const handleContinue = () => {
    router.push(`/assessment/${assessmentId}/final-report`)
  }

  if (state.kind === 'loading') {
    return <VerdictLoading />
  }

  if (state.kind === 'error') {
    return <VerdictError message={state.message} onRetry={() => router.refresh()} />
  }

  return (
    <VerdictCeremony
      investors={state.investors}
      scorecards={state.scorecards}
      report={state.report}
      onContinue={handleContinue}
    />
  )
}

function VerdictLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[color:var(--color-warroom-black)]">
      <EmberDriftBackdrop density={50} />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin-slow rounded-full border-2 border-[color:var(--color-warroom-gold)]/30 border-t-[color:var(--color-warroom-gold)]" />
        <p className="font-display text-xs uppercase tracking-[0.22em] text-[color:var(--color-warroom-gold)]/70">
          The council reconvenes…
        </p>
      </div>
    </div>
  )
}

function VerdictError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[color:var(--color-warroom-black)] px-4">
      <EmberDriftBackdrop density={30} />
      <div className="relative z-10 max-w-md rounded-md border border-[color:var(--color-warroom-crimson)]/40 bg-card/85 p-6 text-center backdrop-blur-md">
        <p className="font-display text-[0.6rem] uppercase tracking-[0.22em] text-[color:var(--color-warroom-crimson-bright)]">
          The chamber refused entry
        </p>
        <p className="mt-3 text-sm text-foreground/80">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-sm border border-[color:var(--color-warroom-gold)]/45 px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-warroom-gold)] transition-all hover:border-[color:var(--color-warroom-gold)] hover:bg-[color:var(--color-warroom-obsidian)]/70"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
