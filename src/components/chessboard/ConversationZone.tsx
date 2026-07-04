'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// <ConversationZone /> — center panel of the council chamber.
//
// Pure layout shell. Holds (Phase 4) the question card, the
// response input, and (Phase 5) the streaming feedback card.
//
// We expose three named slots so the page-level orchestrator
// stays in control of WHAT goes where, while we own the chrome
// and spacing that gives the chamber its proportions.
// ============================================================

interface ConversationZoneProps {
  question?: React.ReactNode
  response?: React.ReactNode
  feedback?: React.ReactNode
  /** Optional banner (e.g. "Council deliberates…") that overlays the slots. */
  overlay?: React.ReactNode
  className?: string
}

export function ConversationZone({
  question,
  response,
  feedback,
  overlay,
  className,
}: ConversationZoneProps) {
  return (
    <section
      className={cn(
        'relative flex h-full min-h-[480px] flex-col gap-4 rounded-md border border-border/60 bg-card/40 p-5 backdrop-blur-sm',
        className,
      )}
      aria-label="Pitch conversation"
    >
      {question && <div className="conversation-question">{question}</div>}
      {response && <div className="conversation-response flex-1">{response}</div>}
      {feedback && <div className="conversation-feedback">{feedback}</div>}
      {overlay && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto">{overlay}</div>
        </div>
      )}
    </section>
  )
}
