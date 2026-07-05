'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { QuestionWordReveal } from './QuestionWordReveal'

// ============================================================
// <QuestionCard /> — the ivory-on-stone slab that holds the
// active investor's question. Subtle gold shimmer on the top
// edge, optional emblem watermark, and the word-reveal animation
// inside.
//
// Composition:
//   <QuestionCard
//     investorName="Mira"
//     emblemUrl="/investors/mira/emblem.svg"   // optional
//     label="The mirror of identity asks:"
//     audioSlot={<QuestionAudioPlayer ... />}
//   >
//     {questionText}
//   </QuestionCard>
//
// The actual reveal animation is delegated to QuestionWordReveal;
// this card owns chrome, framing, emblem, and the audio-player slot.
// ============================================================

interface QuestionCardProps {
  investorName: string
  questionText: string
  /** Pre-text label like "The Queen of Coin asks:" */
  label?: string
  /** Optional emblem watermark URL (svg/png). */
  emblemUrl?: string | null
  /** Slot for the per-investor audio player (TTS). */
  audioSlot?: React.ReactNode
  className?: string
  /** Re-mount key — change this when the question changes so the
   *  word reveal re-fires. Defaults to questionText itself. */
  revealKey?: string | number
  staggerMs?: number
}

export function QuestionCard({
  investorName,
  questionText,
  label,
  emblemUrl = null,
  audioSlot,
  className,
  revealKey,
  staggerMs = 60,
}: QuestionCardProps) {
  const reducedMotion = useReducedMotion()
  const key = revealKey ?? questionText

  return (
    <motion.article
      key={key}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-md border border-[color:var(--color-chessboard-gold)]/30 bg-card/80 p-5 backdrop-blur-sm',
        'shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(200,168,74,0.1)]',
        'noise-overlay',
        className,
      )}
      style={{
        // Parchment-on-stone slab: aged vellum grain under a warm-dark wash that
        // keeps gold + ivory copy fully legible.
        backgroundImage:
          'var(--wr-ivory-wash), url("/assets/images/textures/ivory.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      aria-label={label ? `${label} ${questionText}` : questionText}
    >
      {/* Top-edge shimmer accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(200,168,74,0.55), transparent)',
        }}
      />

      {/* Emblem watermark */}
      {emblemUrl && (
        <Image
          src={emblemUrl}
          alt=""
          width={176}
          height={176}
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -bottom-8 opacity-[0.06]"
          draggable={false}
        />
      )}

      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-display text-[0.6rem] uppercase tracking-[0.22em] text-[color:var(--color-chessboard-gold)]/90">
            {label ?? `${investorName} asks`}
          </span>
        </div>
        {audioSlot && <div className="flex-shrink-0">{audioSlot}</div>}
      </header>

      <p className="font-display text-lg leading-relaxed text-foreground sm:text-xl">
        <span className="text-[color:var(--color-chessboard-gold)]">&ldquo;</span>
        <QuestionWordReveal text={questionText} staggerMs={staggerMs} />
        <span className="text-[color:var(--color-chessboard-gold)]">&rdquo;</span>
      </p>
    </motion.article>
  )
}
