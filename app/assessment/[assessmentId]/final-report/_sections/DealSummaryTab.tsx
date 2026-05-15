'use client'

import { motion } from 'framer-motion'
import type { EvaluationReport } from '@/src/types'

export function DealSummaryTab({ report }: { report: EvaluationReport }) {
  const deal = report.dealSummary as any
  const exitedVia: string | undefined = deal?.exitedVia
  const exitStage: string | undefined = deal?.exitStage
  const capitalSource: string | undefined = deal?.capitalSource

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
      `}</style>
    </div>
  )
}
