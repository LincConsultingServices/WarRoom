'use client'

import { motion } from 'framer-motion'
import type { EvaluationReport } from '@/src/types'

export function DealSummaryTab({ report }: { report: EvaluationReport }) {
  const deal = report.dealSummary as any
  const exitedVia: string | undefined = deal?.exitedVia
  const exitStage: string | undefined = deal?.exitStage
  const capitalSource: string | undefined = deal?.capitalSource
  const engagement = (report as any).phaseEngagement as
    | Record<string, { spamPercent: number; burstEvents: number; floorEvents: number; totalSelections: number }>
    | undefined
  const engagementEntries = engagement ? Object.entries(engagement) : []
  const meanSpam = engagementEntries.length
    ? engagementEntries.reduce((acc, [, e]) => acc + (e?.spamPercent || 0), 0) / engagementEntries.length
    : 0
  const showEngagement = engagementEntries.length > 0 && meanSpam > 0

  // Map the backend's exit reason to a human-friendly banner. Keeps the page
  // coherent for users who never entered the war room (buyout, early exit).
  const exitBanner = (() => {
    if (!exitedVia) return null
    if (exitedVia === 'BUYOUT') {
      return {
        title: 'Exited via Buyout',
        subtitle: capitalSource || `You accepted a buyout offer${exitStage ? ` at ${exitStage}` : ''}.`,
        tone: 'positive' as const,
      }
    }
    if (exitedVia === 'WALKOUT') {
      return {
        title: 'Walked Out of the War Room',
        subtitle: 'You declined every investor offer and exited without a deal.',
        tone: 'negative' as const,
      }
    }
    if (exitedVia === 'EARLY_EXIT') {
      return {
        title: 'Early Exit',
        subtitle: `Simulation ended at ${exitStage || 'your current phase'} before reaching the War Room.`,
        tone: 'neutral' as const,
      }
    }
    return null
  })()

  return (
    <div className="deal-page">
      {exitBanner && (
        <div className={`exit-banner exit-${exitBanner.tone}`}>
          <div className="exit-title">{exitBanner.title}</div>
          <div className="exit-subtitle">{exitBanner.subtitle}</div>
        </div>
      )}
      <div className="deal-stats">
        {[
          { value: deal?.totalInvestors || 0, label: 'Investors Faced', highlight: false },
          { value: deal?.dealsOffered || 0, label: 'Deals Offered', highlight: true },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`stat-card ${stat.highlight ? 'highlight' : ''}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
          >
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {showEngagement && (
        <div className="engagement-section">
          <h3>Focus & Engagement</h3>
          <p className="engagement-blurb">
            We tracked how quickly and uniformly you selected options. A higher percentage means more selections looked rushed — your revenue projection was penalized accordingly.
          </p>
          <div className="engagement-grid">
            {engagementEntries.map(([stage, e]) => {
              const pct = Math.round(e?.spamPercent || 0)
              const tone = pct >= 40 ? 'high' : pct >= 20 ? 'mid' : 'low'
              return (
                <div key={stage} className={`engagement-card engagement-${tone}`}>
                  <div className="engagement-stage">{stage.replace('STAGE_', '').replace(/_/g, ' ')}</div>
                  <div className="engagement-value">{pct}%</div>
                  <div className="engagement-meta">
                    {e?.totalSelections ?? 0} picks · {e?.burstEvents ?? 0} burst · {e?.floorEvents ?? 0} fast
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {deal?.investorResults && deal.investorResults.length > 0 && (
        <div className="investor-results">
          <h3>Investor Scorecards</h3>
          {deal.investorResults.map((sc: any, i: number) => (
            <motion.div
              key={i}
              className="scorecard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="sc-header">
                <strong>{sc.investorName || sc.investor_name}</strong>
                <span className={`deal-badge ${(sc.dealDecision || sc.deal_decision) === 'WALK_OUT' ? 'walkout' : 'deal'}`}>
                  {sc.dealDecision || sc.deal_decision}
                </span>
              </div>
              <div className="sc-scores">
                <span>Primary: {sc.primaryScore || sc.primary_score}/5</span>
                <span>Bias Trait: {sc.biasTraitScore || sc.bias_trait_score}/5</span>
                {sc.redFlag && <span className="red-flag">Red Flag</span>}
              </div>
              {sc.investorReaction && (
                <blockquote>&ldquo;{sc.investorReaction || sc.investor_reaction}&rdquo;</blockquote>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <style jsx>{`
        .deal-page { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .exit-banner { border-radius: 12px; padding: 1rem 1.4rem; margin-bottom: 1.5rem; border: 1px solid rgba(255,255,255,0.08); }
        .exit-banner .exit-title { font-weight: 700; color: white; margin-bottom: 0.2rem; font-size: 1.05rem; }
        .exit-banner .exit-subtitle { color: #9ca3af; font-size: 0.85rem; }
        .exit-positive { background: rgba(16,185,129,0.07); border-color: rgba(16,185,129,0.25); }
        .exit-negative { background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.25); }
        .exit-neutral { background: rgba(99,102,241,0.07); border-color: rgba(99,102,241,0.25); }
        .deal-stats { display: flex; gap: 1.5rem; justify-content: center; margin-bottom: 2rem; }
        .stat-card { background: hsl(var(--muted)); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 2rem 3rem; text-align: center; }
        .stat-card.highlight { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.05); }
        .stat-value { font-size: 2.5rem; font-weight: 800; color: white; }
        .stat-label { font-size: 0.85rem; color: #9ca3af; margin-top: 0.3rem; }
        .investor-results h3 { color: white; margin-bottom: 1rem; }
        .scorecard { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.2rem; margin-bottom: 0.8rem; }
        .sc-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
        .sc-header strong { color: white; }
        .deal-badge { font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 6px; }
        .deal-badge.deal { background: rgba(16,185,129,0.15); color: #34d399; }
        .deal-badge.walkout { background: rgba(239,68,68,0.15); color: hsl(var(--destructive)); }
        .sc-scores { display: flex; gap: 1rem; font-size: 0.85rem; color: #9ca3af; margin-bottom: 0.5rem; }
        .red-flag { color: #ef4444; font-weight: 600; }
        blockquote { background: hsl(var(--muted)); border-left: 2px solid rgba(255,255,255,0.1); padding: 0.6rem 1rem; border-radius: 0 6px 6px 0; font-style: italic; color: #9ca3af; font-size: 0.9rem; margin: 0; }
        .engagement-section { margin-top: 2rem; padding: 1.5rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; }
        .engagement-section h3 { color: white; margin: 0 0 0.4rem 0; }
        .engagement-blurb { color: #9ca3af; font-size: 0.85rem; margin: 0 0 1rem 0; }
        .engagement-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 0.8rem; }
        .engagement-card { padding: 0.9rem; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .engagement-stage { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; margin-bottom: 0.3rem; }
        .engagement-value { font-size: 1.6rem; font-weight: 800; color: white; }
        .engagement-meta { font-size: 0.7rem; color: #9ca3af; margin-top: 0.2rem; }
        .engagement-low { border-color: rgba(16,185,129,0.25); }
        .engagement-low .engagement-value { color: #34d399; }
        .engagement-mid { border-color: rgba(245,158,11,0.3); }
        .engagement-mid .engagement-value { color: #f59e0b; }
        .engagement-high { border-color: rgba(239,68,68,0.35); }
        .engagement-high .engagement-value { color: #ef4444; }
      `}</style>
    </div>
  )
}
