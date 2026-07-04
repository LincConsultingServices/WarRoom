'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================
// <QuestionWordReveal /> — animates the investor's question in
// word-by-word as the speaking gif/video plays. Each word fades
// up + clip-reveals so the line feels SPOKEN rather than pasted.
//
// `key` should change when the question text changes — re-mount
// is what drives the re-animation. The parent owns that.
// ============================================================

interface QuestionWordRevealProps {
  text: string
  /** ms between each word entering. Default 60ms. */
  staggerMs?: number
  /** Per-word reveal duration. Default 450ms. */
  durationMs?: number
  className?: string
}

export function QuestionWordReveal({
  text,
  staggerMs = 60,
  durationMs = 450,
  className,
}: QuestionWordRevealProps) {
  const reducedMotion = useReducedMotion()
  const words = text.split(/\s+/).filter(Boolean)

  if (reducedMotion) {
    return <span className={cn('inline-block', className)}>{text}</span>
  }

  return (
    <span className={cn('inline-block', className)} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 8, clipPath: 'inset(0 100% 0 0)' }}
          animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0% 0 0)' }}
          transition={{
            delay: (i * staggerMs) / 1000,
            duration: durationMs / 1000,
            ease: [0.22, 0.61, 0.36, 1],
          }}
          className="mr-[0.32em] inline-block"
          aria-hidden
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}
