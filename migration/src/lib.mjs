// Shared helpers for export, transform and redirects. No dependencies.

export const slugify = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[“”"'’‘´`]/g, '')
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Decode the handful of HTML entities WordPress puts in titles. */
export const decodeEntities = (s) =>
  String(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')

/** "uitslag-wedstrijd-gp-familie-arijs-2" -> "gp-familie-arijs" */
export const cleanResultSlug = (wpSlug) =>
  wpSlug
    .replace(/^uitslag-wedstrijd-/, '')
    .replace(/^uitslag-/, '')
    .replace(/-\d$/, '')

/** Title shown on the new site, from the WP post title. */
export const cleanResultTitle = (title) =>
  decodeEntities(title)
    .replace(/^uitslag\s+(wedstrijd\s+)?/i, '')
    .replace(/^\s*[:\-–]\s*/, '')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())

/** Competition slug used by both the importer and the redirect map. */
export const competitionSlug = (season, wpSlugOrTitle) => `${season}-${slugify(cleanResultSlug(slugify(wpSlugOrTitle)))}`

export const waterSlug = (w) => {
  const name = slugify(w.name), place = w.place ? slugify(w.place) : ''
  return !place || name.includes(place) ? name : `${name}-${place}`
}

/** "/2022/09/24/gp-familie-bassleer-2/" -> { year: 2022, month: 9, day: 24, slug } */
export const parsePostPath = (p) => {
  const m = p.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)\/?$/)
  return m ? { year: +m[1], month: +m[2], day: +m[3], slug: m[4] } : null
}

/** Belgian weight "24,840" / "24.840" / "24,840 kg" -> 24.84 (kg). Empty -> null. */
export const parseWeight = (s) => {
  const t = String(s ?? '').replace(/kg/i, '').replace(/\s/g, '')
  if (!t || t === '-' ) return null
  // "1.234,5" -> thousands dot + decimal comma
  const n = /,/.test(t) ? t.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.') : t
  const v = Number.parseFloat(n)
  return Number.isFinite(v) ? v : null
}

/** "Pascal C. (v)" -> { name: "Pascal C.", category: "v" } */
export const splitNameCategory = (raw) => {
  const s = decodeEntities(raw).replace(/\s+/g, ' ').trim()
  const m = s.match(/^(.*?)\s*\(([a-z]{1,3})\)\s*$/i)
  return m ? { name: m[1].trim(), category: m[2].toLowerCase() } : { name: s, category: null }
}

const MONTHS = {
  jan: 1, januari: 1, feb: 2, februari: 2, maa: 3, mrt: 3, maart: 3, apr: 4, april: 4, mei: 5,
  jun: 6, juni: 6, jul: 7, juli: 7, aug: 8, augustus: 8, sep: 9, sept: 9, september: 9,
  okt: 10, oktober: 10, nov: 11, november: 11, dec: 12, december: 12,
}

/** Calendar date cell -> "YYYY-MM-DD" or null. Accepts 2/4/2022, 02-04, "za 2 april", "2 apr." */
export const parseDutchDate = (cell, season) => {
  const s = String(cell ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
  let d, m, y
  let r = s.match(/(\d{1,2})[/.\-](\d{1,2})(?:[/.\-](\d{2,4}))?/)
  if (r) [d, m, y] = [+r[1], +r[2], r[3] ? +r[3] : season]
  else if ((r = s.match(/(\d{1,2})\s+([a-z]+)\.?(?:\s+(\d{4}))?/)) && MONTHS[r[2]] ) {
    ;[d, m, y] = [+r[1], MONTHS[r[2]], r[3] ? +r[3] : season]
  } else return null
  if (y < 100) y += 2000
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** "13u30", "13:30", "13.30 - 17.30" -> "13:30" (first time in the cell) */
export const parseTime = (cell) => {
  const r = String(cell ?? '').match(/(\d{1,2})\s*[:.uh]\s*(\d{2})?/i)
  return r ? `${r[1].padStart(2, '0')}:${r[2] ?? '00'}` : null
}

/**
 * Paper calendar cells: trekking "7u45" (sometimes a date), vissen "9u00-12u00/13u30-17u00" or "10u00 tot 16u00".
 * Start = first time, end = last time, and the break between two parts.
 */
export const parseFishing = (draw, fishing) => {
  const times = [...String(fishing ?? '').matchAll(/(\d{1,2})\s*[:.uh]\s*(\d{2})/gi)].map((m) => `${m[1].padStart(2, '0')}:${m[2]}`)
  const d = String(draw ?? '').trim()
  const isTime = /^\d{1,2}\s*[:.uh]\s*\d{0,2}(?![\d/])/i.test(d) // "7u45", "12u lokaal"; not "15/06/26"
  const extra = isTime ? d.replace(/^\d{1,2}\s*[:.uh]\s*\d{0,2}\s*/i, '') : d
  return {
    drawTime: isTime ? parseTime(d) : null,
    drawNote: !extra ? null : isTime ? `Loting: ${d}.` : `Op de kalender staat bij de loting: ${d}.`,
    startTime: times[0] ?? null,
    endTime: times.length > 1 ? times[times.length - 1] : null,
    // two parts with a weigh-in between: "9u00-12u00/13u30-17u00"
    breakStart: times.length === 4 ? times[1] : null,
    breakEnd: times.length === 4 ? times[2] : null,
  }
}

export const inferType = (title) => {
  const t = title.toLowerCase()
  if (/reeks|kampioenschap/.test(t)) return 'kampioenschap'
  if (/koppel/.test(t)) return 'koppel'
  if (/avond|nacht/.test(t)) return 'nacht'
  if (/jeugd/.test(t)) return 'jeugd'
  if (/belgi|duitsland|schwerte|vriendschap/.test(t)) return 'vriendschappelijk'
  if (/^gp\b|grote prijs/.test(t)) return 'club'
  return 'andere' // koningschap, marathon, ...
}
