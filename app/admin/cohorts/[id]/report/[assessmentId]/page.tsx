'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Award } from 'lucide-react'
import api from '@/src/lib/api'
import type { EvaluationReport } from '@/src/types'

/** Extended competency with optional strengths/weaknesses from API */
interface AdminRankedCompetency {
  code: string
  name: string
  weightedAverage: number
  category: string
  strengths?: string[]
  weaknesses?: string[]
}
import { CompetencyRadarChart } from '@/components/competency-radar-chart'
import { StoneCard, GoldDivider, SigilBadge } from '@/src/components/primitives'
import { easeDramatic, staggerContainer, staggerItem } from '@/lib/animations/variants'

const LEVEL_TONES: Record<string, 'verdant' | 'gold' | 'crimson'> = {
  NATURAL_DOMINANT: 'verdant',
  STRONG: 'verdant',
  FUNCTIONAL: 'gold',
  DEVELOPMENT_REQUIRED: 'crimson',
  HIGH_RISK: 'crimson',
}

export default function AdminUserReportPage() {
  const { id: batchId, assessmentId } = useParams() as { id: string; assessmentId: string }
  const prefersReducedMotion = useReducedMotion()
  const [report, setReport] = useState<EvaluationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await api.assessments.getReport(assessmentId)
        setReport(data)
      } catch (err: unknown) {
        console.error(err)
        setError('Failed to load user report for assessment ' + assessmentId)
      } finally {
        setLoading(false)
      }
    }
    if (assessmentId && assessmentId !== 'null') {
      fetchReport()
    } else {
      setLoading(false)
      setError('No assessment ID associated with this user yet.')
    }
  }, [assessmentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-[color:var(--color-warroom-gold)]/30 border-t-[color:var(--color-warroom-gold)] rounded-full animate-spin" />
          <p className="text-sm text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-display)' }}>
            Loading saved report&hellip;
          </p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/cohorts/${batchId}`}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[color:var(--color-warroom-ash)]/30 text-[color:var(--color-warroom-smoke)] hover:text-[color:var(--color-warroom-gold)] hover:border-[color:var(--color-warroom-gold)]/30 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold text-[color:var(--color-warroom-ivory)]" style={{ fontFamily: 'var(--font-display)' }}>
            User Report
          </h1>
        </div>
        <StoneCard>
          <p className="text-center text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-body, serif)' }}>
            {error}
          </p>
        </StoneCard>
      </div>
    )
  }

  const engagement = (report as unknown as Record<string, unknown>).phaseEngagement as
    | Record<string, { spamPercent: number; burstEvents: number; floorEvents: number; totalSelections: number }>
    | undefined

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
          href={`/admin/cohorts/${batchId}`}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-[color:var(--color-warroom-ash)]/30 text-[color:var(--color-warroom-smoke)] hover:text-[color:var(--color-warroom-gold)] hover:border-[color:var(--color-warroom-gold)]/30 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1
            className="text-xl font-bold tracking-[0.04em]"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, var(--color-warroom-gold), var(--color-warroom-gold-bright))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            User Assessment Report
          </h1>
          <p className="text-sm text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-body, serif)' }}>
            Detailed evaluation and competency breakdown
          </p>
        </div>
      </motion.div>

      <GoldDivider variant="line" />

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={staggerContainer}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate="show"
      >
        <motion.div variants={staggerItem}>
          <StoneCard padding="none">
            <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
              <h2 className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-display)' }}>
                Entrepreneur Profile
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-display)' }}>
                  Archetype Profile
                </span>
                <p className="text-lg font-medium text-[color:var(--color-warroom-gold)] mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {report.entrepreneurType || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-display)' }}>
                  Organizational Role Fit
                </span>
                <p className="text-lg font-medium text-[color:var(--color-warroom-ivory)] mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {report.organizationalRole || 'N/A'}
                </p>
              </div>
              {report.archetypeNarrative && (
                <div className="mt-4 p-4 bg-[color:var(--color-warroom-gold)]/[0.04] border border-[color:var(--color-warroom-gold)]/10 rounded-lg">
                  <p className="text-sm italic text-[color:var(--color-warroom-smoke)] break-words" style={{ fontFamily: 'var(--font-body, serif)' }}>
                    {report.archetypeNarrative}
                  </p>
                </div>
              )}
            </div>
          </StoneCard>
        </motion.div>

        {report.spiderChartData && report.competencyRanking && (
          <motion.div variants={staggerItem}>
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2 className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-display)' }}>
                  Competency Analysis
                </h2>
              </div>
              <div className="p-6">
                <CompetencyRadarChart spiderData={report.spiderChartData} competencyRanking={report.competencyRanking} />
              </div>
            </StoneCard>
          </motion.div>
        )}
      </motion.div>

      {report.competencyRanking && (
        <StoneCard padding="none">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
            <Award className="h-5 w-5 text-[color:var(--color-warroom-gold)]" />
            <h2 className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-display)' }}>
              Detailed Competencies
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {(report.competencyRanking as unknown as AdminRankedCompetency[]).map((comp) => (
              <div
                key={comp.code}
                className="p-4 border border-[color:var(--color-warroom-ash)]/15 rounded-lg bg-[color:var(--color-warroom-gold)]/[0.02]"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base text-[color:var(--color-warroom-ivory)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {comp.name}
                  </h3>
                  <SigilBadge tone={LEVEL_TONES[comp.category] || 'gold'}>
                    {(((comp.weightedAverage || 0) / 3) * 10).toFixed(1)} / 10.0
                  </SigilBadge>
                </div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-[color:var(--color-warroom-smoke)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                  {comp.category?.replace(/_/g, ' ')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                  {comp.strengths && comp.strengths.length > 0 && (
                    <div>
                      <span className="font-semibold text-[color:var(--color-warroom-verdant)] block mb-1 text-xs" style={{ fontFamily: 'var(--font-display)' }}>
                        Strengths
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-body, serif)' }}>
                        {comp.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm marker:text-[color:var(--color-warroom-verdant)]/40">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {comp.weaknesses && comp.weaknesses.length > 0 && (
                    <div>
                      <span className="font-semibold text-[color:var(--color-warroom-crimson)] block mb-1 text-xs" style={{ fontFamily: 'var(--font-display)' }}>
                        Areas for Growth
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-body, serif)' }}>
                        {comp.weaknesses.map((w: string, i: number) => (
                          <li key={i} className="text-sm marker:text-[color:var(--color-warroom-crimson)]/40">{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </StoneCard>
      )}

      {report.detailedAnalysis && (
        <StoneCard padding="none">
          <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
            <h2 className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-display)' }}>
              Executive Summary
            </h2>
          </div>
          <div className="p-6">
            <p className="whitespace-pre-line text-sm text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-body, serif)' }}>
              {report.detailedAnalysis}
            </p>
          </div>
        </StoneCard>
      )}

      {engagement && Object.keys(engagement).length > 0 && (
        <StoneCard padding="none">
          <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
            <h2 className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]" style={{ fontFamily: 'var(--font-display)' }}>
              Focus &amp; Engagement
            </h2>
            <p className="text-xs text-[color:var(--color-warroom-smoke)] mt-1" style={{ fontFamily: 'var(--font-body, serif)' }}>
              Rapid-click telemetry per phase. A high percentage means options were chosen too fast; revenue is penalized when &ge; 40%.
            </p>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-warroom-ash)]/20">
                  {['Phase', 'Spam %', 'Burst', 'Floor', 'Selections'].map((h, i) => (
                    <th
                      key={h}
                      className={`py-2 px-2 font-medium text-[color:var(--color-warroom-smoke)] text-[10px] uppercase tracking-[0.14em] ${i >= 1 ? 'text-right' : 'text-left'}`}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(engagement).map(([stage, e]) => {
                  const pct = Math.round(e?.spamPercent || 0)
                  const color =
                    pct >= 40
                      ? 'text-[color:var(--color-warroom-crimson)]'
                      : pct >= 20
                        ? 'text-amber-500'
                        : 'text-[color:var(--color-warroom-verdant)]'
                  return (
                    <tr key={stage} className="border-b border-[color:var(--color-warroom-ash)]/10 last:border-0">
                      <td className="py-2 px-2 font-mono text-[10px] text-[color:var(--color-warroom-smoke)]">
                        {stage.replace('STAGE_', '').replace(/_/g, ' ')}
                      </td>
                      <td className={`py-2 px-2 text-right font-mono ${color}`}>{pct}%</td>
                      <td className="py-2 px-2 text-right font-mono text-[color:var(--color-warroom-smoke)]">{e?.burstEvents ?? 0}</td>
                      <td className="py-2 px-2 text-right font-mono text-[color:var(--color-warroom-smoke)]">{e?.floorEvents ?? 0}</td>
                      <td className="py-2 px-2 text-right font-mono text-[color:var(--color-warroom-smoke)]">{e?.totalSelections ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {Object.values(engagement).some((e) => (e?.spamPercent || 0) >= 40) && (
              <p className="mt-4 text-sm text-amber-500" style={{ fontFamily: 'var(--font-body, serif)' }}>
                One or more phases exceeded the engagement threshold. A revenue penalty was applied automatically.
              </p>
            )}
          </div>
        </StoneCard>
      )}
    </div>
  )
}
