'use client'

import { useEffect, useRef, useState } from 'react'

// ============================================================
// useTypewriterReveal
// ----------------------------------------------------------------
// Faux-streaming text reveal. Backend returns the AI feedback
// all-at-once (no token streaming); this hook makes it FEEL like
// streaming by revealing one character at a time with rhetorical
// pauses at terminal punctuation.
//
// Why client-side: the existing Go backend hands back a complete
// JSON body. We can fake the cinematic streaming experience
// without ever touching backend internals.
//
// Behaviour:
//   • `fullText` changes  → restart reveal from 0.
//   • Returns `{ revealedText, isComplete, progress, skip() }`.
//   • `skip()` jumps to the end instantly (used by the "skip"
//     control when the founder wants the verdict NOW).
//   • Safe across unmounts — clears its timeout in cleanup.
// ============================================================

export interface TypewriterRevealOptions {
  /** ms-per-character. Default 22. */
  charDelayMs?: number
  /** Extra ms inserted after each sentence terminator. Default 180. */
  punctuationPauseMs?: number
  /** Extra ms after a comma. Default 60. */
  commaPauseMs?: number
  /** Skip animation entirely and reveal text in one beat. */
  instant?: boolean
}

export interface TypewriterRevealResult {
  revealedText: string
  isComplete: boolean
  /** 0..1 fraction of full text revealed. */
  progress: number
  /** Jump to the end. */
  skip: () => void
}

const TERMINATORS = new Set(['.', '!', '?'])

export function useTypewriterReveal(
  fullText: string,
  options: TypewriterRevealOptions = {},
): TypewriterRevealResult {
  const {
    charDelayMs = 22,
    punctuationPauseMs = 180,
    commaPauseMs = 60,
    instant = false,
  } = options

  const [revealedText, setRevealedText] = useState(instant ? fullText : '')
  const [isComplete, setIsComplete] = useState(instant && fullText.length > 0)
  const indexRef = useRef(instant ? fullText.length : 0)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    indexRef.current = 0
    let cancelled = false

    // Defer all state writes by one task tick so they're async with respect to
    // this effect body (keeps react-hooks/set-state-in-effect happy without
    // changing user-visible timing in any meaningful way).
    const kickoff = window.setTimeout(() => {
      if (cancelled) return

      if (instant || !fullText) {
        setRevealedText(fullText)
        setIsComplete(fullText.length > 0)
        return
      }

      setRevealedText('')
      setIsComplete(false)

      const tick = () => {
        if (cancelled) return
        const i = indexRef.current
        if (i >= fullText.length) {
          setIsComplete(true)
          return
        }
        indexRef.current = i + 1
        setRevealedText(fullText.slice(0, indexRef.current))
        const justRevealed = fullText[i]
        let delay = charDelayMs
        if (TERMINATORS.has(justRevealed)) delay += punctuationPauseMs
        else if (justRevealed === ',') delay += commaPauseMs
        timeoutRef.current = window.setTimeout(tick, delay)
      }
      timeoutRef.current = window.setTimeout(tick, charDelayMs)
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(kickoff)
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [fullText, charDelayMs, punctuationPauseMs, commaPauseMs, instant])

  const skip = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    indexRef.current = fullText.length
    setRevealedText(fullText)
    setIsComplete(true)
  }

  const progress = fullText.length === 0 ? 1 : revealedText.length / fullText.length

  return { revealedText, isComplete, progress, skip }
}
