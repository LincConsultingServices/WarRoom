'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// <CouncilChamberLayout /> — the 3-panel chamber grid.
//
// Desktop (lg+): three columns (3fr | 4fr | 3fr) with the active
// investor on the left, conversation in the middle, and the
// council roster on the right.
//
// Tablet / mobile: collapses to a single column: the roster
// becomes a horizontal strip ABOVE the active investor so the
// founder can still see who's in the room while they pitch.
//
// This component is purely structural — it owns ZERO business
// logic and renders its children as slots.
// ============================================================

interface CouncilChamberLayoutProps {
  activeInvestor: React.ReactNode
  conversation: React.ReactNode
  roster: React.ReactNode
  /** Optional banner mounted above the grid (timer, stage label, etc). */
  topBar?: React.ReactNode
  className?: string
}

export function CouncilChamberLayout({
  activeInvestor,
  conversation,
  roster,
  topBar,
  className,
}: CouncilChamberLayoutProps) {
  return (
    <div
      className={cn(
        'mx-auto flex h-full w-full max-w-[1480px] flex-col gap-4 px-3 py-4 md:px-6 md:py-6',
        className,
      )}
    >
      {topBar && <div className="flex-shrink-0">{topBar}</div>}
      <div
        className={cn(
          'grid flex-1 gap-4',
          // Below lg: roster on top, active + conversation stacked
          'grid-cols-1',
          // lg: 3-column chamber — left widened so the active investor's
          // portrait fills it as a cinematic full-bleed panel.
          'lg:grid-cols-[minmax(320px,4.5fr)_minmax(360px,4fr)_minmax(220px,2.5fr)]',
        )}
      >
        <div className="order-2 min-h-[420px] lg:order-1 lg:min-h-0">{activeInvestor}</div>
        <div className="order-3 min-h-[420px] lg:order-2 lg:min-h-0">{conversation}</div>
        <div className="order-1 min-h-[140px] lg:order-3 lg:min-h-0">{roster}</div>
      </div>
    </div>
  )
}
