'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { SimOption } from '@/src/types'

interface MCQQuestionProps {
  options: SimOption[]
  selectedOptionId?: string
  mcqFeedback?: string | null
  onSelect: (opt: SimOption) => void
}

export function MCQQuestion({ options, selectedOptionId, mcqFeedback, onSelect }: MCQQuestionProps) {
  return (
    <div className="space-y-3">
      {options.map((opt, idx) => {
        const isSelected = selectedOptionId === opt.id
        return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.01, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(opt)}
            className={cn(
              'w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm',
              isSelected ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            {opt.text}
          </motion.button>
        )
      })}
      {mcqFeedback && selectedOptionId && (
        <div className="mt-3 p-3 rounded-lg bg-[color:var(--color-warroom-gold)]/[0.08] border border-[color:var(--color-warroom-gold)]/30 text-sm text-[color:var(--color-warroom-ivory)]/85">
          <span className="font-medium">Mentor insight: </span>{mcqFeedback}
        </div>
      )}
    </div>
  )
}
