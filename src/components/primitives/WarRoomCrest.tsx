'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { easeDramatic } from '@/lib/animations/variants'

export interface WarRoomCrestProps {
  size?: number
  className?: string
  /** Disable mount animation. */
  staticRender?: boolean
}

/**
 * <WarRoomCrest /> — the inline SVG sigil for the WarRoom brand.
 *
 * Stylized crown with crossed swords and a "KK" monogram at center.
 * Pure SVG — no asset dependency. Designed to look intentional even
 * before bespoke art lands.
 */
export function WarRoomCrest({
  size = 120,
  className,
  staticRender,
}: WarRoomCrestProps) {
  const prefersReducedMotion = useReducedMotion()
  const animate = !staticRender && !prefersReducedMotion

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn('inline-block select-none', className)}
      role="img"
      aria-label="WarRoom crest"
      initial={animate ? { opacity: 0, y: -8, scale: 0.92 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: easeDramatic }}
    >
      <defs>
        <linearGradient id="crest-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0c040" />
          <stop offset="55%" stopColor="#c9962a" />
          <stop offset="100%" stopColor="#8b6914" />
        </linearGradient>
        <radialGradient id="crest-glow" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="rgba(240,192,64,0.35)" />
          <stop offset="60%" stopColor="rgba(240,192,64,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* Glow halo */}
      <circle cx="50" cy="55" r="46" fill="url(#crest-glow)" />

      {/* Outer ring */}
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="url(#crest-gold)"
        strokeWidth="1"
        opacity="0.6"
      />
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="url(#crest-gold)"
        strokeWidth="0.6"
        opacity="0.4"
      />

      {/* Crossed swords */}
      <g stroke="url(#crest-gold)" strokeWidth="1.6" strokeLinecap="round" fill="none">
        {/* Sword 1: top-left to bottom-right */}
        <line x1="22" y1="22" x2="78" y2="78" />
        {/* Sword 2: top-right to bottom-left */}
        <line x1="78" y1="22" x2="22" y2="78" />
      </g>
      {/* Hilts (small rectangles at the top of each sword) */}
      <g fill="url(#crest-gold)">
        <rect
          x="17"
          y="15"
          width="10"
          height="2.2"
          transform="rotate(45 22 22)"
        />
        <rect
          x="73"
          y="15"
          width="10"
          height="2.2"
          transform="rotate(-45 78 22)"
        />
      </g>

      {/* Crown — five points across the top */}
      <g fill="url(#crest-gold)" stroke="url(#crest-gold)" strokeWidth="0.4">
        <polygon points="34,30 38,18 42,30" />
        <polygon points="42,30 46,14 50,30" />
        <polygon points="50,30 54,11 58,30" />
        <polygon points="58,30 62,14 66,30" />
        <polygon points="66,30 70,18 74,30" />
        <rect x="32" y="29" width="44" height="3.5" />
        {/* Three jewel dots on the crown band */}
        <circle cx="40" cy="31" r="0.8" fill="#0a0805" />
        <circle cx="54" cy="31" r="0.8" fill="#0a0805" />
        <circle cx="68" cy="31" r="0.8" fill="#0a0805" />
      </g>

      {/* Central shield */}
      <path
        d="M 36 44 Q 36 41 39 41 L 61 41 Q 64 41 64 44 L 64 60 Q 64 70 50 76 Q 36 70 36 60 Z"
        fill="rgba(10,8,5,0.85)"
        stroke="url(#crest-gold)"
        strokeWidth="1.1"
      />

      {/* KK monogram */}
      <text
        x="50"
        y="61"
        textAnchor="middle"
        fill="url(#crest-gold)"
        fontSize="14"
        fontWeight="700"
        style={{ fontFamily: 'var(--font-display-decorative, var(--font-display))' }}
      >
        KK
      </text>
    </motion.svg>
  )
}
