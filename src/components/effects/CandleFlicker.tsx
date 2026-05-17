'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type CandleFlickerProps = React.HTMLAttributes<HTMLSpanElement> & {
  as?: 'span' | 'div'
  intensity?: 'soft' | 'sharp'
  children: React.ReactNode
}

export function CandleFlicker({
  as = 'span',
  intensity = 'sharp',
  className,
  children,
  ...rest
}: CandleFlickerProps) {
  const Tag = as
  return (
    <Tag
      className={cn(
        intensity === 'sharp' ? 'animate-candle-flicker' : 'animate-torch-glow',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
