'use client'

import { Textarea } from '@/components/ui/textarea'

interface OpenTextQuestionProps {
  value: string
  onChange: (text: string) => void
  placeholder?: string
  rows?: number
}

export function OpenTextQuestion({
  value,
  onChange,
  placeholder = 'Type your response here...',
  rows = 6,
}: OpenTextQuestionProps) {
  return (
    <Textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="resize-none"
    />
  )
}
