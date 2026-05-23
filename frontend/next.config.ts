import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Required for the Docker multi-stage build — produces a self-contained
  // standalone server in .next/standalone that doesn't need node_modules.
  output: 'standalone',
}

export default nextConfig
