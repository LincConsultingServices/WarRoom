'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Archive,
  Calendar,
  Clock,
  AlertTriangle,
  Download,
  Share2,
  Printer,
  MessageSquare,
  BarChart3,
  ChevronDown,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import {
  StoneCard,
  WarRoomCTA,
  GoldDivider,
  SigilBadge,
} from '@/src/components/primitives'
import { easeDramatic } from '@/lib/animations/variants'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ResponseDetail {
  id: string
  questionText: string
  userAnswer: string
  aiFeedback: string
  score: number
  stage: number
  timestamp: string
}

interface SimulationDetail {
  id: string
  attemptNumber: number
  status: string
  createdAt: string
  completedAt: string | null
  totalDuration: number
  score: number
  mistakes: Array<{ name: string; impact: string }>
  competencies: Array<{ name: string; score: number; level: string }>
  responses: ResponseDetail[]
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PROGRESS_CLASSES =
  'h-1.5 bg-[color:var(--color-warroom-rampart)] [&>div]:bg-[color:var(--color-warroom-gold)]'

const LEVEL_TONES: Record<string, string> = {
  Expert: 'text-[color:var(--color-warroom-gold-bright)]',
  Advanced: 'text-[color:var(--color-warroom-gold)]',
  Intermediate: 'text-[color:var(--color-warroom-silver)]',
  Developing: 'text-[color:var(--color-warroom-ember)]',
  Beginner: 'text-[color:var(--color-warroom-crimson-bright)]',
}

type TabKey = 'overview' | 'responses' | 'competencies'

// ─── Page ───────────────────────────────────────────────────────────────────

export default function HistoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  const assessmentId = params.assessmentId as string

  const [simulation, setSimulation] = useState<SimulationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/history/${assessmentId}`)
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (!res.ok) throw new Error('Failed to load simulation details')
        const data = await res.json()
        setSimulation(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [assessmentId, router])

  // ── Loading ──

  if (loading) {
    return (
      <div className="py-6 max-w-4xl mx-auto px-2 sm:px-0 space-y-6">
        <div className="flex items-center gap-3">
          <Archive className="h-5 w-5 text-[color:var(--color-warroom-gold)]" />
          <div className="h-6 w-48 rounded bg-[color:var(--color-warroom-rampart)] animate-pulse" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="got-stone-card h-28 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <div className="got-stone-card h-[400px] animate-pulse" />
      </div>
    )
  }

  // ── Error ──

  if (error || !simulation) {
    return (
      <div className="py-12 max-w-md mx-auto text-center">
        <StoneCard accent="var(--color-warroom-crimson)" className="py-10">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-[color:var(--color-warroom-crimson-bright)]" />
          <p
            className="text-sm text-[color:var(--color-warroom-crimson-bright)] mb-5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {error || 'Campaign not found'}
          </p>
          <Link href="/history">
            <WarRoomCTA size="sm" variant="ghost">
              Return to Archives
            </WarRoomCTA>
          </Link>
        </StoneCard>
      </div>
    )
  }

  const isCompleted = simulation.status === 'COMPLETED'

  // ── Tabs ──

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'responses', label: 'Session Transcript' },
    { key: 'competencies', label: 'Competencies' },
  ]

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Archive
                className="h-6 w-6 text-[color:var(--color-warroom-gold)]"
                aria-hidden
              />
              <h1
                className="text-xl font-semibold tracking-[0.04em]"
                style={{
                  fontFamily: 'var(--font-display)',
                  background:
                    'linear-gradient(135deg, var(--color-warroom-gold), var(--color-warroom-gold-bright))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Campaign {simulation.attemptNumber} Report
              </h1>
            </div>

            <div
              className="flex flex-wrap items-center gap-4 text-xs text-[color:var(--color-warroom-smoke)]"
              style={{ fontFamily: 'var(--font-body, serif)' }}
            >
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(simulation.createdAt), 'PPP')}
              </span>
              {simulation.totalDuration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {simulation.totalDuration} min
                </span>
              )}
              <SigilBadge tone={isCompleted ? 'gold' : 'crimson'}>
                {simulation.status.replace('_', ' ')}
              </SigilBadge>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <WarRoomCTA size="sm" variant="ghost" icon={Printer}>
              Print
            </WarRoomCTA>
            <WarRoomCTA size="sm" variant="ghost" icon={Share2}>
              Share
            </WarRoomCTA>
            <WarRoomCTA size="sm" variant="ghost" icon={Download}>
              Export
            </WarRoomCTA>
          </div>
        </div>
        <GoldDivider variant="line" />
      </motion.div>

      {/* ── Tab navigation ── */}
      <motion.div
        className="mb-6"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: easeDramatic }}
      >
        <div className="flex gap-1 p-1 rounded-[4px] bg-[color:var(--color-warroom-rampart)]/60 border border-[color:var(--color-warroom-ash)]/25 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 text-[10px] uppercase tracking-[0.14em] rounded-[3px] transition-all',
                activeTab === tab.key
                  ? 'bg-[color:var(--color-warroom-gold)]/[0.12] text-[color:var(--color-warroom-gold)] border border-[color:var(--color-warroom-gold)]/30'
                  : 'text-[color:var(--color-warroom-smoke)] hover:text-[color:var(--color-warroom-ivory)] border border-transparent',
              )}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeDramatic }}
            className="space-y-6"
          >
            {/* Stat tiles */}
            <div className="grid md:grid-cols-3 gap-4">
              <StoneCard
                accent="var(--color-warroom-gold)"
                className="text-center py-6"
              >
                <div
                  className="text-3xl font-bold text-[color:var(--color-warroom-gold-bright)]"
                  style={{ fontFamily: 'var(--font-data, var(--font-mono))' }}
                >
                  {simulation.score}%
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)] mt-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Overall Score
                </div>
              </StoneCard>

              <StoneCard
                accent={
                  simulation.mistakes.length > 0
                    ? 'var(--color-warroom-crimson)'
                    : 'var(--color-warroom-verdant)'
                }
                className="text-center py-6"
              >
                <div
                  className={cn(
                    'text-3xl font-bold',
                    simulation.mistakes.length > 0
                      ? 'text-[color:var(--color-warroom-crimson-bright)]'
                      : 'text-[color:var(--color-warroom-verdant)]',
                  )}
                  style={{ fontFamily: 'var(--font-data, var(--font-mono))' }}
                >
                  {simulation.mistakes.length}
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)] mt-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Critical Mistakes
                </div>
              </StoneCard>

              <StoneCard
                accent="var(--color-warroom-gold)"
                className="text-center py-6"
              >
                <div
                  className="text-2xl font-bold text-[color:var(--color-warroom-ivory)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {isCompleted ? 'Complete' : 'Partial'}
                </div>
                <div
                  className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)] mt-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {simulation.completedAt
                    ? `Finished ${format(new Date(simulation.completedAt), 'P')}`
                    : 'In progress'}
                </div>
              </StoneCard>
            </div>

            {/* Mistakes detail */}
            {simulation.mistakes.length > 0 && (
              <StoneCard
                accent="var(--color-warroom-crimson)"
                padding="none"
              >
                <div className="flex items-center gap-2 px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                  <AlertTriangle className="h-4 w-4 text-[color:var(--color-warroom-crimson-bright)]" />
                  <h3
                    className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-crimson-bright)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Critical Mistakes Identified
                  </h3>
                </div>
                <div className="px-6 py-4 space-y-3">
                  {simulation.mistakes.map((mistake, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 items-start p-3 rounded-[3px] border border-[color:var(--color-warroom-crimson)]/20 bg-[color:var(--color-warroom-crimson)]/[0.05]"
                    >
                      <div
                        className="h-6 w-6 rounded-full border border-[color:var(--color-warroom-crimson)]/40 text-[color:var(--color-warroom-crimson-bright)] flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        !
                      </div>
                      <div>
                        <h4
                          className="text-sm font-semibold text-[color:var(--color-warroom-ivory)]"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {mistake.name}
                        </h4>
                        <p
                          className="text-xs text-[color:var(--color-warroom-smoke)] mt-1"
                          style={{ fontFamily: 'var(--font-body, serif)' }}
                        >
                          {mistake.impact}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </StoneCard>
            )}
          </motion.div>
        )}

        {activeTab === 'responses' && (
          <motion.div
            key="responses"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeDramatic }}
          >
            <StoneCard padding="none">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <MessageSquare className="h-4 w-4 text-[color:var(--color-warroom-gold)]" />
                <h3
                  className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Session Transcript
                </h3>
                <span
                  className="text-[10px] text-[color:var(--color-warroom-smoke)] ml-auto"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Every question, answer, and the Council&apos;s feedback
                </span>
              </div>

              <div className="divide-y divide-[color:var(--color-warroom-ash)]/15">
                {simulation.responses.length === 0 ? (
                  <div className="py-10 text-center">
                    <MessageSquare className="h-8 w-8 mx-auto mb-3 text-[color:var(--color-warroom-ash)]" />
                    <p
                      className="text-xs text-[color:var(--color-warroom-smoke)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      No responses recorded for this campaign.
                    </p>
                  </div>
                ) : (
                  simulation.responses.map((resp, index) => {
                    const isOpen = expandedResponse === resp.id
                    const scoreColor =
                      resp.score >= 70
                        ? 'gold'
                        : resp.score >= 40
                          ? 'amethyst'
                          : 'crimson'

                    return (
                      <div key={resp.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedResponse(isOpen ? null : resp.id)
                          }
                          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[color:var(--color-warroom-gold)]/[0.02] transition-colors text-left"
                        >
                          <div
                            className="w-8 h-8 rounded-full border border-[color:var(--color-warroom-ash)]/30 flex items-center justify-center text-xs font-bold text-[color:var(--color-warroom-smoke)] shrink-0"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm text-[color:var(--color-warroom-ivory)] line-clamp-1"
                              style={{ fontFamily: 'var(--font-body, serif)' }}
                            >
                              {resp.questionText}
                            </p>
                            <p
                              className="text-[10px] text-[color:var(--color-warroom-smoke)] mt-0.5"
                              style={{ fontFamily: 'var(--font-display)' }}
                            >
                              Stage {resp.stage}
                              {resp.timestamp &&
                                ` • ${format(new Date(resp.timestamp), 'p')}`}
                            </p>
                          </div>

                          <SigilBadge tone={scoreColor as 'gold' | 'crimson' | 'amethyst'}>
                            {resp.score}/100
                          </SigilBadge>

                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-[color:var(--color-warroom-smoke)] transition-transform shrink-0',
                              isOpen && 'rotate-180',
                            )}
                          />
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.25,
                                ease: easeDramatic,
                              }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-5 pt-1 space-y-4 ml-12">
                                {/* Your answer */}
                                <div>
                                  <h4
                                    className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)] mb-2"
                                    style={{
                                      fontFamily: 'var(--font-display)',
                                    }}
                                  >
                                    Your Answer
                                  </h4>
                                  <div
                                    className="p-4 rounded-[3px] border border-[color:var(--color-warroom-ash)]/20 bg-[color:var(--color-warroom-rampart)]/40 text-sm text-[color:var(--color-warroom-ivory)] whitespace-pre-wrap"
                                    style={{
                                      fontFamily: 'var(--font-body, serif)',
                                    }}
                                  >
                                    {resp.userAnswer}
                                  </div>
                                </div>

                                {/* Council feedback */}
                                <div>
                                  <h4
                                    className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)] mb-2 flex items-center gap-1.5"
                                    style={{
                                      fontFamily: 'var(--font-display)',
                                    }}
                                  >
                                    <Star className="h-3 w-3 text-[color:var(--color-warroom-gold)]" />
                                    Council Feedback
                                  </h4>
                                  <div
                                    className="p-4 rounded-[3px] border border-[color:var(--color-warroom-gold)]/15 bg-[color:var(--color-warroom-gold)]/[0.03] text-sm text-[color:var(--color-warroom-ivory)]"
                                    style={{
                                      fontFamily: 'var(--font-body, serif)',
                                    }}
                                  >
                                    {resp.aiFeedback ||
                                      'No specific feedback recorded for this response.'}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })
                )}
              </div>
            </StoneCard>
          </motion.div>
        )}

        {activeTab === 'competencies' && (
          <motion.div
            key="competencies"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: easeDramatic }}
          >
            <StoneCard padding="none">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <BarChart3 className="h-4 w-4 text-[color:var(--color-warroom-gold)]" />
                <h3
                  className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Competency Breakdown
                </h3>
              </div>

              {simulation.competencies.length === 0 ? (
                <div className="py-10 text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-3 text-[color:var(--color-warroom-ash)]" />
                  <p
                    className="text-xs text-[color:var(--color-warroom-smoke)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    No competency data available.
                  </p>
                </div>
              ) : (
                <div className="p-6 grid gap-5 md:grid-cols-2">
                  {simulation.competencies.map((comp, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <h4
                          className="text-sm font-semibold text-[color:var(--color-warroom-ivory)]"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {comp.name}
                        </h4>
                        <span
                          className="text-xs text-[color:var(--color-warroom-smoke)]"
                          style={{
                            fontFamily: 'var(--font-data, var(--font-mono))',
                          }}
                        >
                          {comp.score}/100
                        </span>
                      </div>
                      <Progress
                        value={comp.score || 0}
                        className={cn('flex-1', PROGRESS_CLASSES)}
                      />
                      <p
                        className={cn(
                          'text-[10px] uppercase tracking-[0.12em]',
                          LEVEL_TONES[comp.level] ||
                            'text-[color:var(--color-warroom-smoke)]',
                        )}
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {comp.level}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </StoneCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
