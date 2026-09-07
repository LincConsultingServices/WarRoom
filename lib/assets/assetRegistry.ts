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
    landing:    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-uPIq1QYtYyk7dGOLhU6AhXOq6jGQ5m.png',
    dashboard:  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-wI7IQgt44XI7Tnz7l6PC5KWQgLtcob.png',
    simulation: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-yOgZyRBJNY0iECvKTLjC4siQx4C1sa.png',
    chessboard: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-RSRu9o1FG9r7HgQUB0v0Mbxd9rQPSv.png',
    verdict:    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-7dZmJREIntjPKO2gDxXbtvhc5n3Ymq.png',
  },

  textures: {
    noise:     '/assets/images/textures/noise.webp',
    parchment: '/assets/images/textures/parchment.webp',
    stone:     '/assets/images/textures/stone.webp',
    leather:   '/assets/images/textures/leather.webp',
    vignette:  '/assets/images/textures/vignette.webp',
  },

  door: {
    openingMp4:  '/assets/video/chessboard-door-opening.mp4',
    openingWebm: '/assets/video/chessboard-door-opening.webm',
  },

  crests: {
    chessboard: '/assets/images/crests/warroom-crest.svg',
  },
} as const

export type AssetCategory = keyof typeof ASSET_REGISTRY
