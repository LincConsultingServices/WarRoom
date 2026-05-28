'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface NoiseOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  opacity?: number
  blend?: 'overlay' | 'soft-light' | 'multiply' | 'screen'
}

export function NoiseOverlay({
  className,
  style,
  opacity = 0.06,
  blend = 'overlay',
  ...rest
}: NoiseOverlayProps) {
  // Prefer the generated PNG noise texture; the SVG fractal noise data-URL is
  // the layered fallback so anything missing on disk still renders something.
  const layeredBg = [
    'url("/assets/images/textures/noise.webp")',
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.79 0 0 0 0 0.64 0 0 0 0 0.16 0 0 0 0.7 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
  ].join(', ')

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        opacity,
        mixBlendMode: blend,
        backgroundImage: layeredBg,
        backgroundSize: '512px 512px, 160px 160px',
        backgroundRepeat: 'repeat, repeat',
        ...style,
      }}
      {...rest}
    />
  )
}
