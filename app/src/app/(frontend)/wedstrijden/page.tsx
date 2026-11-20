import Link from 'next/link'
import type { Metadata } from 'next'
import type { Competition, Result, Water } from '@/payload-types'
import { payload } from '@/lib/payload'
import { getSeasons } from '@/lib/standings'
import { daysUntil, fmtDate, fmtKg, typeLabel } from '@/lib/format'

export const metadata: Metadata = { title: 'Wedstrijden', description: 'Kalender en uitslagen van alle wedstrijden.' }

type Props = { searchParams: Promise<{ seizoen?: string }> }

export default async function Wedstrijden({ searchParams }: Props) {
  const p = await payload()
  const seasons = await getSeasons()
  const sp = await searchParams
  const current = new Date().getFullYear()
  const season = Number(sp.seizoen) || (seasons.includes(current) ? current : seasons[0] ?? current)

  const comps = await p.find({ collection: 'competitions', where: { season: { equals: season } }, sort: 'date', limit: 200, depth: 1, pagination: false })
  const results = await p.find({
    collection: 'results',
    where: { competition: { in: comps.docs.map((c) => c.id) } },
    depth: 1,
    limit: 200,
    pagination: false,
  })
  const resultFor = (c: Competition): Result | undefined =>
    results.docs.find((r) => (typeof r.competition === 'object' ? r.competition.id : r.competition) === c.id)

  const byMonth = new Map<string, Competition[]>()
  for (const c of comps.docs) {
    const key = fmtDate(c.date, { month: 'long' })
    byMonth.set(key, [...(byMonth.get(key) ?? []), c])
  }

  return (
    <div className="wrap">
      <header className="page-head">
        <h1>Wedstrijden {season}</h1>
        <p>Iedereen is welkom. Kom op tijd voor de loting, en neem je visvergunning mee.</p>
      </header>
      {seasons.length > 1 && (
        <nav className="season-switch" aria-label="Seizoen kiezen">
          {seasons.map((s) => (
            <Link key={s} href={`/wedstrijden?seizoen=${s}`} aria-current={s === season ? 'page' : undefined}>
              {s}
            </Link>
          ))}
        </nav>
      )}
      {comps.docs.length === 0 && <p className="empty">Voor dit seizoen staan nog geen wedstrijden op de kalender.</p>}
      {[...byMonth.entries()].map(([month, list]) => (
        <section key={month} className="month" aria-labelledby={`m-${month}`}>
          <h2 className="month__name" id={`m-${month}`}>
            {month}
          </h2>
          <div>
            {list.map((c) => {
              const r = resultFor(c)
              const top = r?.entries?.[0]
              const past = daysUntil(c.date) < 0
              const water = c.water && typeof c.water === 'object' ? (c.water as Water) : null
              return (
                <Link
                  key={c.id}
                  href={`/wedstrijden/${c.slug}`}
                  className={`match ${past ? 'is-past' : ''} ${c.status === 'afgelast' ? 'is-cancelled' : ''}`}
                >
                  <span className="match__date">
                    {fmtDate(c.date, { day: 'numeric' })}
                    <small>{fmtDate(c.date, { weekday: 'short' })}</small>
                  </span>
                  <span>
                    <span className="match__title">
                      {c.title}
                      {c.status === 'afgelast' && <span className="tag tag--warn">Afgelast</span>}
                      {c.status === 'verplaatst' && <span className="tag tag--warn">Verplaatst</span>}
                      {c.type && c.type !== 'club' && !(c.title ?? '').toLowerCase().includes(c.type) && <span className="tag">{typeLabel[c.type]}</span>}
                    </span>
                    <br />
                    <span className="match__where">
                      {water?.name ?? 'Viswater volgt'}
                      {c.startTime ? `, ${c.startTime}${c.endTime ? ` tot ${c.endTime}` : ''}` : ''}
                    </span>
                  </span>
                  <span className="match__side">
                    {top && typeof top.angler === 'object' ? (
                      <>
                        <strong>{top.angler.name}</strong>
                        {fmtKg(top.weight)} kg
                      </>
                    ) : past ? (
                      'Uitslag volgt'
                    ) : (
                      c.price ?? ''
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
