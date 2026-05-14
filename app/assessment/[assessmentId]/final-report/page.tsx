'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import api from '@/src/lib/api'
import type { EvaluationReport } from '@/src/types'
import { DealSummaryTab } from './_sections/DealSummaryTab'
import { CompetencyTab } from './_sections/CompetencyTab'
import { AIAnalysisTab } from './_sections/AIAnalysisTab'
import { ResponsesTab } from './_sections/ResponsesTab'

// ============================================
// Final Report — thin orchestrator shell
// Each tab is independently located in _sections/
// This page can be navigated to at any point (buyout, walkout, full completion)
// ============================================

const TABS = [
  { id: 1, label: 'Deal Summary' },
  { id: 2, label: 'Competency Profile' },
  { id: 3, label: 'AI Analysis' },
  { id: 4, label: 'Your Responses' },
] as const

type TabId = typeof TABS[number]['id']

export default function FinalReportPage() {
  const params = useParams()
  const assessmentId = params?.assessmentId as string

  const [report, setReport] = useState<EvaluationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>(1)

  useEffect(() => {
    api.assessments
      .getReport(assessmentId)
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [assessmentId])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background))', color: 'hsl(var(--primary))', fontSize: '1.2rem' }}>
        Loading your evaluation report...
      </div>
    )
  }

  if (error || !report) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a', color: '#fca5a5' }}>
        <div style={{ textAlign: 'center' }}>
          <p>{error || 'Report not found'}</p>
          <Link href="/" style={{ color: '#a5b4fc' }}>← Return Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="report-page">
      <header className="report-header">
        <Link href="/" className="back-link">← Dashboard</Link>
        <h1>Evaluation Report</h1>
        <p className="subtitle">{report.entrepreneurType} • {report.organizationalRole}</p>
      </header>

      <nav className="page-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="report-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 1 && <DealSummaryTab report={report} />}
            {activeTab === 2 && <CompetencyTab report={report} />}
            {activeTab === 3 && <AIAnalysisTab report={report} />}
            {activeTab === 4 && <ResponsesTab report={report} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <style jsx>{`
        .report-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%);
          color: #e0e0e0;
          padding: 2rem;
        }
        .report-header { text-align: center; margin-bottom: 2rem; }
        .back-link { color: #8b8bcc; text-decoration: none; font-size: 0.85rem; display: inline-block; margin-bottom: 1rem; }
        h1 { font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #fff, #c4b5fd); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.5rem; }
        .subtitle { color: hsl(var(--muted-foreground)); font-size: 1rem; font-weight: 500; }
        .page-tabs { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .tab { background: hsl(var(--muted)); border: 1px solid rgba(255,255,255,0.08); color: #9ca3af; padding: 0.7rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; }
        .tab:hover { background: rgba(255,255,255,0.08); }
        .tab.active { background: rgba(139,92,246,0.15); border-color: #8b5cf6; color: hsl(var(--primary)); }
        .report-content { max-width: 900px; margin: 0 auto; }
      `}</style>
    </div>
  )
}
