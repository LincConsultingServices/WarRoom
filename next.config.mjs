import bundleAnalyzer from '@next/bundle-analyzer'

// Enable with `ANALYZE=true`. NOTE: @next/bundle-analyzer hooks webpack, so it
// only emits the treemap on a webpack build (`ANALYZE=true next build --webpack`);
// the default Turbopack build ignores it. For a quick per-route byte table that
// works on any build, see scripts/analyze-bundle.mjs.
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  // Transform barrel imports from these heavily-used packages into direct
  // module imports, trimming what lands in each route's bundle. (lucide-react
  // is already covered by Next's built-in default list.)
  experimental: {
    optimizePackageImports: ['framer-motion', '@floating-ui/react'],
  },
}

export default withBundleAnalyzer(nextConfig)
