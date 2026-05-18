'use client'

import { CompetencyRadarChart } from '@/components/competency-radar-chart'
import type { EvaluationReport, RankedCompetency, CompetencyCode } from '@/src/types'

const COMP_COLORS: Record<string, string> = {
  C1: '#c9a227', C2: '#d4af37', C3: '#f59e0b', C4: '#10b981',
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
      <div className="radar-chart bg-[color:var(--color-warroom-rampart)] p-6 rounded-2xl mb-8 border border-[color:var(--color-warroom-ash)]/20">
        <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-warroom-ivory)' }}>Competency Radar</h3>
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
                <span className="comp-code" style={{ color: COMP_COLORS[comp.code] || '#c9a227' }}>
                  {comp.code}
                </span>
                <span className="comp-name">{comp.name}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(scaledScore / maxVal) * 100}%`, background: COMP_COLORS[comp.code] || '#c9a227' }}
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
        .archetype-badge { display: inline-block; background: linear-gradient(135deg, var(--color-warroom-gold), var(--color-warroom-gold-bright)); color: var(--color-warroom-void); padding: 0.6rem 2rem; border-radius: 12px; font-size: 1.3rem; font-weight: 700; margin-bottom: 0.8rem; font-family: var(--font-display); }
        .archetype-role { color: var(--color-warroom-smoke); font-size: 1rem; margin-bottom: 1rem; font-family: var(--font-body, serif); }
        .archetype-role strong { color: var(--color-warroom-gold); }
        .archetype-narrative { color: #d1d5db; line-height: 1.6; max-width: 700px; margin: 0 auto; font-size: 0.95rem; font-family: var(--font-body, serif); }
        .spider-chart { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; }
        .spider-chart h3, .role-fit h3, .action-plan h3 { color: var(--color-warroom-ivory); font-size: 1.1rem; margin-bottom: 1rem; font-family: var(--font-display); }
        .bar-row { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.7rem; }
        .bar-label { width: 200px; display: flex; gap: 0.5rem; align-items: center; }
        .comp-code { font-weight: 700; font-size: 0.85rem; width: 28px; font-family: var(--font-display); }
        .comp-name { font-size: 0.8rem; color: #d1d5db; font-family: var(--font-body, serif); }
        .bar-track { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
        .bar-value { width: 40px; text-align: right; font-weight: 600; font-size: 0.85rem; color: var(--color-warroom-ivory); font-family: var(--font-data, monospace); }
        .cat-badge { font-size: 0.65rem; padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 600; white-space: nowrap; width: 130px; text-align: center; font-family: var(--font-display); }
        .cat-natural-dominant { background: rgba(16,185,129,0.12); color: var(--color-warroom-verdant); }
        .cat-strong { background: rgba(59,130,246,0.12); color: #60a5fa; }
        .cat-functional { background: rgba(245,158,11,0.12); color: #fbbf24; }
        .cat-development-required { background: rgba(239,68,68,0.12); color: var(--color-warroom-crimson); }
        .cat-high-risk { background: rgba(239,68,68,0.2); color: var(--color-warroom-crimson); }
        .role-fit { margin-bottom: 2rem; }
        .role-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.5rem; }
        .role-name { font-size: 1.2rem; font-weight: 700; color: var(--color-warroom-gold); margin-bottom: 0.5rem; font-family: var(--font-display); }
        .role-card p { color: var(--color-warroom-smoke); font-size: 0.9rem; margin-bottom: 0.8rem; font-family: var(--font-body, serif); }
        .dominant-comps { display: flex; gap: 0.4rem; }
        .dom-comp { border: 1px solid; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: var(--color-warroom-smoke); font-family: var(--font-display); }
        .action-plan { margin-bottom: 2rem; }
        .action-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 1rem 1.2rem; margin-bottom: 0.6rem; }
        .action-comp { font-weight: 600; color: var(--color-warroom-gold); font-size: 0.85rem; margin-bottom: 0.3rem; font-family: var(--font-display); }
        .action-item p { color: #d1d5db; font-size: 0.9rem; margin: 0 0 0.3rem 0; font-family: var(--font-body, serif); }
        .target { font-size: 0.75rem; color: var(--color-warroom-smoke); font-family: var(--font-data, monospace); }
        @media (max-width: 768px) { .bar-label { width: 120px; } .cat-badge { display: none; } }
      `}</style>
    </div>
  )
}
