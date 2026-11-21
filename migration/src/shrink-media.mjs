// Shrinks the photos the import uses to at most 2560 px (JPEG quality 85), so they fit in git.
// The site makes its own smaller sizes on upload; originals stay in the full export archive.
// Needs ImageMagick (`convert`); without it, files are left as they are.
import { readFile, stat } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(process.env.MIGRATION_DATA ?? path.join(ROOT, 'data'), 'import')
const LIMIT = 1_500_000

let hasConvert = true
try { execFileSync('convert', ['-version'], { stdio: 'ignore' }) } catch { hasConvert = false }
if (!hasConvert) { console.log('shrink-media: ImageMagick not found, skipped'); process.exit(0) }

const files = new Set()
for (const n of ['waters', 'news', 'pages', 'albums', 'board-members']) {
  const text = await readFile(path.join(OUT, `${n}.json`), 'utf8').catch(() => '')
  for (const m of text.match(/data\/media\/[^"]+\.(jpe?g|png)/gi) ?? []) files.add(m)
}
let n = 0
for (const f of files) {
  const abs = path.join(ROOT, f)
  const s = await stat(abs).catch(() => null)
  if (!s || s.size <= LIMIT) continue
  const args = /\.png$/i.test(f) ? [abs, '-resize', '2560x2560>', abs] : [abs, '-resize', '2560x2560>', '-quality', '85', abs]
  execFileSync('convert', args)
  n++
}
console.log(`shrink-media: ${n} of ${files.size} photos made smaller`)
