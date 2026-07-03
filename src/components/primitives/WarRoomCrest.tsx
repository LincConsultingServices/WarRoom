'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { easeDramatic } from '@/lib/animations/variants'
import { ASSET_REGISTRY } from '@/lib/assets/assetRegistry'

export interface WarRoomCrestProps {
  size?: number
  className?: string
  staticRender?: boolean
}

const CREST_SRC = ASSET_REGISTRY.crests.warroom

/**
 * <WarRoomCrest /> — Chess king emblem for the WarRoom brand.
 * Pure SVG fallback — no asset dependency.
 */
export function WarRoomCrest({ size = 120, className, staticRender }: WarRoomCrestProps) {
  const prefersReducedMotion = useReducedMotion()
  const animate = !staticRender && !prefersReducedMotion

  const [crestLoaded, setCrestLoaded] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    const img = new Image()
    img.onload = () => { if (!cancelled) setCrestLoaded(true) }
    img.onerror = () => { if (!cancelled) setCrestLoaded(false) }
    img.src = CREST_SRC
    return () => { cancelled = true }
  }, [])

  if (crestLoaded) {
    return (
      <motion.img
        src={CREST_SRC}
        alt="WarRoom crest"
        width={size}
        height={size}
        className={cn('inline-block select-none', className)}
        initial={animate ? { opacity: 0, y: -8, scale: 0.92 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: easeDramatic }}
      />
    )
  }

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
          <stop offset="0%" stopColor="#e0c870" />
          <stop offset="55%" stopColor="#c8a84a" />
          <stop offset="100%" stopColor="#8a7030" />
        </linearGradient>
        <radialGradient id="crest-glow" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="rgba(200,168,74,0.25)" />
          <stop offset="60%" stopColor="rgba(200,168,74,0.06)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* Glow halo */}
      <circle cx="50" cy="55" r="46" fill="url(#crest-glow)" />

      {/* Outer rings */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="url(#crest-gold)" strokeWidth="1" opacity="0.5" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="url(#crest-gold)" strokeWidth="0.5" opacity="0.3" />

      {/* Chess board accent — 4 small squares */}
      <g fill="url(#crest-gold)" opacity="0.25">
        <rect x="20" y="20" width="6" height="6" />
        <rect x="26" y="26" width="6" height="6" />
        <rect x="68" y="20" width="6" height="6" />
        <rect x="62" y="26" width="6" height="6" />
      </g>

      {/* Chess King piece */}
      <g fill="url(#crest-gold)" stroke="url(#crest-gold)" strokeWidth="0.3">
        {/* Cross top */}
        <rect x="47" y="14" width="6" height="14" rx="1" />
        <rect x="43" y="18" width="14" height="6" rx="1" />
        {/* Neck */}
        <rect x="45" y="28" width="10" height="4" rx="1" />
        {/* Body */}
        <path d="M 36 32 Q 36 30 38 30 L 62 30 Q 64 30 64 32 L 68 62 Q 68 66 64 66 L 36 66 Q 32 66 32 62 Z" />
        {/* Base */}
        <rect x="30" y="66" width="40" height="6" rx="2" />
        <rect x="28" y="72" width="44" height="4" rx="2" />
      </g>

      {/* KK monogram on body */}
      <text
        x="50"
        y="54"
        textAnchor="middle"
        fill="rgba(8,8,8,0.85)"
        fontSize="13"
        fontWeight="800"
        style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
      >
        KK
      </text>
    </motion.svg>
  )
}
