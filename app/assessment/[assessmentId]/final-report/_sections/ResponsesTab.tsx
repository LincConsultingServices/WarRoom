'use client'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
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
        <p className="responses-subtitle">Expand any question to compare your choice with the ideal path</p>
      </div>

      {sortedStages.length === 0 && <div className="no-data">No responses recorded.</div>}

      {sortedStages.map((stageName) => (
        <div key={stageName} className="stage-group">
          <div className="stage-header">
            <span className="stage-badge">{stageLabel(stageName)}</span>
            <span className="response-count">{grouped[stageName].length} responses</span>
          </div>

          <Accordion type="multiple" className="response-accordion">
            {grouped[stageName].map((entry, i) => {
              const userAnswer = getResponseText(entry)
              const idealText = (entry.idealOptionText || '').trim()
              const hasIdeal = idealText.length > 0
              const userMatchesIdeal = hasIdeal && userAnswer.trim() === idealText
              const tip = entry.aiFeedback && typeof (entry.aiFeedback as any).feedback === 'string' ? (entry.aiFeedback as any).feedback : ''

              return (
                <AccordionItem key={i} value={`${stageName}-${i}`} className="response-item">
                  <AccordionTrigger className="response-trigger">
                    <div className="trigger-content">
                      <span className="q-type">{(entry.questionType || 'unknown').replace(/_/g, ' ')}</span>
                      <p className="trigger-question">{entry.questionText || entry.questionId || 'Question'}</p>
                      <div className="trigger-meta">
                        <ProficiencyBadge p={entry.proficiency} />
                        {userMatchesIdeal && <span className="match-badge">✓ Matches ideal</span>}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="response-content">
                    {hasIdeal ? (
                      <div className="answer-grid">
                        <div className={`answer-card user-card${userMatchesIdeal ? ' is-match' : ''}`}>
                          <span className="answer-label">Your Answer</span>
                          <p>{userAnswer}</p>
                          {tip && <p className="ai-tip">Tip: {tip}</p>}
                        </div>
                        <div className="answer-card ideal-card">
                          <span className="answer-label ideal-label">Ideal Path</span>
                          <p>{idealText}</p>
                          {entry.idealRationale && <p className="ai-tip">{entry.idealRationale}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="answer-card single-card">
                        <span className="answer-label">Your Answer</span>
                        <p>{userAnswer}</p>
                        {tip && <p className="ai-tip">Tip: {tip}</p>}
                        <p className="no-ideal-note">No ideal reference for free-form responses — your answer is evaluated by AI.</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
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

        .response-accordion :global(.response-item) {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          margin-bottom: 0.6rem;
          padding: 0 1.1rem;
        }
        .response-accordion :global(.response-trigger) {
          padding: 0.9rem 0;
        }
        .response-accordion :global(.response-content) {
          padding-top: 0.4rem;
          padding-bottom: 1rem;
        }

        .trigger-content { display: flex; flex-direction: column; gap: 0.4rem; flex: 1; }
        .q-type { font-size: 0.7rem; font-weight: 600; color: #8b5cf6; text-transform: uppercase; letter-spacing: 0.5px; }
        .trigger-question { font-size: 0.9rem; color: #e0e0e0; margin: 0; line-height: 1.4; }
        .trigger-meta { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
        .match-badge { font-size: 0.7rem; font-weight: 600; color: #34d399; background: rgba(16,185,129,0.1); padding: 0.15rem 0.5rem; border-radius: 6px; }

        .answer-grid { display: grid; grid-template-columns: 1fr; gap: 0.8rem; }
        @media (min-width: 640px) { .answer-grid { grid-template-columns: 1fr 1fr; } }

        .answer-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.8rem 1rem; }
        .answer-card.single-card { background: rgba(255,255,255,0.02); }
        .answer-card.is-match { border-color: rgba(16,185,129,0.35); background: rgba(16,185,129,0.04); }
        .answer-card.ideal-card { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.05); }

        .answer-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .ideal-label { color: #34d399; }
        .answer-card p { color: #d1d5db; font-size: 0.88rem; margin: 0.3rem 0 0 0; line-height: 1.5; }
        .ai-tip { font-size: 0.78rem; color: #9ca3af; font-style: italic; margin-top: 0.5rem !important; }
        .no-ideal-note { font-size: 0.74rem; color: #6b7280; font-style: italic; margin-top: 0.6rem !important; }
        .no-data { color: #6b7280; text-align: center; padding: 3rem; }
      `}</style>
    </div>
  )
}
