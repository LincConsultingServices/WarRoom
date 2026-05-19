'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================
// CINEMA OVERLAY — Full-screen dramatic transition
// ============================================

interface CinemaOverlayProps {
  show: boolean
  icon?: React.ReactNode
  title?: string
  subtitle?: string
}

export function CinemaOverlay({ show, icon, title, subtitle }: CinemaOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 backdrop-blur-xl flex flex-col items-center justify-center gap-5"
          style={{ background: 'radial-gradient(ellipse at center, rgba(10,8,6,0.97), rgba(5,4,3,0.99))' }}
        >
          {/* Ambient embers */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[0,1,2,3,4].map(i => (
              <motion.div key={i} className="absolute w-1 h-1 rounded-full"
                style={{ left: `${20 + i * 15}%`, bottom: '10%', background: '#ff6b00', boxShadow: '0 0 6px #ff6b00' }}
                animate={{ y: [0, -150], opacity: [0.8, 0], scale: [1, 0] }}
                transition={{ duration: 2 + i * 0.4, delay: i * 0.3, repeat: Infinity, ease: 'easeOut' }}
              />
            ))}
          </div>
          {icon && (
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
              {icon}
            </motion.div>
          )}
          {title && (
            <motion.h2
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.06em', color: '#c9a227', textShadow: '0 0 30px rgba(201,162,39,0.5)' }}
            >
              {title}
            </motion.h2>
          )}
          {subtitle && (
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
              style={{ fontSize: '0.8rem', color: '#8c8075', letterSpacing: '0.06em' }}
            >
              {subtitle}
            </motion.p>
          )}
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 1.5, ease: 'easeInOut' }}
            style={{ width: 200, height: 1, background: 'linear-gradient(90deg, transparent, #c9a227, transparent)', transformOrigin: 'center' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// STAGE NARRATION OVERLAY
// ============================================

interface StageNarrationData {
  month: string
  title: string
  desc: string
}

interface StageNarrationOverlayProps {
  show: boolean
  data: StageNarrationData
  stageIndex: number
  totalStages: number
  stageLabels: string[]
  accentColor?: string
  onDismiss: () => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function StageNarrationOverlay({ show, data, stageIndex, totalStages: _totalStages, stageLabels, accentColor = '#c9a227', onDismiss }: StageNarrationOverlayProps) {
  useEffect(() => {
    if (!show) return
    const timer = setTimeout(onDismiss, 6000)
    return () => clearTimeout(timer)
  }, [show, onDismiss])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[70] flex items-center justify-center cursor-pointer"
          style={{ background: 'radial-gradient(ellipse at center, rgba(10,8,6,0.97) 0%, rgba(5,4,3,0.99) 100%)' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ delay: 0.1, duration: 0.45, ease: 'easeOut' }}
            className="relative w-full h-full flex flex-col justify-center items-center px-5 py-7 sm:px-8 sm:py-9 text-center overflow-hidden"
            style={{
              background: `linear-gradient(145deg, hsl(var(--background) / 0.58), ${accentColor}14)`,
              boxShadow: `0 30px 70px -45px ${accentColor}`,
              backdropFilter: 'blur(18px)',
            }}
            onClick={onDismiss}
          >
            <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 20% 15%, ${accentColor}22, transparent 55%)` }} />
            <div className="relative flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-extrabold tracking-[0.15em] uppercase mb-6 border"
                style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}
              >
                {data.month}
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="text-3xl sm:text-5xl font-black tracking-tight mb-3"
                style={{ color: accentColor }}
              >
                {data.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5 }}
                className="text-muted-foreground max-w-xl leading-relaxed text-sm sm:text-base"
              >
                {data.desc}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                className="flex items-center gap-0 w-full max-w-xl mt-8"
              >
                {stageLabels.map((label, i) => (
                  <React.Fragment key={i}>
                    <div
                      className={cn('w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all duration-300', i === stageIndex ? 'scale-125' : '', i < stageIndex ? 'bg-emerald-500 border-emerald-500' : i === stageIndex ? 'border-[var(--active-color)] bg-[var(--active-color)]' : 'border-muted-foreground/20 bg-muted/30')}
                      style={{ '--active-color': accentColor } as React.CSSProperties}
                      title={label}
                    />
                    {i < stageLabels.length - 1 && <div className={cn('flex-1 h-0.5', i < stageIndex ? 'bg-emerald-500' : 'bg-muted-foreground/10')} />}
                  </React.Fragment>
                ))}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="flex justify-between w-full max-w-xl mt-1.5 px-0">
                {stageLabels.map((label, i) => (
                  <span key={i} className={cn('text-[8px] font-bold tracking-wider', i === stageIndex ? 'text-foreground' : i < stageIndex ? 'text-emerald-500/50' : 'text-muted-foreground/30')} style={i === stageIndex ? { color: accentColor } : undefined}>
                    {label}
                  </span>
                ))}
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="text-xs text-muted-foreground/50 mt-8 tracking-wide">
                Click anywhere or wait to continue...
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// SNAPSHOT DASHBOARD — Post-Stage Performance
// ============================================

interface SnapshotEntry {
  name: string
  score: number
  isUser: boolean
}

interface SnapshotDashboardProps {
  show: boolean
  revenue: number
  previousRevenue?: number
  leaderboardEntries: SnapshotEntry[]
  currentUserId?: string
  stageName: string
  onContinue: () => void
}

export function SnapshotDashboard({ show, revenue, previousRevenue, leaderboardEntries, stageName, onContinue }: SnapshotDashboardProps) {
  const revChange = previousRevenue && previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue * 100) : 0
  const isPositive = revChange >= 0

  function fmtRev(amount: number): string {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
    return `$${amount.toLocaleString()}`
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[65] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
            className="w-full max-w-lg space-y-5"
          >
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-3"
              style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.3)', color: '#c9a227', borderRadius: '2px', fontFamily: "'Cinzel', Georgia, serif", letterSpacing: '0.15em' }}>
              ⚔ Stage Complete ⚔
              </div>
              <h3 className="text-xl font-bold">{stageName}</h3>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className={cn('rounded-2xl border p-6 text-center bg-card', isPositive ? 'border-emerald-500/30' : 'border-red-500/30')}
            >
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Revenue Projection</p>
              <div className={cn('text-4xl font-black font-mono', isPositive ? 'text-emerald-500' : 'text-red-500')}>{fmtRev(revenue)}</div>
              {previousRevenue !== undefined && previousRevenue > 0 && (
                <div className={cn('flex items-center justify-center gap-1 mt-2 text-sm font-semibold', isPositive ? 'text-emerald-500' : 'text-red-500')}>
                  <span>{isPositive ? 'UP' : 'DOWN'}</span>
                  <span>{isPositive ? '+' : ''}{revChange.toFixed(1)}% from last stage</span>
                </div>
              )}
            </motion.div>

            {leaderboardEntries.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="rounded-2xl border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Leaderboard</p>
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>
                <div className="space-y-1">
                  {leaderboardEntries.slice(0, 6).map((entry, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                      className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm', entry.isUser ? 'bg-primary/5 border border-primary/20' : '')}
                    >
                      <span className="w-6 text-center font-bold text-xs" style={{ color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : undefined }}>
                        {i < 3 ? ['1st', '2nd', '3rd'][i] : `#${i + 1}`}
                      </span>
                      <span className="flex-1 truncate">
                        {entry.name}
                        {entry.isUser && <span className="ml-1 text-[10px] text-primary font-bold">(YOU)</span>}
                      </span>
                      <span className="font-mono text-xs font-bold text-muted-foreground">{entry.score.toFixed(0)}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onContinue}
                style={{ background: 'linear-gradient(135deg, #b8891e, #c9a227)', color: '#0a0806', border: '1px solid rgba(201,162,39,0.5)', borderRadius: '3px', padding: '10px 28px', fontFamily: "'Cinzel', Georgia, serif", fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: '0 4px 20px rgba(201,162,39,0.3)', cursor: 'pointer' }}
              >
                Continue →
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================
// MENTOR TIP POPUP
// ============================================

interface MentorTipPopupProps {
  show: boolean
  message: string
  emoji?: string
  onDismiss: () => void
  onAskMentor?: () => void
}

export function MentorTipPopup({ show, message, emoji = 'TIP', onDismiss, onAskMentor }: MentorTipPopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed bottom-24 right-6 z-[55] max-w-xs"
        >
          <div className="relative p-4 shadow-xl" style={{ background: 'rgba(17,14,10,0.95)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: '4px', backdropFilter: 'blur(16px)' }}>
            <button onClick={onDismiss} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-all">✕</button>
            <div className="flex items-start gap-3 pr-4">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="h-10 w-10 flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.25)', borderRadius: '50%' }}
              >
                {emoji}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#c9a227', fontFamily: "'Cinzel', Georgia, serif", letterSpacing: '0.15em' }}>📜 Mentor Scroll</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{message}</p>
              </div>
            </div>
            {onAskMentor && (
              <button onClick={() => { onDismiss(); onAskMentor() }} className="mt-3 w-full py-2 text-xs font-bold transition-all" style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.25)', color: '#c9a227', borderRadius: '2px', fontFamily: "'Cinzel', Georgia, serif", letterSpacing: '0.08em' }}>
                Use a Mentor Lifeline
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
