'use client'

import React, { useRef } from 'react'
import { motion, AnimatePresence, useInView, type Variants } from 'framer-motion'

// ============================================
// FADE IN UP — Viewport-triggered fade + slide
// ============================================

interface FadeInUpProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
  y?: number
}

export function FadeInUp({ children, delay = 0, duration = 0.5, className, y = 24 }: FadeInUpProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// STAGGER GRID — Staggered entrance grid
// ============================================

interface StaggerGridProps {
  children: React.ReactNode
  className?: string
  stagger?: number
}

export function StaggerGrid({ children, className, stagger = 0.08 }: StaggerGridProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger } },
  }

  const item: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] } },
  }

  return (
    <motion.div ref={ref} variants={container} initial="hidden" animate={isInView ? 'show' : 'hidden'} className={className}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? <motion.div variants={item}>{child}</motion.div> : child
      )}
    </motion.div>
  )
}

// ============================================
// SCALE ON HOVER
// ============================================

interface ScaleOnHoverProps {
  children: React.ReactNode
  className?: string
  scale?: number
}

export function ScaleOnHover({ children, className, scale = 1.03 }: ScaleOnHoverProps) {
  return (
    <motion.div whileHover={{ scale, y: -4 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }} className={className}>
      {children}
    </motion.div>
  )
}

// ============================================
// FLOATING ANIMATION
// ============================================

interface FloatingProps {
  children: React.ReactNode
  className?: string
  duration?: number
  y?: number
}

export function Floating({ children, className, duration = 3, y = 10 }: FloatingProps) {
  return (
    <motion.div animate={{ y: [-y, y, -y] }} transition={{ duration, repeat: Infinity, ease: 'easeInOut' }} className={className}>
      {children}
    </motion.div>
  )
}

// ============================================
// SLIDE TRANSITION
// ============================================

interface SlideTransitionProps {
  children: React.ReactNode
  transitionKey: string | number
  direction?: 'left' | 'right'
  className?: string
}

export function SlideTransition({ children, transitionKey, direction = 'left', className }: SlideTransitionProps) {
  const xOffset = direction === 'left' ? 60 : -60
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, x: xOffset }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -xOffset }}
        transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
