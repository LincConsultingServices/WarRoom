'use client'

import { Loader2, MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Mentor, MentorLifelineResult } from '@/src/types'

interface MentorLifelineOverlayProps {
  show: boolean
  lifelinesLeft: number
  onClose: () => void
  mentorResult: MentorLifelineResult | null
  loadingConfig: boolean
  availableMentors: Mentor[]
  selectedMentorId: string
  setSelectedMentorId: (id: string) => void
  mentorQuestion: string
  setMentorQuestion: (q: string) => void
  mentorLoading: boolean
  onUseMentor: () => void
}

export function MentorLifelineOverlay({
  show,
  lifelinesLeft,
  onClose,
  mentorResult,
  loadingConfig,
  availableMentors,
  selectedMentorId,
  setSelectedMentorId,
  mentorQuestion,
  setMentorQuestion,
  mentorLoading,
  onUseMentor,
}: MentorLifelineOverlayProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Consult a Mentor</h3>
            <p className="text-xs text-muted-foreground">
              {lifelinesLeft} lifeline{lifelinesLeft !== 1 ? 's' : ''} remaining
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {mentorResult ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
              <div className="h-10 w-10 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-lg font-bold flex-shrink-0">
                {mentorResult.mentorName.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-sm">{mentorResult.mentorName}</div>
                <div className="text-xs text-muted-foreground">Mentor Guidance</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm leading-relaxed">
              {mentorResult.guidance}
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {mentorResult.lifelinesLeft} lifeline{mentorResult.lifelinesLeft !== 1 ? 's' : ''} remaining
            </div>
            <Button className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {loadingConfig && availableMentors.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Loading mentors...
              </div>
            ) : null}
            <div>
              <Label className="text-sm font-medium mb-2 block">Choose your mentor</Label>
              <div className="space-y-2">
                {availableMentors.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMentorId(m.id)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all text-sm',
                      selectedMentorId === m.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.specialization}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Your question (optional)</Label>
              <Textarea
                placeholder="What specific advice do you need? (Leave blank for general guidance)"
                value={mentorQuestion}
                onChange={(e) => setMentorQuestion(e.target.value)}
                rows={3}
                className="resize-none text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={onUseMentor}
                disabled={!selectedMentorId || mentorLoading || availableMentors.length === 0}
              >
                {mentorLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting advice...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Get Advice
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
