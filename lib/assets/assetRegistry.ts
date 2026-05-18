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
    idle:        '/assets/images/narrator/narrator-idle.webm',
    speaking:    '/assets/images/narrator/narrator-speaking.webm',
    pointing:    '/assets/images/narrator/narrator-pointing.webm',
    celebrating: '/assets/images/narrator/narrator-celebrating.webm',
    warning:     '/assets/images/narrator/narrator-warning.webm',
    whispering:  '/assets/images/narrator/narrator-whispering.webm',
  },

  backgrounds: {
    landing:    '/assets/images/bg/landing-hall.jpg',
    dashboard:  '/assets/images/bg/dashboard-chamber.jpg',
    simulation: '/assets/images/bg/simulation-stone.jpg',
    warroom:    '/assets/images/bg/warroom-throne.jpg',
    verdict:    '/assets/images/bg/verdict-hall.jpg',
  },

  textures: {
    noise:     '/assets/images/textures/noise.png',
    parchment: '/assets/images/textures/parchment.jpg',
    stone:     '/assets/images/textures/stone.jpg',
    leather:   '/assets/images/textures/leather.jpg',
    vignette:  '/assets/images/textures/vignette.png',
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
