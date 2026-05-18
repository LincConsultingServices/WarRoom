'use client'

import type React from 'react'
import type { EvaluationReport } from '@/src/types'

function renderAnalysis(text: string): React.ReactNode {
  if (!text) return <p className="no-data">No detailed analysis available.</p>

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      elements.push(<br key={key++} />)
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h3 key={key++} className="analysis-heading">{trimmed.replace('## ', '')}</h3>)
    } else if (trimmed.startsWith('- ')) {
      elements.push(
        <div key={key++} className="analysis-bullet">
          <span className="bullet">&bull;</span>
          <span>{trimmed.replace('- ', '')}</span>
        </div>
      )
    } else {
      elements.push(<p key={key++} className="analysis-text">{trimmed}</p>)
    }
  }
  return <>{elements}</>
}

export function AIAnalysisTab({ report }: { report: EvaluationReport }) {
  return (
    <div className="analysis-page">
      <div className="analysis-header">
        <h2>Detailed AI Evaluation</h2>
        <p className="analysis-subtitle">
          Comprehensive analysis of your simulation journey — strengths, weaknesses, and actionable insights
        </p>
      </div>

      <div className="analysis-content">
        {renderAnalysis(report.detailedAnalysis || '')}
      </div>

      <style jsx>{`
        .analysis-page { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .analysis-header { text-align: center; margin-bottom: 2rem; }
        .analysis-header h2 { font-size: 1.5rem; font-weight: 800; color: var(--color-warroom-ivory); margin-bottom: 0.5rem; font-family: var(--font-display); }
        .analysis-subtitle { color: var(--color-warroom-smoke); font-size: 0.9rem; font-family: var(--font-body, serif); }
        .analysis-content { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 2rem; }
        .analysis-heading { font-size: 1.15rem; font-weight: 700; color: var(--color-warroom-gold); margin: 1.5rem 0 0.6rem 0; padding-bottom: 0.4rem; border-bottom: 1px solid rgba(201, 162, 39, 0.2); font-family: var(--font-display); }
        .analysis-heading:first-child { margin-top: 0; }
        .analysis-bullet { display: flex; gap: 0.6rem; padding: 0.3rem 0; font-size: 0.95rem; color: #d1d5db; line-height: 1.6; font-family: var(--font-body, serif); }
        .bullet { color: var(--color-warroom-gold); font-weight: 700; flex-shrink: 0; }
        .analysis-text { font-size: 0.95rem; color: #d1d5db; line-height: 1.6; margin: 0.3rem 0; font-family: var(--font-body, serif); }
        .no-data { color: var(--color-warroom-smoke); text-align: center; padding: 3rem; font-family: var(--font-body, serif); }
      `}</style>
    </div>
  )
}
