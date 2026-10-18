'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Briefcase,
  CalendarRange,
  Compass,
  Download,
  Flag,
  Handshake,
  RefreshCw,
  Target,
  UserPlus,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import api from '@/src/lib/api'
import { easeDramatic } from '@/lib/animations/variants'
import type {
  EvaluationReport,
  ImplementationRoadmap,
  RoadmapSkillGap,
  RoadmapSupportType,
} from '@/src/types'

// ============================================
// 30-Day Implementation Roadmap
// The four weeks are framed as the phases of a chess game — the plan opens,
// develops, fights for position, then closes on the Day-30 checkpoint.
// ============================================

const PHASES = [
  { name: 'Opening', glyph: '♙' },
  { name: 'Development', glyph: '♘' },
  { name: 'Middlegame', glyph: '♖' },
  { name: 'Endgame', glyph: '♔' },
] as const

// Gold deepens week by week as the campaign intensifies.
const WEEK_INTENSITY = [34, 52, 72, 100]

function weekTone(index: number): CSSProperties {
  return { '--wk': `${WEEK_INTENSITY[index] ?? 100}%` } as CSSProperties
}

const SUPPORT: Record<RoadmapSupportType, { label: string; icon: LucideIcon }> = {
  hire: { label: 'Hire', icon: UserPlus },
  cofounder: { label: 'Co-founder', icon: Handshake },
  outsource: { label: 'Outsource', icon: Briefcase },
  advisor: { label: 'Advisor', icon: Compass },
  partner: { label: 'Partner', icon: Users },
  tool: { label: 'Tool', icon: Wrench },
  upskill: { label: 'Upskill', icon: BookOpen },
}

const SEVERITY_LABEL: Record<RoadmapSkillGap['severity'], string> = {
  critical: 'Critical gap',
  developing: 'Developing',
  watch: 'Watch area',
}

export function isUsableRoadmap(r: ImplementationRoadmap | null | undefined): r is ImplementationRoadmap {
  return !!r && Array.isArray(r.weeks) && r.weeks.length > 0
}

function phaseFor(index: number) {
  return PHASES[index] ?? PHASES[PHASES.length - 1]
}

function dayRange(start: number, end: number) {
  return start === end ? `Day ${start}` : `Days ${start}–${end}`
}

function supportMeta(type: string) {
  return SUPPORT[type as RoadmapSupportType] ?? SUPPORT.advisor
}

// Plain-text export so the founder can keep the plan outside the app.
function roadmapToText(r: ImplementationRoadmap): string {
  const lines: string[] = [
    "KK'S WAR ROOM — 30-DAY IMPLEMENTATION ROADMAP",
    '',
    r.headline,
    '',
    r.summary,
    '',
    `DAY 30 OBJECTIVE: ${r.northStar}`,
  ]
  if (r.ideaSnapshot?.length) {
    lines.push('', 'BUILT FROM YOUR ANSWERS')
    for (const item of r.ideaSnapshot) lines.push(`- ${item.label}: ${item.value}`)
  }
  r.weeks.forEach((w, i) => {
    lines.push(
      '',
      `WEEK ${w.week} · ${phaseFor(i).name.toUpperCase()} (${dayRange(w.startDay, w.endDay)}): ${w.theme}`,
    )
    if (w.objective) lines.push(`Objective: ${w.objective}`)
    for (const t of w.tasks ?? []) {
      lines.push(`[ ] ${t.days} — ${t.title}${t.owner ? ` (${t.owner})` : ''}`)
      if (t.detail) lines.push(`    ${t.detail}`)
    }
    if (w.milestone) lines.push(`Milestone: ${w.milestone}`)
    if (w.metric) lines.push(`Measure: ${w.metric}`)
  })
  if (r.strengths?.length) {
    lines.push('', 'STRENGTHS TO LEAN ON')
    for (const s of r.strengths) lines.push(`- ${s.name}: ${s.howToUse}`)
  }
  if (r.skillGaps?.length) {
    lines.push('', 'GAPS TO COVER')
    for (const g of r.skillGaps) {
      lines.push(
        `- ${g.name} (${SEVERITY_LABEL[g.severity] ?? g.severity}, start ${g.whenInPlan}): ${g.risk}`,
      )
      lines.push(
        `  Recommended: ${supportMeta(g.recommendation.type).label} — ${g.recommendation.label}. ${g.recommendation.detail}`,
      )
      for (const alt of g.alternatives ?? [])
        lines.push(`  Or: ${supportMeta(alt.type).label} — ${alt.label}`)
    }
  }
  if (r.checkpoint) {
    lines.push('', 'DAY-30 CHECKPOINT')
    for (const c of r.checkpoint.successCriteria ?? []) lines.push(`[ ] ${c}`)
    lines.push(`If you're on track: ${r.checkpoint.ifOnTrack}`)
    lines.push(`If you're behind: ${r.checkpoint.ifBehind}`)
  }
  return lines.join('\n')
}

function downloadRoadmap(r: ImplementationRoadmap) {
  const blob = new Blob([roadmapToText(r)], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'war-room-30-day-roadmap.txt'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

interface RoadmapTabProps {
  report: EvaluationReport
  assessmentId: string
  /** Lets the page keep a lazily-fetched roadmap across tab switches. */
  onRoadmapLoaded?: (roadmap: ImplementationRoadmap) => void
}

export function RoadmapTab({ report, assessmentId, onRoadmapLoaded }: RoadmapTabProps) {
  const inline = isUsableRoadmap(report.implementationRoadmap) ? report.implementationRoadmap : null
  const [fetched, setFetched] = useState<ImplementationRoadmap | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const roadmap = inline ?? fetched

  useEffect(() => {
    if (inline) return
    let cancelled = false
    api.assessments
      .getRoadmap(assessmentId)
      .then((r) => {
        if (cancelled) return
        if (isUsableRoadmap(r)) {
          setFetched(r)
          onRoadmapLoaded?.(r)
        } else {
          setFailed(true)
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
    // onRoadmapLoaded is a notification hook; re-running on its identity would refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId, inline, attempt])

  if (!roadmap) {
    return (
      <div className="rm-state">
        {failed ? (
          <>
            <p className="rm-state-title">We couldn&rsquo;t draft your roadmap just now.</p>
            <p className="rm-state-sub">Your report is safe. Try again in a moment.</p>
            <button
              type="button"
              className="rm-btn"
              onClick={() => {
                setFailed(false)
                setAttempt((n) => n + 1)
              }}
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </>
        ) : (
          <>
            <div className="rm-spinner" aria-hidden />
            <p className="rm-state-title">Drafting your 30-day campaign&hellip;</p>
            <p className="rm-state-sub">Built from your War Room answers and competency profile.</p>
          </>
        )}
        <style jsx>{`
  .rm-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; text-align: center; padding: 4rem 1rem; }
  .rm-state-title { color: var(--color-chessboard-ivory); font-family: var(--font-display); font-weight: 700; font-size: 1.05rem; letter-spacing: 0.02em; }
  .rm-state-sub { color: var(--color-chessboard-smoke); font-size: 0.9rem; font-family: var(--font-body, serif); }
  .rm-spinner { width: 2rem; height: 2rem; border-radius: 9999px; border: 2px solid color-mix(in srgb, var(--color-chessboard-gold) 25%, transparent); border-top-color: var(--color-chessboard-gold); animation: rm-spin 0.9s linear infinite; }
  @keyframes rm-spin { to { transform: rotate(360deg); } }
  .rm-btn { display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; padding: 0.55rem 1.1rem; border-radius: 10px; border: 1px solid color-mix(in srgb, var(--color-chessboard-gold) 45%, transparent); background: color-mix(in srgb, var(--color-chessboard-gold) 10%, transparent); color: var(--color-chessboard-gold); font-family: var(--font-display); font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: background 0.2s ease; }
  .rm-btn:hover { background: color-mix(in srgb, var(--color-chessboard-gold) 18%, transparent); }
        `}</style>
      </div>
    )
  }

  return <RoadmapView roadmap={roadmap} />
}

function RoadmapView({ roadmap }: { roadmap: ImplementationRoadmap }) {
  const prefersReducedMotion = useReducedMotion()
  const [focusWeek, setFocusWeek] = useState<number | null>(null)

  const weeks = roadmap.weeks.slice(0, 4)
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  const weekIndexForDay = (day: number) => {
    const idx = weeks.findIndex((w) => day >= w.startDay && day <= w.endDay)
    return idx === -1 ? Math.min(3, Math.floor((day - 1) / 7)) : idx
  }

  const reveal = (i: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '0px 0px -10% 0px' },
          transition: { duration: 0.45, delay: i * 0.06, ease: easeDramatic },
        }

  const scrollToWeek = (i: number) => {
    document.getElementById(`rm-week-${i + 1}`)?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  const generatedOn = roadmap.generatedAt ? new Date(roadmap.generatedAt) : null

  return (
    <div className="rm">
      {/* ── Hero ───────────────────────────────────── */}
      <motion.div {...reveal(0)}>
        <header className="rm-hero">
          <span className="rm-eyebrow">
            <CalendarRange className="h-3.5 w-3.5" /> Your 30-Day Implementation Roadmap
          </span>
          <h2 className="rm-headline">{roadmap.headline}</h2>
          {roadmap.summary && <p className="rm-summary">{roadmap.summary}</p>}

          <div className="rm-northstar">
            <Target className="rm-northstar-icon" aria-hidden />
            <div>
              <span className="rm-kicker">Day 30 objective</span>
              <p>{roadmap.northStar}</p>
            </div>
          </div>

          <button type="button" className="rm-btn rm-btn-ghost" onClick={() => downloadRoadmap(roadmap)}>
            <Download className="h-4 w-4" /> Download plan
          </button>
        </header>
      </motion.div>

      {/* ── The 30-square board ────────────────────── */}
      <motion.div {...reveal(1)}>
        <section className="rm-board-wrap" aria-label="Your 30 days at a glance">
          <div className="rm-board" onMouseLeave={() => setFocusWeek(null)}>
            {days.map((day) => {
              const wi = weekIndexForDay(day)
              const dim = focusWeek !== null && focusWeek !== wi
              return (
                <button
                  key={day}
                  type="button"
                  className={`rm-square ${day % 2 === 0 ? 'is-even' : ''} ${dim ? 'is-dim' : ''}`}
                  style={weekTone(wi)}
                  onMouseEnter={() => setFocusWeek(wi)}
                  onFocus={() => setFocusWeek(wi)}
                  onBlur={() => setFocusWeek(null)}
                  onClick={() => scrollToWeek(wi)}
                  aria-label={`Day ${day}: week ${wi + 1}, ${weeks[wi]?.theme ?? ''}`}
                >
                  {(day === 1 || day === 30 || weeks.some((w) => w.startDay === day)) && (
                    <span className="rm-square-num">{day}</span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="rm-legend">
            {weeks.map((w, i) => (
              <button
                key={w.week}
                type="button"
                className={`rm-legend-item ${focusWeek === i ? 'is-active' : ''}`}
                style={weekTone(i)}
                onMouseEnter={() => setFocusWeek(i)}
                onMouseLeave={() => setFocusWeek(null)}
                onClick={() => scrollToWeek(i)}
              >
                <span className="rm-legend-swatch" aria-hidden />
                <span className="rm-legend-phase">{phaseFor(i).name}</span>
                <span className="rm-legend-days">{dayRange(w.startDay, w.endDay)}</span>
              </button>
            ))}
          </div>
        </section>
      </motion.div>

      {/* ── Inputs the plan is built from ──────────── */}
      {roadmap.ideaSnapshot?.length > 0 && (
        <motion.div {...reveal(2)}>
          <section className="rm-brief">
            <h3 className="rm-section-title">Built from your War Room answers</h3>
            <dl className="rm-brief-grid">
              {roadmap.ideaSnapshot.map((item) => (
                <div key={item.key} className={`rm-brief-item ${item.key === 'problem' ? 'is-wide' : ''}`}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </motion.div>
      )}

      {/* ── Four weeks ─────────────────────────────── */}
      <section className="rm-weeks">
        {weeks.map((w, i) => {
          const phase = phaseFor(i)
          return (
            <motion.div key={w.week} {...reveal(i)}>
              <article
                id={`rm-week-${w.week}`}
                className={`rm-week ${focusWeek === i ? 'is-focus' : ''}`}
                style={weekTone(i)}
                onMouseEnter={() => setFocusWeek(i)}
                onMouseLeave={() => setFocusWeek(null)}
              >
                <div className="rm-week-rail" aria-hidden>
                  <span className="rm-glyph">{phase.glyph}</span>
                </div>
                <div className="rm-week-body">
                  <div className="rm-week-head">
                    <span className="rm-kicker">
                      Week {w.week} · {phase.name}
                    </span>
                    <span className="rm-days">{dayRange(w.startDay, w.endDay)}</span>
                  </div>
                  <h3 className="rm-week-theme">{w.theme}</h3>
                  {w.objective && <p className="rm-week-objective">{w.objective}</p>}

                  <ol className="rm-tasks">
                    {(w.tasks ?? []).map((t, ti) => (
                      <li key={ti} className="rm-task">
                        <span className="rm-task-days">{t.days}</span>
                        <div className="rm-task-main">
                          <p className="rm-task-title">{t.title}</p>
                          {t.detail && <p className="rm-task-detail">{t.detail}</p>}
                        </div>
                        {t.owner && <span className="rm-owner">{t.owner}</span>}
                      </li>
                    ))}
                  </ol>

                  {(w.milestone || w.metric) && (
                    <div className="rm-week-foot">
                      {w.milestone && (
                        <span>
                          <Flag className="h-3.5 w-3.5" aria-hidden /> <b>Milestone</b> {w.milestone}
                        </span>
                      )}
                      {w.metric && (
                        <span>
                          <Target className="h-3.5 w-3.5" aria-hidden /> <b>Measure</b> {w.metric}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </article>
            </motion.div>
          )
        })}
      </section>

      {/* ── Strengths & gaps ───────────────────────── */}
      {(roadmap.strengths?.length > 0 || roadmap.skillGaps?.length > 0) && (
        <section className="rm-split">
          {roadmap.strengths?.length > 0 && (
            <motion.div {...reveal(0)}>
              <div className="rm-panel">
                <h3 className="rm-section-title">Your strongest pieces</h3>
                <p className="rm-panel-sub">Own these yourself this month.</p>
                {roadmap.strengths.map((s) => (
                  <div key={s.code} className="rm-strength">
                    <div className="rm-comp-row">
                      <span className="rm-code">{s.code}</span>
                      <span className="rm-comp-name">{s.name}</span>
                      <ScoreMeter score={s.score} />
                    </div>
                    <p className="rm-panel-text">{s.howToUse}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {roadmap.skillGaps?.length > 0 && (
            <motion.div {...reveal(1)}>
              <div className="rm-panel rm-panel-gaps">
                <h3 className="rm-section-title">Reinforcements to call in</h3>
                <p className="rm-panel-sub">
                  Where your profile is thinnest, bring in help instead of waiting to master it.
                </p>
                {roadmap.skillGaps.map((g) => {
                  const rec = supportMeta(g.recommendation.type)
                  const RecIcon = rec.icon
                  return (
                    <div key={g.code} className="rm-gap">
                      <div className="rm-comp-row">
                        <span className="rm-code">{g.code}</span>
                        <span className="rm-comp-name">{g.name}</span>
                        <span className={`rm-severity is-${g.severity}`}>
                          {SEVERITY_LABEL[g.severity] ?? g.severity}
                        </span>
                      </div>
                      <p className="rm-panel-text">{g.risk}</p>

                      <div className="rm-rec">
                        <span className="rm-rec-icon" aria-hidden>
                          <RecIcon className="h-4 w-4" />
                        </span>
                        <div>
                          <span className="rm-rec-type">
                            Recommended · {rec.label}
                            {g.whenInPlan && <em> · start {g.whenInPlan}</em>}
                          </span>
                          <p className="rm-rec-label">{g.recommendation.label}</p>
                          {g.recommendation.detail && (
                            <p className="rm-rec-detail">{g.recommendation.detail}</p>
                          )}
                        </div>
                      </div>

                      {g.alternatives?.length > 0 && (
                        <ul className="rm-alts">
                          {g.alternatives.map((alt, ai) => {
                            const meta = supportMeta(alt.type)
                            const AltIcon = meta.icon
                            return (
                              <li key={ai} title={alt.detail}>
                                <AltIcon className="h-3.5 w-3.5" aria-hidden />
                                <span className="rm-alt-type">{meta.label}</span>
                                {alt.label}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </section>
      )}

      {/* ── Day-30 checkpoint ──────────────────────── */}
      {roadmap.checkpoint && (
        <motion.div {...reveal(0)}>
          <section className="rm-checkpoint">
            <div className="rm-checkpoint-head">
              <span className="rm-glyph rm-glyph-sm" aria-hidden>
                ♚
              </span>
              <div>
                <span className="rm-kicker">Day 30</span>
                <h3 className="rm-section-title">The checkpoint</h3>
              </div>
            </div>
            <ul className="rm-criteria">
              {(roadmap.checkpoint.successCriteria ?? []).map((c, i) => (
                <li key={i}>
                  <span className="rm-check" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
            <div className="rm-verdicts">
              <div className="rm-verdict is-good">
                <span className="rm-kicker">If you&rsquo;re on track</span>
                <p>{roadmap.checkpoint.ifOnTrack}</p>
              </div>
              <div className="rm-verdict">
                <span className="rm-kicker">If you&rsquo;re behind</span>
                <p>{roadmap.checkpoint.ifBehind}</p>
              </div>
            </div>
          </section>
        </motion.div>
      )}

      <p className="rm-footnote">
        {roadmap.source === 'ai'
          ? 'Personalised by AI from your War Room answers and competency profile.'
          : 'Built from your War Room answers and competency profile.'}
        {generatedOn && !Number.isNaN(generatedOn.getTime()) && (
          <> · Drafted {generatedOn.toLocaleDateString()}</>
        )}
      </p>

      <style jsx>{`
  .rm { display: flex; flex-direction: column; gap: 2rem; }
  .rm-kicker { display: block; font-family: var(--font-display); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-chessboard-gold); }
  .rm-section-title { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--color-chessboard-ivory); margin: 0; }

  /* Hero */
  .rm-hero { position: relative; overflow: hidden; border-radius: 18px; padding: 2rem 1.75rem 1.75rem; border: 1px solid color-mix(in srgb, var(--color-chessboard-gold) 28%, transparent); background:
      radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, var(--color-chessboard-gold) 12%, transparent) 0%, transparent 55%),
      repeating-conic-gradient(color-mix(in srgb, var(--foreground) 2.5%, transparent) 0% 25%, transparent 0% 50%) 0 0 / 28px 28px,
      var(--color-chessboard-rampart); }
  .rm-eyebrow { display: inline-flex; align-items: center; gap: 0.45rem; font-family: var(--font-display); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-chessboard-gold); }
  .rm-headline { margin: 0.7rem 0 0.6rem; font-family: var(--font-display); font-size: clamp(1.45rem, 3.6vw, 2.1rem); line-height: 1.15; font-weight: 800; letter-spacing: -0.01em; color: var(--color-chessboard-ivory); max-width: 30ch; }
  .rm-summary { color: var(--muted-foreground); font-family: var(--font-body, serif); font-size: 0.95rem; line-height: 1.65; max-width: 62ch; margin: 0; }
  .rm-northstar { display: flex; gap: 0.85rem; align-items: flex-start; margin: 1.4rem 0 1.1rem; padding: 1rem 1.1rem; border-radius: 12px; border-left: 3px solid var(--color-chessboard-gold); background: color-mix(in srgb, var(--color-chessboard-gold) 8%, transparent); }
  .rm-northstar p { margin: 0.2rem 0 0; color: var(--color-chessboard-ivory); font-family: var(--font-body, serif); font-size: 1rem; font-weight: 600; line-height: 1.5; }
  :global(.rm-northstar-icon) { width: 1.35rem; height: 1.35rem; color: var(--color-chessboard-gold); flex-shrink: 0; margin-top: 0.15rem; }
  .rm-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.55rem 1.1rem; border-radius: 10px; border: 1px solid color-mix(in srgb, var(--color-chessboard-gold) 45%, transparent); background: color-mix(in srgb, var(--color-chessboard-gold) 10%, transparent); color: var(--color-chessboard-gold); font-family: var(--font-display); font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: background 0.2s ease, transform 0.2s ease; }
  .rm-btn:hover { background: color-mix(in srgb, var(--color-chessboard-gold) 18%, transparent); transform: translateY(-1px); }
  .rm-btn:focus-visible, .rm-square:focus-visible, .rm-legend-item:focus-visible { outline: 2px solid var(--color-chessboard-gold); outline-offset: 2px; }

  /* 30-square board */
  .rm-board-wrap { display: flex; flex-direction: column; gap: 0.85rem; }
  .rm-board { display: grid; grid-template-columns: repeat(30, minmax(0, 1fr)); gap: 3px; padding: 6px; border-radius: 10px; border: 1px solid color-mix(in srgb, var(--color-chessboard-gold) 22%, transparent); background: color-mix(in srgb, var(--foreground) 4%, transparent); }
  .rm-square { position: relative; aspect-ratio: 1 / 1.35; border: 0; padding: 0; border-radius: 3px; cursor: pointer; background: color-mix(in srgb, var(--color-chessboard-gold) var(--wk), var(--color-chessboard-rampart)); transition: opacity 0.2s ease, transform 0.2s ease; }
  .rm-square.is-even { background: color-mix(in srgb, var(--color-chessboard-gold) calc(var(--wk) * 0.62), var(--color-chessboard-rampart)); }
  .rm-square.is-dim { opacity: 0.28; }
  .rm-square:hover { transform: translateY(-2px); }
  .rm-square-num { position: absolute; left: 50%; bottom: calc(100% + 4px); transform: translateX(-50%); font-family: var(--font-data, monospace); font-size: 0.62rem; color: var(--color-chessboard-smoke); pointer-events: none; }
  .rm-board { margin-top: 1.1rem; }
  .rm-legend { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.5rem; }
  .rm-legend-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.6rem; border-radius: 8px; border: 1px solid color-mix(in srgb, var(--foreground) 7%, transparent); background: transparent; cursor: pointer; text-align: left; transition: border-color 0.2s ease, background 0.2s ease; }
  .rm-legend-item.is-active, .rm-legend-item:hover { border-color: color-mix(in srgb, var(--color-chessboard-gold) 45%, transparent); background: color-mix(in srgb, var(--color-chessboard-gold) 6%, transparent); }
  .rm-legend-swatch { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; background: color-mix(in srgb, var(--color-chessboard-gold) var(--wk), var(--color-chessboard-rampart)); }
  .rm-legend-phase { font-family: var(--font-display); font-size: 0.78rem; font-weight: 700; color: var(--color-chessboard-ivory); }
  .rm-legend-days { margin-left: auto; font-family: var(--font-data, monospace); font-size: 0.68rem; color: var(--color-chessboard-smoke); white-space: nowrap; }

  /* Brief */
  .rm-brief { border-radius: 14px; padding: 1.25rem 1.35rem; border: 1px dashed color-mix(in srgb, var(--foreground) 14%, transparent); }
  .rm-brief-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 0.9rem 1.4rem; margin: 1rem 0 0; }
  .rm-brief-item.is-wide { grid-column: 1 / -1; }
  .rm-brief-item dt { font-family: var(--font-display); font-size: 0.66rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-chessboard-smoke); }
  .rm-brief-item dd { margin: 0.2rem 0 0; font-family: var(--font-body, serif); font-size: 0.9rem; line-height: 1.45; color: var(--color-chessboard-ivory); }
  .rm-brief-item.is-wide dd { font-size: 1.02rem; font-weight: 600; }

  /* Weeks */
  .rm-weeks { display: flex; flex-direction: column; gap: 1rem; }
  .rm-week { display: grid; grid-template-columns: 56px 1fr; gap: 1.1rem; scroll-margin-top: 1.5rem; border-radius: 16px; padding: 1.35rem 1.35rem 1.25rem 1rem; border: 1px solid color-mix(in srgb, var(--foreground) 7%, transparent); background: color-mix(in srgb, var(--foreground) 2.5%, transparent); transition: border-color 0.25s ease, box-shadow 0.25s ease; }
  .rm-week.is-focus { border-color: color-mix(in srgb, var(--color-chessboard-gold) 45%, transparent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-chessboard-gold) 12%, transparent), 0 10px 30px -18px color-mix(in srgb, var(--color-chessboard-gold) 60%, transparent); }
  .rm-week-rail { display: flex; flex-direction: column; align-items: center; position: relative; }
  .rm-week-rail::after { content: ''; flex: 1; width: 2px; margin-top: 0.6rem; border-radius: 1px; background: linear-gradient(to bottom, color-mix(in srgb, var(--color-chessboard-gold) var(--wk), transparent), transparent); }
  .rm-glyph { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 12px; font-size: 1.65rem; line-height: 1; color: var(--color-chessboard-ivory); border: 1px solid color-mix(in srgb, var(--color-chessboard-gold) 50%, transparent); background: color-mix(in srgb, var(--color-chessboard-gold) calc(var(--wk, 60%) * 0.22), var(--color-chessboard-rampart)); }
  .rm-glyph-sm { width: 42px; height: 42px; font-size: 1.45rem; }
  .rm-week-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .rm-days { font-family: var(--font-data, monospace); font-size: 0.75rem; color: var(--color-chessboard-smoke); }
  .rm-week-theme { margin: 0.3rem 0 0.35rem; font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; color: var(--color-chessboard-ivory); }
  .rm-week-objective { margin: 0 0 1rem; color: var(--muted-foreground); font-family: var(--font-body, serif); font-size: 0.92rem; line-height: 1.55; }
  .rm-tasks { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .rm-task { display: grid; grid-template-columns: 86px 1fr auto; gap: 0.9rem; align-items: start; padding: 0.75rem 0; border-top: 1px solid color-mix(in srgb, var(--foreground) 6%, transparent); }
  .rm-task-days { font-family: var(--font-data, monospace); font-size: 0.72rem; font-weight: 600; color: var(--color-chessboard-gold); padding-top: 0.12rem; white-space: nowrap; }
  .rm-task-title { margin: 0; font-family: var(--font-display); font-size: 0.93rem; font-weight: 700; color: var(--color-chessboard-ivory); }
  .rm-task-detail { margin: 0.25rem 0 0; font-family: var(--font-body, serif); font-size: 0.87rem; line-height: 1.55; color: var(--muted-foreground); }
  .rm-owner { font-family: var(--font-display); font-size: 0.66rem; font-weight: 600; letter-spacing: 0.04em; padding: 0.2rem 0.55rem; border-radius: 999px; white-space: nowrap; color: var(--color-chessboard-smoke); border: 1px solid color-mix(in srgb, var(--foreground) 12%, transparent); }
  .rm-week-foot { display: flex; flex-wrap: wrap; gap: 0.6rem 1.4rem; margin-top: 0.4rem; padding-top: 0.85rem; border-top: 1px dashed color-mix(in srgb, var(--color-chessboard-gold) 30%, transparent); font-family: var(--font-body, serif); font-size: 0.85rem; color: var(--muted-foreground); }
  .rm-week-foot span { display: flex; align-items: flex-start; gap: 0.4rem; }
  .rm-week-foot :global(svg) { color: var(--color-chessboard-gold); flex-shrink: 0; margin-top: 0.2rem; }
  .rm-week-foot b { flex-shrink: 0; padding-top: 0.1rem; font-family: var(--font-display); font-size: 0.66rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-chessboard-gold); }

  /* Strengths & gaps */
  .rm-split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr); gap: 1rem; align-items: start; }
  .rm-panel { border-radius: 16px; padding: 1.35rem; border: 1px solid color-mix(in srgb, var(--foreground) 7%, transparent); background: color-mix(in srgb, var(--foreground) 2.5%, transparent); }
  .rm-panel-sub { margin: 0.25rem 0 1rem; color: var(--color-chessboard-smoke); font-family: var(--font-body, serif); font-size: 0.85rem; }
  .rm-strength, .rm-gap { padding: 0.9rem 0; border-top: 1px solid color-mix(in srgb, var(--foreground) 6%, transparent); }
  .rm-comp-row { display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; }
  .rm-code { font-family: var(--font-data, monospace); font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 5px; color: var(--color-chessboard-gold); border: 1px solid color-mix(in srgb, var(--color-chessboard-gold) 40%, transparent); }
  .rm-comp-name { font-family: var(--font-display); font-weight: 700; font-size: 0.92rem; color: var(--color-chessboard-ivory); }
  .rm-panel-text { margin: 0.45rem 0 0; font-family: var(--font-body, serif); font-size: 0.87rem; line-height: 1.55; color: var(--muted-foreground); }
  .rm-severity { margin-left: auto; font-family: var(--font-display); font-size: 0.64rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 0.15rem 0.5rem; border-radius: 6px; color: var(--color-chessboard-smoke); background: color-mix(in srgb, var(--foreground) 6%, transparent); }
  .rm-severity.is-critical { color: var(--destructive); background: color-mix(in srgb, var(--destructive) 12%, transparent); }
  .rm-severity.is-developing { color: var(--color-chessboard-gold); background: color-mix(in srgb, var(--color-chessboard-gold) 12%, transparent); }
  .rm-rec { display: flex; gap: 0.75rem; margin-top: 0.8rem; padding: 0.85rem 0.9rem; border-radius: 12px; background: color-mix(in srgb, var(--color-chessboard-gold) 7%, transparent); border: 1px solid color-mix(in srgb, var(--color-chessboard-gold) 25%, transparent); }
  .rm-rec-icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; color: var(--color-chessboard-gold); background: color-mix(in srgb, var(--color-chessboard-gold) 14%, transparent); }
  .rm-rec-type { font-family: var(--font-display); font-size: 0.64rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-chessboard-gold); }
  .rm-rec-type em { font-style: normal; color: var(--color-chessboard-smoke); }
  .rm-rec-label { margin: 0.2rem 0 0; font-family: var(--font-display); font-weight: 700; font-size: 0.92rem; color: var(--color-chessboard-ivory); }
  .rm-rec-detail { margin: 0.25rem 0 0; font-family: var(--font-body, serif); font-size: 0.85rem; line-height: 1.5; color: var(--muted-foreground); }
  .rm-alts { list-style: none; margin: 0.6rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
  .rm-alts li { display: flex; align-items: center; gap: 0.45rem; font-family: var(--font-body, serif); font-size: 0.84rem; color: var(--muted-foreground); }
  .rm-alts :global(svg) { color: var(--color-chessboard-smoke); flex-shrink: 0; }
  .rm-alt-type { font-family: var(--font-display); font-size: 0.64rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-chessboard-smoke); min-width: 5.6rem; }

  /* Checkpoint */
  .rm-checkpoint { border-radius: 18px; padding: 1.5rem; border: 1px solid color-mix(in srgb, var(--color-chessboard-gold) 32%, transparent); background: linear-gradient(160deg, color-mix(in srgb, var(--color-chessboard-gold) 9%, transparent), transparent 60%), var(--color-chessboard-rampart); }
  .rm-checkpoint-head { display: flex; align-items: center; gap: 0.85rem; }
  .rm-criteria { list-style: none; margin: 1.1rem 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 0.6rem 1.2rem; }
  .rm-criteria li { display: flex; gap: 0.6rem; align-items: flex-start; font-family: var(--font-body, serif); font-size: 0.9rem; line-height: 1.45; color: var(--color-chessboard-ivory); }
  .rm-check { width: 14px; height: 14px; margin-top: 0.2rem; flex-shrink: 0; border-radius: 3px; border: 1.5px solid var(--color-chessboard-gold); }
  .rm-verdicts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem; }
  .rm-verdict { padding: 0.9rem 1rem; border-radius: 12px; border: 1px solid color-mix(in srgb, var(--foreground) 8%, transparent); background: color-mix(in srgb, var(--foreground) 2.5%, transparent); }
  .rm-verdict.is-good { border-color: color-mix(in srgb, var(--color-chessboard-gold) 35%, transparent); }
  .rm-verdict p { margin: 0.35rem 0 0; font-family: var(--font-body, serif); font-size: 0.88rem; line-height: 1.55; color: var(--muted-foreground); }

  .rm-footnote { margin: -0.5rem 0 0; text-align: center; font-family: var(--font-body, serif); font-size: 0.75rem; color: var(--color-chessboard-smoke); }

  @media (max-width: 768px) {
    .rm-hero { padding: 1.5rem 1.15rem 1.25rem; }
    .rm-board { grid-template-columns: repeat(15, minmax(0, 1fr)); row-gap: 1.3rem; }
    .rm-legend { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .rm-legend-item { flex-wrap: wrap; row-gap: 0.1rem; }
    .rm-legend-days { margin-left: 0; flex-basis: 100%; padding-left: calc(10px + 0.5rem); }
    .rm-week { grid-template-columns: 1fr; padding: 1.15rem; }
    .rm-week-rail { flex-direction: row; }
    .rm-week-rail::after { display: none; }
    .rm-glyph { width: 40px; height: 40px; font-size: 1.35rem; }
    .rm-task { grid-template-columns: 1fr; gap: 0.3rem; }
    .rm-owner { justify-self: start; }
    .rm-split { grid-template-columns: 1fr; }
    .rm-verdicts { grid-template-columns: 1fr; }
  }
      `}</style>
    </div>
  )
}

function ScoreMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, (score / 3) * 100))
  return (
    <span className="rm-meter" aria-label={`Score ${score.toFixed(2)} of 3`}>
      <span className="rm-meter-fill" style={{ width: `${pct}%` }} />
      <style jsx>{`
        .rm-meter { position: relative; width: 64px; height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--foreground) 8%, transparent); overflow: hidden; flex-shrink: 0; margin-left: auto; }
        .rm-meter-fill { position: absolute; inset: 0 auto 0 0; border-radius: 3px; background: linear-gradient(90deg, var(--color-chessboard-gold), var(--color-chessboard-gold-bright)); }
      `}</style>
    </span>
  )
}
