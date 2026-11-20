/**
 * Import the old plasvissers.be content into Payload.
 *
 *   cd app && npx payload run scripts/import-wordpress.ts
 *
 * Reads ../migration/data/import/*.json (made by `npm run all` in /migration) and
 * media files under ../migration/. Override with MIGRATION_DIR=/path/to/migration.
 * Idempotent: everything is upserted by slug (media by filename), so it can be re-run.
 * Fields that do not exist in the current schema are skipped with a warning, and
 * rich text fields get Lexical JSON while plain text fields get plain text.
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

const MIGRATION_DIR = process.env.MIGRATION_DIR ?? path.resolve(process.cwd(), '../migration')
const DATA = path.join(MIGRATION_DIR, 'data', 'import')
const DRY = process.argv.includes('--dry-run')

const read = <T,>(name: string): T => JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'))
const log = (...a: unknown[]) => console.log('[import]', ...a)
const warned = new Set<string>()
const warnOnce = (m: string) => { if (!warned.has(m)) { warned.add(m); console.warn('[import] !', m) } }

type Field = { name?: string; type: string; fields?: Field[]; tabs?: { name?: string; fields: Field[] }[] }
function flatFields(fields: Field[]): Field[] {
  return fields.flatMap((f) => {
    if (f.name) return [f]
    if (f.tabs) return f.tabs.flatMap((t) => (t.name ? [{ name: t.name, type: 'group', fields: t.fields }] : flatFields(t.fields)))
    return f.fields ? flatFields(f.fields) : []
  })
}

// ---------- rich text ----------
const textNode = (text: string) => ({ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 })
const decode = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
const htmlToText = (html: string) => decode(html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|h\d|li|tr|div)>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/\n{3,}/g, '\n\n').trim()

/** Minimal Lexical document, used when Payload's HTML converter is not available. */
function simpleLexical(html: string) {
  const blocks = html.match(/<(h[1-6]|p|li)[^>]*>[\s\S]*?<\/\1>/gi) ?? [html]
  const children = blocks
    .map((b) => {
      const tag = (b.match(/^<(\w+)/)?.[1] ?? 'p').toLowerCase()
      const text = htmlToText(b)
      if (!text) return null
      return tag.startsWith('h')
        ? { type: 'heading', tag: tag === 'h1' ? 'h2' : tag, children: [textNode(text)], direction: 'ltr', format: '', indent: 0, version: 1 }
        : { type: 'paragraph', children: [textNode(tag === 'li' ? `• ${text}` : text)], direction: 'ltr', format: '', indent: 0, textFormat: 0, version: 1 }
    })
    .filter(Boolean)
  return { root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 } }
}

let htmlToLexical: (html: string) => Promise<unknown> = async (html) => simpleLexical(html)
async function setupLexical(payload: Payload) {
  try {
    const lexical: any = await import('@payloadcms/richtext-lexical')
    const jsdomName = 'jsdom'
    const { JSDOM } = await import(jsdomName)
    const editorConfig = await lexical.editorConfigFactory.default({ config: payload.config })
    htmlToLexical = async (html) => lexical.convertHTMLToLexical({ editorConfig, html, JSDOM })
    log('Rich text: using Payload HTML → Lexical converter')
  } catch {
    log('Rich text: Payload converter not available, using simple paragraphs')
  }
}

// ---------- schema-aware data ----------
async function shape(payload: Payload, slug: string, data: Record<string, unknown>, isGlobal = false) {
  const cfg: any = isGlobal ? payload.config.globals.find((g) => g.slug === slug) : (payload.collections as any)[slug]?.config
  if (!cfg) throw new Error(`Unknown ${isGlobal ? 'global' : 'collection'} "${slug}"`)
  const fields = new Map(flatFields(cfg.fields).map((f) => [f.name!, f]))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null || v === '') continue
    if (k === '_status') { if (cfg.versions?.drafts) out._status = v; continue }
    const f = fields.get(k)
    if (!f) { warnOnce(`${slug}.${k} is not in the schema, skipped`); continue }
    if (f.type === 'richText') out[k] = typeof v === 'string' ? await htmlToLexical(v) : v
    else if ((f.type === 'textarea' || f.type === 'text') && typeof v === 'string' && /<[a-z]/i.test(v)) out[k] = htmlToText(v)
    else out[k] = v
  }
  return out
}

async function upsert(payload: Payload, collection: string, where: Record<string, unknown>, data: Record<string, unknown>) {
  const shaped = await shape(payload, collection, data)
  if (DRY) { log(`(dry) ${collection}`, JSON.stringify(where)); return 'dry-id' as unknown as string | number }
  const found = await payload.find({ collection: collection as never, where: where as never, limit: 1, depth: 0, draft: true })
  const doc = found.docs[0]
    ? await payload.update({ collection: collection as never, id: (found.docs[0] as any).id, data: shaped as never, depth: 0 })
    : await payload.create({ collection: collection as never, data: shaped as never, depth: 0 })
  return (doc as any).id as string | number
}

// ---------- media ----------
const mediaCache = new Map<string, string | number>()
async function media(payload: Payload, rel: string | null | undefined, alt: string, credit?: string) {
  if (!rel) return undefined
  if (mediaCache.has(rel)) return mediaCache.get(rel)
  const filePath = path.join(MIGRATION_DIR, rel)
  if (!fs.existsSync(filePath)) { warnOnce(`media file missing: ${rel}`); return undefined }
  if (DRY) return undefined
  const filename = path.basename(filePath)
  // Images are converted to WebP on upload, so look for both names.
  const webp = filename.replace(/\.(jpe?g|png|gif)$/i, '.webp')
  const found = await payload.find({ collection: 'media' as never, where: { or: [{ filename: { equals: filename } }, { filename: { equals: webp } }] } as never, limit: 1, depth: 0 })
  const id = found.docs[0]
    ? (found.docs[0] as any).id
    : ((await payload.create({ collection: 'media' as never, data: (await shape(payload, 'media', { alt, credit })) as never, filePath })) as any).id
  mediaCache.set(rel, id)
  return id as string | number
}
const altFromFile = (rel: string, fallback: string) =>
  path.basename(rel).replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').replace(/\b\d{6,}\b/g, '').trim() || fallback

// ---------- main ----------
async function main() {
  if (!fs.existsSync(DATA)) throw new Error(`${DATA} not found. Run "npm run all" in /migration first.`)
  const payload = await getPayload({ config })
  await setupLexical(payload)
  const counts: Record<string, number> = {}
  const inc = (k: string) => (counts[k] = (counts[k] ?? 0) + 1)

  // waters
  const waterIds = new Map<string, string | number>()
  for (const w of read<any[]>('waters.json')) {
    const image = await media(payload, w.imageFile, `${w.name} ${w.place ?? ''}`.trim())
    const description = w.description ?? (w.place ? `<p>Wedstrijdwater in ${w.place}.</p>` : undefined)
    waterIds.set(w.slug, await upsert(payload, 'waters', { slug: { equals: w.slug } }, { name: w.name, slug: w.slug, town: w.place, address: w.address, description, image }))
    inc('waters')
  }

  // anglers
  const anglerIds = new Map<string, string | number>()
  for (const a of read<any[]>('anglers.json')) {
    anglerIds.set(a.slug, await upsert(payload, 'anglers', { name: { equals: a.name } }, { name: a.name, slug: a.slug, member: a.member, category: a.category }))
    inc('anglers')
  }

  // competitions + results
  const compIds = new Map<string, string | number>()
  for (const c of read<any[]>('competitions.json')) {
    compIds.set(c.slug, await upsert(payload, 'competitions', { slug: { equals: c.slug } }, {
      title: c.title, slug: c.slug, date: new Date(`${c.date}T12:00:00Z`).toISOString(),
      startTime: c.startTime, endTime: c.endTime, drawTime: c.drawTime, notes: c.notes,
      water: c.waterSlug ? waterIds.get(c.waterSlug) : undefined, type: c.type, season: c.season,
      countsForStandings: c.countsForStandings, status: c.status,
    }))
    inc('competitions')
  }
  for (const r of read<any[]>('results.json')) {
    const competition = compIds.get(r.competitionSlug)
    if (!competition) { warnOnce(`results for unknown competition ${r.competitionSlug}`); continue }
    const entries = r.entries
      .filter((e: any) => anglerIds.has(e.anglerSlug))
      .map((e: any) => ({ angler: anglerIds.get(e.anglerSlug), weight: e.weight ?? 0, fishCount: e.fishCount ?? undefined, peg: e.peg ?? undefined, note: e.note ?? undefined }))
    await upsert(payload, 'results', { competition: { equals: competition } }, { competition, entries, report: r.reportHtml ? htmlToText(r.reportHtml) : undefined })
    inc('results')
  }

  // board
  for (const b of read<any[]>('board-members.json')) {
    await upsert(payload, 'board-members', { name: { equals: b.name } }, { name: b.name, role: b.role, email: b.email, order: b.order })
    inc('board-members')
  }

  // news
  for (const n of read<any[]>('news.json')) {
    const cover = await media(payload, n.coverFile, n.title)
    await upsert(payload, 'news', { slug: { equals: n.slug } }, {
      title: n.title, slug: n.slug, publishedAt: n.publishedAt, cover, excerpt: n.excerpt, content: n.html || '<p></p>', category: 'nieuws', _status: 'published',
    })
    inc('news')
  }

  // pages
  for (const p of read<any[]>('pages.json')) {
    await upsert(payload, 'pages', { slug: { equals: p.slug } }, { title: p.title, slug: p.slug, content: p.html, _status: 'published' })
    inc('pages')
  }

  // albums
  for (const a of read<any[]>('albums.json')) {
    const photos: (string | number)[] = []
    for (const f of a.photoFiles) { const id = await media(payload, f, altFromFile(f, a.title)); if (id) photos.push(id) }
    await upsert(payload, 'albums', { slug: { equals: a.slug } }, {
      title: a.title, slug: a.slug, date: new Date(`${a.date}T12:00:00Z`).toISOString(), description: a.description, cover: photos[0], photos, _status: 'published',
    })
    inc('albums')
  }

  // site settings (club song etc.)
  const s = read<any>('site-settings.json')
  const clubSong = await media(payload, s.clubSongFile, "'t Plasvisserslieken (clublied)")
  const settings = await shape(payload, 'site-settings', {
    clubName: s.name, tagline: s.tagline, clubSong,
    clubhouse: s.clubhouse?.name,
    address: s.clubhouse && `${s.clubhouse.street}\n${s.clubhouse.postalCode} ${s.clubhouse.city}`,
  }, true)
  if (!DRY) await payload.updateGlobal({ slug: 'site-settings' as never, data: settings as never })

  log('Done', counts)
  if (warned.size) log(`${warned.size} warning(s), see above`)
  process.exit(0)
}

try {
  await main()
} catch (e) {
  console.error(e)
  process.exit(1)
}
