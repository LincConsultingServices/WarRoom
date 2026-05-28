/**
 * assetRegistry — typed paths for all expected media.
 *
 * Files don't exist on disk today; the `useAsset` hook reports
 * `hasFailed: true` so components render CSS placeholder fallbacks.
 *
 * Investor- and mentor-specific assets are owned by
 * `src/lib/investorAssets.ts` — do not duplicate them here.
 */

export const ASSET_REGISTRY = {
  narrator: {
    // Stills (Imagen) — animated WebMs are an aspirational upgrade per ASSETS_REQUIRED.md §3.
    idle:        '/assets/images/narrator/narrator-idle.webp',
    speaking:    '/assets/images/narrator/narrator-speaking.webp',
    pointing:    '/assets/images/narrator/narrator-pointing.webp',
    celebrating: '/assets/images/narrator/narrator-celebrating.webp',
    warning:     '/assets/images/narrator/narrator-warning.webp',
    whispering:  '/assets/images/narrator/narrator-whispering.webp',
  },

  backgrounds: {
    landing:    '/assets/images/bg/landing-hall.webp',
    dashboard:  '/assets/images/bg/dashboard-chamber.webp',
    simulation: '/assets/images/bg/simulation-stone.webp',
    warroom:    '/assets/images/bg/warroom-throne.webp',
    verdict:    '/assets/images/bg/verdict-hall.webp',
  },

  textures: {
    noise:     '/assets/images/textures/noise.webp',
    parchment: '/assets/images/textures/parchment.webp',
    stone:     '/assets/images/textures/stone.webp',
    leather:   '/assets/images/textures/leather.webp',
    vignette:  '/assets/images/textures/vignette.webp',
  },

  door: {
    openingMp4:  '/assets/video/warroom-door-opening.mp4',
    openingWebm: '/assets/video/warroom-door-opening.webm',
  },

  crests: {
    warroom: '/assets/images/crests/warroom-crest.svg',
  },
} as const

export type AssetCategory = keyof typeof ASSET_REGISTRY
