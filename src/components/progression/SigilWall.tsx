'use client'

// ============================================
// <SigilWall /> — the founder's achievements. Earned sigils render in
// their rarity colour; unearned ones show as locked silhouettes (with
// the feat description) so they read as aspirational, not absent.
// ============================================

import { cn } from '@/lib/utils'
import type { EarnedSigil } from '@/src/types'
import { SIGILS, SIGIL_TIER_COLOR } from '@/src/lib/progression'
import { SigilCrest, iconForSigil } from './SigilCrest'

export interface SigilWallProps {
  earned: EarnedSigil[]
  crestSize?: number
  className?: string
}

export function SigilWall({ earned, crestSize = 64, className }: SigilWallProps) {
  const earnedMap = new Map(earned.map((e) => [e.id, e]))

  return (
    <div
      className={cn('grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-4', className)}
    >
      {SIGILS.map((sigil) => {
        const got = earnedMap.get(sigil.id)
        const locked = !got
        const tier = got?.tier ?? sigil.tier
        const style = SIGIL_TIER_COLOR[tier]
        return (
          <div key={sigil.id} className="flex flex-col items-center gap-2 text-center">
            <SigilCrest
              icon={iconForSigil(sigil.id)}
              size={crestSize}
              primary={style.base}
              secondary={style.bright}
              iconColor={style.bright}
              locked={locked}
              title={`${sigil.name} — ${sigil.description}`}
            />
            <div className="flex min-h-[2.5rem] flex-col">
              <span
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-[0.1em]',
                  locked
                    ? 'text-[color:var(--color-warroom-smoke)]/70'
                    : 'text-[color:var(--color-warroom-ghost)]',
                )}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {sigil.name}
              </span>
              <span className="mt-0.5 text-[10px] leading-snug text-[color:var(--color-warroom-smoke)]/70">
                {locked ? sigil.description : style.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
