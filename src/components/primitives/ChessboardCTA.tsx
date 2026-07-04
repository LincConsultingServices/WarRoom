'use client'

import { forwardRef, type ReactNode, type MouseEvent } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { audioManager, type SfxKey } from '@/lib/audio/audioManager'

type ChessboardCTASize = 'sm' | 'md' | 'lg'
type ChessboardCTAVariant = 'primary' | 'ghost'
type MotionButtonProps = HTMLMotionProps<'button'>

export interface ChessboardCTAProps extends Omit<MotionButtonProps, 'children' | 'ref'> {
  size?: ChessboardCTASize
  variant?: ChessboardCTAVariant
  icon?: LucideIcon
  iconRight?: LucideIcon
  sfxKey?: SfxKey
  children: ReactNode
  className?: string
}

const SIZE_CLASSES: Record<ChessboardCTASize, string> = {
  sm: 'px-5 py-2.5 text-xs',
  md: 'px-7 py-3.5 text-sm',
  lg: 'px-10 py-5 text-base',
}

const CORNER_SIZE: Record<ChessboardCTASize, number> = { sm: 6, md: 8, lg: 10 }

/**
 * <ChessboardCTA /> — premium chess-themed action button.
 * Charcoal base with muted gold border and corner embellishments.
 */
export const ChessboardCTA = forwardRef<HTMLButtonElement, ChessboardCTAProps>(
  function ChessboardCTA(
    {
      size = 'md',
      variant = 'primary',
      icon: Icon,
      iconRight: IconRight,
      sfxKey = 'ui.click',
      onClick,
      className,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      audioManager.playSfx(sfxKey)
      onClick?.(e)
    }

    const corner = CORNER_SIZE[size]

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        onClick={handleClick}
        className={cn(
          'relative inline-flex items-center justify-center gap-2.5 font-bold uppercase tracking-[0.08em] select-none',
          'border rounded-[3px] overflow-visible',
          SIZE_CLASSES[size],
          variant === 'primary' && [
            'text-[color:var(--btn-primary-text)]',
            'border-[color:var(--color-chessboard-gold)]/40',
            'shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]',
          ],
          variant === 'ghost' && [
            'text-[color:var(--color-chessboard-silver)] border-[color:var(--color-chessboard-gold)]/25 bg-[color:var(--color-chessboard-gold)]/[0.04]',
            'hover:border-[color:var(--color-chessboard-gold)]/45 hover:text-[color:var(--color-chessboard-ivory)]',
          ],
          className,
        )}
        style={{
          fontFamily: 'var(--font-display)',
          ...(variant === 'primary'
            ? {
                background: 'var(--btn-primary-bg)',
                backgroundSize: '200% 100%',
              }
            : {}),
        }}
        {...rest}
      >
        <CornerOrnament position="tl" size={corner} variant={variant} />
        <CornerOrnament position="tr" size={corner} variant={variant} />
        <CornerOrnament position="bl" size={corner} variant={variant} />
        <CornerOrnament position="br" size={corner} variant={variant} />

        {Icon && <Icon className="h-[1.1em] w-[1.1em] shrink-0" aria-hidden />}
        <span>{children}</span>
        {IconRight && <IconRight className="h-[1.1em] w-[1.1em] shrink-0" aria-hidden />}
      </motion.button>
    )
  },
)

type CornerPosition = 'tl' | 'tr' | 'bl' | 'br'

function CornerOrnament({ position, size, variant }: { position: CornerPosition; size: number; variant: ChessboardCTAVariant }) {
  const color = variant === 'primary' ? 'rgba(200,168,74,0.55)' : 'var(--color-chessboard-gold)'
  const offset = -2
  const styles: React.CSSProperties = { position: 'absolute', width: size, height: size, borderColor: color, pointerEvents: 'none' }

  if (position === 'tl') { styles.top = offset; styles.left = offset; styles.borderTop = `1px solid ${color}`; styles.borderLeft = `1px solid ${color}` }
  else if (position === 'tr') { styles.top = offset; styles.right = offset; styles.borderTop = `1px solid ${color}`; styles.borderRight = `1px solid ${color}` }
  else if (position === 'bl') { styles.bottom = offset; styles.left = offset; styles.borderBottom = `1px solid ${color}`; styles.borderLeft = `1px solid ${color}` }
  else { styles.bottom = offset; styles.right = offset; styles.borderBottom = `1px solid ${color}`; styles.borderRight = `1px solid ${color}` }

  return <span aria-hidden style={styles} />
}
