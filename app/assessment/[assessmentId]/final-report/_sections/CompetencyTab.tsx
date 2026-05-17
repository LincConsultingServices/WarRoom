'use client'

import { CompetencyRadarChart } from '@/components/competency-radar-chart'
import type { EvaluationReport, RankedCompetency, CompetencyCode } from '@/src/types'

const COMP_COLORS: Record<string, string> = {
  C1: '#6366f1', C2: '#8b5cf6', C3: '#f59e0b', C4: '#10b981',
  C5: '#3b82f6', C6: '#ec4899', C7: '#06b6d4', C8: '#f97316',
  C9: '#14b8a6',
}

export function CompetencyTab({ report }: { report: EvaluationReport }) {
  const ranking = report.competencyRanking || []
  const spiderData = report.spiderChartData || {}
  const maxVal = 10

  return (
    <div className="comp-page">
      {/* Archetype */}
      <div className="archetype-section">
        <div className="archetype-badge">{report.entrepreneurType}</div>
        <p className="archetype-role">Organizational Role: <strong>{report.organizationalRole}</strong></p>
        {report.archetypeNarrative && (
          <p className="archetype-narrative">{report.archetypeNarrative}</p>
        )}
      </div>

      {/* Radar Chart */}
      <div className="radar-chart bg-neutral-950 p-6 rounded-2xl mb-8 border border-neutral-800">
        <h3 className="text-xl font-bold mb-4">Competency Radar</h3>
        <CompetencyRadarChart spiderData={spiderData} competencyRanking={ranking} />
      </div>

      {/* Bar Chart */}
      <div className="spider-chart">
        <h3>Competency Profile</h3>
        {ranking.map((comp: RankedCompetency) => {
          const scaledScore = (comp.weightedAverage / 3) * 10
          return (
            <div key={comp.code} className="bar-row">
              <div className="bar-label">
                <span className="comp-code" style={{ color: COMP_COLORS[comp.code] || '#8b5cf6' }}>
                  {comp.code}
                </span>
                <span className="comp-name">{comp.name}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(scaledScore / maxVal) * 100}%`, background: COMP_COLORS[comp.code] || '#8b5cf6' }}
                />
              </div>
              <div className="bar-value">{scaledScore.toFixed(1)}</div>
              <span className={`cat-badge cat-${comp.category.toLowerCase().replace(/_/g, '-')}`}>
                {comp.category.replace(/_/g, ' ')}
              </span>
            </div>
          )
        })}
      </div>

      {/* Role Fit */}
      {report.roleFitMap && (
        <div className="role-fit">
          <h3>Role Fit Analysis</h3>
          <div className="role-card">
            <div className="role-name">{report.roleFitMap.role}</div>
            <p>{report.roleFitMap.bestEnvironment}</p>
            <div className="dominant-comps">
              {report.roleFitMap.dominantCompetencies?.map((c: CompetencyCode) => (
                <span key={c} className="dom-comp" style={{ borderColor: COMP_COLORS[c] }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Plan */}
      {report.actionPlan && report.actionPlan.length > 0 && (
        <div className="action-plan">
          <h3>Action Plan</h3>
          {report.actionPlan.map((item, i) => (
            <div key={i} className="action-item">
              <div className="action-comp">{item.competency}</div>
              <p>{item.action}</p>
              <span className="target">{item.targetDate}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .comp-page { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .archetype-section { text-align: center; margin-bottom: 2.5rem; }
        .archetype-badge { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 0.6rem 2rem; border-radius: 12px; font-size: 1.3rem; font-weight: 700; margin-bottom: 0.8rem; }
        .archetype-role { color: #9ca3af; font-size: 1rem; margin-bottom: 1rem; }
        .archetype-role strong { color: hsl(var(--primary)); }
        .archetype-narrative { color: #d1d5db; line-height: 1.6; max-width: 700px; margin: 0 auto; font-size: 0.95rem; }
        .spider-chart { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; }
        .spider-chart h3, .role-fit h3, .action-plan h3 { color: white; font-size: 1.1rem; margin-bottom: 1rem; }
        .bar-row { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.7rem; }
        .bar-label { width: 200px; display: flex; gap: 0.5rem; align-items: center; }
        .comp-code { font-weight: 700; font-size: 0.85rem; width: 28px; }
        .comp-name { font-size: 0.8rem; color: #d1d5db; }
        .bar-track { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
        .bar-value { width: 40px; text-align: right; font-weight: 600; font-size: 0.85rem; color: white; }
        .cat-badge { font-size: 0.65rem; padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 600; white-space: nowrap; width: 130px; text-align: center; }
        .cat-natural-dominant { background: rgba(16,185,129,0.12); color: #34d399; }
        .cat-strong { background: rgba(59,130,246,0.12); color: #60a5fa; }
        .cat-functional { background: rgba(245,158,11,0.12); color: #fbbf24; }
        .cat-development-required { background: rgba(239,68,68,0.12); color: hsl(var(--destructive)); }
        .cat-high-risk { background: rgba(239,68,68,0.2); color: #ef4444; }
        .role-fit { margin-bottom: 2rem; }
        .role-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.5rem; }
        .role-name { font-size: 1.2rem; font-weight: 700; color: hsl(var(--primary)); margin-bottom: 0.5rem; }
        .role-card p { color: #9ca3af; font-size: 0.9rem; margin-bottom: 0.8rem; }
        .dominant-comps { display: flex; gap: 0.4rem; }
        .dom-comp { border: 1px solid; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: hsl(var(--muted-foreground)); }
        .action-plan { margin-bottom: 2rem; }
        .action-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 1rem 1.2rem; margin-bottom: 0.6rem; }
        .action-comp { font-weight: 600; color: #f59e0b; font-size: 0.85rem; margin-bottom: 0.3rem; }
        .action-item p { color: #d1d5db; font-size: 0.9rem; margin: 0 0 0.3rem 0; }
        .target { font-size: 0.75rem; color: #6b7280; }
        @media (max-width: 768px) { .bar-label { width: 120px; } .cat-badge { display: none; } }
      `}</style>
    </div>
  )
}
