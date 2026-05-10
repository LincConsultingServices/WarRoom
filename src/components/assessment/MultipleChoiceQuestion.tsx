'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { SimOption } from '@/src/types'

interface MultipleChoiceQuestionProps {
  options: SimOption[]
  selectedOptionId?: string
  onSelect: (opt: SimOption) => void
  mcqFeedback?: string | null
}

export function MultipleChoiceQuestion({
  options,
  selectedOptionId,
  onSelect,
  mcqFeedback,
}: MultipleChoiceQuestionProps) {
  return (
    <div className="space-y-3">
      {options.map((opt, optIdx) => {
        const isSelected = selectedOptionId === opt.id
        return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: optIdx * 0.05 }}
            whileHover={{ scale: 1.01, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(opt)}
            className={cn(
              'w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm',
              isSelected
                ? 'border-primary bg-primary/5 font-medium'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            {opt.text}
          </motion.button>
        )
      })}
      {mcqFeedback && selectedOptionId && (
        <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
          <span className="font-medium">Mentor insight: </span>
          {mcqFeedback}
        </div>
      )}
    </div>
  )
}
