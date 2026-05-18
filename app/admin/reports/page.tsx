'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { BarChart3, Download, TrendingUp, Users, ScrollText } from 'lucide-react'
import api from '@/src/lib/api'
import type { AdminBatch } from '@/src/types'
import { StoneCard, WarRoomCTA, GoldDivider, SigilBadge } from '@/src/components/primitives'
import { easeDramatic, staggerContainer, staggerItem } from '@/lib/animations/variants'

interface ReportMetric {
  id: string
  name: string
  cohort: string
  type: 'cohort'
  generatedAt: string
  participantCount: number
}

export default function ReportsPage() {
  const prefersReducedMotion = useReducedMotion()
  const [reports, setReports] = useState<ReportMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [totalParticipants, setTotalParticipants] = useState(0)

  useEffect(() => {
    async function loadReports() {
      try {
        const batches = await api.admin.listBatches()

        let participantsCount = 0
        const batchReports: ReportMetric[] = batches.map((b: AdminBatch) => {
          participantsCount += b.participantCount || 0
          return {
            id: b.id,
            name: `${b.name} - Overall Analysis`,
            cohort: b.name,
            type: 'cohort',
            generatedAt: new Date(b.createdAt).toISOString().split('T')[0],
            participantCount: b.participantCount || 0,
          }
        })

        setTotalParticipants(participantsCount)
        setReports(batchReports)
      } catch (err: unknown) {
        console.error('Failed to load reports', err)
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  return (
    <div className="py-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeDramatic }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ScrollText className="h-6 w-6 text-[color:var(--color-warroom-gold)]" />
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
                Reports
              </h1>
            </div>
            <p
              className="text-sm text-[color:var(--color-warroom-smoke)]"
              style={{ fontFamily: 'var(--font-body, serif)' }}
            >
              View and manage simulation reports
            </p>
          </div>
          <WarRoomCTA size="sm" variant="ghost" icon={Download} disabled={loading}>
            Export Summary
          </WarRoomCTA>
        </div>
        <div className="mt-5">
          <GoldDivider variant="line" />
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-[color:var(--color-warroom-gold)]/30 border-t-[color:var(--color-warroom-gold)] rounded-full animate-spin" />
            <p
              className="text-sm text-[color:var(--color-warroom-smoke)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Loading report data&hellip;
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="show"
          className="space-y-8"
        >
          {/* Stats */}
          <motion.div variants={staggerItem} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Total Cohort Reports', value: reports.length, icon: BarChart3 },
              { label: 'Total Participants Active', value: totalParticipants, icon: Users },
              { label: 'Metrics Tracked', value: '8+', icon: TrendingUp },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <StoneCard key={stat.label}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-warroom-smoke)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {stat.label}
                      </p>
                      <p
                        className="text-3xl font-bold text-[color:var(--color-warroom-gold)] mt-2"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {stat.value}
                      </p>
                    </div>
                    <Icon className="h-8 w-8 text-[color:var(--color-warroom-gold)]/20" />
                  </div>
                </StoneCard>
              )
            })}
          </motion.div>

          {/* Reports Table */}
          <motion.div variants={staggerItem}>
            <StoneCard padding="none">
              <div className="px-6 py-4 border-b border-[color:var(--color-warroom-ash)]/20">
                <h2
                  className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Recent Cohort Reports
                </h2>
              </div>
              <div className="p-6">
                {reports.length === 0 ? (
                  <p
                    className="text-[color:var(--color-warroom-smoke)] text-center py-6 text-sm"
                    style={{ fontFamily: 'var(--font-body, serif)' }}
                  >
                    No reports available. Create a batch to see analytics.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[color:var(--color-warroom-ash)]/20">
                          {['Report', 'Type', 'Cohort', 'Participants', 'Generated', 'Actions'].map(
                            (h, i) => (
                              <th
                                key={h}
                                className={`py-3 px-4 font-medium text-[color:var(--color-warroom-smoke)] text-[10px] uppercase tracking-[0.14em] ${i === 5 ? 'text-right' : 'text-left'}`}
                                style={{ fontFamily: 'var(--font-display)' }}
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((report) => (
                          <tr
                            key={report.id}
                            className="border-b border-[color:var(--color-warroom-ash)]/10 last:border-0 hover:bg-[color:var(--color-warroom-gold)]/[0.02] transition-colors"
                          >
                            <td
                              className="py-4 px-4 font-medium text-[color:var(--color-warroom-ivory)]"
                              style={{ fontFamily: 'var(--font-display)' }}
                            >
                              {report.name}
                            </td>
                            <td className="py-4 px-4">
                              <SigilBadge tone="gold">Cohort</SigilBadge>
                            </td>
                            <td
                              className="py-4 px-4 text-[color:var(--color-warroom-smoke)]"
                              style={{ fontFamily: 'var(--font-body, serif)' }}
                            >
                              {report.cohort}
                            </td>
                            <td className="py-4 px-4 text-[color:var(--color-warroom-smoke)] font-mono text-xs">
                              {report.participantCount}
                            </td>
                            <td className="py-4 px-4 text-[color:var(--color-warroom-smoke)] font-mono text-xs">
                              {report.generatedAt}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Link href={`/admin/cohorts/${report.id}`}>
                                <WarRoomCTA size="sm" variant="ghost" icon={BarChart3}>
                                  View Data
                                </WarRoomCTA>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </StoneCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
