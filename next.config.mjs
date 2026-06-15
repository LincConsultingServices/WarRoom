/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Transform barrel imports from these heavily-used packages into direct
  // module imports, trimming what lands in each route's bundle. (lucide-react
  // is already covered by Next's built-in default list.)
  experimental: {
    optimizePackageImports: ['framer-motion', '@floating-ui/react'],
  },
}

export default nextConfig
