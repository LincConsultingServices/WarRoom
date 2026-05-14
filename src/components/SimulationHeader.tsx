'use client'

import { Progress } from '@/components/ui/progress'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StageTimerResult } from '@/src/hooks/useStageTimer'

interface SimulationHeaderProps {
  stageName: string
  progressLabel?: string  // e.g. "Q2 of 5" or "3/7 answered"
  progressPct: number
  timer?: StageTimerResult
  showTimer?: boolean
  isCrisis?: boolean
  accent?: string
  rightSlot?: React.ReactNode
}

export function SimulationHeader({
  stageName,
  progressLabel,
  progressPct,
  timer,
  showTimer = true,
  isCrisis,
  accent = '#6366f1',
  rightSlot,
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
          <span style={{ color: accent }} className="font-medium">{stageName}</span>
          {progressLabel && (
            <>
              <span className="mx-2 text-muted-foreground/40">|</span>
              <span>{progressLabel}</span>
            </>
          )}
        </div>
        <Progress value={progressPct} className="h-1 mt-1" />
      </div>

      {isCrisis && <span className="danger-pulse-dot" title="High-pressure scenario" />}

      {rightSlot}

      {showTimer && timer && (
        <div
          className={cn(
            'flex items-center gap-1.5 text-sm font-mono flex-shrink-0 px-3 py-1 rounded-lg',
            timer.isWarning ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-muted'
          )}
        >
          <Clock className="h-4 w-4" />
          <span>{timer.display}</span>
        </div>
      )}
    </header>
  )
}
