'use client'

import { Loader2, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeInUp } from '@/src/components/AnimatedComponents'
import { PhaseTransitionScenario } from '@/src/components/PhaseTransitionScenario'
import type { PhaseScenarioOut, LeaderboardEntry } from '@/src/types'

interface PhaseTransitionViewProps {
  phaseScenario: PhaseScenarioOut
  showRestartCheckpoint: boolean
  submitting: boolean
  revenue: number
  prevRevenue?: number
  entries: LeaderboardEntry[]
  userId?: string
  onScenarioSubmit: (response: string) => Promise<void>
  onRestart: () => void
  onContinue: () => void
}

export function PhaseTransitionView({
  phaseScenario, showRestartCheckpoint, submitting, revenue, prevRevenue,
  entries, userId, onScenarioSubmit, onRestart, onContinue,
}: PhaseTransitionViewProps) {
  return (
    <div className="min-h-screen bg-background">
      {submitting && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Processing...</p>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {showRestartCheckpoint ? (
          <FadeInUp className="space-y-8 bg-card border p-8 rounded-3xl shadow-xl">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Lightbulb className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">The Crossroads</h2>
              <p className="text-muted-foreground">You have laid the groundwork. Before you commit capital and enter the 60-minute execution phase, decide:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border rounded-2xl p-6 flex flex-col items-center text-center space-y-4 bg-muted/20">
                <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold">I need to rethink</h3>
                  <p className="text-xs text-muted-foreground">I found flaws in my idea. Restart from the beginning with a new concept.</p>
                </div>
                <div className="flex-1" />
                <Button variant="outline" className="w-full" onClick={onRestart} disabled={submitting}>Restart Simulation</Button>
              </div>

              <div className="border rounded-2xl p-6 flex flex-col items-center text-center space-y-4 bg-primary/5 border-primary/20">
                <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold">I am ready</h3>
                  <p className="text-xs text-muted-foreground">My idea is solid. I am ready to commit capital and build the business.</p>
                </div>
                <div className="flex-1" />
                <Button className="w-full" onClick={onContinue} disabled={submitting}>Continue to Execution</Button>
              </div>
            </div>
          </FadeInUp>
        ) : (
          <PhaseTransitionScenario
            scenario={phaseScenario}
            onSubmit={onScenarioSubmit}
            revenue={revenue}
            previousRevenue={prevRevenue}
            leaderboardEntries={entries}
            currentUserId={userId}
          />
        )}
      </div>
    </div>
  )
}
