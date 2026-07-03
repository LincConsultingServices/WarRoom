'use client'

// ============================================
// <LoreTip /> — the "codex" tooltip. Wraps a themed term and reveals a
// plain-language meaning on hover/focus, so the GoT metaphors stay
// atmospheric without sacrificing comprehension. Built on Floating UI
// (already a dependency); accessible (focusable, dismissible, role=tooltip).
// ============================================

import { useState, type ReactNode } from 'react'
import {
  useFloating,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  offset,
  flip,
  shift,
  autoUpdate,
  safePolygon,
  FloatingPortal,
} from '@floating-ui/react'
import { cn } from '@/lib/utils'

export interface LoreTipProps {
  /** Plain-language explanation shown in the tooltip. */
  tip: ReactNode
  children: ReactNode
  className?: string
}

export function LoreTip({ tip, children, className }: LoreTipProps) {
  const [open, setOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  const hover = useHover(context, { move: false, handleClose: safePolygon() })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role])

  return (
    <>
      <span
        ref={refs.setReference}
        tabIndex={0}
        {...getReferenceProps()}
        className={cn(
          'cursor-help underline decoration-dotted decoration-[color:var(--color-chessboard-gold)]/50 underline-offset-4 outline-none focus-visible:decoration-[color:var(--color-chessboard-gold)]',
          className,
        )}
      >
        {children}
      </span>
      {open && (
        <FloatingPortal>
          <div
            // Floating UI callback ref (a setter, not a `.current` read) — safe in render.
            // eslint-disable-next-line react-hooks/refs
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{ ...floatingStyles, fontFamily: 'var(--font-body, var(--font-display))' }}
            className="z-[70] max-w-[16rem] rounded-sm border border-[color:var(--color-chessboard-gold)]/35 bg-[color:var(--color-chessboard-black)]/95 px-3 py-2 text-xs leading-relaxed text-[color:var(--color-chessboard-ivory)] shadow-[0_8px_32px_rgba(0,0,0,0.7)] backdrop-blur-sm"
          >
            {tip}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
