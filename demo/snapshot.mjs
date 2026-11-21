#!/usr/bin/env node
/**
 * Static, read-only snapshot of the public site, for the GitHub Pages demo.
 *
 *   node demo/snapshot.mjs --origin http://localhost:3000 --base /DAPV --out demo/out --static app/.next/static
 *
 * Crawls every public page of a running app (starting at "/"), saves each page as
 * <path>/index.html, and rewrites links so the copy works under a sub-path (GitHub Pages
 * serves project sites at /<repo>/). The public site has no client components, so all
 * Next.js scripts are dropped: the result is plain HTML + CSS + media.
 *
 * Query pages (?seizoen=2023, ?pagina=2) become their own folders (klassement/seizoen-2023/).
 * Old WordPress redirects are followed and links point straight to the target.
 * /admin, /preview and the API (other than media files) are left out, and a demo banner is added.
 */
import fs from 'node:fs'
import path from 'node:path'

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : def
}
const ORIGIN = arg('origin', 'http://localhost:3000').replace(/\/$/, '')
const BASE = arg('base', '/DAPV').replace(/\/$/, '')
const OUT = path.resolve(arg('out', 'demo/out'))
const STATIC = arg('static', 'app/.next/static')
const REPO_URL = arg('repo', 'https://github.com/Stijndh88/DAPV')

const SKIP = [/^\/admin(\/|$)/, /^\/preview(\/|$)/, /^\/_next\//, /^\/api\/(?!media\/file\/)/]

const decodeEntities = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"')

/** "/klassement?seizoen=2023" → "/klassement/seizoen-2023/" ; "/" → "/" */
function pagePath(u) {
  let p = decodeURIComponent(u.pathname).replace(/\/+$/, '')
  const q = [...u.searchParams].map(([k, v]) => `${k}-${v}`.replace(/[^\w.-]+/g, '-')).join('-')
  if (q) p += `/${q}`
  return `${p}/`
}

const pages = new Map() // key (path+search) → { status, html }
const assets = new Set() // pathname
const redirects = new Map() // key → absolute target URL
const queue = ['/']
const seen = new Set(queue)

const keyOf = (u) => u.pathname + u.search

function enqueue(raw, from) {
  if (!raw) return
  raw = decodeEntities(raw.trim())
  if (/^(mailto:|tel:|javascript:|data:|#)/i.test(raw)) return
  let u
  try { u = new URL(raw, from) } catch { return }
  if (u.origin !== ORIGIN) return
  if (SKIP.some((r) => r.test(u.pathname))) return
  u.hash = ''
  const k = keyOf(u)
  if (!seen.has(k)) { seen.add(k); queue.push(k) }
}

function refsIn(html) {
  const out = []
  for (const m of html.matchAll(/\s(?:href|src|action|poster)="([^"]*)"/g)) out.push(m[1])
  for (const m of html.matchAll(/\s(?:imageSrcSet|imagesrcset|srcSet)="([^"]*)"|\ssrcset="([^"]*)"/g))
    for (const part of (m[1] ?? m[2]).split(',')) out.push(part.trim().split(/\s+/)[0])
  for (const m of html.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) out.push(m[1])
  return out
}

async function crawl() {
  while (queue.length) {
    const k = queue.shift()
    const url = ORIGIN + k
    const res = await fetch(url, { redirect: 'manual' })
    if (res.status >= 300 && res.status < 400) {
      const loc = new URL(res.headers.get('location'), url)
      redirects.set(k, loc)
      enqueue(loc.href, url)
      continue
    }
    const type = res.headers.get('content-type') ?? ''
    if (type.includes('text/html')) {
      const html = await res.text()
      pages.set(k, { status: res.status, html })
      for (const r of refsIn(html)) enqueue(r, url)
      if (res.status !== 200) console.warn(`[snapshot] ${res.status} ${k}`)
    } else if (res.ok) {
      const u = new URL(url)
      const file = path.join(OUT, decodeURIComponent(u.pathname))
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
      assets.add(k)
    } else {
      console.warn(`[snapshot] ${res.status} ${k} (skipped)`)
    }
  }
}

/** Follow redirects recorded during the crawl (max 10 hops). */
function resolve(u) {
  for (let i = 0; i < 10; i++) {
    const t = redirects.get(keyOf(u))
    if (!t) break
    const hash = u.hash
    u = new URL(t.href)
    if (!u.hash) u.hash = hash
  }
  return u
}

function rewriteUrl(raw, from) {
  const decoded = decodeEntities(raw)
  if (/^(mailto:|tel:|javascript:|data:|#)/i.test(decoded)) return raw
  let u
  try { u = new URL(decoded, from) } catch { return raw }
  if (u.origin !== ORIGIN) return raw
  if (/^\/_next\//.test(u.pathname)) return BASE + u.pathname
  u = resolve(u)
  const k = keyOf(u)
  if (pages.has(k)) return BASE + encodeURI(pagePath(u)) + u.hash
  return BASE + u.pathname + u.search + u.hash
}

const BANNER = `<div class="demo-banner" role="note" style="background:#FF5A1F;color:#0E3B43;font:600 15px/1.4 system-ui,sans-serif;padding:8px 16px;text-align:center">
Demo van de nieuwe website (alleen lezen, met de echte inhoud van plasvissers.be). Inloggen en beheer werken hier niet.
<a href="${REPO_URL}" style="color:inherit;text-decoration:underline">Meer info</a></div>`

function transform(html, from) {
  html = html
    // drop the Next.js runtime: the public pages work without it
    .replace(/<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<link\b[^>]*\brel="(?:preload|modulepreload)"[^>]*\bas="script"[^>]*\/?>/g, '')
    .replace(/<link\b[^>]*\bas="script"[^>]*\brel="(?:preload|modulepreload)"[^>]*\/?>/g, '')
    .replace(/<link\b[^>]*\brel="modulepreload"[^>]*\/?>/g, '')
    // no editor login in a static demo
    .replace(/<a\b[^>]*\bhref="\/admin[^"]*"[^>]*>[\s\S]*?<\/a>/g, '')
    .replace(/<head>/, '<head><meta name="robots" content="noindex"/>')
    .replace(/(<body[^>]*>)/, `$1${BANNER}`)
  html = html.replace(/(\s(?:href|src|action|poster)=")([^"]*)(")/g, (_, a, v, b) => a + rewriteUrl(v, from) + b)
  html = html.replace(/(\s(?:imageSrcSet|imagesrcset|srcSet|srcset)=")([^"]*)(")/g, (_, a, v, b) =>
    a + v.split(',').map((part) => {
      const [u, ...rest] = part.trim().split(/\s+/)
      return [rewriteUrl(u, from), ...rest].join(' ')
    }).join(', ') + b)
  html = html.replace(/url\(\s*(['"]?)(\/[^'")]+)\1\s*\)/g, (_, q, v) => `url(${q}${rewriteUrl(v, from)}${q})`)
  return html.replaceAll(ORIGIN, '')
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true })
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name)
    if (e.isDirectory()) copyDir(s, d)
    else if (e.name.endsWith('.css')) fs.writeFileSync(d, fs.readFileSync(s, 'utf8').replace(/url\((['"]?)\/(?!\/)/g, `url($1${BASE}/`))
    else fs.copyFileSync(s, d)
  }
}

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
await crawl()

// a page GitHub Pages shows for unknown URLs
const nf = await fetch(`${ORIGIN}/deze-pagina-bestaat-niet-demo`)
if ((nf.headers.get('content-type') ?? '').includes('text/html')) {
  fs.writeFileSync(path.join(OUT, '404.html'), transform(await nf.text(), `${ORIGIN}/`))
}

let ok = 0
for (const [k, { status, html }] of pages) {
  if (status !== 200) continue
  const u = new URL(ORIGIN + k)
  const file = path.join(OUT, pagePath(u), 'index.html')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, transform(html, u.href))
  ok++
}
copyDir(STATIC, path.join(OUT, '_next', 'static'))
fs.writeFileSync(path.join(OUT, '.nojekyll'), '')

console.log(`[snapshot] ${ok} pages, ${assets.size} media files, ${redirects.size} redirects followed → ${OUT}`)
const bad = [...pages].filter(([, p]) => p.status !== 200)
if (bad.length) console.log(`[snapshot] not saved (non-200): ${bad.map(([k, p]) => `${p.status} ${k}`).join(', ')}`)
if (ok < 5) { console.error('[snapshot] too few pages, something is wrong'); process.exit(1) }
