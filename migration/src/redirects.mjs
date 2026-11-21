#!/usr/bin/env node
// Build the old -> new URL map.
//   node src/redirects.mjs
// Uses data/import/*.json when the transform has run (exact slugs), otherwise
// seed/old-urls.json (the sitemap list). Writes:
//   redirects.json         [{ from, to, query? }]  generic list (from without trailing slash)
//   redirects.next.json    for `async redirects()` in next.config
//   ../app/redirects.json  same, inside the app's Docker build context
//   redirects.caddy        snippet for the Caddyfile
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { competitionSlug, parsePostPath, waterSlug } from './lib.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = async (p) => { try { return JSON.parse(await readFile(p, 'utf8')) } catch { return null } }
const strip = (p) => (p.length > 1 ? p.replace(/\/$/, '') : p)

const seed = await readJson(path.join(ROOT, 'seed', 'old-urls.json'))
const waters = (await readJson(path.join(ROOT, 'seed', 'waters.json'))).waters
const imported = {
  competitions: await readJson(path.join(ROOT, 'data', 'import', 'competitions.json')),
  news: await readJson(path.join(ROOT, 'data', 'import', 'news.json')),
  pages: await readJson(path.join(ROOT, 'data', 'import', 'pages.json')),
}

const map = new Map() // from -> to
const add = (from, to) => { if (strip(from) !== strip(to) && !map.has(strip(from))) map.set(strip(from), to) }

// Fixed pages
const FIXED = {
  '/ontstaan': '/geschiedenis',
  '/ontstaan/clubreglement': '/club/reglement',
  '/praktische-clubgegevens': '/club/praktisch',
  '/leden': '/club/leden',
  '/bestuur': '/club/bestuur',
  '/cpt_staff_lst/bestuur-17': '/club/bestuur',
  '/archief-wedstrijden': '/wedstrijden',
  '/clubnieuws': '/nieuws',
  '/category/nieuws': '/nieuws',
  '/category/uncategorised': '/nieuws',
  '/author/stijndh': '/nieuws',
  '/feed': '/nieuws',
  '/comments/feed': '/nieuws',
  '/vislocaties': '/visplaatsen',
  '/bwg_gallery/fotos-2022': '/fotos/fotos-2022',
  '/bwg_album/fotos': '/fotos',
  '/bwg_tag/2022': '/fotos/fotos-2022',
  '/bwg_tag/2023': '/fotos',
  '/wp-admin': '/admin',
  '/wp-login.php': '/admin',
}
for (const [f, t] of Object.entries(FIXED)) add(f, t)
for (let p = 2; p <= 10; p++) add(`/nieuws/page/${p}`, '/nieuws')
for (let y = 2019; y <= 2026; y++) {
  add(`/kalender-${y}`, `/wedstrijden?seizoen=${y}`)
  add(`/category/wedstrijduitslagen-${y}`, `/wedstrijden?seizoen=${y}`)
}
for (const w of waters) if (w.oldPath) add(w.oldPath, `/visplaatsen/${waterSlug(w)}`)
add('/dendervissers-gijzegem', `/visplaatsen/${waterSlug(waters.find((w) => w.name === 'Dendervissers'))}`)

// Posts: exact slugs from the transform if available
const newsSlugs = new Set(seed.newsPostSlugs)
const queryRules = []
if (imported.competitions) {
  for (const c of imported.competitions) for (const op of c.oldPaths) {
    if (op.startsWith('/?')) queryRules.push({ key: 'p', value: op.split('=')[1], to: `/wedstrijden/${c.slug}` })
    else add(op, `/wedstrijden/${c.slug}`)
  }
  for (const n of imported.news ?? []) for (const op of n.oldPaths) {
    if (op.startsWith('/?')) queryRules.push({ key: 'p', value: op.split('=')[1], to: `/nieuws/${n.slug}` })
    else add(op, `/nieuws/${n.slug}`)
  }
  for (const pg of imported.pages ?? []) for (const op of pg.oldPaths) {
    if (op.startsWith('/?')) queryRules.push({ key: 'page_id', value: op.split('=')[1], to: ['reglement', 'praktisch'].includes(pg.slug) ? `/club/${pg.slug}` : `/${pg.slug}` })
  }
} else {
  for (const p of seed.posts) {
    const pp = parsePostPath(p)
    if (newsSlugs.has(pp.slug)) add(p, `/nieuws/${pp.slug}`)
    else add(p, `/wedstrijden/${competitionSlug(pp.year, pp.slug)}`)
  }
}
queryRules.push({ key: 'page_id', value: '58', to: '/nieuws' })

// Monthly archives: results months -> that season, the rest -> news
for (const o of seed.other) {
  const m = o.match(/^\/(\d{4})\/(\d{2})\/?$/)
  if (m) add(o, `/wedstrijden?seizoen=${m[1]}`)
}
// Any other old upload links keep working only if the files are re-hosted; send them home otherwise.
const list = [...map].map(([from, to]) => ({ from, to })).sort((a, b) => a.from.localeCompare(b.from))
const all = [...list, ...queryRules.map((q) => ({ from: '/', query: { [q.key]: q.value }, to: q.to }))]

await writeFile(path.join(ROOT, 'redirects.json'), JSON.stringify(all, null, 2) + '\n')
const nextRedirects = [
  ...list.map((r) => ({ source: r.from, destination: r.to, permanent: true })),
  ...queryRules.map((q) => ({ source: '/', has: [{ type: 'query', key: q.key, value: q.value }], destination: q.to, permanent: true })),
]
await writeFile(path.join(ROOT, 'redirects.next.json'), JSON.stringify(nextRedirects, null, 2) + '\n')
// The app's Docker build context is ./app, so production reads its own copy.
await writeFile(path.join(ROOT, '..', 'app', 'redirects.json'), JSON.stringify(nextRedirects, null, 2) + '\n')
await writeFile(path.join(ROOT, 'redirects.caddy'), [
  '# Old WordPress URLs -> new site. Import with: import /path/to/redirects.caddy (inside the site block)',
  ...list.map((r, i) => `@old${i} path ${r.from} ${r.from}/\nredir @old${i} ${r.to} permanent`),
  ...queryRules.map((q, i) => `@oldq${i} query ${q.key}=${q.value}\nredir @oldq${i} ${q.to} permanent`),
  '@wpcontent path /wp-content/* /wp-includes/* /xmlrpc.php\nredir @wpcontent / permanent',
  '',
].join('\n'))
console.log(`Redirects: ${list.length} paths + ${queryRules.length} query rules (${imported.competitions ? 'from import data' : 'from sitemap seed'})`)
