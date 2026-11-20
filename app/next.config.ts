import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

type Redirect = { source: string; destination: string; permanent?: boolean }

/**
 * 301s for old WordPress URLs. Source of truth is a JSON array of {source, destination, permanent}.
 * The Docker build context is ./app, so production reads app/redirects.json; the repo-level
 * migration/redirects.next.json is used as a fallback for local builds.
 */
function loadRedirects(): { source: string; destination: string; permanent: boolean }[] {
  for (const file of [path.join(dirname, 'redirects.json'), path.join(dirname, '..', 'migration', 'redirects.next.json')]) {
    try {
      if (!fs.existsSync(file)) continue
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
      const list: Redirect[] = Array.isArray(raw) ? raw : Array.isArray(raw?.redirects) ? raw.redirects : []
      return list
        .filter((r) => typeof r?.source === 'string' && typeof r?.destination === 'string' && r.source !== r.destination)
        .map((r) => ({ source: r.source, destination: r.destination, permanent: r.permanent ?? true }))
    } catch (e) {
      console.warn(`[redirects] could not read ${file}:`, (e as Error).message)
    }
  }
  return []
}

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  agentRules: false,
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },
  async redirects() {
    return loadRedirects()
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
