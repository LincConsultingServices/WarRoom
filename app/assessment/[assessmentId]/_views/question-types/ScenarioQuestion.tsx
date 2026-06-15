'use client'

import { Loader2, AlertTriangle, MessageSquare, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { FadeInUp } from '@/src/components/AnimatedComponents'
import type { SimOption } from '@/src/types'

interface ScenarioQuestionProps {
  options: SimOption[]
  selectedOptionId?: string
  mcqFeedback?: string | null
  loadingFollowup?: boolean
  followupScenario?: { question: string } | null
  followupError?: string
  followupText?: string
  onSelect: (opt: SimOption) => void
  onConfirmDecision: (opt: SimOption) => void
  onTextChange: (text: string) => void
  onRetryFollowup: (opt: SimOption) => void
}

export function ScenarioQuestion({
  options, selectedOptionId, mcqFeedback, loadingFollowup, followupScenario, followupError,
  followupText, onSelect, onConfirmDecision, onTextChange, onRetryFollowup,
}: ScenarioQuestionProps) {
  const selectedOpt = options.find(o => o.id === selectedOptionId)

  return (
    <div className="space-y-3">
      <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> Choose your decision wisely — this scenario tests your real-world judgment
      </div>
      {options.map((opt, idx) => {
        const isSelected = selectedOptionId === opt.id
        return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.01, x: 4 }} whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(opt)}
            className={cn('w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm flex flex-col', isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 font-medium' : 'border-border hover:border-amber-400/50 hover:bg-muted/30')}
          >
            <span>{opt.text}</span>
            {isSelected && opt.warning && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {opt.warning}
              </motion.div>
            )}
          </motion.button>
        )
      })}
      {mcqFeedback && selectedOptionId && !followupScenario && (
        <div className="mt-3 p-3 rounded-lg bg-[color:var(--color-warroom-gold)]/[0.08] border border-[color:var(--color-warroom-gold)]/30 text-sm text-[color:var(--color-warroom-ivory)]/85">
          <span className="font-medium">Mentor insight: </span>{mcqFeedback}
        </div>
      )}

      {/* Follow-up branching */}
      {selectedOptionId && (loadingFollowup || followupScenario || followupError) && (
        <FadeInUp className="mt-6 pl-4 border-l-2 border-amber-500/40 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Consequence</span>
          </div>
          {loadingFollowup ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
              <span className="text-sm italic text-amber-700 dark:text-amber-400">AI is developing the scenario consequence...</span>
            </div>
          ) : followupError ? (
            <div className="space-y-3">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-900 dark:text-red-100">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-red-600" /><span className="font-bold">Follow-up Failed</span></div>
                {followupError}
              </div>
              <Button variant="outline" onClick={() => selectedOpt && onRetryFollowup(selectedOpt)} className="w-full text-red-600 hover:bg-red-50">Retry Generating Consequence</Button>
            </div>
          ) : followupScenario && (
            <div className="space-y-3">
              <div className="p-4 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm font-medium leading-relaxed text-amber-900 dark:text-amber-100">{followupScenario.question}</div>
              <div className="pt-2">
                <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> How do you manage this consequence?</div>
                <Textarea placeholder="Type your strategic response here..." value={followupText || ''} onChange={e => onTextChange(e.target.value)} rows={4} className="resize-none text-sm" />
              </div>
            </div>
          )}
        </FadeInUp>
      )}

      {selectedOptionId && !loadingFollowup && !followupScenario && !followupError && (
        <FadeInUp className="mt-4 flex justify-end">
          <Button onClick={() => selectedOpt && onConfirmDecision(selectedOpt)} className="w-full sm:w-auto">
            Confirm Decision <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </FadeInUp>
      )}
    </div>
  )
}
