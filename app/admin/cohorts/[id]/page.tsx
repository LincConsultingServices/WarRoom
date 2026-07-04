'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import api from '@/src/lib/api'
import type {
  AdminBatchDetail,
  BatchParticipant,
  BatchStats,
  UpdateBatchRequest,
  CohortProgression,
  CompetencyCode,
  CompetencyMastery,
  CompetencyCategory,
} from '@/src/types'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Hash,
  Trash2,
  Pencil,
  Eye,
  Trophy,
  Sparkles,
  Download,
} from 'lucide-react'
import { StoneCard, ChessboardCTA, GoldDivider, SigilBadge } from '@/src/components/primitives'
import { CompetencyConstellation, RankInsignia } from '@/src/components/progression'
import { COMPETENCY_META, CATEGORY_LABEL } from '@/src/lib/progression'
import { easeDramatic, staggerContainer, staggerItem } from '@/lib/animations/variants'

const INPUT_CLASSES =
  'bg-[color:var(--color-chessboard-rampart)]/60 border-[color:var(--color-chessboard-ash)]/30 text-[color:var(--color-chessboard-ivory)] placeholder:text-[color:var(--color-chessboard-smoke)] focus-visible:border-[color:var(--color-chessboard-gold)]/60 focus-visible:ring-[color:var(--color-chessboard-gold)]/20'

interface AdminLeaderboardEntry {
  rank: number
  name: string
  stageName?: string
  revenueProjection?: number
  [key: string]: unknown
}

// Map a rounded cohort-average mastery tier (0–5) back to a category so the
// shared <CompetencyConstellation> can render the cohort's collective standing.
const TIER_CATEGORY: Record<number, CompetencyCategory> = {
  1: 'HIGH_RISK',
  2: 'DEVELOPMENT_REQUIRED',
  3: 'FUNCTIONAL',
  4: 'STRONG',
  5: 'NATURAL_DOMINANT',
}

function cohortMastery(
  competencies: CohortProgression['competencies'],
): Partial<Record<CompetencyCode, CompetencyMastery>> {
  const out: Partial<Record<CompetencyCode, CompetencyMastery>> = {}
  for (const c of competencies) {
    const tier = Math.round(c.avgTier)
    if (tier < 1) continue
    out[c.code] = {
      bestAverage: 0,
      category: TIER_CATEGORY[tier],
      trials: c.founders,
      updatedAt: '',
    }
  }
  return out
}

const competencyName = (code: string) =>
  COMPETENCY_META.find((m) => m.code === code)?.name ?? code

// Build a one-row-per-founder CSV joining roster + (optional) progression.
function buildCohortCsv(
  participants: BatchParticipant[],
  standings: CohortProgression['standings'],
): string {
  const byUser = new Map(standings.map((s) => [s.userId, s]))
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const headers = [
    'Name', 'Email', 'Joined', 'Status', 'Stage', 'Revenue',
    'Mean Spam %', 'Rank', 'Rating', 'Sigils', 'Lit Competencies',
  ]
  const rows = participants.map((p) => {
    const eng = p.phaseEngagement ? Object.values(p.phaseEngagement) : []
    const meanSpam = eng.length
      ? Math.round(eng.reduce((a, e) => a + (e?.spamPercent || 0), 0) / eng.length)
      : ''
    const st = byUser.get(p.userId)
    return [
      p.userName, p.email, new Date(p.joinedAt).toISOString().slice(0, 10),
      p.status ?? '', p.currentStage?.replace(/^STAGE_/, '').replace(/_/g, ' ') ?? '',
      p.revenueProjection ?? '', meanSpam,
      st?.rankTitle ?? '', st?.rating ?? '', st?.sigilCount ?? '',
      st ? `${st.litCompetencies}/8` : '',
    ].map(esc).join(',')
  })
  return [headers.join(','), ...rows].join('\n')
}

export default function BatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const batchId = params.id as string

  const [batch, setBatch] = useState<AdminBatchDetail | null>(null)
  const [participants, setParticipants] = useState<BatchParticipant[]>([])
  const [stats, setStats] = useState<BatchStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<AdminLeaderboardEntry[]>([])
  const [cohortProgression, setCohortProgression] = useState<CohortProgression | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editName, setEditName] = useState('')
  const [editLevel, setEditLevel] = useState(1)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [batchData, participantsData, statsData] = await Promise.all([
        api.admin.getBatch(batchId),
        api.admin.getParticipants(batchId),
        api.admin.getStats(batchId),
      ])
      let leaderboardData: AdminLeaderboardEntry[] = []
      try {
        if (batchData?.code) {
          const lbResponse = await api.batches.getLeaderboard(batchData.code)
          leaderboardData = (lbResponse.entries || []) as unknown as AdminLeaderboardEntry[]
        }
      } catch (e: unknown) {
        console.warn('Leaderboard fetch failed', e)
      }
      // Cohort progression is live-only (no mock). Degrade silently if the
      // backend endpoint isn't deployed yet — the section simply stays hidden.
      let progressionData: CohortProgression | null = null
      try {
        progressionData = await api.admin.getCohortProgression(batchId)
      } catch {
        progressionData = null
      }
      setBatch(batchData)
      setParticipants(participantsData)
      setStats(statsData)
      setLeaderboard(leaderboardData)
      setCohortProgression(progressionData)
      setEditName(batchData.name)
      setEditLevel(batchData.level)
    } catch (err: unknown) {
      console.error('Failed to fetch batch:', err)
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCopy = () => {
    if (batch) {
      navigator.clipboard.writeText(batch.code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates: UpdateBatchRequest = {}
      if (editName !== batch?.name) updates.name = editName
      if (editLevel !== batch?.level) updates.level = editLevel
      await api.admin.updateBatch(batchId, updates)
      setShowEdit(false)
      fetchData()
    } catch (err: unknown) {
      console.error('Failed to update batch:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    if (!batch) return
    try {
      await api.admin.updateBatch(batchId, { active: !batch.active })
      fetchData()
    } catch (err: unknown) {
      console.error('Failed to toggle batch:', err)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.admin.deleteBatch(batchId)
      router.push('/admin/cohorts')
    } catch (err: unknown) {
      console.error('Failed to delete batch:', err)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <SigilBadge tone="gold">In Progress</SigilBadge>
      case 'COMPLETED':
        return <SigilBadge tone="verdant">Completed</SigilBadge>
      case 'NOT_STARTED':
        return <SigilBadge>Not Started</SigilBadge>
      default:
        return <SigilBadge>No Simulation</SigilBadge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-[color:var(--color-chessboard-gold)]/30 border-t-[color:var(--color-chessboard-gold)] rounded-full animate-spin" />
          <p className="text-sm text-[color:var(--color-chessboard-smoke)]" style={{ fontFamily: 'var(--font-display)' }}>
            Loading batch details&hellip;
          </p>
        </div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[color:var(--color-chessboard-smoke)]" style={{ fontFamily: 'var(--font-display)' }}>
          Batch not found
        </p>
      </div>
    )
  }

  const nameByUser = new Map(participants.map((p) => [p.userId, p.userName]))
  const showAscent = !!cohortProgression && cohortProgression.totalFounders > 0

  const handleExportCsv = () => {
    if (!batch) return
    const csv = buildCohortCsv(participants, cohortProgression?.standings ?? [])
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${batch.code}-cohort-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Per-competency cohort breakdown — weakest first, so the focus areas surface.
  const competencyBreakdown = cohortProgression
    ? [...cohortProgression.competencies].sort((a, b) => {
        if (a.founders === 0 && b.founders === 0) return 0
        if (a.founders === 0) return 1 // no-data sinks to the bottom
        if (b.founders === 0) return -1
        return a.avgTier - b.avgTier
      })
    : []

  return (
    <div className="py-6 space-y-6">
      {/* Back + Header */}
      <motion.div
        className="flex items-center gap-4"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeDramatic }}
      >
        <Link
          href="/admin/cohorts"
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-[color:var(--color-chessboard-ash)]/30 text-[color:var(--color-chessboard-smoke)] hover:text-[color:var(--color-chessboard-gold)] hover:border-[color:var(--color-chessboard-gold)]/30 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1
            className="text-xl font-bold tracking-[0.04em]"
            style={{
              fontFamily: 'var(--font-display)',
              background:
                'linear-gradient(135deg, var(--color-chessboard-gold), var(--color-chessboard-gold-bright))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {batch.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 font-mono text-xs text-[color:var(--color-chessboard-smoke)] hover:text-[color:var(--color-chessboard-gold)] transition-colors"
            >
              <Hash className="h-3 w-3" />
              {batch.code}
              {copiedCode ? (
                <Check className="h-3 w-3 text-[color:var(--color-chessboard-verdant)]" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
            <SigilBadge tone={batch.active ? 'verdant' : 'crimson'}>
              {batch.active ? 'Active' : 'Inactive'}
            </SigilBadge>
            <span
              className="text-[10px] uppercase tracking-[0.1em] text-[color:var(--color-chessboard-smoke)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Level {batch.level} {batch.level === 1 ? '(Student)' : '(Manager)'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <ChessboardCTA
            variant="ghost"
            size="sm"
            icon={Download}
            onClick={handleExportCsv}
            disabled={participants.length === 0}
          >
            Export CSV
          </ChessboardCTA>
          <ChessboardCTA variant="ghost" size="sm" icon={Pencil} onClick={() => setShowEdit(true)}>
            Edit
          </ChessboardCTA>
          <ChessboardCTA variant="ghost" size="sm" onClick={handleToggleActive}>
            {batch.active ? 'Deactivate' : 'Activate'}
          </ChessboardCTA>
          <ChessboardCTA variant="ghost" size="sm" icon={Trash2} onClick={() => setShowDelete(true)}>
            Delete
          </ChessboardCTA>
        </div>
      </motion.div>

      <GoldDivider variant="line" />

      {/* Stats Row */}
      {stats && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
          variants={staggerContainer}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="show"
        >
          {[
            { label: 'Participants', value: stats.totalParticipants },
            { label: 'Simulations', value: stats.simulationsTotal ?? stats.assessmentsTotal },
            { label: 'Completed', value: stats.completed },
            { label: 'In Progress', value: stats.inProgress },
            { label: 'Not Started', value: stats.notStarted },
            { label: 'Avg Revenue', value: `$${Math.round(stats.avgRevenue).toLocaleString()}` },
            { label: 'Max Revenue', value: `$${(stats.maxRevenue ?? 0).toLocaleString()}` },
          ].map((s) => (
            <motion.div key={s.label} variants={staggerItem}>
              <StoneCard>
                <div className="text-2xl font-bold text-[color:var(--color-chessboard-ivory)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {s.value}
                </div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-[color:var(--color-chessboard-smoke)] mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {s.label}
                </p>
              </StoneCard>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* The Cohort's Ascent — authoritative progression roll-up (live-only) */}
      {showAscent && cohortProgression && (
        <StoneCard padding="none">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-[color:var(--color-chessboard-ash)]/20">
            <Sparkles className="h-5 w-5 text-[color:var(--color-chessboard-gold)]" />
            <h2
              className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-chessboard-smoke)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              The Cohort&rsquo;s Ascent
            </h2>
            <span
              className="ml-auto text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-chessboard-smoke)]/70"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {cohortProgression.withProgress} of {cohortProgression.totalFounders} founders rising
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 p-6">
            {/* Aggregate constellation — the cohort's collective mastery */}
            <div className="flex flex-col items-center">
              <p
                className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-chessboard-smoke)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Collective Mastery
              </p>
              <CompetencyConstellation
                mastery={cohortMastery(cohortProgression.competencies)}
                size={260}
                interactive
              />
            </div>
            {/* Founder standings — rating-descending */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-chessboard-ash)]/20">
                    {['Founder', 'Rank', 'Rating', 'Sigils', 'Lit'].map((h, i) => (
                      <th
                        key={h}
                        className={`py-3 px-2 font-medium text-[color:var(--color-chessboard-smoke)] text-[10px] uppercase tracking-[0.14em] ${i >= 2 ? 'text-right' : 'text-left'}`}
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohortProgression.standings.map((s) => (
                    <tr
                      key={s.userId}
                      className="border-b border-[color:var(--color-chessboard-ash)]/10 last:border-0 hover:bg-[color:var(--color-chessboard-gold)]/[0.02]"
                    >
                      <td className="py-3 px-2 font-medium text-[color:var(--color-chessboard-ivory)]">
                        {nameByUser.get(s.userId) || '—'}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <RankInsignia tier={s.rankTier} size={26} />
                          <span
                            className="text-xs text-[color:var(--color-chessboard-smoke)]"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {s.rankTitle}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-[color:var(--color-chessboard-gold)]">
                        {(s.rating ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-xs text-[color:var(--color-chessboard-ivory)]">
                        {s.sigilCount}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-xs text-[color:var(--color-chessboard-smoke)]">
                        {s.litCompetencies}/8
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-competency breakdown — weakest first, so focus areas surface */}
          {competencyBreakdown.length > 0 && (
            <div className="border-t border-[color:var(--color-chessboard-ash)]/20 px-6 py-5">
              <p
                className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-chessboard-smoke)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Competency Breakdown — weakest first
              </p>
              <div className="space-y-2">
                {competencyBreakdown.map((c, i) => {
                  const hasData = c.founders > 0
                  const pct = Math.max(0, Math.min(100, (c.avgTier / 5) * 100))
                  const label = hasData
                    ? CATEGORY_LABEL[TIER_CATEGORY[Math.max(1, Math.round(c.avgTier))]]
                    : 'No data'
                  const focus = hasData && i < 3
                  return (
                    <div key={c.code} className="flex items-center gap-3">
                      <span className="w-40 truncate text-xs text-[color:var(--color-chessboard-ivory)]">
                        {competencyName(c.code)}
                      </span>
                      <div className="flex-1 h-2 overflow-hidden rounded-full bg-[color:var(--color-chessboard-rampart)]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: focus
                              ? 'var(--color-chessboard-crimson-bright)'
                              : 'var(--color-chessboard-gold)',
                          }}
                        />
                      </div>
                      <span
                        className="w-28 text-right text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-chessboard-smoke)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {label}
                      </span>
                      <span className="w-16 text-right font-mono text-[10px] text-[color:var(--color-chessboard-smoke)]">
                        {c.founders} {c.founders === 1 ? 'founder' : 'founders'}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p
                className="mt-3 text-[10px] text-[color:var(--color-chessboard-smoke)]"
                style={{ fontFamily: 'var(--font-body, serif)' }}
              >
                Crimson bars mark the cohort&rsquo;s three weakest competencies — likely teaching focus areas.
              </p>
            </div>
          )}
        </StoneCard>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <StoneCard padding="none">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-[color:var(--color-chessboard-ash)]/20">
            <Trophy className="h-5 w-5 text-[color:var(--color-chessboard-gold)]" />
            <h2 className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-chessboard-smoke)]" style={{ fontFamily: 'var(--font-display)' }}>
              Batch Leaderboard
            </h2>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-chessboard-ash)]/20">
                  {['Rank', 'Participant', 'Stage', 'Revenue'].map((h, i) => (
                    <th
                      key={h}
                      className={`py-3 px-2 font-medium text-[color:var(--color-chessboard-smoke)] text-[10px] uppercase tracking-[0.14em] ${i === 3 ? 'text-right' : 'text-left'} ${i === 0 ? 'w-16' : ''}`}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((lb, idx) => (
                  <tr key={String(lb.rank ?? idx)} className="border-b border-[color:var(--color-chessboard-ash)]/10 last:border-0 hover:bg-[color:var(--color-chessboard-gold)]/[0.02]">
                    <td className="py-3 px-2 font-bold w-16 text-[color:var(--color-chessboard-gold)]" style={{ fontFamily: 'var(--font-display)' }}>
                      {lb.rank === 1 ? '1st' : lb.rank === 2 ? '2nd' : lb.rank === 3 ? '3rd' : `#${lb.rank}`}
                    </td>
                    <td className="py-3 px-2 text-[color:var(--color-chessboard-ivory)]">{lb.name}</td>
                    <td className="py-3 px-2 text-[color:var(--color-chessboard-smoke)] text-xs">{lb.stageName || '-'}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-[color:var(--color-chessboard-gold)]">
                      ${lb.revenueProjection?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StoneCard>
      )}

      {/* Participants Table */}
      <StoneCard padding="none">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[color:var(--color-chessboard-ash)]/20">
          <Users className="h-5 w-5 text-[color:var(--color-chessboard-gold)]" />
          <h2 className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-chessboard-smoke)]" style={{ fontFamily: 'var(--font-display)' }}>
            Participants ({participants.length})
          </h2>
        </div>
        <div className="p-6">
          {participants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-chessboard-ash)]/20">
                    {['Name', 'Email', 'Joined', 'Status', 'Stage', 'Revenue', 'Engagement', 'Report'].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`py-3 px-2 font-medium text-[color:var(--color-chessboard-smoke)] text-[10px] uppercase tracking-[0.14em] ${i >= 5 ? 'text-right' : 'text-left'}`}
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => {
                    const engagementEntries = p.phaseEngagement ? Object.values(p.phaseEngagement) : []
                    const meanSpam = engagementEntries.length
                      ? engagementEntries.reduce((acc, e) => acc + (e?.spamPercent || 0), 0) / engagementEntries.length
                      : null
                    const engagementColor =
                      meanSpam == null
                        ? 'text-[color:var(--color-chessboard-smoke)]'
                        : meanSpam >= 40
                          ? 'text-[color:var(--color-chessboard-crimson)]'
                          : meanSpam >= 20
                            ? 'text-amber-500'
                            : 'text-[color:var(--color-chessboard-verdant)]'
                    return (
                      <tr key={p.userId} className="border-b border-[color:var(--color-chessboard-ash)]/10 last:border-0 hover:bg-[color:var(--color-chessboard-gold)]/[0.02]">
                        <td className="py-3 px-2 font-medium text-[color:var(--color-chessboard-ivory)]">{p.userName}</td>
                        <td className="py-3 px-2 text-[color:var(--color-chessboard-smoke)] text-xs">{p.email}</td>
                        <td className="py-3 px-2 text-[color:var(--color-chessboard-smoke)] text-xs">
                          {new Date(p.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">{getStatusBadge(p.status)}</td>
                        <td className="py-3 px-2 text-[color:var(--color-chessboard-smoke)] font-mono text-[10px]">
                          {p.currentStage?.replace('STAGE_', '').replace(/_/g, ' ') || '-'}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-xs text-[color:var(--color-chessboard-ivory)]">
                          {p.revenueProjection != null ? `$${p.revenueProjection.toLocaleString()}` : '-'}
                        </td>
                        <td className={`py-3 px-2 text-right font-mono text-xs ${engagementColor}`}>
                          {meanSpam == null ? '-' : `${Math.round(meanSpam)}%`}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {p.assessmentId ? (
                            <Link href={`/admin/cohorts/${batchId}/report/${p.assessmentId}`}>
                              <ChessboardCTA size="sm" variant="ghost" icon={Eye}>
                                View
                              </ChessboardCTA>
                            </Link>
                          ) : (
                            <span className="text-[color:var(--color-chessboard-smoke)] text-[10px]">No data</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-[color:var(--color-chessboard-smoke)] py-8 text-sm" style={{ fontFamily: 'var(--font-body, serif)' }}>
              No participants have joined this batch yet. Share the batch code to invite participants.
            </p>
          )}
        </div>
      </StoneCard>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-[color:var(--color-chessboard-rampart)] border-[color:var(--color-chessboard-ash)]/30 text-[color:var(--color-chessboard-ivory)]">
          <DialogHeader>
            <DialogTitle className="text-[color:var(--color-chessboard-gold)]" style={{ fontFamily: 'var(--font-display)' }}>
              Edit Batch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-chessboard-smoke)] mb-1.5 block" style={{ fontFamily: 'var(--font-display)' }}>
                Batch Name
              </label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className={`mt-1 ${INPUT_CLASSES}`} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-chessboard-smoke)] mb-1.5 block" style={{ fontFamily: 'var(--font-display)' }}>
                Level
              </label>
              <div className="flex gap-2 mt-1">
                <ChessboardCTA type="button" size="sm" variant={editLevel === 1 ? 'primary' : 'ghost'} onClick={() => setEditLevel(1)}>
                  Level 1 (Student)
                </ChessboardCTA>
                <ChessboardCTA type="button" size="sm" variant={editLevel === 2 ? 'primary' : 'ghost'} onClick={() => setEditLevel(2)}>
                  Level 2 (Manager)
                </ChessboardCTA>
              </div>
            </div>
          </div>
          <DialogFooter>
            <ChessboardCTA variant="ghost" size="sm" onClick={() => setShowEdit(false)}>Cancel</ChessboardCTA>
            <ChessboardCTA size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </ChessboardCTA>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="bg-[color:var(--color-chessboard-rampart)] border-[color:var(--color-chessboard-ash)]/30 text-[color:var(--color-chessboard-ivory)]">
          <DialogHeader>
            <DialogTitle className="text-[color:var(--color-chessboard-crimson)]" style={{ fontFamily: 'var(--font-display)' }}>
              Delete Batch
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[color:var(--color-chessboard-smoke)] py-4" style={{ fontFamily: 'var(--font-body, serif)' }}>
            Are you sure you want to delete <strong className="text-[color:var(--color-chessboard-ivory)]">{batch.name}</strong> ({batch.code})?
            This action cannot be undone. All participant data will remain but the batch will be removed.
          </p>
          <DialogFooter>
            <ChessboardCTA variant="ghost" size="sm" onClick={() => setShowDelete(false)}>Cancel</ChessboardCTA>
            <ChessboardCTA size="sm" onClick={handleDelete} disabled={deleting} icon={Trash2}>
              {deleting ? 'Deleting…' : 'Delete Batch'}
            </ChessboardCTA>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
