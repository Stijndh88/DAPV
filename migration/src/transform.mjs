#!/usr/bin/env node
// Turn the raw WordPress export (data/raw) into import-ready JSON (data/import)
// that matches the Payload collections in /app.
//   node src/transform.mjs [--now 2026-11-20]
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cheerio from 'cheerio'
import {
  slugify, decodeEntities, cleanResultTitle, competitionSlug, waterSlug, parsePostPath,
  parseWeight, splitNameCategory, parseDutchDate, parseTime, inferType,
} from './lib.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = process.env.MIGRATION_DATA ?? path.join(ROOT, 'data')
const RAW = path.join(DATA, 'raw')
const OUT = path.join(DATA, 'import')
const args = process.argv.slice(2)
const NOW = args.includes('--now') ? args[args.indexOf('--now') + 1] : new Date().toISOString().slice(0, 10)

const readJson = async (p, fallback) => { try { return JSON.parse(await readFile(p, 'utf8')) } catch { return fallback } }
const report = { warnings: [], anglerMatches: {}, unparsedPosts: [], counts: {} }
const warn = (m) => { report.warnings.push(m); console.warn('  ! ' + m) }

// ---------- tables ----------
function readTables(html) {
  const $ = cheerio.load(html ?? '')
  return $('table').toArray().map((t) => {
    const rows = $(t).find('tr').toArray().map((tr) => ({
      cells: $(tr).find('th,td').toArray().map((c) => $(c).text().replace(/\s+/g, ' ').trim()),
      links: $(tr).find('a[href]').toArray().map((a) => $(a).attr('href')),
      isHead: $(tr).parent().is('thead') || $(tr).find('th').length > 0,
    }))
    const headIdx = rows.findIndex((r) => r.isHead)
    const header = (headIdx >= 0 ? rows[headIdx] : rows[0])?.cells.map((c) => c.toLowerCase()) ?? []
    const body = rows.slice((headIdx >= 0 ? headIdx : 0) + 1)
    return { id: $(t).attr('id') ?? null, header, body }
  })
}

const findCol = (header, ...res) => header.findIndex((h) => res.some((re) => re.test(h)))

function parseResultsTable(t) {
  const h = t.header
  let col = {
    place: findCol(h, /^(plaats|pl\.?|rang|#)$/),
    name: findCol(h, /naam|visser|deelnemer|koppel/),
    peg: findCol(h, /^(nr\.?|nummer|stek|piket|plaatsnr\.?)$/),
    weight: findCol(h, /gewicht|kg/),
    count: findCol(h, /aantal|stuks|# ?vis/),
  }
  if (col.weight < 0 && h.length === 4) col = { place: 0, name: 1, peg: 2, weight: 3, count: -1 } // known layout
  if (col.name < 0 || col.weight < 0) return null
  const entries = []
  for (const r of t.body) {
    const c = r.cells
    const rawName = c[col.name]
    if (!rawName || /^totaal/i.test(rawName)) continue
    entries.push({
      rawName,
      weight: parseWeight(c[col.weight]),
      fishCount: col.count >= 0 ? Number.parseInt(c[col.count], 10) || null : null,
      peg: col.peg >= 0 ? (Number.parseInt(c[col.peg], 10) || null) : null,
      oldPlace: col.place >= 0 ? Number.parseInt(c[col.place], 10) || null : null,
      king: col.place >= 0 && /♚/.test(c[col.place] ?? ''),
    })
  }
  return entries.length ? entries : null
}

function parseCalendarTable(t, season) {
  const h = t.header
  const col = {
    title: findCol(h, /wedstrijd|omschrijving|naam/),
    sp: findCol(h, /^s\.?$/),
    date: findCol(h, /datum|dag/),
    water: findCol(h, /water|locatie|vijver/),
    draw: findCol(h, /trekking/),
    fish: findCol(h, /vissen|uur/),
  }
  if (col.date < 0 || col.title < 0) return []
  return t.body.flatMap((r) => {
    const c = r.cells
    const date = parseDutchDate(c[col.date], season)
    if (!c[col.title] || !date) return []
    return [{
      title: decodeEntities(c[col.title]),
      date,
      superPrestige: col.sp >= 0 && /x|s|ja|\*/i.test(c[col.sp] ?? ''),
      water: col.water >= 0 ? c[col.water] : null,
      drawTime: col.draw >= 0 ? parseTime(c[col.draw]) : null,
      fishing: col.fish >= 0 ? c[col.fish] : null,
      startTime: col.fish >= 0 ? parseTime(c[col.fish]) : null,
      endTime: col.fish >= 0 ? parseTime(String(c[col.fish]).split(/-|tot/).slice(1).join(' ')) : null,
      links: r.links,
    }]
  })
}

// ---------- html cleanup ----------
function cleanHtml(html, { dropImages = true } = {}) {
  const $ = cheerio.load(html ?? '', null, false)
  $('script,style,iframe,form,noscript,.wpcf7,.weatherwidget-io,[class*="weatherwidget"],.mejs-container,audio').remove()
  if (dropImages) $('img,figure').remove()
  $('a').each((_, a) => {
    const href = $(a).attr('href') ?? ''
    if (href.includes('weatherwidget') || href.includes('forecast7')) $(a).remove()
  })
  $('[class],[style],[id]').removeAttr('class').removeAttr('style').removeAttr('id')
  $('p').each((_, p) => { if (!$(p).text().trim() && !$(p).find('img').length) $(p).remove() })
  return $.html().trim()
}

// Smush lazy-loading puts the real URL in data-src and a data: placeholder in src
const imgSrc = (el) => [el.attribs['data-src'], el.attribs['data-lazy-src'], el.attribs.src].find((u) => u && !u.startsWith('data:')) ?? null
const firstImage = (html) => cheerio.load(html ?? '')('img').toArray().map(imgSrc).find(Boolean) ?? null

// country tags on guest anglers in result sheets; categories are s (senior), v (veteraan), j (junior)
const COUNTRIES = { D: 'Duitsland', NL: 'Nederland', F: 'Frankrijk', L: 'Luxemburg' }

// ---------- main ----------
async function main() {
  const posts = await readJson(path.join(RAW, 'posts.json'), null)
  if (!posts) throw new Error('data/raw/posts.json missing: run `npm run export` first')
  const pages = await readJson(path.join(RAW, 'pages.json'), [])
  const categories = await readJson(path.join(RAW, 'categories.json'), [])
  const media = await readJson(path.join(RAW, 'media.json'), [])
  const html = await readJson(path.join(RAW, 'html.json'), {})
  const manifest = await readJson(path.join(DATA, 'media-manifest.json'), {})
  const seed = {
    club: await readJson(path.join(ROOT, 'seed', 'club.json')),
    board: await readJson(path.join(ROOT, 'seed', 'board.json')),
    members: await readJson(path.join(ROOT, 'seed', 'members.json')),
    waters: await readJson(path.join(ROOT, 'seed', 'waters.json')),
    aliases: await readJson(path.join(ROOT, 'seed', 'angler-aliases.json'), { aliases: {}, guesses: {} }),
  }
  await mkdir(OUT, { recursive: true })

  const normUrl = (u) => u && u.replace(/^http:/, 'https:').replace('://www.', '://').replace(/\?.*$/, '')
  const localFile = (u) => {
    if (!u) return null
    const n = normUrl(u).replace(/\/photo-gallery\/(thumb|\.thumb|\.original)\//, '/photo-gallery/')
    return manifest[n] ?? manifest[n.replace(/-\d{2,4}x\d{2,4}(?=\.[a-z]+$)/i, '')] ?? null
  }
  const mediaById = new Map(media.map((m) => [m.id, m]))
  const catSlug = new Map(categories.map((c) => [c.id, c.slug]))
  const pathOf = (link) => new URL(link).pathname

  // ---- waters ----
  const waters = seed.waters.waters.map((w) => ({ ...w, slug: waterSlug(w), description: null, imageFile: null }))
  for (const w of waters) {
    const page = w.oldPath && pages.find((p) => pathOf(p.link) === w.oldPath)
    if (page) {
      w.description = cleanHtml(page.content.rendered)
      w.imageFile = localFile(firstImage(page.content.rendered))
    }
  }
  // the /vislocaties/ overview has one captioned photo per water
  const overview = pages.find((p) => p.slug === 'vislocaties')
  if (overview) {
    const $o = cheerio.load(overview.content.rendered)
    $o('figure.wp-block-image').each((_, f) => {
      const cap = $o(f).find('figcaption').text().toLowerCase()
      const img = $o(f).find('img').get(0)
      const w = img && waters.find((x) => cap.includes(x.name.toLowerCase()))
      if (w && !w.imageFile) w.imageFile = localFile(imgSrc(img))
    })
  }
  const matchWater = (cell) => {
    if (!cell) return null
    const c = cell.toLowerCase()
    // longest matching name or alias wins ("lustige lijnvissers" beats "lijnvissers")
    const score = (x) => Math.max(0, ...[x.name.toLowerCase(), ...x.aliases].filter((a) => c.includes(a)).map((a) => a.length))
    let w = waters.map((x) => [x, score(x)]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (!w) {
      w = { name: cell.trim(), place: null, slug: slugify(cell), aliases: [], description: null, imageFile: null, fromCalendar: true }
      waters.push(w)
      warn(`New water from calendar: "${cell}" (check name/address)`)
    }
    return w.slug
  }

  // ---- results posts & news ----
  const resultComps = []
  const news = []
  for (const p of posts) {
    const pp = parsePostPath(pathOf(p.link))
    const cats = p.categories.map((id) => catSlug.get(id))
    const tables = readTables(p.content.rendered)
    const entries = tables.map(parseResultsTable).find(Boolean)
    const title = decodeEntities(p.title.rendered)
    if (entries) {
      const season = Number(cats.find((c) => /wedstrijduitslagen-\d{4}/.test(c))?.slice(-4)) || pp?.year || Number(p.date.slice(0, 4))
      resultComps.push({
        slug: competitionSlug(season, p.slug),
        title: cleanResultTitle(title),
        date: p.date.slice(0, 10),
        season,
        type: inferType(cleanResultTitle(title)),
        oldPaths: [pathOf(p.link), `/?p=${p.id}`],
        entries,
        textHtml: cleanHtml(p.content.rendered.replace(/<table[\s\S]*?<\/table>/gi, '')),
      })
    } else {
      if (!cats.includes('nieuws')) report.unparsedPosts.push({ id: p.id, title, link: p.link, reason: 'no results table found; imported as news' })
      const fm = mediaById.get(p.featured_media)
      news.push({
        slug: p.slug,
        title,
        publishedAt: `${p.date_gmt}Z`,
        excerpt: cheerio.load(p.excerpt?.rendered ?? '').text().replace(/\s+/g, ' ').trim().slice(0, 300),
        html: cleanHtml(p.content.rendered),
        coverFile: localFile(fm?.source_url) ?? localFile(firstImage(p.content.rendered)),
        imageFiles: cheerio.load(p.content.rendered)('img').toArray().map((i) => localFile(imgSrc(i))).filter(Boolean),
        oldPaths: [pathOf(p.link), `/?p=${p.id}`],
      })
    }
  }

  // ---- calendars ----
  const calendarRows = []
  for (const p of pages.filter((p) => /^kalender-\d{4}$/.test(p.slug))) {
    const season = Number(p.slug.slice(-4))
    for (const t of readTables(p.content.rendered)) calendarRows.push(...parseCalendarTable(t, season).map((r) => ({ ...r, season })))
  }

  // ---- merge calendar + results into competitions ----
  const dayDiff = (a, b) => Math.abs((new Date(a) - new Date(b)) / 864e5)
  const competitions = []
  const usedResults = new Set()
  for (const row of calendarRows) {
    const linkPaths = row.links.map((l) => { try { return new URL(l, 'https://plasvissers.be').pathname } catch { return l } })
    let rc = resultComps.find((r) => !usedResults.has(r) && r.oldPaths.some((op) => linkPaths.includes(op)))
    rc ??= resultComps.find((r) => !usedResults.has(r) && r.season === row.season && dayDiff(r.date, row.date) <= 1)
    if (rc) usedResults.add(rc)
    const notes = [row.superPrestige && 'Telt mee voor de Super Prestige.'].filter(Boolean)
    // "GP Fam. Verpeten WORDT LATER GEVIST" -> status verplaatst, clean title
    const postponed = !rc && /\s*[-–(]?\s*(wordt later gevist|uitgesteld|verplaatst)\)?\s*$/i
    const isPostponed = postponed && postponed.test(row.title)
    if (isPostponed) notes.push('Uitgesteld: wordt later gevist (zo stond het op de oude kalender).')
    competitions.push({
      slug: rc?.slug ?? competitionSlug(row.season, isPostponed ? row.title.replace(postponed, '') : row.title),
      title: rc?.title ?? (isPostponed ? row.title.replace(postponed, '') : row.title),
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      drawTime: row.drawTime,
      waterSlug: matchWater(row.water),
      type: inferType(row.title),
      season: row.season,
      countsForStandings: inferType(row.title) === 'kampioenschap' || row.superPrestige,
      status: isPostponed ? 'verplaatst' : rc ? 'gespeeld' : row.date < NOW ? 'gespeeld' : 'gepland',
      notes: [...notes, !rc && !isPostponed && row.date < NOW ? 'Geen uitslag gepubliceerd op de oude website.' : null].filter(Boolean).join(' ') || null,
      oldPaths: rc?.oldPaths ?? [],
      results: rc?.entries ?? null,
      textHtml: rc?.textHtml || null,
    })
  }
  for (const rc of resultComps.filter((r) => !usedResults.has(r))) {
    competitions.push({
      slug: rc.slug, title: rc.title, date: rc.date, startTime: null, endTime: null, drawTime: null, waterSlug: null, type: rc.type, season: rc.season,
      countsForStandings: rc.type === 'kampioenschap', status: 'gespeeld', notes: null,
      oldPaths: rc.oldPaths, results: rc.entries, textHtml: rc.textHtml || null,
    })
  }
  // ---- results typed in from paper sheets (seed/results/*.txt, see its README) ----
  report.sheetDoubts = []
  const sheetDir = process.env.MIGRATION_SHEETS ?? path.join(ROOT, 'seed', 'results')
  const sheetFiles = (await readdir(sheetDir).catch(() => [])).filter((f) => f.endsWith('.txt')).sort()
  for (const file of sheetFiles) {
    const text = await readFile(path.join(sheetDir, file), 'utf8')
    const [head, body = ''] = text.split(/^---\s*$/m)
    const meta = Object.fromEntries(head.split('\n').map((l) => l.match(/^\s*([^:#]+?)\s*:\s*(.*)$/)).filter(Boolean).map((m) => [m[1].toLowerCase(), m[2].trim()]))
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.datum ?? '') || !meta.titel) { warn(`${file}: needs "datum: JJJJ-MM-DD" and "titel:"`); continue }
    const entries = []
    for (const line of body.split('\n')) {
      if (!line.trim() || line.trim().startsWith('#')) continue
      const [place, rawName, peg, weight, doubt] = line.split('|').map((x) => x.trim())
      if (!rawName) continue
      entries.push({ rawName, weight: parseWeight(weight), fishCount: null, peg: Number.parseInt(peg, 10) || null, oldPlace: Number.parseInt(place, 10) || null, king: false })
      if (doubt) report.sheetDoubts.push({ file, place: Number.parseInt(place, 10) || null, name: rawName, weight, doubt })
    }
    const season = Number(meta.datum.slice(0, 4))
    const sp = /^(ja|yes|x)$/i.test(meta['super prestige'] ?? '')
    const type = inferType(meta.titel)
    competitions.push({
      slug: competitionSlug(season, meta.titel), title: meta.titel, date: meta.datum, startTime: null, endTime: null, drawTime: null,
      waterSlug: matchWater(meta.water), type, season,
      countsForStandings: type === 'kampioenschap' || sp, status: 'gespeeld',
      notes: [sp && 'Telt mee voor de Super Prestige.', meta.bron && `Bron: ${meta.bron}.`].filter(Boolean).join(' ') || null,
      oldPaths: [], results: entries, textHtml: null,
    })
  }

  // make slugs unique within the import
  const seen = new Map()
  for (const c of competitions) {
    const n = (seen.get(c.slug) ?? 0) + 1
    seen.set(c.slug, n)
    if (n > 1) { warn(`Duplicate competition slug ${c.slug}, renamed to ${c.slug}-${n}`); c.slug = `${c.slug}-${n}` }
  }
  competitions.sort((a, b) => a.date.localeCompare(b.date))

  // ---- anglers ----
  const members = seed.members.members.map((name) => ({ name, slug: slugify(name), category: null, member: true }))
  const anglers = new Map(members.map((m) => [m.slug, m]))
  const first = (n) => n.split(' ')[0].toLowerCase()
  report.anglerGuesses = {}
  const resolveAngler = (raw) => {
    let { name, category } = splitNameCategory(raw)
    const alias = seed.aliases.aliases[name]
    if (alias) {
      if (seed.aliases.guesses[name]) report.anglerGuesses[name] = `${alias}: ${seed.aliases.guesses[name]}`
      name = alias
    }
    const lower = name.toLowerCase()
    let m = members.find((x) => x.name.toLowerCase() === lower)
    // "Pascal C." -> first name + initial of the last name
    m ??= (() => {
      const r = lower.match(/^(\S+)\s+([a-z])\.?$/)
      if (!r) return null
      const hits = members.filter((x) => first(x.name) === r[1] && x.name.split(' ').slice(1).join(' ').replace(/^(de|van|d')\s*/i, '').toLowerCase().startsWith(r[2]))
      return hits.length === 1 ? hits[0] : null
    })()
    // "Neirinckx Freddy" -> last name first
    m ??= members.find((x) => { const parts = x.name.split(' '); return `${parts.slice(1).join(' ')} ${parts[0]}`.toLowerCase() === lower })
    // "Evert" -> unique first name
    m ??= (() => { const hits = members.filter((x) => first(x.name) === lower); return hits.length === 1 ? hits[0] : null })()
    if (m) {
      if (m.name.toLowerCase() !== raw.toLowerCase()) report.anglerMatches[raw] = m.name
      if (category && !m.category) m.category = category
      return m.slug
    }
    const slug = slugify(name)
    if (!anglers.has(slug)) anglers.set(slug, { name, slug, category, member: false })
    report.anglerMatches[raw] = name === raw ? '(not on member list)' : `${name} (not on member list)`
    return slug
  }

  const results = []
  for (const c of competitions) {
    if (!c.results) continue
    const isPair = c.type === 'koppel' || c.results.some((e) => /\s~\s/.test(e.rawName))
    results.push({
      competitionSlug: c.slug,
      reportHtml: c.textHtml,
      entries: c.results.map((e) => {
        // Koningschap: "Remi (8,600kg)" = heaviest single fish, "1 (♚)" = the king
        const fish = e.rawName.match(/\s*\(([\d.,\s]+)\s*kg\)/i)
        const rawName = fish ? e.rawName.replace(fish[0], '') : e.rawName
        let pair = [rawName]
        if (isPair) {
          const parts = rawName.split(/\s*(?:\s~\s|&|\+|\sen\s)\s*/i).filter(Boolean)
          // "Werner ~ 1/2": fished on his own
          pair = parts.length > 1 && /^\d+\s*\/\s*\d+$/.test(parts[1]) ? [parts[0]] : parts
        }
        const notes = []
        // "(D)" after a guest's name is a country, not a category (s/v/j)
        const country = pair[0].match(/\s*\((D|NL|F|L)\)\s*$/i)
        if (country) {
          pair[0] = pair[0].replace(country[0], '')
          notes.push(`Gastvisser uit ${COUNTRIES[country[1].toUpperCase()]}`)
        }
        if (e.king) notes.push('Koning')
        if (fish) notes.push(`Zwaarste vis ${fish[1].trim()} kg`)
        if (pair.length > 1) notes.push(`Koppel: ${pair.join(' & ')}`)
        else if (isPair && pair[0] !== rawName) notes.push('Viste alleen')
        return {
          anglerSlug: resolveAngler(pair[0]),
          weight: e.weight,
          fishCount: e.fishCount,
          peg: e.peg,
          note: notes.length ? notes.join(' · ') : null,
          oldPlace: e.oldPlace,
        }
      }),
    })
    delete c.results
    delete c.textHtml
  }

  // ---- pages ----
  const PAGE_MAP = { ontstaan: 'geschiedenis', clubreglement: 'reglement', 'praktische-clubgegevens': 'praktisch', 'lid-worden': 'lid-worden' }
  const outPages = pages.filter((p) => PAGE_MAP[p.slug]).map((p) => ({
    slug: PAGE_MAP[p.slug],
    title: p.slug === 'ontstaan' ? 'Geschiedenis' : decodeEntities(p.title.rendered),
    html: cleanHtml(p.content.rendered),
    oldPaths: [pathOf(p.link), `/?page_id=${p.id}`],
  }))

  // ---- album ----
  const galleryHtml = (html['/bwg_gallery/fotos-2022/'] ?? '') + (html['/fotos/'] ?? '')
  const $g = cheerio.load(galleryHtml)
  const galleryFiles = [...new Set($g('img').toArray()
    .flatMap((i) => [i.attribs['data-src'], i.attribs['data-original'], i.attribs.src].filter(Boolean))
    .filter((s) => s.includes('/photo-gallery/'))
    .map(localFile).filter(Boolean))]
  const albums = galleryFiles.length ? [{
    slug: 'fotos-2022', title: "Foto's 2022", date: '2022-12-31',
    description: 'Overgezet van de vorige website.', coverFile: galleryFiles[0], photoFiles: galleryFiles,
    oldPaths: ['/fotos/', '/bwg_gallery/fotos-2022/'],
  }] : []
  if (!albums.length) warn('No gallery photos found in /fotos/ HTML')
  else warn('Album date for "Foto\'s 2022" set to 2022-12-31 (the old gallery has no date)')

  // ---- board & settings ----
  const board = seed.board.members.map((b, i) => ({ ...b, order: i + 1 }))
  const settings = { ...seed.club, clubSongFile: localFile(`https://plasvissers.be${seed.club.clubSong}`) }
  // The old MP3 starts with ~400 zero bytes, so upload type sniffing sees text/plain. Strip them.
  if (settings.clubSongFile) {
    const f = path.join(ROOT, settings.clubSongFile)
    const buf = await readFile(f).catch(() => null)
    const start = buf ? buf.findIndex((b) => b !== 0) : 0
    if (start > 0) { await writeFile(f, buf.subarray(start)); warn(`Stripped ${start} leading zero bytes from ${settings.clubSongFile}`) }
  }

  const write = (n, d) => writeFile(path.join(OUT, n), JSON.stringify(d, null, 2))
  const anglerList = [...anglers.values()]
  await Promise.all([
    write('waters.json', waters), write('competitions.json', competitions), write('results.json', results),
    write('anglers.json', anglerList), write('news.json', news), write('pages.json', outPages),
    write('albums.json', albums), write('board-members.json', board), write('site-settings.json', settings),
  ])
  report.counts = {
    posts: posts.length, resultPosts: resultComps.length, news: news.length, calendarRows: calendarRows.length,
    competitions: competitions.length, results: results.length, resultEntries: results.reduce((s, r) => s + r.entries.length, 0),
    anglers: anglerList.length, waters: waters.length, pages: outPages.length, albumPhotos: galleryFiles.length,
  }
  await write('report.json', report)
  console.log('Transform done:', report.counts)
}

main().catch((e) => { console.error(e); process.exit(1) })
