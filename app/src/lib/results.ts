/** Pure helpers for parsing pasted results and ranking them. Shared by hooks, seed and importer. */

export type ParsedLine = { name: string; weight: number; fishCount?: number; note?: string; category?: string }

const toNumber = (raw: string | undefined): number | undefined => {
  if (raw == null) return undefined
  const cleaned = raw.trim().replace(/\s|kg|gr?|g$/gi, '')
  if (!cleaned) return undefined
  // Accept "4,350" (Belgian decimal) and "4350" grams.
  const n = Number(cleaned.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

/**
 * Accepts lines like (tab, semicolon or two+ spaces separated, as copied from Excel):
 *   Jan Peeters;4,350;12
 *   1  Jan Peeters  4350  12
 * Weight > 100 is treated as grams and converted to kg. An optional leading place number is ignored.
 */
export function parseResultsPaste(text: string): ParsedLine[] {
  const out: ParsedLine[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const sep = /\t|;/.test(line) ? /\t|;/ : /\s{2,}/
    let parts = line.split(sep).map((p) => p.trim()).filter(Boolean)
    if (parts.length === 1) {
      // "Jan Peeters 4,350 12" single-space fallback: peel numbers off the end
      const m = line.match(/^(.*?)\s+([\d.,]+)\s*(?:kg|g)?(?:\s+(\d+))?$/i)
      if (m) parts = [m[1], m[2], m[3]].filter(Boolean) as string[]
    }
    if (parts.length && /^\d{1,3}\.?$/.test(parts[0]) && parts.length >= 3 && isNaN(Number(parts[1].replace(',', '.')))) {
      parts.shift() // leading place number
    }
    const [name, w, c, ...rest] = parts
    if (!name || /^(naam|name|visser|plaats)$/i.test(name)) continue // header row
    let weight = toNumber(w) ?? 0
    if (weight > 100) weight = weight / 1000
    const cat = name.match(/\s*\(([a-z]{1,3})\)\s*$/i)
    out.push({
      name: name.replace(/\s*\([a-z]{1,3}\)\s*$/i, '').replace(/\s+/g, ' '),
      category: cat ? cat[1].toLowerCase() : undefined,
      weight: Math.round(weight * 1000) / 1000,
      fishCount: c ? Math.round(toNumber(c) ?? 0) : undefined,
      note: rest.length ? rest.join(' ') : undefined,
    })
  }
  return out
}

export type RankableEntry = { weight?: number | null; place?: number | null; points?: number | null; disqualified?: boolean | null }

/**
 * Sort by weight (desc) and assign places; equal weights share a place.
 * Points: winner gets N points, last gets 1 (N = number of anglers). Blank (0 kg) gets 1 point.
 * Disqualified entries go last with 0 points.
 */
export function rankEntries<T extends RankableEntry>(entries: T[]): T[] {
  const valid = entries.filter((e) => !e.disqualified)
  const dq = entries.filter((e) => e.disqualified)
  valid.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
  const n = valid.length
  let lastWeight: number | null = null
  let lastPlace = 0
  valid.forEach((e, i) => {
    const w = e.weight ?? 0
    const place = lastWeight !== null && w === lastWeight ? lastPlace : i + 1
    lastWeight = w
    lastPlace = place
    e.place = place
    e.points = w > 0 ? n - place + 1 : 1
  })
  dq.forEach((e) => {
    e.place = null
    e.points = 0
  })
  return [...valid, ...dq]
}
