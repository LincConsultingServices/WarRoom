'use client'

import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import type { SimOption } from '@/src/types'

interface BudgetAllocationQuestionProps {
  options: SimOption[]
  capital: number
  allocations: Record<string, number>
  onChange: (optionId: string, value: number) => void
}

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toLocaleString('en-US')}`
}

export function BudgetAllocationQuestion({
  options,
  capital,
  allocations,
  onChange,
}: BudgetAllocationQuestionProps) {
  const totalAllocated = Object.values(allocations).reduce((s, v) => s + v, 0)
  const isComplete = totalAllocated === capital
  const isExceeded = totalAllocated > capital

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground mb-2">
        Allocate your budget of {formatRevenue(capital)} across categories.
      </div>
      {options.map((opt) => {
        const val = allocations[opt.id] || 0
        return (
          <div key={opt.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{opt.text}</span>
              <span className="font-mono font-medium text-primary">{formatRevenue(val)}</span>
            </div>
            <Slider
              value={[val]}
              onValueChange={([v]) => onChange(opt.id, v)}
              max={capital}
              step={capital / 20} // 5% increments
              className="w-full"
            />
          </div>
        )
      })}
      <div className={cn(
        'text-sm font-medium text-center p-2 rounded-lg',
        isComplete ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
        isExceeded ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
        'bg-muted text-muted-foreground'
      )}>
        Total: {formatRevenue(totalAllocated)} {isComplete ? '✓' : isExceeded ? `(exceeds ${formatRevenue(capital)})` : `(${formatRevenue(capital - totalAllocated)} remaining)`}
      </div>
    </div>
  )
}
