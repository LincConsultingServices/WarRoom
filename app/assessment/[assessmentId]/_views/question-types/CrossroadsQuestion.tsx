'use client'

import { motion } from 'framer-motion'
import { Handshake } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChessboardCrest } from '@/src/components/primitives/ChessboardCrest'
import type { SimOption } from '@/src/types'

// ============================================
// CrossroadsQuestion — the Stage 3 buyout fork.
//
// The backend serves this as a plain `multiple_choice` question whose two
// options read as long sentences ("AGREE TO BUY OUT DEAL - Sell the business
// now and exit."). Rendered through the generic MCQ list they look like any
// other throwaway pick, when this is the single branch point of the run.
//
// This view presents the same two options — same ids, same contract — as two
// side-by-side gates: the War Room on the left under its crest, the exit on
// the right. Option ids drive the layout, so the copy in simulation.json can
// change freely without breaking it.
// ============================================

const WARROOM_OPTION_ID = 'Q_3_DECISION_WARROOM'
const BUYOUT_OPTION_ID = 'Q_3_DECISION_BUYOUT'

const CROSSROADS_META: Record<string, { title: string; tagline: string }> = {
  [WARROOM_OPTION_ID]: {
    title: 'Enter the War Room',
    tagline: 'Walk out of the deal and pitch the Council for growth capital.',
  },
  [BUYOUT_OPTION_ID]: {
    title: 'Sell & Exit',
    tagline: 'Accept the buyout, bank the win, and close the board.',
  },
}

// Display order — the War Room gate always sits first.
const DISPLAY_ORDER = [WARROOM_OPTION_ID, BUYOUT_OPTION_ID]

/** True when this question is the buyout / War Room fork. */
export function isCrossroadsQuestion(options: SimOption[]): boolean {
  const ids = new Set(options.map(o => o.id))
  return DISPLAY_ORDER.every(id => ids.has(id))
}

interface CrossroadsQuestionProps {
  options: SimOption[]
  selectedOptionId?: string
  mcqFeedback?: string | null
  onSelect: (opt: SimOption) => void
}

export function CrossroadsQuestion({ options, selectedOptionId, mcqFeedback, onSelect }: CrossroadsQuestionProps) {
  const ordered = DISPLAY_ORDER
    .map(id => options.find(o => o.id === id))
    .filter((o): o is SimOption => Boolean(o))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ordered.map((opt, idx) => {
          const meta = CROSSROADS_META[opt.id]
          const isSelected = selectedOptionId === opt.id
          const isWarRoom = opt.id === WARROOM_OPTION_ID
          return (
            <motion.button
              key={opt.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(opt)}
              aria-pressed={isSelected}
              className={cn(
                'group relative flex flex-col items-center text-center gap-3 rounded-2xl border-2 px-5 py-6 transition-colors',
                isSelected
                  ? 'border-[color:var(--color-chessboard-gold)] bg-[color:var(--color-chessboard-gold)]/[0.08] shadow-[0_0_18px_rgba(200,168,74,0.18)]'
                  : 'border-[color:var(--color-chessboard-gold)]/20 hover:border-[color:var(--color-chessboard-gold)]/55 hover:bg-[color:var(--color-chessboard-gold)]/[0.04]',
              )}
            >
              <div className="flex h-16 w-16 items-center justify-center">
                {isWarRoom ? (
                  <ChessboardCrest size={64} staticRender className={cn('transition-opacity', isSelected ? 'opacity-100' : 'opacity-75 group-hover:opacity-100')} />
                ) : (
                  <Handshake
                    className={cn(
                      'h-11 w-11 transition-opacity text-[color:var(--color-chessboard-gold)]',
                      isSelected ? 'opacity-100' : 'opacity-65 group-hover:opacity-90',
                    )}
                    strokeWidth={1.25}
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <div className={cn(
                  'text-base font-semibold uppercase tracking-[0.08em]',
                  isSelected ? 'text-[color:var(--color-chessboard-gold)]' : 'text-foreground',
                )}>
                  {meta.title}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{meta.tagline}</p>
              </div>

              {isSelected && (
                <motion.span
                  layoutId="crossroads-chosen"
                  className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[color:var(--color-chessboard-gold)]"
                >
                  Chosen
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      {mcqFeedback && selectedOptionId && (
        <div className="p-3 rounded-lg bg-[color:var(--color-chessboard-gold)]/[0.08] border border-[color:var(--color-chessboard-gold)]/30 text-sm text-foreground/85">
          <span className="font-medium">Mentor insight: </span>{mcqFeedback}
        </div>
      )}
    </div>
  )
}
