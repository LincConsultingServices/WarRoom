'use client'

import { useEffect, useState } from 'react'
import {
  getInvestorAssetUrl,
  prefetchInvestorAssets,
  type InvestorAssetKey,
  type ResolvedInvestorAsset,
} from '@/src/lib/investorAssets'

// ============================================================
// useInvestorAssets
// ----------------------------------------------------------------
// Eager-resolves a set of asset keys for the ACTIVE investor and
// optionally prefetches the same set for the NEXT investor (so the
// transition between investors is seamless even on slow networks).
//
// Per Phase 11 of the cinematic-overhaul plan:
//   "Lazy load investor assets — only load the active investor's
//    assets eagerly, prefetch the next investor's assets in the
//    background. All other investors only load portrait.jpg."
//
// Returns a per-key map of `ResolvedInvestorAsset` and a `ready`
// flag so the consumer can render a graceful "still resolving"
// state if needed. Resolution uses the module-scoped cache in
// `lib/investorAssets`, so repeated calls are cheap.
// ============================================================

const DEFAULT_KEYS: InvestorAssetKey[] = [
  'portrait',
  'speaking',
  'thinking',
  'impressed',
  'skeptical',
]

const DEFAULT_PREFETCH_KEYS: InvestorAssetKey[] = ['portrait', 'speaking']

export interface UseInvestorAssetsOptions {
  /** Asset keys to eager-resolve for the active investor. */
  keys?: InvestorAssetKey[]
  /** Optional next investor id — its assets are prefetched in
   *  the background using `prefetchKeys`. No state is exposed
   *  for them; they just warm the resolver cache. */
  nextInvestorId?: string | null
  /** Keys to prefetch for the next investor. */
  prefetchKeys?: InvestorAssetKey[]
}

export interface UseInvestorAssetsResult {
  /** Per-key resolved asset for the active investor. Empty until
   *  the first probe round resolves. */
  assets: Partial<Record<InvestorAssetKey, ResolvedInvestorAsset>>
  /** True once every requested key has resolved (hit OR fallback). */
  ready: boolean
}

export function useInvestorAssets(
  investorId: string | null | undefined,
  options: UseInvestorAssetsOptions = {},
): UseInvestorAssetsResult {
  const { keys = DEFAULT_KEYS, nextInvestorId, prefetchKeys = DEFAULT_PREFETCH_KEYS } = options

  const [state, setState] = useState<UseInvestorAssetsResult>({
    assets: {},
    ready: !investorId,
  })

  useEffect(() => {
    let cancelled = false

    // Defer state writes by one task tick so they're async with respect to
    // the effect body. Keeps react-hooks/set-state-in-effect satisfied without
    // changing observable behaviour (the resolver itself is already async).
    const kickoff = window.setTimeout(() => {
      if (cancelled) return

      if (!investorId) {
        setState({ assets: {}, ready: true })
        return
      }

      setState({ assets: {}, ready: false })

      Promise.all(
        keys.map((key) =>
          getInvestorAssetUrl(investorId, key).then((res) => ({ key, res })),
        ),
      )
        .then((results) => {
          if (cancelled) return
          const next: Partial<Record<InvestorAssetKey, ResolvedInvestorAsset>> = {}
          for (const { key, res } of results) {
            next[key] = res
          }
          setState({ assets: next, ready: true })
        })
        .catch(() => {
          if (cancelled) return
          // Resolver never throws today, but stay defensive
          setState({ assets: {}, ready: true })
        })
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(kickoff)
    }
    // keys deliberately stable across renders (DEFAULT_KEYS is module-scoped);
    // if callers pass a fresh array each render they should memo it themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investorId, keys.join('|')])

  // Background prefetch for the next investor — fire-and-forget.
  useEffect(() => {
    if (!nextInvestorId || nextInvestorId === investorId) return
    let cancelled = false
    void prefetchInvestorAssets(nextInvestorId, prefetchKeys).catch(() => {
      /* ignore */
    })
    return () => {
      cancelled = true
      // We can't actually cancel an in-flight prefetch — the resolver
      // memoises its result so a "cancelled" prefetch just warms the
      // cache anyway. Setting the flag exists for future cleanup hooks.
      void cancelled
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextInvestorId, investorId, prefetchKeys.join('|')])

  return state
}
