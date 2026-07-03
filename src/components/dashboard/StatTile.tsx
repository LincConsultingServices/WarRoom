'use client'

import { type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { easeDramatic } from '@/lib/animations/variants'

export interface StatTileProps {
  label: ReactNode
  value: ReactNode
  icon?: LucideIcon
  /** A short subtext (e.g. "+12% vs last run"). */
  hint?: string
  /** Top accent line color. Defaults to gold. */
  accent?: string
  className?: string
}

/**
 * <StatTile /> — a stone-card statistic tile.
 *
 * Layout: top accent rule, large monospace numeric value, small display font
 * label, optional icon and hint. Designed for the 2×2 dashboard grid.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  accent = 'var(--color-warroom-gold)',
  className,
}: StatTileProps) {
  const prefersReducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: easeDramatic }}
      className={cn('got-stone-card relative overflow-hidden p-5', className)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      <div className="flex items-start justify-between gap-3">
        <span
          className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-warroom-smoke)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {label}
        </span>
        {Icon && (
          <span
            className="rounded-sm p-1.5 border border-[color:var(--color-warroom-gold)]/20"
            style={{ background: `${accent}14` }}
          >
            <Icon
              className="h-3.5 w-3.5"
              style={{ color: accent }}
              aria-hidden
            />
          </span>
        )}
      </div>

      <div
        className="mt-3 text-3xl font-semibold text-[color:var(--color-warroom-ghost)] leading-none"
        style={{ fontFamily: 'var(--font-data, var(--font-mono))' }}
      >
        {value}
      </div>

      {hint && (
        <div
          className="mt-2 text-[10px] tracking-[0.08em] text-[color:var(--color-warroom-smoke)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {hint}
        </div>
      )}
    </motion.div>
  )
}
