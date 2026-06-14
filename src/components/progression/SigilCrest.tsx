'use client'

// ============================================
// <SigilCrest /> — procedural heater-shield crest (no image assets).
// Used for House crests (shape + palette) and achievement sigils
// (icon + rarity tier). The icon sits on a dark central medallion so
// it stays legible on any crest colour.
// ============================================

import { useId } from 'react'
import {
  Award, Bird, Castle, Coins, Crown, Flag, Flame, Footprints, Hammer,
  Handshake, Lock, MessageSquare, Scale, Shield, Sparkles, Star, Sword, Swords,
  Target, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SHIELD =
  'M50 4 C50 4 88 16 88 16 L88 52 C88 84 50 106 50 106 C50 106 12 84 12 52 L12 16 C12 16 50 4 50 4 Z'

/** Achievement sigil id → icon. */
export const ICON_BY_SIGIL: Record<string, LucideIcon> = {
  first_blood: Sword,
  the_committed: Flag,
  silver_tongue: MessageSquare,
  the_diplomat: Handshake,
  the_unbroken: Shield,
  master_of_coin: Coins,
  dragonslayer: Flame,
  natural_born: Star,
  the_phoenix: Bird,
  iron_will: Hammer,
  the_strategist: Target,
  polymath: Sparkles,
  the_sovereign: Crown,
  unanimous: Scale,
}

/** House crest shape id → icon. */
export const ICON_BY_HOUSE_SIGIL: Record<string, LucideIcon> = {
  blade: Swords,
  flame: Flame,
  tower: Castle,
  crown: Crown,
  wolf: Footprints,
  dragon: Bird,
}

export function iconForSigil(id: string): LucideIcon {
  return ICON_BY_SIGIL[id] ?? Award
}
export function iconForHouseSigil(id: string): LucideIcon {
  return ICON_BY_HOUSE_SIGIL[id] ?? Swords
}

export interface SigilCrestProps {
  icon: LucideIcon
  size?: number
  /** Main crest colour. */
  primary: string
  /** Gradient end (defaults to primary). */
  secondary?: string
  /** Icon tint (defaults to a bright parchment). */
  iconColor?: string
  locked?: boolean
  title?: string
  className?: string
}

export function SigilCrest({
  icon: Icon,
  size = 72,
  primary,
  secondary,
  iconColor,
  locked = false,
  title,
  className,
}: SigilCrestProps) {
  const gid = useId().replace(/:/g, '')
  const top = locked ? '#3a352c' : secondary ?? primary
  const mid = locked ? '#2a261e' : primary
  const stroke = locked ? '#4a4336' : secondary ?? primary
  const tint = locked ? '#6b6353' : iconColor ?? '#f3ead7'

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size * 1.1 }}
      role="img"
      aria-label={title}
      title={title}
    >
      <svg viewBox="0 0 100 110" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`crest-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={top} />
            <stop offset="52%" stopColor={mid} />
            <stop offset="100%" stopColor={top} />
          </linearGradient>
        </defs>
        <path
          d={SHIELD}
          fill={`url(#crest-${gid})`}
          stroke={stroke}
          strokeWidth="2.5"
          opacity={locked ? 0.55 : 1}
        />
        {/* top sheen */}
        <path
          d="M50 8 C50 8 84 19 84 19 L84 30 C70 22 30 22 16 30 L16 19 C16 19 50 8 50 8 Z"
          fill="rgba(255,255,255,0.14)"
        />
        {/* dark central medallion for icon legibility */}
        <circle cx="50" cy="56" r="23" fill="rgba(8,6,4,0.88)" stroke={stroke} strokeWidth="1.5" opacity={locked ? 0.6 : 1} />
      </svg>

      <Icon
        aria-hidden
        style={{
          width: size * 0.3,
          height: size * 0.3,
          color: tint,
          marginTop: size * 0.04,
          filter: locked ? 'none' : 'drop-shadow(0 0 6px rgba(0,0,0,0.5))',
        }}
      />

      {locked && (
        <span
          className="absolute -bottom-0.5 right-0 flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--color-warroom-gold)]/30 bg-[color:var(--color-warroom-black)]"
          aria-hidden
        >
          <Lock className="h-2.5 w-2.5 text-[color:var(--color-warroom-smoke)]" />
        </span>
      )}
    </div>
  )
}
