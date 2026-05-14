'use client'

import { stageLabel } from '@/src/lib/helpers'
import type { EvaluationReport, UserResponseEntry } from '@/src/types'

function getResponseText(entry: any): string {
  if (typeof entry.selectedOptionText === 'string' && entry.selectedOptionText.trim()) return entry.selectedOptionText
  const response = entry.response || {}
  if (typeof response.selectedOptionText === 'string' && response.selectedOptionText.trim()) return response.selectedOptionText
  if (typeof response.text === 'string' && response.text.trim()) return response.text
  if (typeof response.selectedOptionId === 'string' && response.selectedOptionId.trim()) return `Selected: ${response.selectedOptionId}`
  if (response.allocations && typeof response.allocations === 'object') {
    return Object.entries(response.allocations).map(([k, v]) => `${k}: ${v}%`).join(', ')
  }
  return JSON.stringify(response)
}

function ProficiencyBadge({ p }: { p: number | null }) {
  if (p === null || p === undefined) return null
  const colors: Record<number, { bg: string; text: string; label: string }> = {
    1: { bg: 'rgba(239,68,68,0.12)', text: '#fca5a5', label: 'P1 — Developing' },
    2: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', label: 'P2 — Strong' },
    3: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', label: 'P3 — Advanced' },
  }
  const c = colors[p] || colors[1]
  return (
    <span style={{ background: c.bg, color: c.text, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
      {c.label}
    </span>
  )
}

export function ResponsesTab({ report }: { report: EvaluationReport }) {
  const responses = report.userResponses || []

  // Group by stage
  const grouped: Record<string, UserResponseEntry[]> = {}
  for (const r of responses) {
    const stage = r.stageName || 'Unknown'
    if (!grouped[stage]) grouped[stage] = []
    grouped[stage].push(r)
  }
  const sortedStages = Object.keys(grouped)

  return (
    <div className="responses-page">
      <div className="responses-header">
        <h2>Your Responses</h2>
        <p className="responses-subtitle">All your answers throughout the simulation, grouped by stage</p>
      </div>

      {sortedStages.length === 0 && <div className="no-data">No responses recorded.</div>}

      {sortedStages.map((stageName) => (
        <div key={stageName} className="stage-group">
          <div className="stage-header">
            <span className="stage-badge">{stageLabel(stageName)}</span>
            <span className="response-count">{grouped[stageName].length} responses</span>
          </div>

          {grouped[stageName].map((entry, i) => (
            <div key={i} className="response-card">
              <div className="response-question">
                <span className="q-type">{(entry.questionType || 'unknown').replace(/_/g, ' ')}</span>
                <p>{entry.questionText || entry.questionId || 'Question'}</p>
              </div>
              <div className="response-answer">
                <span className="answer-label">Your Answer:</span>
                <p>{getResponseText(entry)}</p>
              </div>
              <div className="response-footer">
                <ProficiencyBadge p={entry.proficiency} />
                {entry.aiFeedback && (entry.aiFeedback as any).feedback && (
                  <span className="ai-feedback-text">
                    Tip: {typeof (entry.aiFeedback as any).feedback === 'string' ? (entry.aiFeedback as any).feedback : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      <style jsx>{`
        .responses-page { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .responses-header { text-align: center; margin-bottom: 2rem; }
        .responses-header h2 { font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 0.5rem; }
        .responses-subtitle { color: #9ca3af; font-size: 0.9rem; }
        .stage-group { margin-bottom: 2rem; }
        .stage-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.8rem; }
        .stage-badge { background: rgba(99,102,241,0.15); color: hsl(var(--muted-foreground)); padding: 0.25rem 0.8rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; }
        .response-count { font-size: 0.8rem; color: #6b7280; }
        .response-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1rem 1.2rem; margin-bottom: 0.6rem; }
        .response-question { margin-bottom: 0.6rem; }
        .q-type { font-size: 0.7rem; font-weight: 600; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.5px; }
        .response-question p { font-size: 0.9rem; color: #e0e0e0; margin: 0.2rem 0 0 0; }
        .response-answer { background: rgba(255,255,255,0.02); border-radius: 8px; padding: 0.6rem 0.8rem; margin-bottom: 0.5rem; }
        .answer-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; }
        .response-answer p { color: #d1d5db; font-size: 0.9rem; margin: 0.2rem 0 0 0; }
        .response-footer { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
        .ai-feedback-text { font-size: 0.78rem; color: #9ca3af; font-style: italic; }
        .no-data { color: #6b7280; text-align: center; padding: 3rem; }
      `}</style>
    </div>
  )
}
