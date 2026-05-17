'use client'

import { cn } from '@/lib/utils'
import type { Investor } from '@/src/types'
import { CouncilMemberCard, type CouncilMood } from './CouncilMemberCard'

// ============================================================
// <CouncilRoster /> — right-panel stack of all council members.
//
// Renders one card per selected investor, with the currently-
// active member scaled up and glowing. Below `lg` the stack
// flips to a horizontal strip so the chamber stays usable on
// mobile.
//
// Mood map (`moods` prop) should come from `useCouncilMoods`
// (Phase 6 deliverable). Until that hook is built, callers can
// pass an empty object and every card defaults to "neutral".
// ============================================================

interface CouncilRosterProps {
  investors: Investor[]
  activeInvestorId: string | null
  moods?: Record<string, CouncilMood>
  className?: string
}

export function CouncilRoster({
  investors,
  activeInvestorId,
  moods = {},
  className,
}: CouncilRosterProps) {
  if (investors.length === 0) return null

  return (
    <aside
      className={cn(
        'flex h-full flex-col rounded-md border border-border/60 bg-card/50 p-3 backdrop-blur-sm',
        className,
      )}
      aria-label="War council roster"
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h3 className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60">
          The Council
        </h3>
        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-foreground/40">
          {investors.length} members
        </span>
      </header>

      {/* Desktop stack */}
      <div className="hidden flex-1 flex-col gap-2 overflow-y-auto pr-1 lg:flex">
        {investors.map((inv) => (
          <CouncilMemberCard
            key={inv.id}
            investor={inv}
            mood={moods[inv.id] ?? 'neutral'}
            isActive={inv.id === activeInvestorId}
          />
        ))}
      </div>

      {/* Mobile / tablet strip */}
      <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
        {investors.map((inv) => (
          <div key={inv.id} className="w-[68%] flex-shrink-0 sm:w-[44%] md:w-[30%]">
            <CouncilMemberCard
              investor={inv}
              mood={moods[inv.id] ?? 'neutral'}
              isActive={inv.id === activeInvestorId}
            />
          </div>
        ))}
      </div>
    </aside>
  )
}
