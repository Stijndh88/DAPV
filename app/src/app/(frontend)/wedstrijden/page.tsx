import Link from 'next/link'
import type { Metadata } from 'next'
import type { Competition, Result, Water } from '@/payload-types'
import { payload } from '@/lib/payload'
import { getSeasons } from '@/lib/standings'
import { daysUntil, fmtDate, fmtKg, relativeDay, typeLabel } from '@/lib/format'
import { localDay } from '@/lib/calendar'

export const metadata: Metadata = { title: 'Wedstrijden', description: 'Kalender en uitslagen van alle wedstrijden.' }

type Props = { searchParams: Promise<{ seizoen?: string; weergave?: string }> }

const waterOf = (c: Competition) => (c.water && typeof c.water === 'object' ? (c.water as Water) : null)
const isEvent = (c: Competition) => !c.startTime && !c.drawTime && c.type === 'andere' // a party, not a match

export default async function Wedstrijden({ searchParams }: Props) {
  const p = await payload()
  const seasons = await getSeasons()
  const sp = await searchParams
  const current = new Date().getFullYear()
  const season = Number(sp.seizoen) || (seasons.includes(current) ? current : seasons[0] ?? current)
  const view = sp.weergave === 'overzicht' ? 'overzicht' : 'lijst'
  const q = (s: number, v = view) => `/wedstrijden?seizoen=${s}${v === 'overzicht' ? '&weergave=overzicht' : ''}`

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

  const next = comps.docs.find((c) => daysUntil(c.date) >= 0 && c.status !== 'afgelast')
  const last = comps.docs.at(-1)
  const seasonOver = !!last && daysUntil(last.date) < 0
  const played = comps.docs.filter((c) => daysUntil(c.date) < 0 && !isEvent(c)).length
  const total = comps.docs.filter((c) => !isEvent(c)).length

  const byMonth = new Map<string, Competition[]>()
  for (const c of comps.docs) {
    const key = fmtDate(c.date, { month: 'long' })
    byMonth.set(key, [...(byMonth.get(key) ?? []), c])
  }

  return (
    <div className="wrap">
      <header className="page-head">
        <h1>Wedstrijden {season}</h1>
        <p>
          {total > 0 && (
            <>
              {total} wedstrijden
              {played > 0 && played < total ? `, waarvan ${played} gevist` : ''}.{' '}
            </>
          )}
          Iedereen is welkom. Kom op tijd voor de loting, en neem je visvergunning mee.
        </p>
      </header>

      <div className="cal-bar">
        {seasons.length > 1 && (
          <nav className="season-switch" aria-label="Seizoen kiezen">
            {seasons.map((s) => (
              <Link key={s} href={q(s)} aria-current={s === season ? 'page' : undefined}>
                {s}
              </Link>
            ))}
          </nav>
        )}
        <nav className="view-switch" aria-label="Weergave">
          <Link href={q(season, 'lijst')} aria-current={view === 'lijst' ? 'page' : undefined}>
            Lijst
          </Link>
          <Link href={q(season, 'overzicht')} aria-current={view === 'overzicht' ? 'page' : undefined}>
            Seizoen in één blik
          </Link>
        </nav>
      </div>

      {next && season === current && (
        <p className="next-up">
          Volgende wedstrijd <strong>{relativeDay(next.date) || fmtDate(next.date, { day: 'numeric', month: 'long' })}</strong>:{' '}
          <Link href={`/wedstrijden/${next.slug}`}>{next.title}</Link>
          {waterOf(next) ? ` aan ${waterOf(next)!.name}` : ''}.
        </p>
      )}
      {seasonOver && season === current && (
        <p className="next-up">
          Seizoen {season} zit erop. De kalender voor {season + 1} komt hier zodra het bestuur de data vastlegt.
        </p>
      )}

      {comps.docs.length === 0 && <p className="empty">Voor dit seizoen staan nog geen wedstrijden op de kalender.</p>}

      {view === 'overzicht' ? (
        <SeasonGrid comps={comps.docs} season={season} nextId={next?.id} />
      ) : (
        [...byMonth.entries()].map(([month, list]) => (
          <section key={month} className="month" aria-labelledby={`m-${month}`}>
            <h2 className="month__name" id={`m-${month}`}>
              {month}
            </h2>
            <div>
              {list.map((c) => {
                const r = resultFor(c)
                const top = r?.entries?.[0]
                const past = daysUntil(c.date) < 0
                const water = waterOf(c)
                const town = water?.town && !water.name.toLowerCase().includes(water.town.toLowerCase()) ? `, ${water.town}` : ''
                return (
                  <Link
                    key={c.id}
                    href={`/wedstrijden/${c.slug}`}
                    className={`match ${past ? 'is-past' : ''} ${c.status === 'afgelast' ? 'is-cancelled' : ''} ${c.id === next?.id ? 'is-next' : ''}`}
                  >
                    <span className="match__date">
                      {fmtDate(c.date, { day: 'numeric' })}
                      <small>{fmtDate(c.date, { weekday: 'short' })}</small>
                    </span>
                    <span>
                      <span className="match__title">
                        {c.title}
                        {c.id === next?.id && <span className="tag tag--next">Volgende</span>}
                        {c.status === 'afgelast' && <span className="tag tag--warn">Afgelast</span>}
                        {c.status === 'verplaatst' && <span className="tag tag--warn">Verplaatst</span>}
                        {c.type && c.type !== 'club' && !isEvent(c) && !(c.title ?? '').toLowerCase().includes(c.type) && (
                          <span className="tag">{typeLabel[c.type]}</span>
                        )}
                      </span>
                      <br />
                      <span className="match__where">
                        {water ? `${water.name}${town}` : isEvent(c) ? 'Clubactiviteit' : 'Viswater volgt'}
                        {c.drawTime ? `, loting ${c.drawTime}` : c.startTime ? `, ${c.startTime}` : ''}
                        {c.countsForStandings ? ', Super Prestige' : ''}
                      </span>
                    </span>
                    <span className="match__side">
                      {top && typeof top.angler === 'object' ? (
                        <>
                          <strong>{top.angler.name}</strong>
                          {fmtKg(top.weight)} kg
                        </>
                      ) : past ? (
                        isEvent(c) ? '' : daysUntil(c.date) < -30 ? 'Geen uitslag' : 'Uitslag volgt'
                      ) : (
                        c.price ?? ''
                      )}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        ))
      )}

      <section className="subscribe" aria-labelledby="sub-title">
        <h2 id="sub-title">Altijd de kalender op je gsm</h2>
        <p>
          Abonneer je één keer en je agenda toont elke wedstrijd met loting, uren en viswater. Verandert er iets, dan past je agenda zich
          vanzelf aan.
        </p>
        <p className="subscribe__actions">
          <a className="btn btn--primary" href="/kalender.ics">
            Kalender downloaden
          </a>
        </p>
        <details>
          <summary>Zo zet je hem in Google Agenda of op een iPhone</summary>
          <ol>
            <li>
              <strong>Google Agenda:</strong> open Google Agenda op een computer, kies <em>Andere agenda’s</em>, dan <em>Via URL</em>, en plak het adres van
              de knop hierboven (rechtsklik, link kopiëren).
            </li>
            <li>
              <strong>iPhone:</strong> ga naar Instellingen, Agenda, Accounts, Voeg account toe, Andere, <em>Voeg agenda-abonnement toe</em>, en plak het adres.
            </li>
            <li>
              <strong>Eén wedstrijd:</strong> op elke wedstrijdpagina staat een knop <em>Zet in je agenda</em>.
            </li>
          </ol>
        </details>
      </section>
    </div>
  )
}

/** Every month of the season as a small calendar; match days are marked and link to the match. */
function SeasonGrid({ comps, season, nextId }: { comps: Competition[]; season: number; nextId?: number | string }) {
  const byDay = new Map<string, Competition[]>()
  for (const c of comps) byDay.set(localDay(c.date), [...(byDay.get(localDay(c.date)) ?? []), c])
  const months = [...new Set(comps.map((c) => Number(localDay(c.date).slice(5, 7))))].sort((a, b) => a - b)
  const today = localDay(new Date())
  const dayNames = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
  return (
    <div className="season-grid">
      {months.map((m) => {
        const first = new Date(Date.UTC(season, m - 1, 1))
        const days = new Date(Date.UTC(season, m, 0)).getUTCDate()
        const lead = (first.getUTCDay() + 6) % 7 // Monday first
        const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
        return (
          <section key={m} className="mini-month" aria-label={fmtDate(first, { month: 'long', year: 'numeric' })}>
            <h2>{fmtDate(first, { month: 'long' })}</h2>
            <div className="mini-month__grid" role="presentation">
              {dayNames.map((d) => (
                <span key={d} className="mini-month__dow" aria-hidden="true">
                  {d}
                </span>
              ))}
              {cells.map((d, i) => {
                if (!d) return <span key={`x${i}`} />
                const key = `${season}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const list = byDay.get(key)
                const cls = ['mini-day', key === today ? 'is-today' : '', key < today ? 'is-past' : ''].join(' ')
                if (!list) return <span key={key} className={cls}>{d}</span>
                const c = list[0]
                return (
                  <Link
                    key={key}
                    href={`/wedstrijden/${c.slug}`}
                    className={`${cls} has-match ${c.id === nextId ? 'is-next' : ''} ${c.status === 'afgelast' ? 'is-cancelled' : ''} ${isEvent(c) ? 'is-event' : ''}`}
                    title={list.map((x) => x.title).join(', ')}
                  >
                    {d}
                    <span className="sr-only">: {list.map((x) => x.title).join(', ')}</span>
                  </Link>
                )
              })}
            </div>
            <ul className="mini-month__list">
              {comps
                .filter((c) => Number(localDay(c.date).slice(5, 7)) === m)
                .map((c) => (
                  <li key={c.id}>
                    <span>{Number(localDay(c.date).slice(8))}</span> <Link href={`/wedstrijden/${c.slug}`}>{c.title}</Link>
                  </li>
                ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
