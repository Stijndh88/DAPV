// Runs the transform on a small fixture shaped like the real WordPress REST output
// (TablePress markup, Yoast-style links). Fixture values are test data only.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseWeight, parseDutchDate, splitNameCategory, competitionSlug, cleanResultTitle } from '../src/lib.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('helpers', () => {
  assert.equal(parseWeight('24,840'), 24.84)
  assert.equal(parseWeight('1.234,5 kg'), 1234.5)
  assert.equal(parseWeight('8.620'), 8.62)
  assert.equal(parseWeight(''), null)
  assert.equal(parseDutchDate('za 2 april', 2022), '2022-04-02')
  assert.equal(parseDutchDate('15/04/2023', 2023), '2023-04-15')
  assert.equal(parseDutchDate('8-4', 2023), '2023-04-08')
  assert.deepEqual(splitNameCategory('Pascal C. (v)'), { name: 'Pascal C.', category: 'v' })
  assert.equal(competitionSlug(2022, 'uitslag-wedstrijd-gp-familie-arijs-2'), '2022-gp-familie-arijs')
  assert.equal(cleanResultTitle('Uitslag 1e Reeks Kampioenschap'), '1e Reeks Kampioenschap')
})

const table = (id, head, rows) => `<table id="tablepress-${id}" class="tablepress"><thead><tr class="row-1">${head.map((h, i) => `<th class="column-${i + 1}">${h}</th>`).join('')}</tr></thead><tbody class="row-hover">${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`

test('transform builds competitions, results, anglers and news', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pv-'))
  await mkdir(path.join(dir, 'raw'), { recursive: true })
  const posts = [
    { id: 846, date: '2023-04-15T21:01:07', date_gmt: '2023-04-15T19:01:07', slug: 'uitslag-1e-reeks-kampioenschap-2', link: 'https://plasvissers.be/2023/04/15/uitslag-1e-reeks-kampioenschap-2/', title: { rendered: 'Uitslag 1e Reeks Kampioenschap' }, categories: [8], featured_media: 0, excerpt: { rendered: '' },
      content: { rendered: table(45, ['Plaats', 'Visserke vis', 'Nr.', 'Gewicht'], [['1', 'Evert', '7', '24,840'], ['2', 'Pascal C. (v)', '3', '12,100'], ['3', 'Mekkes', '9', '4,860'], ['', '', '', '']]) } },
    { id: 838, date: '2023-04-08T20:49:38', date_gmt: '2023-04-08T18:49:38', slug: 'gp-fam-arijs', link: 'https://plasvissers.be/2023/04/08/gp-fam-arijs/', title: { rendered: 'GP Fam. Arijs' }, categories: [8], featured_media: 0, excerpt: { rendered: '' },
      content: { rendered: table(44, ['Plaats', 'Visserke vis', 'Nr.', 'Gewicht'], [['1', 'Neirinckx Freddy', '1', '95,820']]) } },
    { id: 503, date: '2021-06-21T10:00:00', date_gmt: '2021-06-21T08:00:00', slug: 'trekking-koppelvissing-26-06', link: 'https://plasvissers.be/2021/06/21/trekking-koppelvissing-26-06/', title: { rendered: 'Trekking koppelvissing 26/06' }, categories: [5], featured_media: 0, excerpt: { rendered: '<p>De koppels</p>' },
      content: { rendered: '<p>De koppels zijn getrokken.</p><img src="https://plasvissers.be/wp-content/uploads/2022/07/raffle_small-840x560.jpg">' } },
  ]
  const pages = [
    { id: 804, slug: 'kalender-2023', link: 'https://plasvissers.be/kalender-2023/', title: { rendered: 'Kalender 2023' },
      content: { rendered: table(42, ['Wedstrijd', 'S', 'Datum', 'Water', 'Trekking', 'Vissen van ... tot ...'], [
        ['<a href="https://plasvissers.be/2023/04/08/gp-fam-arijs/">GP Fam. Arijs</a>', 'S', 'za 8 april', 'Meerse Lijnvissers', '12u30', '13u30 - 17u30'],
        ['1° Reeks Kampioenschap', '', '15/04', 'Donk', '12u30', '13u30 - 17u30'],
        ['GP Café De Parking', '', '30/09', 'Nieuwe Plas', '12u30', '13u30 - 17u30'],
      ]) } },
    { id: 22, slug: 'ontstaan', link: 'https://plasvissers.be/ontstaan/', title: { rendered: 'Ontstaan' }, content: { rendered: '<p>Opgericht in 1969.</p><script>x</script>' } },
  ]
  const categories = [{ id: 5, slug: 'nieuws' }, { id: 8, slug: 'wedstrijduitslagen-2023' }]
  for (const [n, d] of Object.entries({ posts, pages, categories, media: [] })) await writeFile(path.join(dir, 'raw', `${n}.json`), JSON.stringify(d))
  await writeFile(path.join(dir, 'raw', 'html.json'), '{}')
  await writeFile(path.join(dir, 'media-manifest.json'), JSON.stringify({ 'https://plasvissers.be/wp-content/uploads/2022/07/raffle_small.jpg': 'data/media/2022/07/raffle_small.jpg' }))

  execFileSync(process.execPath, [path.join(ROOT, 'src/transform.mjs'), '--now', '2026-11-20'], { env: { ...process.env, MIGRATION_DATA: dir }, stdio: 'pipe' })
  const read = async (n) => JSON.parse(await readFile(path.join(dir, 'import', n), 'utf8'))

  const comps = await read('competitions.json')
  assert.equal(comps.length, 3)
  const arijs = comps.find((c) => c.slug === '2023-gp-fam-arijs')
  assert.equal(arijs.waterSlug, 'de-meerse-lijnvissers-mere')
  assert.equal(arijs.startTime, '13:30')
  assert.equal(arijs.status, 'gespeeld')
  assert.ok(arijs.countsForStandings) // Super Prestige
  const reeks = comps.find((c) => c.slug === '2023-1e-reeks-kampioenschap')
  assert.equal(reeks.type, 'kampioenschap')
  assert.equal(reeks.waterSlug, 'donkvissers-mere')
  const parking = comps.find((c) => c.title === 'GP Café De Parking')
  assert.match(parking.notes, /Geen uitslag/)

  const results = await read('results.json')
  assert.equal(results.length, 2)
  const r = results.find((x) => x.competitionSlug === '2023-1e-reeks-kampioenschap')
  assert.equal(r.entries.length, 3) // empty row skipped
  assert.deepEqual(r.entries.map((e) => e.anglerSlug), ['evert-de-wuffel', 'pascal-cornand', 'mekkes'])
  assert.equal(r.entries[0].weight, 24.84)
  assert.equal(results.find((x) => x.competitionSlug === '2023-gp-fam-arijs').entries[0].anglerSlug, 'freddy-neirinckx')

  const anglers = await read('anglers.json')
  assert.equal(anglers.find((a) => a.slug === 'pascal-cornand').category, 'v')
  assert.equal(anglers.find((a) => a.slug === 'mekkes').member, false)

  const news = await read('news.json')
  assert.equal(news.length, 1)
  assert.equal(news[0].coverFile, 'data/media/2022/07/raffle_small.jpg')
  assert.doesNotMatch(news[0].html, /<img/)

  const pagesOut = await read('pages.json')
  assert.equal(pagesOut[0].slug, 'geschiedenis')
  assert.doesNotMatch(pagesOut[0].html, /script/)
})
