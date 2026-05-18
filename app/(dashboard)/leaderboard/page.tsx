'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Trophy, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LeaderboardPanel } from '@/src/components/LeaderboardPanel'
import { useLeaderboard } from '@/src/hooks/useLeaderboard'
import { useNarratorOnboarding } from '@/src/hooks/useNarratorOnboarding'
import { GoldDivider, SigilBadge, StoneCard } from '@/src/components/primitives'
import { easeDramatic } from '@/lib/animations/variants'

export default function LeaderboardPage() {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  const [user, setUser] = useState<{ name: string; id?: string } | null>(null)
  const [batch, setBatch] = useState<{ code: string; name: string } | null>(
    null,
  )

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
    const storedBatch = JSON.parse(localStorage.getItem('batch') || 'null')
    if (!storedUser) {
      router.push('/login')
      return
    }
    setUser(storedUser)
    setBatch(storedBatch)
  }, [router])

  const { entries, connected, updatedAt } = useLeaderboard(batch?.code)

  useNarratorOnboarding('leaderboard', { delayMs: 1400 })

  return (
    <div className="py-6 px-2 sm:px-0 max-w-3xl mx-auto w-full">
      {/* ── Header ── */}
      <motion.div
        className="mb-8"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeDramatic }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Trophy
              className="h-6 w-6 text-[color:var(--color-warroom-gold)]"
              aria-hidden
            />
            <h1
              className="text-xl font-semibold tracking-[0.04em]"
              style={{
                fontFamily: 'var(--font-display)',
                background:
                  'linear-gradient(135deg, var(--color-warroom-gold), var(--color-warroom-gold-bright))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              The Iron Rankings
            </h1>
          </div>

          {batch && (
            <SigilBadge tone="gold">
              {batch.code}
            </SigilBadge>
          )}
        </div>

        <GoldDivider variant="line" />
      </motion.div>

      {batch ? (
        <>
          {/* ── Batch info ── */}
          <motion.div
            className="mb-6 text-center"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45, ease: easeDramatic }}
          >
            <h2
              className="text-lg font-semibold text-[color:var(--color-warroom-ivory)] tracking-[0.04em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {batch.name || batch.code}
            </h2>
            <p
              className={cn(
                'text-xs mt-1.5 uppercase tracking-[0.14em]',
                connected
                  ? 'text-[color:var(--color-warroom-verdant)]'
                  : 'text-[color:var(--color-warroom-smoke)]',
              )}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {connected ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-warroom-verdant)] animate-pulse inline-block" />
                  Live updates active
                </span>
              ) : (
                'Reconnecting…'
              )}
            </p>
          </motion.div>

          {/* ── Leaderboard ── */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: easeDramatic }}
          >
            <LeaderboardPanel
              entries={entries}
              currentUserId={user?.id}
              connected={connected}
              updatedAt={updatedAt}
              className="w-full min-h-[460px]"
            />
          </motion.div>

          {/* ── Footer note ── */}
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-[10px] text-center uppercase tracking-[0.16em] text-[color:var(--color-warroom-smoke)] mt-5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Rankings are based on projected annual revenue from simulation decisions.
          </motion.p>
        </>
      ) : (
        /* ── Empty state (no batch) ── */
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: easeDramatic }}
        >
          <StoneCard className="py-16 text-center">
            <Crown
              className="h-10 w-10 mx-auto mb-4 text-[color:var(--color-warroom-ash)]"
              aria-hidden
            />
            <p
              className="text-sm text-[color:var(--color-warroom-smoke)] mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              No batch associated with your account.
            </p>
            <p
              className="text-xs text-[color:var(--color-warroom-smoke)]/70"
              style={{ fontFamily: 'var(--font-body, serif)' }}
            >
              Sign in with a batch code to see live rankings.
            </p>
          </StoneCard>
        </motion.div>
      )}
    </div>
  )
}
