import type { Angler, Competition, Result } from '@/payload-types'
import { payload, getSettings } from './payload'

export type StandingRow = {
  angler: Pick<Angler, 'id' | 'name' | 'slug'>
  total: number
  totalWeight: number
  matches: number
  wins: number
  perMatch: Record<string, { points: number; weight: number; place: number | null; dropped?: boolean }>
}

export async function getSeasons(): Promise<number[]> {
  const p = await payload()
  const res = await p.find({ collection: 'competitions', limit: 1000, depth: 0, select: { season: true }, pagination: false })
  const set = new Set<number>()
  res.docs.forEach((d) => d.season && set.add(d.season))
  return [...set].sort((a, b) => b - a)
}

export async function getStandings(season: number) {
  const p = await payload()
  const settings = await getSettings()
  const method = settings.standingsMethod ?? 'points'
  const dropWorst = settings.dropWorst ?? 0
  const membersOnly = settings.membersOnly ?? true

  const comps = await p.find({
    collection: 'competitions',
    where: { and: [{ season: { equals: season } }, { countsForStandings: { equals: true } }] },
    sort: 'date',
    limit: 200,
    depth: 0,
    pagination: false,
  })
  const compIds = comps.docs.map((c) => c.id)
  const results = compIds.length
    ? await p.find({ collection: 'results', where: { competition: { in: compIds } }, depth: 1, limit: 200, pagination: false })
    : { docs: [] as Result[] }

  const rows = new Map<string, StandingRow>()
  const played: Competition[] = []
  for (const comp of comps.docs) {
    const r = results.docs.find((x) => (typeof x.competition === 'object' ? x.competition.id : x.competition) === comp.id)
    if (!r) continue
    played.push(comp)
    for (const e of r.entries ?? []) {
      const a = e.angler
      if (!a || typeof a !== 'object') continue
      if (membersOnly && a.member === false) continue
      const key = String(a.id)
      const row =
        rows.get(key) ??
        ({ angler: { id: a.id, name: a.name, slug: a.slug }, total: 0, totalWeight: 0, matches: 0, wins: 0, perMatch: {} } as StandingRow)
      row.perMatch[String(comp.id)] = { points: e.points ?? 0, weight: e.weight ?? 0, place: e.place ?? null }
      row.matches += 1
      row.totalWeight += e.weight ?? 0
      if (e.place === 1) row.wins += 1
      rows.set(key, row)
    }
  }

  for (const row of rows.values()) {
    const scores = Object.entries(row.perMatch).map(([id, m]) => ({ id, v: method === 'weight' ? m.weight : m.points }))
    scores.sort((a, b) => a.v - b.v)
    const drop = new Set(scores.slice(0, Math.min(dropWorst, Math.max(0, scores.length - 1))).map((s) => s.id))
    drop.forEach((id) => (row.perMatch[id].dropped = true))
    row.total = scores.filter((s) => !drop.has(s.id)).reduce((sum, s) => sum + s.v, 0)
    row.total = Math.round(row.total * 1000) / 1000
    row.totalWeight = Math.round(row.totalWeight * 1000) / 1000
  }

  const sorted = [...rows.values()].sort((a, b) => b.total - a.total || b.totalWeight - a.totalWeight || b.wins - a.wins)
  return { season, method, dropWorst, competitions: played, rows: sorted, plannedCount: comps.docs.length }
}

/**
 * Standings to show when no season is chosen: the given season if it has results,
 * otherwise the most recent earlier season that does (a new season's calendar
 * can exist before its first result, and old seasons may lack published results).
 */
export async function getLatestStandings(preferred: number) {
  const first = await getStandings(preferred)
  if (first.rows.length) return first
  for (const y of (await getSeasons()).filter((y) => y < preferred)) {
    const s = await getStandings(y)
    if (s.rows.length) return s
  }
  return first
}
