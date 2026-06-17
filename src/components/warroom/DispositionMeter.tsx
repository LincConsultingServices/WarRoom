'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================
// <DispositionMeter />
// ----------------------------------------------------------------
// 180° SVG arc gauge showing the active investor's current
// disposition (0 = hostile crimson, 50 = neutral silver, 100 =
// enthralled gold). The needle is spring-damped via framer-motion
// to feel organic instead of binary.
//
// Designed to be driven by useFeedbackSentiment (Phase 5):
//   sentiment label → target value
//     impressed   → 80
//     neutral     → 50
//     skeptical   → 22
//
// Consumers can also drive `value` directly when they have a
// concrete score (e.g. from InvestorScorecard.primaryScore).
// ============================================================

interface DispositionMeterProps {
  /** 0-100. Target value the needle will animate toward. */
  value: number
  label?: string
  className?: string
  /** Shows a numeric readout under the gauge. */
  showReadout?: boolean
}

const ARC_RADIUS = 64
const ARC_STROKE = 8
const VIEW_W = 160
const VIEW_H = 92
const CX = VIEW_W / 2
const CY = ARC_RADIUS + ARC_STROKE / 2 + 4

function describe(value: number): { label: string; tone: string } {
  if (value >= 75) return { label: 'Enthralled', tone: 'text-amber-300' }
  if (value >= 58) return { label: 'Interested', tone: 'text-amber-200' }
  if (value >= 42) return { label: 'Neutral',    tone: 'text-white/80' }
  if (value >= 25) return { label: 'Skeptical',  tone: 'text-orange-300' }
  return                  { label: 'Hostile',    tone: 'text-red-400' }
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 180) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(value: number): string {
  const clamped = Math.max(0, Math.min(100, value))
  const start = polarToCartesian(CX, CY, ARC_RADIUS, 0)
  const angle = (clamped / 100) * 180
  const end = polarToCartesian(CX, CY, ARC_RADIUS, angle)
  const large = angle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 ${large} 1 ${end.x} ${end.y}`
}

const FULL_ARC = arcPath(100)

export function DispositionMeter({
  value,
  label = 'Disposition',
  className,
  showReadout = true,
}: DispositionMeterProps) {
  const reducedMotion = useReducedMotion()
  const spring = useSpring(reducedMotion ? value : 0, {
    stiffness: 90,
    damping: 18,
    mass: 0.7,
  })
  const [displayValue, setDisplayValue] = useState(reducedMotion ? value : 0)

  useEffect(() => {
    spring.set(Math.max(0, Math.min(100, value)))
  }, [value, spring])

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplayValue(v))
    return () => unsub()
  }, [spring])

  const needleAngle = useTransform(spring, (v) => -90 + (v / 100) * 180)
  const desc = describe(displayValue)

  return (
    <div className={cn('flex flex-col items-center', className)} aria-label={`${label}: ${Math.round(displayValue)} of 100`}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full max-w-[180px]"
        role="img"
        aria-hidden={false}
      >
        <defs>
          <linearGradient id="dispoArc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#c0c0c0" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d={FULL_ARC}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth={ARC_STROKE}
          strokeLinecap="round"
        />

        {/* Active arc — clipped via stroke-dasharray-by-percentage trick:
            we draw the full gradient arc and slide a mask via dasharray */}
        <ActiveArc value={displayValue} />

        {/* Tick marks at 0/50/100 */}
        {[0, 50, 100].map((t) => {
          const inner = polarToCartesian(CX, CY, ARC_RADIUS - ARC_STROKE / 2 - 4, (t / 100) * 180)
          const outer = polarToCartesian(CX, CY, ARC_RADIUS + ARC_STROKE / 2 + 4, (t / 100) * 180)
          return (
            <line
              key={t}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="currentColor"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
          )
        })}

        {/* Needle */}
        <motion.line
          x1={CX} y1={CY}
          x2={CX} y2={CY - ARC_RADIUS + 6}
          stroke="#facc15"
          strokeWidth="2.4"
          strokeLinecap="round"
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            rotate: needleAngle,
          }}
        />
        <circle cx={CX} cy={CY} r="4" fill="#facc15" />
      </svg>

      {showReadout && (
        <div className="mt-1 flex flex-col items-center gap-0.5">
          <span className="font-display text-[0.6rem] uppercase tracking-[0.2em] text-white/50">
            {label}
          </span>
          <span className={cn('font-display text-sm font-semibold tracking-wide', desc.tone)}>
            {desc.label}
          </span>
        </div>
      )}
    </div>
  )
}

function ActiveArc({ value }: { value: number }) {
  // Approximate arc length: half-circle of radius ARC_RADIUS = π·r
  const len = Math.PI * ARC_RADIUS
  const visible = (Math.max(0, Math.min(100, value)) / 100) * len
  return (
    <path
      d={FULL_ARC}
      fill="none"
      stroke="url(#dispoArc)"
      strokeWidth={ARC_STROKE}
      strokeLinecap="round"
      strokeDasharray={`${visible} ${len}`}
    />
  )
}
