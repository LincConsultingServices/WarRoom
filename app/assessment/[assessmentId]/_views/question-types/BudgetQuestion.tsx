'use client'

import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { formatRevenue, isAllocationComplete, sumAllocations } from '@/src/lib/helpers'
import type { SimOption } from '@/src/types'

interface BudgetQuestionProps {
  options: SimOption[]
  capital: number
  allocations: Record<string, number>
  onAllocate: (optionId: string, value: number) => void
}

export function BudgetQuestion({ options, capital, allocations, onAllocate }: BudgetQuestionProps) {
  const total = sumAllocations(allocations)
  const isComplete = isAllocationComplete(total, capital)
  const isExceeded = total > capital
  const remaining = Math.max(0, capital - total)
  // Slider granularity: 20 notches across the budget, never 0 (a 0 step makes
  // the slider unusable when capital hasn't loaded yet).
  const step = capital > 0 ? capital / 20 : 1

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground mb-2">Allocate your budget of {formatRevenue(capital)} across categories.</div>
      {options.map((opt: SimOption) => {
        const val = allocations[opt.id] || 0
        return (
          <div key={opt.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{opt.text}</span>
              <span className="font-mono font-medium text-primary">{formatRevenue(val)}</span>
            </div>
            {/* Clamp to what this category already holds plus what is still
                unspent, so the categories can never sum past the budget.
                Previously every slider ran to the full capital independently,
                letting six categories allocate six times the money. */}
            <Slider
              value={[val]}
              onValueChange={([v]) => onAllocate(opt.id, Math.min(v, val + remaining))}
              max={capital}
              step={step}
              className="w-full"
            />
          </div>
        )
      })}
      <div className={cn('text-sm font-medium text-center p-2 rounded-lg',
        isComplete ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
        isExceeded ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
        'bg-muted text-muted-foreground'
      )}>
        Total: {formatRevenue(total)} {isComplete ? '✓' : isExceeded ? `(exceeds ${formatRevenue(capital)})` : `(${formatRevenue(capital - total)} remaining)`}
      </div>
    </div>
  )
}
