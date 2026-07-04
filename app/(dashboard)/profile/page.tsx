'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/src/lib/api'
import type { Assessment, EvaluationReport, InvestorScorecard } from '@/src/types'
import { Award, Crown, Sparkles } from 'lucide-react'
import { ArchetypeBadge } from '@/src/components/profile/ArchetypeBadge'
import {
  LegacyScoreSparkline,
  type LegacyRun,
} from '@/src/components/profile/LegacyScoreSparkline'
import { PastVerdictCard } from '@/src/components/profile/PastVerdictCard'
import { EmberDriftBackdrop } from '@/src/components/verdict/EmberDriftBackdrop'
import { StoneCard, SigilBadge } from '@/src/components/primitives'
import {
  HouseBanner,
  RenownBar,
  CompetencyConstellation,
  SigilWall,
  HouseCustomizer,
  HearthFlame,
} from '@/src/components/progression'
import { SIGILS } from '@/src/lib/progression'
import { useFounderProgression } from '@/src/hooks/useFounderProgression'
import { LoreTip } from '@/src/components/common/LoreTip'
import { LORE } from '@/src/lib/lore'

// ============================================================
// /profile (route: /(dashboard)/profile)
// ----------------------------------------------------------------
// The founder's character sheet. Surfaces:
//   • House identity (crest, rank, words) + Rating progress
//   • Competency Constellation (best-ever mastery across all runs)
//   • Sigil Wall (earned achievements + aspirational locked ones)
//   • House customiser (rank-gated, earned cosmetics)
//   • Legacy score history + past verdicts (existing)
//
// All data comes from existing endpoints + the progression adapter.
// No existing API contracts are changed.
// ============================================================

interface EnrichedRun {
  assessment: Assessment
  archetypeName: string | null
  legacyScore: number | null
}

function computeFallbackScore(cards: InvestorScorecard[]): number | null {
  if (!cards || cards.length === 0) return null
  const sum = cards.reduce((acc, c) => acc + (c.primaryScore || 0), 0)
  return Math.round(sum / cards.length)
}

async function enrichAssessment(a: Assessment): Promise<EnrichedRun> {
  if (a.status !== 'COMPLETED') {
    return { assessment: a, archetypeName: null, legacyScore: null }
  }

  let archetypeName: string | null = null
  let legacyScore: number | null = null

  try {
    const report = (await api.assessments.getReport(a.id)) as EvaluationReport
    archetypeName = report.entrepreneurType?.trim() || null
    if (report.dealSummary?.investorResults) {
      legacyScore = computeFallbackScore(report.dealSummary.investorResults)
    }
  } catch {
    // ignore — try scorecard fallback
  }

  if (legacyScore == null) {
    try {
      const cards = (await api.assessments.getScorecard(a.id)) as InvestorScorecard[]
      legacyScore = computeFallbackScore(cards)
    } catch {
      legacyScore = null
    }
  }

  return { assessment: a, archetypeName, legacyScore }
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; user: { name?: string } | null; runs: EnrichedRun[] }
  | { kind: 'error'; message: string }

const EMPTY_RUNS: EnrichedRun[] = []

export default function ProfilePage() {
  const router = useRouter()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const { progression, updateHouse } = useFounderProgression()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [user, assessments] = await Promise.all([
          api.auth.me().catch(() => null) as Promise<{ name?: string } | null>,
          api.assessments.list() as Promise<Assessment[]>,
        ])

        const enriched = await Promise.all(assessments.map(enrichAssessment))

        if (cancelled) return

        enriched.sort((a, b) => {
          const aTime = new Date(
            a.assessment.completedAt || a.assessment.updatedAt || a.assessment.createdAt,
          ).getTime()
          const bTime = new Date(
            b.assessment.completedAt || b.assessment.updatedAt || b.assessment.createdAt,
          ).getTime()
          return bTime - aTime
        })

        setState({ kind: 'ready', user, runs: enriched })
      } catch (err) {
        if (cancelled) return
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Failed to load your record.',
        })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const readyRuns = state.kind === 'ready' ? state.runs : EMPTY_RUNS

  const currentArchetype = useMemo<string | null>(() => {
    for (const run of readyRuns) {
      if (run.archetypeName) return run.archetypeName
    }
    return null
  }, [readyRuns])

  const sparklineRuns = useMemo<LegacyRun[]>(() => {
    return [...readyRuns]
      .filter((r) => r.legacyScore != null && r.assessment.status === 'COMPLETED')
      .sort((a, b) => {
        const aT = new Date(a.assessment.completedAt || a.assessment.createdAt).getTime()
        const bT = new Date(b.assessment.completedAt || b.assessment.createdAt).getTime()
        return aT - bT
      })
      .map((r) => ({
        id: r.assessment.id,
        score: r.legacyScore!,
        label: r.archetypeName || `Run ${r.assessment.attemptNumber}`,
        completedAt: r.assessment.completedAt,
      }))
  }, [readyRuns])

  const completedCount = useMemo(
    () => readyRuns.filter((r) => r.assessment.status === 'COMPLETED').length,
    [readyRuns],
  )

  if (state.kind === 'loading') {
    return <ProfileLoading />
  }

  if (state.kind === 'error') {
    return <ProfileError message={state.message} onRetry={() => router.refresh()} />
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--color-chessboard-black)] text-foreground">
      <EmberDriftBackdrop density={38} />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col gap-10 px-4 py-12 sm:py-16">
        {/* Hero — House identity */}
        <header className="flex flex-col items-center gap-5 text-center">
          <p className="font-display text-[0.6rem] uppercase tracking-[0.32em] text-[color:var(--color-chessboard-silver)]/70">
            Player Profile
          </p>
          {progression ? (
            <HouseBanner
              house={progression.house}
              rank={progression.rank}
              founderName={state.user?.name ?? undefined}
              variant="hero"
            />
          ) : state.user?.name ? (
            <h1
              className="font-display text-3xl font-bold tracking-wider text-foreground sm:text-4xl"
              style={{ textShadow: '0 0 24px rgba(200,200,200,0.25)' }}
            >
              {state.user.name}
            </h1>
          ) : null}
          {currentArchetype && (
            <ArchetypeBadge archetypeName={currentArchetype} variant="inline" />
          )}
        </header>

        {/* Rating + streak */}
        {progression && (
          <StoneCard padding="md">
            <RenownBar rank={progression.rank} rating={progression.rating} />
            <div className="mt-4 flex justify-end">
              <HearthFlame streak={progression.streak} />
            </div>
          </StoneCard>
        )}

        {/* Competency Constellation */}
        {progression && (
          <section className="flex flex-col items-center gap-4 rounded-md border border-[color:var(--color-chessboard-silver)]/25 bg-card/50 p-6 backdrop-blur-sm noise-overlay">
            <SigilBadge icon={Sparkles} tone="silver">
              <LoreTip tip={LORE.constellation}>Competency Constellation</LoreTip>
            </SigilBadge>
            <CompetencyConstellation
              mastery={progression.competencyMastery}
              size={360}
              interactive
            />
          </section>
        )}

        {/* Sigil Wall */}
        {progression && (
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between px-1">
              <SigilBadge icon={Award} tone="silver">
                <LoreTip tip={LORE.sigil}>Sigils</LoreTip>
              </SigilBadge>
              <span className="font-display text-[0.55rem] uppercase tracking-[0.18em] text-foreground/40">
                {progression.sigils.length} / {SIGILS.length} earned
              </span>
            </div>
            <SigilWall earned={progression.sigils} />
          </section>
        )}

        {/* House decree (customiser) */}
        {progression && (
          <section className="flex flex-col gap-4">
            <SigilBadge icon={Crown} tone="silver">
              <LoreTip tip={LORE.house}>Club Affiliation</LoreTip>
            </SigilBadge>
            <StoneCard padding="md">
              <HouseCustomizer
                house={progression.house}
                rankTier={progression.rank.tier}
                onSave={updateHouse}
              />
            </StoneCard>
          </section>
        )}

        {/* Legacy score history */}
        <section className="flex flex-col items-center gap-4 rounded-md border border-[color:var(--color-chessboard-silver)]/25 bg-card/50 p-6 backdrop-blur-sm noise-overlay">
          <div className="text-center">
            <p className="font-display text-[0.6rem] uppercase tracking-[0.22em] text-foreground/55">
              <LoreTip tip={LORE.legacyScore}>Performance Score History</LoreTip>
            </p>
            <p className="mt-1 font-mono text-xs text-foreground/45">
              {completedCount} completed {completedCount === 1 ? 'trial' : 'trials'}
            </p>
          </div>
          <LegacyScoreSparkline
            runs={sparklineRuns}
            width={420}
            height={96}
            className="text-foreground/40"
            onSelectRun={(run) => router.push(`/assessment/${run.id}/final-report`)}
          />
        </section>

        {/* Past verdicts */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-foreground/70">
              Past Verdicts
            </h2>
            <span className="font-display text-[0.55rem] uppercase tracking-[0.18em] text-foreground/40">
              {readyRuns.length} {readyRuns.length === 1 ? 'trial' : 'trials'}
            </span>
          </div>
          {readyRuns.length === 0 ? (
            <div className="rounded-md border border-dashed border-[color:var(--color-chessboard-silver)]/20 bg-card/30 px-6 py-10 text-center">
              <p className="font-display text-xs uppercase tracking-[0.22em] text-foreground/50">
                The boardroom awaits your first pitch.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {readyRuns.map((run) => (
                <li key={run.assessment.id}>
                  <PastVerdictCard
                    assessment={run.assessment}
                    archetypeName={run.archetypeName}
                    legacyScore={run.legacyScore}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

function ProfileLoading() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[color:var(--color-chessboard-black)]">
      <EmberDriftBackdrop density={30} />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin-slow rounded-full border-2 border-[color:var(--color-chessboard-silver)]/30 border-t-[color:var(--color-chessboard-silver)]" />
        <p className="font-display text-xs uppercase tracking-[0.22em] text-[color:var(--color-chessboard-silver)]/70">
          Preparing the boardroom…
        </p>
      </div>
    </main>
  )
}

function ProfileError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[color:var(--color-chessboard-black)] px-4">
      <EmberDriftBackdrop density={20} />
      <div className="relative z-10 max-w-md rounded-md border border-[color:var(--color-chessboard-crimson)]/40 bg-card/85 p-6 text-center backdrop-blur-md">
        <p className="font-display text-[0.6rem] uppercase tracking-[0.22em] text-[color:var(--color-chessboard-crimson-bright)]">
          The record is unavailable
        </p>
        <p className="mt-3 text-sm text-foreground/80">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-sm border border-[color:var(--color-chessboard-silver)]/45 px-4 py-2 font-display text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--color-chessboard-silver)] transition-all hover:border-[color:var(--color-chessboard-silver)] hover:bg-[color:var(--color-chessboard-charcoal)]/70"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
