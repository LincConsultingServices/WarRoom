'use client'

import { Clock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface SimulationHeaderProps {
  accent: string
  stageLabel: string
  currentQuestionIndex?: number
  totalQuestions: number
  answeredCount?: number
  progressValue: number
  isCrisisQuestion?: boolean
  showTimer: boolean
  timerDisplay: string
  isTimerWarning: boolean
}

export function SimulationHeader({
  accent,
  stageLabel,
  currentQuestionIndex,
  totalQuestions,
  answeredCount,
  progressValue,
  isCrisisQuestion,
  showTimer,
  timerDisplay,
  isTimerWarning,
}: SimulationHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur-md h-14 flex items-center px-4 gap-4"
      style={{ borderBottomColor: `${accent}40` }}
    >
      <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        KK
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">
          <span style={{ color: accent }} className="font-medium">
            {stageLabel}
          </span>
          <span className="mx-2 text-muted-foreground/40">|</span>
          <span>
            {currentQuestionIndex !== undefined
              ? `Q${currentQuestionIndex + 1} of ${totalQuestions}`
              : `${answeredCount} of ${totalQuestions} answered`}
          </span>
        </div>
        <Progress value={progressValue} className="h-1 mt-1" />
      </div>
      {isCrisisQuestion && (
        <span className="danger-pulse-dot" title="High-pressure scenario" />
      )}
      {showTimer && (
        <div
          className={cn(
            'flex items-center gap-1.5 text-sm font-mono flex-shrink-0 px-3 py-1 rounded-lg',
            isTimerWarning ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-muted'
          )}
        >
          <Clock className="h-4 w-4" />
          <span>{timerDisplay}</span>
        </div>
      )}
    </header>
  )
}
