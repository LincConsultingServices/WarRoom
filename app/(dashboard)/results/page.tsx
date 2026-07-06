'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  Play,
  BarChart3,
  AlertTriangle,
  ScrollText,
  Swords,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import api from '@/src/lib/api'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { CompetencyRadarChart } from '@/components/competency-radar-chart-lazy'
import {
  StoneCard,
  ChessboardCTA,
  GoldDivider,
  SigilBadge,
} from '@/src/components/primitives'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'
import {
  staggerContainer,
  staggerItem,
  easeDramatic,
} from '@/lib/animations/variants'

// ─── Types ──────────────────────────────────────────────────────────────────

interface SimulationResult {
  id: string
  attemptNumber: number
  status: string
  currentStage: string
  startedAt: string | null
  completedAt: string | null
  stages: {
    stageNumber: number
    stageName: string
    completedAt: string | null
    questionsAnswered: number
  }[]
  responses: {
    questionId: string
    rawScore: number | null
    stage: { stageNumber: number; stageName: string } | null
  }[]
  competencyScores: {
    competencyCode: string
    competencyName: string
    normalizedScore: number
    levelAchieved: string
  }[]
  mistakesTriggered: {
    mistakeCode: string
    mistakeName: string
    triggeredAtStage: number
    hasCompounded: boolean
  }[]
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STAGE_NAMES: Record<number, string> = {
  [-2]: 'Ideating',
  [-1]: 'Concepting',
  0: 'Committing',
  1: 'Validating',
  2: 'Scaling',
  3: 'Establishing',
}

// currentStage from the API is the raw backend stage ID (e.g.
// "STAGE_2A_GROWTH"), not the -2..3 grid position used for this overview —
// map it here rather than changing the API's field type, which every other
// consumer of this endpoint (dashboard, profile, history) already relies on
// being that raw string.
const STAGE_ID_TO_NUMBER: Record<string, number> = {
  STAGE_NEG2_IDEATION: -2,
  STAGE_NEG1_VISION: -1,
  STAGE_0_COMMITMENT: 0,
  STAGE_1_VALIDATION: 1,
  STAGE_2A_GROWTH: 2,
  STAGE_2B_EXPANSION: 2,
  STAGE_3_SCALE: 3,
}

const PROGRESS_CLASSES =
  'h-1.5 bg-[color:var(--color-chessboard-rampart)] [&>div]:bg-[color:var(--color-chessboard-gold)]'

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  const [simulations, setSimulations] = useState<SimulationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null)

  useNarratorOnboarding('results', { enabled: false }) // narrator disabled: was mid-nav spam

  useEffect(() => {
    async function fetchResults() {
      try {
        const data: unknown = await api.assessments.list()
        const sims = (data as SimulationResult[]) || []
        setSimulations(sims)
        if (sims.length > 0) setExpandedAttempt(sims[0].id)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('Unauthorized')) {
          router.push('/login')
          return
        }
        console.error(err)
        setError('Failed to load simulation results.')
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [router])

  // ── Loading ──

  if (loading) {
    return (
      <div className="py-6 max-w-4xl mx-auto px-2 sm:px-0 space-y-6">
        <div className="flex items-center gap-3">
          <ScrollText className="h-5 w-5 text-[color:var(--color-chessboard-gold)]" />
          <div className="h-6 w-48 rounded bg-[color:var(--color-chessboard-rampart)] animate-pulse" />
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="got-stone-card h-48 animate-pulse"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    )
  }

  // ── Error ──

  if (error) {
    return (
      <div className="py-12 max-w-md mx-auto text-center">
        <StoneCard accent="var(--color-chessboard-crimson)" className="py-10">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-[color:var(--color-chessboard-crimson-bright)]" />
          <p
            className="text-sm text-[color:var(--color-chessboard-crimson-bright)] mb-5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {error}
          </p>
          <ChessboardCTA
            size="sm"
            variant="ghost"
            onClick={() => window.location.reload()}
          >
            Try Again
          </ChessboardCTA>
        </StoneCard>
      </div>
    )
  }

  // ── Main ──

  return (
    <div className="py-6 max-w-4xl mx-auto px-2 sm:px-0 w-full">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeDramatic }}
      >
        <div className="flex items-center gap-3 mb-4">
          <ScrollText
            className="h-6 w-6 text-[color:var(--color-chessboard-gold)]"
            aria-hidden
          />
          <h1
            className="text-xl font-semibold tracking-[0.04em]"
            style={{
              fontFamily: 'var(--font-display)',
              background:
                'linear-gradient(135deg, var(--color-chessboard-gold), var(--color-chessboard-gold-bright))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Results
          </h1>
        </div>
        <p
          className="text-sm text-[color:var(--color-chessboard-smoke)] mb-4"
          style={{ fontFamily: 'var(--font-body, serif)' }}
        >
          Detailed breakdown of all your simulation campaigns.
        </p>
        <GoldDivider variant="line" />
      </motion.div>

      {simulations.length === 0 ? (
        /* ── Empty state ── */
        <StoneCard className="py-14 text-center">
          <Swords className="h-10 w-10 mx-auto mb-4 text-[color:var(--color-chessboard-ash)]" />
          <p
            className="text-sm text-[color:var(--color-chessboard-smoke)] mb-5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            No simulations found. Begin your first trial to see results here.
          </p>
          <Link href="/assessment/start">
            <ChessboardCTA size="sm" variant="ghost" icon={Play}>
              Start Simulation
            </ChessboardCTA>
          </Link>
        </StoneCard>
      ) : (
        /* ── Simulation cards ── */
        <motion.div
          className="space-y-6"
          variants={staggerContainer}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="show"
        >
          {simulations.map((simulation) => (
            <SimulationCard
              key={simulation.id}
              simulation={simulation}
              isExpanded={expandedAttempt === simulation.id}
              onToggle={() =>
                setExpandedAttempt(
                  expandedAttempt === simulation.id ? null : simulation.id,
                )
              }
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ─── Simulation Card ────────────────────────────────────────────────────────

function SimulationCard({
  simulation,
  isExpanded,
  onToggle,
}: {
  simulation: SimulationResult
  isExpanded: boolean
  onToggle: () => void
}) {
  const isCompleted = simulation.status === 'COMPLETED'
  const totalResponses = simulation.responses?.length || 0
  const completedStages =
    simulation.stages?.filter((s) => s.completedAt)?.length || 0
  const avgScore =
    simulation.competencyScores?.length > 0
      ? Math.round(
          simulation.competencyScores.reduce(
            (sum, c) => sum + (c.normalizedScore || 0),
            0,
          ) / simulation.competencyScores.length,
        )
      : null

  return (
    <motion.div variants={staggerItem}>
      <StoneCard
        accent={
          isCompleted
            ? 'var(--color-chessboard-gold)'
            : 'var(--color-chessboard-ember)'
        }
        padding="none"
      >
        {/* ── Header row ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h2
              className="text-base font-semibold text-[color:var(--color-chessboard-ivory)] tracking-[0.04em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Campaign {simulation.attemptNumber}
            </h2>
            <p
              className="text-xs text-[color:var(--color-chessboard-smoke)] mt-0.5"
              style={{ fontFamily: 'var(--font-body, serif)' }}
            >
              {isCompleted && simulation.completedAt
                ? `Completed on ${new Date(simulation.completedAt).toLocaleDateString()}`
                : simulation.startedAt
                  ? `Started on ${new Date(simulation.startedAt).toLocaleDateString()}`
                  : 'Not started'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {avgScore !== null && (
              <div className="text-right">
                <div
                  className="text-xl font-bold text-[color:var(--color-chessboard-gold-bright)]"
                  style={{ fontFamily: 'var(--font-data, var(--font-mono))' }}
                >
                  {avgScore}
                </div>
                <div
                  className="text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-chessboard-smoke)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Avg Score
                </div>
              </div>
            )}
            <SigilBadge
              tone={isCompleted ? 'gold' : 'crimson'}
              icon={isCompleted ? CheckCircle2 : Clock}
            >
              {isCompleted
                ? 'Complete'
                : simulation.status?.replace('_', ' ') || 'Active'}
            </SigilBadge>
          </div>
        </div>

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-4 gap-px mx-6 mb-4 rounded-[3px] overflow-hidden border border-[color:var(--color-chessboard-ash)]/25">
          {[
            { label: 'Responses', value: totalResponses },
            { label: 'Stages', value: `${completedStages}/6` },
            {
              label: 'Competencies',
              value: simulation.competencyScores?.length || 0,
            },
            {
              label: 'Mistakes',
              value: simulation.mistakesTriggered?.length || 0,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center py-3 bg-[color:var(--color-chessboard-rampart)]/50"
            >
              <div
                className="text-sm font-bold text-[color:var(--color-chessboard-gold)]"
                style={{ fontFamily: 'var(--font-data, var(--font-mono))' }}
              >
                {stat.value}
              </div>
              <div
                className="text-[9px] uppercase tracking-[0.12em] text-[color:var(--color-chessboard-smoke)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Stage progress ── */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-6 gap-1.5">
            {([-2, -1, 0, 1, 2, 3] as const).map((stageNum) => {
              const stage = simulation.stages?.find(
                (s) => s.stageNumber === stageNum,
              )
              const isDone = Boolean(stage?.completedAt)
              const isCurrent =
                !isDone && STAGE_ID_TO_NUMBER[simulation.currentStage] === stageNum
              const stageResponses =
                simulation.responses?.filter(
                  (r) => r.stage?.stageNumber === stageNum,
                ) || []

              return (
                <div
                  key={stageNum}
                  className={cn(
                    'text-center py-2 px-1 rounded-[3px] text-[10px] border transition-colors',
                    isDone &&
                      'bg-[color:var(--color-chessboard-gold)]/[0.08] border-[color:var(--color-chessboard-gold)]/30',
                    isCurrent &&
                      'bg-[color:var(--color-chessboard-ember)]/[0.08] border-[color:var(--color-chessboard-ember)]/40 ring-1 ring-[color:var(--color-chessboard-ember)]/30',
                    !isDone &&
                      !isCurrent &&
                      'bg-[color:var(--color-chessboard-rampart)]/40 border-[color:var(--color-chessboard-ash)]/20',
                  )}
                >
                  <div
                    className={cn(
                      'font-semibold truncate',
                      isDone
                        ? 'text-[color:var(--color-chessboard-gold)]'
                        : isCurrent
                          ? 'text-[color:var(--color-chessboard-ember)]'
                          : 'text-[color:var(--color-chessboard-smoke)]',
                    )}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {STAGE_NAMES[stageNum] || `S${stageNum}`}
                  </div>
                  <div className="text-[color:var(--color-chessboard-smoke)] mt-0.5">
                    {stageResponses.length > 0
                      ? `${stageResponses.length} Q`
                      : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Expand toggle ── */}
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-3 border-t border-[color:var(--color-chessboard-ash)]/20 text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-chessboard-smoke)] hover:text-[color:var(--color-chessboard-gold)] transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {isExpanded ? (
            <>
              Hide Details <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              Show Details <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>

        {/* ── Expanded details ── */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: easeDramatic }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-2 border-t border-[color:var(--color-chessboard-ash)]/20 space-y-6">
                {/* Competency Scores */}
                {simulation.competencyScores?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="h-4 w-4 text-[color:var(--color-chessboard-gold)]" />
                      <h3
                        className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-chessboard-smoke)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        Competency Profile
                      </h3>
                    </div>

                    {/* Radar chart */}
                    <div className="got-stone-card p-4 mb-4">
                      <CompetencyRadarChart
                        spiderData={simulation.competencyScores.reduce(
                          (acc, c) => ({
                            ...acc,
                            [c.competencyCode]: c.normalizedScore || 0,
                          }),
                          {},
                        )}
                        competencyRanking={simulation.competencyScores.map(
                          (c) => ({
                            code: c.competencyCode,
                            name: c.competencyName,
                          }),
                        )}
                      />
                    </div>

                    {/* Competency bars */}
                    <div className="space-y-3">
                      {simulation.competencyScores.map((c) => (
                        <div
                          key={c.competencyCode}
                          className="flex items-center gap-3"
                        >
                          <span
                            className="text-[10px] w-7 text-[color:var(--color-chessboard-smoke)] shrink-0"
                            style={{
                              fontFamily: 'var(--font-data, var(--font-mono))',
                            }}
                          >
                            {c.competencyCode}
                          </span>
                          <span
                            className="text-xs w-36 truncate text-[color:var(--color-chessboard-ivory)]"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {c.competencyName}
                          </span>
                          <Progress
                            value={c.normalizedScore || 0}
                            className={cn('flex-1', PROGRESS_CLASSES)}
                          />
                          <span
                            className="text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-[2px] border border-[color:var(--color-chessboard-ash)]/30 text-[color:var(--color-chessboard-smoke)] w-10 text-center shrink-0"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {c.levelAchieved}
                          </span>
                          <span
                            className="text-xs w-7 text-right text-[color:var(--color-chessboard-ivory)] shrink-0"
                            style={{
                              fontFamily: 'var(--font-data, var(--font-mono))',
                            }}
                          >
                            {c.normalizedScore || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mistakes */}
                {simulation.mistakesTriggered?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-[color:var(--color-chessboard-crimson-bright)]" />
                      <h3
                        className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-chessboard-smoke)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        Mistakes Triggered
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {simulation.mistakesTriggered.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-[3px] border border-[color:var(--color-chessboard-crimson)]/20 bg-[color:var(--color-chessboard-crimson)]/[0.05]"
                        >
                          <div>
                            <span
                              className="text-xs text-[color:var(--color-chessboard-ivory)]"
                              style={{ fontFamily: 'var(--font-display)' }}
                            >
                              {m.mistakeName || m.mistakeCode}
                            </span>
                            <span className="text-[10px] text-[color:var(--color-chessboard-smoke)] ml-2">
                              Stage {m.triggeredAtStage}
                            </span>
                          </div>
                          {m.hasCompounded && (
                            <SigilBadge tone="crimson">Compounded</SigilBadge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {isCompleted && (
                    <Link href={`/assessment/${simulation.id}/final-report`}>
                      <ChessboardCTA
                        size="sm"
                        variant="ghost"
                        icon={BarChart3}
                      >
                        View Full Report
                      </ChessboardCTA>
                    </Link>
                  )}
                  {!isCompleted && simulation.status !== 'NOT_STARTED' && (
                    <Link href={`/assessment/${simulation.id}`}>
                      <ChessboardCTA size="sm" variant="primary" icon={Play}>
                        Continue Simulation
                      </ChessboardCTA>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </StoneCard>
    </motion.div>
  )
}
