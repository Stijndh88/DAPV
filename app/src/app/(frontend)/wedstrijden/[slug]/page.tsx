import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Water } from '@/payload-types'
import { payload, getSettings } from '@/lib/payload'
import { daysUntil, fmtDate, fmtKg, relativeDay, typeLabel, ucfirst } from '@/lib/format'
import { directionsUrl, fishingTimes, googleCalendarUrl } from '@/lib/calendar'
import { FeedRules } from '@/components/site/FeedRules'

type Props = { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const p = await payload()
  const res = await p.find({ collection: 'competitions', where: { slug: { equals: slug } }, depth: 2, limit: 1 })
  return res.docs[0]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await load((await params).slug)
  return c ? { title: `${c.title}, ${fmtDate(c.date)}` } : {}
}

export default async function Wedstrijd({ params }: Props) {
  const c = await load((await params).slug)
  if (!c) notFound()
  const p = await payload()
  const [settings, siblings, resultRes, albumsRes, newsRes] = await Promise.all([
    getSettings(),
    p.find({ collection: 'competitions', where: { season: { equals: c.season } }, sort: 'date', depth: 0, limit: 200, pagination: false, select: { slug: true, title: true, date: true } }),
    p.find({ collection: 'results', where: { competition: { equals: c.id } }, depth: 1, limit: 1 }),
    p.find({ collection: 'albums', where: { competition: { equals: c.id } }, depth: 1, limit: 3 }),
    p.find({ collection: 'news', where: { and: [{ relatedCompetition: { equals: c.id } }, { _status: { equals: 'published' } }] }, depth: 0, limit: 3 }),
  ])
  const result = resultRes.docs[0]
  const entries = result?.entries ?? []
  const water = c.water && typeof c.water === 'object' ? (c.water as Water) : null
  const upcoming = daysUntil(c.date) >= 0
  const idx = siblings.docs.findIndex((x) => x.id === c.id)
  const prev = idx > 0 ? siblings.docs[idx - 1] : null
  const next = idx >= 0 ? siblings.docs[idx + 1] : null
  const route = directionsUrl(water)
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const isMatch = !!(c.startTime || c.drawTime) || c.type !== 'andere'
  const showFish = entries.some((e) => e.fishCount)
  const name = (a: unknown) => (a && typeof a === 'object' && 'name' in a ? (a as { name: string }).name : '')

  return (
    <div className="wrap">
      <header className="page-head">
        <Link href={`/wedstrijden?seizoen=${c.season}`} className="breadcrumb">
          Wedstrijden {c.season}
        </Link>
        <h1>{c.title}</h1>
        <p>
          {ucfirst(fmtDate(c.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}
          {upcoming && relativeDay(c.date) ? `, ${relativeDay(c.date)}` : ''}
          {c.status === 'afgelast' && <span className="tag tag--warn">Afgelast</span>}
          {c.status === 'verplaatst' && <span className="tag tag--warn">Verplaatst</span>}
          {c.countsForStandings && <span className="tag">Super Prestige</span>}
        </p>
        {upcoming && c.status !== 'afgelast' && (
          <p className="match-actions">
            <a className="btn btn--primary" href={`/wedstrijden/${c.slug}/agenda.ics`}>
              Zet in je agenda
            </a>
            <a className="btn" href={googleCalendarUrl(c, siteUrl)} target="_blank" rel="noreferrer">
              Google Agenda
            </a>
            {route && (
              <a className="btn" href={route} target="_blank" rel="noreferrer">
                Route naar het water
              </a>
            )}
          </p>
        )}
      </header>

      <dl className="facts">
        <div>
          <dt>Viswater</dt>
          <dd>
            {water ? <Link href={`/visplaatsen/${water.slug}`}>{water.name}</Link> : 'Volgt nog'}
            {water?.town && !water.name.toLowerCase().includes(water.town.toLowerCase()) && <small className="facts__sub">{water.town}</small>}
            {route && !upcoming && (
              <small className="facts__sub">
                <a href={route} target="_blank" rel="noreferrer">Route</a>
              </small>
            )}
          </dd>
        </div>
        {c.drawTime && (
          <div>
            <dt>Loting</dt>
            <dd>{c.drawTime}</dd>
          </div>
        )}
        {c.startTime && (
          <div>
            <dt>{c.breakStart && c.breakEnd ? 'Vissen, in twee delen' : 'Vissen'}</dt>
            <dd>{fishingTimes(c)}</dd>
          </div>
        )}
        <div>
          <dt>Soort</dt>
          <dd>{typeLabel[c.type ?? 'club']}</dd>
        </div>
        {c.price && (
          <div>
            <dt>Inschrijfgeld</dt>
            <dd>{c.price}</dd>
          </div>
        )}
        {c.maxParticipants && (
          <div>
            <dt>Plaatsen</dt>
            <dd>max. {c.maxParticipants}</dd>
          </div>
        )}
      </dl>

      {upcoming && c.registration && (
        <section className="catch" style={{ marginBottom: '2.5rem' }}>
          <h2>Inschrijven</h2>
          <p className="pre">{c.registration}</p>
        </section>
      )}
      {c.notes && <p className="pre">{c.notes}</p>}

      {entries.length > 0 && (
        <section aria-labelledby="uitslag" style={{ marginTop: '2rem' }}>
          <h2 id="uitslag">Uitslag</h2>
          <ol className="podium">
            {entries.slice(0, 3).map((e) => (
              <li key={e.id}>
                <span className="p-place">{e.place}e plaats</span>
                <span className="p-name">{name(e.angler)}</span>
                <span className="p-kg">{fmtKg(e.weight)} kg</span>
                {e.fishCount ? <span className="muted">, {e.fishCount} vissen</span> : null}
              </li>
            ))}
          </ol>
          <div className="board-scroll">
            <table className="board">
              <thead>
                <tr>
                  <th scope="col">Plaats</th>
                  <th scope="col">Visser</th>
                  {entries.some((e) => e.peg) && <th scope="col">Stek</th>}
                  {showFish && <th scope="col" className="num">Vissen</th>}
                  <th scope="col" className="num">Gewicht</th>
                  <th scope="col" className="num">Punten</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className={e.place === 1 ? 'is-first' : undefined}>
                    <td className="pos">{e.place ?? '–'}</td>
                    <td className="name">
                      {name(e.angler)}
                      {e.note && <small>{e.note}</small>}
                      {e.disqualified && <small>Uitgesloten</small>}
                    </td>
                    {entries.some((x) => x.peg) && <td>{e.peg}</td>}
                    {showFish && <td className="num">{e.fishCount ?? '–'}</td>}
                    <td className="num">{fmtKg(e.weight)} kg</td>
                    <td className="num">{e.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result?.biggestFish?.weight ? (
            <p style={{ marginTop: '1.5rem' }}>
              Grootste vis: <strong>{name(result.biggestFish.angler)}</strong>
              {result.biggestFish.species ? `, ${result.biggestFish.species}` : ''} van {fmtKg(result.biggestFish.weight)} kg.
            </p>
          ) : null}
          {result?.report && <p className="pre">{result.report}</p>}
        </section>
      )}
      {!upcoming && entries.length === 0 && c.status !== 'afgelast' && <p className="empty">De uitslag wordt binnenkort toegevoegd.</p>}

      {isMatch && <FeedRules water={water} settings={settings} mode={c.breakStart && c.breakEnd ? 'twoPart' : c.startTime ? 'continuous' : null} />}

      {(newsRes.docs.length > 0 || albumsRes.docs.length > 0) && (
        <section style={{ marginTop: '3rem' }}>
          <h2>Meer over deze wedstrijd</h2>
          <ul className="story-list">
            {newsRes.docs.map((n) => (
              <li key={n.id}>
                <Link href={`/nieuws/${n.slug}`}>
                  <strong>{n.title}</strong>
                </Link>
              </li>
            ))}
            {albumsRes.docs.map((a) => (
              <li key={a.id}>
                <Link href={`/fotos/${a.slug}`}>
                  <strong>Foto’s: {a.title}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(prev || next) && (
        <nav className="pager" aria-label="Andere wedstrijden dit seizoen">
          {prev ? (
            <Link href={`/wedstrijden/${prev.slug}`} rel="prev">
              <small>Vorige, {fmtDate(prev.date, { day: 'numeric', month: 'long' })}</small>
              {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/wedstrijden/${next.slug}`} rel="next" className="pager__next">
              <small>Volgende, {fmtDate(next.date, { day: 'numeric', month: 'long' })}</small>
              {next.title}
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
