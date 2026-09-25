import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  pageExtensions: ['ts', 'tsx', 'mdx'],
  // reach the dev server over Tailscale
  allowedDevOrigins: ['100.102.79.18', 'macbook-2.tailb70de6.ts.net'],
}

export default createMDX({})(nextConfig)
