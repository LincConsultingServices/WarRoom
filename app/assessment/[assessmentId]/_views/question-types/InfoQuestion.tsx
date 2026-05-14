'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InfoQuestionProps {
  contextText?: string
  isAcknowledged: boolean
  onAcknowledge: () => void
}

export function InfoQuestion({ contextText, isAcknowledged, onAcknowledge }: InfoQuestionProps) {
  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
        <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-2">INFORMATION</div>
        {contextText && <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{contextText}</p>}
      </motion.div>
      {!isAcknowledged && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={onAcknowledge} className="text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Got it — Continue
          </Button>
        </div>
      )}
    </div>
  )
}
