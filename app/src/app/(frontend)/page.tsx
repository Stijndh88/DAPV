import Link from 'next/link'
import type { Competition, Water } from '@/payload-types'
import { payload, getSettings } from '@/lib/payload'
import { getStandings } from '@/lib/standings'
import { fmtDate, fmtKg, fmtShort, fmtWeekday, relativeDay, typeLabel } from '@/lib/format'
import { Bobber, Waterline } from '@/components/site/Waterline'
import { Img } from '@/components/site/Img'

const waterName = (c: Competition) => (c.water && typeof c.water === 'object' ? (c.water as Water) : null)

export default async function Home() {
  const p = await payload()
  const settings = await getSettings()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [upcoming, news, albums, lastResult] = await Promise.all([
    p.find({
      collection: 'competitions',
      where: { and: [{ date: { greater_than_equal: todayStart.toISOString() } }, { status: { not_equals: 'afgelast' } }] },
      sort: 'date',
      limit: 5,
      depth: 1,
    }),
    p.find({ collection: 'news', where: { _status: { equals: 'published' } }, sort: '-publishedAt', limit: 4, depth: 1 }),
    p.find({ collection: 'albums', sort: '-date', limit: 1, depth: 1 }),
    p.find({ collection: 'results', sort: '-createdAt', limit: 1, depth: 2 }),
  ])

  const next = upcoming.docs[0]
  const later = upcoming.docs.slice(1)
  const season = next?.season ?? new Date().getFullYear()
  let standings = await getStandings(season)
  if (standings.rows.length === 0 && season > 2000) standings = await getStandings(season - 1)
  const result = lastResult.docs[0]
  const resultComp = result && typeof result.competition === 'object' ? result.competition : null
  const winner = result?.entries?.[0]
  const winnerName = winner && typeof winner.angler === 'object' ? winner.angler.name : null
  const album = albums.docs[0]
  const [lead, ...restNews] = news.docs

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="wrap">
          {next ? (
            <>
              <p className="hero__lead">
                Volgende wedstrijd, <strong>{relativeDay(next.date)}</strong>
              </p>
              <h1 id="hero-title" className="hero__title">
                <Link href={`/wedstrijden/${next.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  <span style={{ textTransform: 'capitalize' }}>{fmtWeekday(next.date)}</span> {fmtDate(next.date, { day: 'numeric', month: 'long' })}
                </Link>
              </h1>
              <p className="hero__meta">
                {next.title}
                {waterName(next) ? ` aan ${waterName(next)!.name}` : ''}
                {next.startTime ? `, aanvang ${next.startTime}` : ''}
                {next.drawTime ? `, loting om ${next.drawTime}` : ''}.
              </p>
              <div className="hero__actions">
                <Link className="btn btn--primary" href={`/wedstrijden/${next.slug}`}>
                  Zo schrijf je in
                </Link>
                <Link className="btn" href="/wedstrijden">
                  Hele kalender
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="hero__lead">{settings.tagline}</p>
              <h1 id="hero-title" className="hero__title">
                {settings.clubName}
              </h1>
              <p className="hero__meta">{settings.welcome}</p>
              <div className="hero__actions">
                <Link className="btn btn--primary" href="/lid-worden">
                  Lid worden
                </Link>
                <Link className="btn" href="/wedstrijden">
                  Kalender bekijken
                </Link>
              </div>
            </>
          )}
        </div>
        <div className="hero__stage">
          <div className="hero__bobber">
            <Bobber />
          </div>
          <Waterline />
        </div>
      </section>

      <section className="deep underwater" aria-label="Klassement en laatste uitslag">
        <div className="wrap underwater__grid">
          <div>
            <div className="section-head">
              <h2>Klassement {standings.season}</h2>
              <Link href={`/klassement?seizoen=${standings.season}`}>Volledig klassement</Link>
            </div>
            {standings.rows.length ? (
              <table className="board">
                <thead>
                  <tr>
                    <th scope="col">Plaats</th>
                    <th scope="col">Visser</th>
                    <th scope="col" className="num">{standings.method === 'weight' ? 'Kg' : 'Punten'}</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.rows.slice(0, 6).map((r, i) => (
                    <tr key={r.angler.id} className={i === 0 ? 'is-first' : undefined}>
                      <td className="pos">{i + 1}</td>
                      <td className="name">
                        {r.angler.name}
                        <small>
                          {r.matches} {r.matches === 1 ? 'wedstrijd' : 'wedstrijden'}, {fmtKg(r.totalWeight, 2)} kg
                        </small>
                      </td>
                      <td className="num big">{standings.method === 'weight' ? fmtKg(r.total, 2) : r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted">Het klassement start na de eerste wedstrijd van het seizoen.</p>
            )}
          </div>
          <div>
            <div className="section-head">
              <h2>Laatste uitslag</h2>
            </div>
            {result && resultComp ? (
              <div className="catch">
                <p className="muted" style={{ margin: 0 }}>
                  {resultComp.title}, {fmtDate(resultComp.date)}
                </p>
                <p className="catch__winner">{winnerName}</p>
                <p className="catch__weight">{fmtKg(winner?.weight)} kg{winner?.fishCount ? `, ${winner.fishCount} vissen` : ''}</p>
                <p>
                  {result.entries?.length ?? 0} vissers aan de waterkant.{' '}
                  <Link href={`/wedstrijden/${resultComp.slug}`}>Bekijk de volledige uitslag</Link>
                </p>
              </div>
            ) : (
              <p className="muted">Nog geen uitslagen dit seizoen.</p>
            )}
          </div>
        </div>
      </section>
      <Waterline flip />

      {later.length > 0 && (
        <section className="section" aria-labelledby="next-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="next-title">Daarna op de kalender</h2>
              <Link href="/wedstrijden">Alle wedstrijden</Link>
            </div>
            <ul className="fixtures">
              {later.map((c) => (
                <li key={c.id}>
                  <Link href={`/wedstrijden/${c.slug}`} className="fixture">
                    <span className="fixture__day">{fmtDate(c.date, { day: 'numeric' })}</span>
                    <span className="fixture__month">{fmtDate(c.date, { weekday: 'short', month: 'long' })}</span>
                    <span className="fixture__title">
                      {c.title}
                      {c.status === 'verplaatst' && <span className="tag tag--warn">Verplaatst</span>}
                    </span>
                    <span className="fixture__where">
                      {waterName(c)?.name ?? typeLabel[c.type ?? 'club']}
                      {c.startTime ? `, ${c.startTime}` : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {lead && (
        <section className="section" aria-labelledby="news-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="news-title">Nieuws van de club</h2>
              <Link href="/nieuws">Alle berichten</Link>
            </div>
            <div className="news-lead">
              <Link href={`/nieuws/${lead.slug}`} className="story">
                <Img media={lead.cover} size="card" sizes="(max-width: 860px) 100vw, 60vw" />
                <time dateTime={lead.publishedAt}>{fmtDate(lead.publishedAt)}</time>
                <h3>{lead.title}</h3>
                {lead.excerpt && <p>{lead.excerpt}</p>}
              </Link>
              {restNews.length > 0 && (
                <ul className="story-list">
                  {restNews.map((n) => (
                    <li key={n.id}>
                      <Link href={`/nieuws/${n.slug}`}>
                        <time dateTime={n.publishedAt}>{fmtShort(n.publishedAt)}</time>
                        <strong>{n.title}</strong>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {album && Array.isArray(album.photos) && album.photos.length > 0 && (
        <section className="section" aria-labelledby="photos-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="photos-title">{album.title}</h2>
              <Link href={`/fotos/${album.slug}`}>Alle {album.photos.length} foto’s</Link>
            </div>
            <div className="mosaic">
              {album.photos.slice(0, 7).map((ph, i) =>
                typeof ph === 'object' ? (
                  <Link key={ph.id} href={`/fotos/${album.slug}#foto-${i + 1}`}>
                    <Img media={ph} size={i === 0 ? 'card' : 'thumb'} sizes={i === 0 ? '50vw' : '25vw'} />
                  </Link>
                ) : null,
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
