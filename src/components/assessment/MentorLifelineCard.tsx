'use client'

import { MessageSquare, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MentorLifelineCardProps {
  lifelinesLeft: number
  onAskMentor: () => void
}

export function MentorLifelineCard({
  lifelinesLeft,
  onAskMentor,
}: MentorLifelineCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Mentor Lifelines</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                i < lifelinesLeft ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {lifelinesLeft} left
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs"
        disabled={lifelinesLeft <= 0}
        onClick={onAskMentor}
      >
        {lifelinesLeft > 0 ? (
          <>
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Ask a Mentor
          </>
        ) : (
          'No lifelines left'
        )}
      </Button>
    </div>
  )
}
