#!/usr/bin/env node
// Export everything from the WordPress site into migration/data/.
//   node src/export.mjs [--base https://plasvissers.be] [--no-media]
// Writes data/raw/*.json (REST API dumps + rendered HTML of key pages),
// data/media/** (files, mirroring /wp-content/uploads/) and data/media-manifest.json.
import { mkdir, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const BASE = (args.includes('--base') ? args[args.indexOf('--base') + 1] : 'https://plasvissers.be').replace(/\/$/, '')
const WITH_MEDIA = !args.includes('--no-media')
const RAW = path.join(ROOT, 'data', 'raw')
const MEDIA = path.join(ROOT, 'data', 'media')
const UA = 'plasvissers-migration/1.0'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function get(url, { tries = 4, as = 'text' } = {}) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA } })
      if (res.status === 404 || res.status === 400) return { res, body: null }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : await res.text()
      return { res, body }
    } catch (e) {
      if (i >= tries) throw new Error(`${url}: ${e.message}`)
      await sleep(500 * 2 ** i)
    }
  }
}

async function restAll(type, extra = '') {
  const out = []
  for (let page = 1; ; page++) {
    const url = `${BASE}/wp-json/wp/v2/${type}?per_page=100&page=${page}${extra}`
    const { res, body } = await get(url)
    if (!body) break
    const items = JSON.parse(body)
    out.push(...items)
    const totalPages = Number(res.headers.get('x-wp-totalpages') ?? 1)
    console.log(`  ${type} page ${page}/${totalPages}: ${items.length}`)
    if (page >= totalPages || items.length === 0) break
  }
  return out
}

const save = (name, data) =>
  writeFile(path.join(RAW, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2))

// Pages whose rendered HTML we keep (galleries are rendered by shortcodes only in HTML).
const HTML_PAGES = ['/', '/fotos/', '/bwg_gallery/fotos-2022/', '/vislocaties/', '/bestuur/', '/leden/', '/praktische-clubgegevens/']
const SITEMAPS = ['sitemap_index.xml', 'post-sitemap.xml', 'page-sitemap.xml', 'category-sitemap.xml', 'bwg_gallery-sitemap.xml', 'bwg_album-sitemap.xml', 'bwg_tag-sitemap.xml', 'cpt_staff_lst-sitemap.xml']

/** Every uploads URL referenced anywhere; thumbnails mapped to their originals. */
function collectUploadUrls(texts) {
  const urls = new Set()
  const re = /https?:\/\/(?:www\.)?plasvissers\.be\/wp-content\/uploads\/[^"'\s)<>?]+\.(?:jpe?g|png|gif|webp|mp3|m4a|pdf|svg)/gi
  for (const t of texts) for (const m of String(t).matchAll(re)) {
    let u = m[0].replace(/^http:/, 'https:').replace('://www.', '://')
    u = u.replace(/\/photo-gallery\/(thumb|\.thumb|\.original)\//, '/photo-gallery/') // 10Web thumbs
    urls.add(u)
    const original = u.replace(/-\d{2,4}x\d{2,4}(?=\.[a-z]+$)/i, '') // WP size variants
    if (original !== u) urls.add(original)
  }
  return [...urls]
}

async function exists(p) { try { await access(p); return true } catch { return false } }

async function main() {
  await mkdir(RAW, { recursive: true })
  console.log(`Exporting ${BASE}`)

  const index = JSON.parse((await get(`${BASE}/wp-json/`)).body)
  await save('site.json', { name: index.name, description: index.description, url: index.url, timezone: index.timezone_string, namespaces: index.namespaces, page_on_front: index.page_on_front, page_for_posts: index.page_for_posts })

  const data = {}
  for (const type of ['posts', 'pages', 'categories', 'tags', 'media', 'users']) {
    try { data[type] = await restAll(type) } catch (e) { console.warn(`  ${type}: ${e.message}`); data[type] = [] }
    await save(`${type}.json`, data[type])
  }

  const html = {}
  for (const p of HTML_PAGES) {
    const { body } = await get(`${BASE}${p}`)
    if (body) html[p] = body
  }
  await save('html.json', html)

  const sitemaps = {}
  for (const s of SITEMAPS) {
    const { body } = await get(`${BASE}/${s}`)
    if (body) sitemaps[s] = body
  }
  await save('sitemaps.json', sitemaps)

  const texts = [
    ...data.posts.map((p) => p.content?.rendered),
    ...data.pages.map((p) => p.content?.rendered),
    ...data.media.map((m) => m.source_url),
    ...Object.values(html),
    ...Object.values(sitemaps),
  ]
  const urls = collectUploadUrls(texts)
  console.log(`Found ${urls.length} upload URLs`)

  const manifest = {}
  if (WITH_MEDIA) {
    let ok = 0, missing = 0
    for (const u of urls) {
      const rel = decodeURIComponent(new URL(u).pathname.replace(/^\/wp-content\/uploads\//, ''))
      const dest = path.join(MEDIA, rel)
      if (!(await exists(dest))) {
        const { body } = await get(u, { as: 'buffer' }).catch(() => ({ body: null }))
        if (!body) { missing++; continue }
        await mkdir(path.dirname(dest), { recursive: true })
        await writeFile(dest, body)
      }
      manifest[u] = path.relative(ROOT, dest)
      ok++
    }
    console.log(`Media: ${ok} saved, ${missing} not found (size variants that do not exist are expected)`)
  }
  await writeFile(path.join(ROOT, 'data', 'media-manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`Done: ${data.posts.length} posts, ${data.pages.length} pages, ${data.media.length} media items.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
