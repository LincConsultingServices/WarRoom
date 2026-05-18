'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SigilTone = 'gold' | 'crimson' | 'verdant' | 'amethyst'

export interface SigilBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: LucideIcon
  tone?: SigilTone
  children: ReactNode
}

const TONE_STYLES: Record<SigilTone, string> = {
  gold:
    'bg-[color:var(--color-warroom-gold)]/[0.10] text-[color:var(--color-warroom-gold)] border-[color:var(--color-warroom-gold)]/30',
  crimson:
    'bg-[color:var(--color-warroom-crimson)]/[0.15] text-[color:var(--color-warroom-crimson-bright)] border-[color:var(--color-warroom-crimson)]/35',
  verdant:
    'bg-[color:var(--color-warroom-verdant)]/[0.15] text-[color:var(--color-warroom-verdant)] border-[color:var(--color-warroom-verdant)]/35',
  amethyst:
    'bg-[color:var(--color-warroom-amethyst)]/[0.15] text-[color:var(--color-warroom-amethyst)] border-[color:var(--color-warroom-amethyst)]/35',
}

/**
 * <SigilBadge /> — small house-banner chip used for section labels
 * ("The Trial", "The Council") and status pills.
 */
export const SigilBadge = forwardRef<HTMLSpanElement, SigilBadgeProps>(
  function SigilBadge(
    { icon: Icon, tone = 'gold', children, className, ...rest },
    ref,
  ) {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
          'rounded-[2px] border whitespace-nowrap',
          TONE_STYLES[tone],
          className,
        )}
        style={{ fontFamily: 'var(--font-display)' }}
        {...rest}
      >
        {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden />}
        {children}
      </span>
    )
  },
)
