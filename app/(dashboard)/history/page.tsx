'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Archive,
  Clock,
  Play,
  AlertTriangle,
  Swords,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react'
import api from '@/src/lib/api'
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

interface SimulationHistoryItem {
  id: string
  attemptNumber: number
  status: string
  score: number | null
  date: string
  duration: number | null
  stage: string
  mistakes: number
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  const [history, setHistory] = useState<SimulationHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useNarratorOnboarding('history', { enabled: false }) // narrator disabled: was mid-nav spam

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/history')
        if (response.status === 401) {
          router.push('/login')
          return
        }

        const simulations: unknown = await api.assessments.list()

        // Transform for history view
        const historyItems = ((simulations as Record<string, unknown>[]) || []).map(
          (a: Record<string, unknown>, idx: number) => ({
            id: String(a.id || ''),
            attemptNumber: idx + 1,
            date: String(a.createdAt || ''),
            stage: `Stage ${a.currentStage ?? '?'}`,
            score: typeof a.score === 'number' ? a.score : null,
            duration: typeof a.duration === 'number' ? a.duration : null,
            mistakes: typeof a.mistakesCount === 'number' ? a.mistakesCount : 0,
            status: String(a.status || 'in-progress'),
          }),
        )

        setHistory(historyItems)
        if (historyItems.length > 0) setExpandedId(historyItems[0].id)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('Unauthorized')) {
          router.push('/login')
          return
        }
        setError('Failed to load history.')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [router])

  // ── Loading ──

  if (loading) {
    return (
      <div className="py-6 max-w-4xl mx-auto px-2 sm:px-0 space-y-6">
        <div className="flex items-center gap-3">
          <Archive className="h-5 w-5 text-[color:var(--color-chessboard-gold)]" />
          <div className="h-6 w-48 rounded bg-[color:var(--color-chessboard-rampart)] animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="got-stone-card h-36 animate-pulse"
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Archive
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
              The Archives
            </h1>
          </div>

          <Link href="/assessment/start">
            <ChessboardCTA size="sm" variant="ghost" icon={Play}>
              New Campaign
            </ChessboardCTA>
          </Link>
        </div>

        <p
          className="text-sm text-[color:var(--color-chessboard-smoke)] mb-4"
          style={{ fontFamily: 'var(--font-body, serif)' }}
        >
          Review your past campaigns and track your growth through the gauntlet.
        </p>
        <GoldDivider variant="line" />
      </motion.div>

      {history.length === 0 ? (
        /* ── Empty state ── */
        <StoneCard className="py-14 text-center">
          <Clock className="h-10 w-10 mx-auto mb-4 text-[color:var(--color-chessboard-ash)]" />
          <p
            className="text-sm text-[color:var(--color-chessboard-smoke)] mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            No simulations yet
          </p>
          <p
            className="text-xs text-[color:var(--color-chessboard-smoke)] mb-6 max-w-sm mx-auto"
            style={{ fontFamily: 'var(--font-body, serif)' }}
          >
            Complete your first campaign to see your history and track your
            progress through the gauntlet.
          </p>
          <Link href="/assessment/start">
            <ChessboardCTA size="sm" variant="ghost" icon={Play}>
              Start Campaign
            </ChessboardCTA>
          </Link>
        </StoneCard>
      ) : (
        /* ── History cards ── */
        <motion.div
          className="space-y-5"
          variants={staggerContainer}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="show"
        >
          {history.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggle={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ─── History Card ───────────────────────────────────────────────────────────

function HistoryCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: SimulationHistoryItem
  isExpanded: boolean
  onToggle: () => void
}) {
  const isCompleted = item.status === 'COMPLETED'

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
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div>
            <h2
              className="text-base font-semibold text-[color:var(--color-chessboard-ivory)] tracking-[0.04em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Campaign {item.attemptNumber}
            </h2>
            {item.date && (
              <p
                className="text-xs text-[color:var(--color-chessboard-smoke)] mt-0.5 flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-body, serif)' }}
              >
                <Calendar className="h-3 w-3" />
                {new Date(item.date).toLocaleDateString()}
              </p>
            )}
          </div>
          <SigilBadge
            tone={isCompleted ? 'gold' : 'crimson'}
            icon={isCompleted ? CheckCircle2 : Clock}
          >
            {isCompleted
              ? 'Complete'
              : item.status.replace('_', ' ') || 'Active'}
          </SigilBadge>
        </div>

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-3 gap-px mx-6 mb-4 rounded-[3px] overflow-hidden border border-border">
          {[
            { label: 'Stage', value: item.stage },
            {
              label: 'Score',
              value: item.score !== null ? `${item.score}%` : '—',
            },
            {
              label: 'Duration',
              value:
                item.duration !== null
                  ? `${Math.round(item.duration)} min`
                  : '—',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center py-3 bg-muted"
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

        {/* ── Mistakes indicator ── */}
        {item.mistakes > 0 && (
          <div className="mx-6 mb-4 flex items-center gap-2 text-[color:var(--color-chessboard-crimson-bright)]">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span
              className="text-[10px] uppercase tracking-[0.12em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {item.mistakes} mistake{item.mistakes !== 1 ? 's' : ''} triggered
            </span>
          </div>
        )}

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
              View Details <ChevronDown className="w-3 h-3" />
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
              <div className="px-6 pb-6 pt-3 border-t border-[color:var(--color-chessboard-ash)]/20 space-y-4">
                <p
                  className="text-xs text-[color:var(--color-chessboard-smoke)]"
                  style={{ fontFamily: 'var(--font-body, serif)' }}
                >
                  Open the full campaign report to review competencies, stage
                  transcripts, and the Council&apos;s feedback.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link href={`/history/${item.id}`}>
                    <ChessboardCTA size="sm" variant="ghost" icon={Swords}>
                      View Full Report
                    </ChessboardCTA>
                  </Link>
                  {!isCompleted && item.status !== 'NOT_STARTED' && (
                    <Link href={`/assessment/${item.id}`}>
                      <ChessboardCTA size="sm" variant="primary" icon={Play}>
                        Continue Campaign
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
