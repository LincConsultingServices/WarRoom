// ============================================================
// Investor asset resolver
// ----------------------------------------------------------------
// Investor media is optional — when an asset isn't present on
// disk we want the UI to fall back gracefully, NOT 404 the browser.
//
// This module probes a list of candidate URLs via HEAD requests,
// memoises the first hit (or `null` for "nothing found"), and
// returns a typed {url, kind} descriptor that <InvestorPortraitMedia/>
// consumes to pick the right renderer.
//
// Convention: assets live at
//   /public/investors/<investorId>/{portrait,speaking,thinking,
//                                    impressed,skeptical,ambient}.{webm,mp4,gif,jpg,png}
//   /public/investors/<investorId>/sigil.svg
//   /public/investors/<investorId>/question-ambient.mp3
//
// Order of preference per asset key: webm → mp4 → gif → jpg → png
// (favours WebM for size + transparency support).
// ============================================================

export type InvestorAssetKey =
  | 'portrait'
  | 'speaking'
  | 'thinking'
  | 'impressed'
  | 'skeptical'
  | 'ambient'
  | 'sigil'
  | 'question-ambient'

export type InvestorAssetKind = 'video' | 'image' | 'gif' | 'audio' | 'svg' | 'fallback'

export interface ResolvedInvestorAsset {
  url: string | null
  kind: InvestorAssetKind
}

// Extension preference order per kind. The first match wins.
const VARIANTS: Record<InvestorAssetKey, { ext: string; kind: InvestorAssetKind }[]> = {
  portrait:           [{ ext: 'webp', kind: 'image' }, { ext: 'jpg', kind: 'image' }, { ext: 'png', kind: 'image' }],
  speaking:           [{ ext: 'webm', kind: 'video' }, { ext: 'mp4',  kind: 'video' }, { ext: 'gif', kind: 'gif' }],
  thinking:           [{ ext: 'webm', kind: 'video' }, { ext: 'mp4',  kind: 'video' }, { ext: 'gif', kind: 'gif' }],
  impressed:          [{ ext: 'webm', kind: 'video' }, { ext: 'mp4',  kind: 'video' }, { ext: 'gif', kind: 'gif' }],
  skeptical:          [{ ext: 'webm', kind: 'video' }, { ext: 'mp4',  kind: 'video' }, { ext: 'gif', kind: 'gif' }],
  ambient:            [{ ext: 'webm', kind: 'video' }, { ext: 'mp4',  kind: 'video' }],
  sigil:              [{ ext: 'svg',  kind: 'svg' }, { ext: 'png', kind: 'image' }],
  'question-ambient': [{ ext: 'mp3',  kind: 'audio' }, { ext: 'ogg', kind: 'audio' }],
}

const FALLBACK: ResolvedInvestorAsset = { url: null, kind: 'fallback' }

// Module-scoped cache. Both successful resolutions AND failures are cached
// to keep the network quiet on re-renders.
const cache = new Map<string, Promise<ResolvedInvestorAsset>>()

function cacheKey(investorId: string, key: InvestorAssetKey): string {
  return `${investorId}::${key}`
}

async function probe(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'force-cache' })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Resolve the URL for a given investor asset. Returns `{url: null, kind: 'fallback'}`
 * when no candidate file exists. Never throws.
 *
 * Calls are memoised per (investorId, key) for the lifetime of the page.
 */
export function getInvestorAssetUrl(
  investorId: string,
  key: InvestorAssetKey,
): Promise<ResolvedInvestorAsset> {
  if (!investorId) return Promise.resolve(FALLBACK)
  const id = sanitizeId(investorId)
  const k = cacheKey(id, key)
  const existing = cache.get(k)
  if (existing) return existing

  const variants = VARIANTS[key]
  const promise = (async (): Promise<ResolvedInvestorAsset> => {
    for (const v of variants) {
      const url = `/investors/${id}/${key}.${v.ext}`
      const ok = await probe(url)
      if (ok) return { url, kind: v.kind }
    }
    return FALLBACK
  })()

  cache.set(k, promise)
  return promise
}

/**
 * Eagerly resolve a batch of assets for one investor. Useful for the
 * "next investor" prefetch when transitioning between rounds.
 */
export function prefetchInvestorAssets(
  investorId: string,
  keys: InvestorAssetKey[] = ['portrait', 'speaking', 'thinking'],
): Promise<void> {
  return Promise.all(keys.map((k) => getInvestorAssetUrl(investorId, k))).then(() => undefined)
}

/**
 * Test-only / dev-tooling: wipe the resolution cache.
 */
export function _resetInvestorAssetCache(): void {
  cache.clear()
}

// Defensive id sanitiser — investor ids come from the backend but we use them
// to build URLs, so strip anything that could break the URL or escape the path.
function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_')
}
