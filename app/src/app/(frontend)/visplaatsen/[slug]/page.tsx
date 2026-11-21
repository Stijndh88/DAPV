import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { payload, getSettings } from '@/lib/payload'
import { directionsUrl } from '@/lib/calendar'
import { FeedRules } from '@/components/site/FeedRules'
import { fmtDate } from '@/lib/format'
import { Img } from '@/components/site/Img'

type Props = { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const p = await payload()
  return (await p.find({ collection: 'waters', where: { slug: { equals: slug } }, depth: 1, limit: 1 })).docs[0]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const w = await load((await params).slug)
  return w ? { title: w.name } : {}
}

export default async function Visplaats({ params }: Props) {
  const w = await load((await params).slug)
  if (!w) notFound()
  const p = await payload()
  const [settings, all] = await Promise.all([
    getSettings(),
    p.find({ collection: 'competitions', where: { water: { equals: w.id } }, sort: '-date', limit: 100, depth: 0, pagination: false }),
  ])
  const now = new Date().toISOString()
  const comps = { docs: all.docs.filter((c) => c.date >= now).reverse().slice(0, 5) }
  const pastComps = all.docs.filter((c) => c.date < now)
  const address = [w.address, w.town].filter(Boolean).join(', ')
  const map = directionsUrl(w)
  return (
    <div className="wrap">
      <header className="page-head">
        <Link href="/visplaatsen" className="breadcrumb">
          Visplaatsen
        </Link>
        <h1>{w.name}</h1>
        {address && <p>{address}</p>}
      </header>
      {w.image && typeof w.image === 'object' && (
        <div style={{ maxWidth: 1000, marginBottom: '2rem' }}>
          <Img media={w.image} size="large" sizes="(max-width: 1000px) 100vw, 1000px" priority />
        </div>
      )}
      <div className="article">
        {w.description && <p className="pre">{w.description}</p>}
        <dl className="facts">
          {w.species && (
            <div>
              <dt>Vissoorten</dt>
              <dd>{w.species}</dd>
            </div>
          )}
          {map && (
            <div>
              <dt>Route</dt>
              <dd>
                <a href={map} target="_blank" rel="noreferrer">Route naar het water</a>
              </dd>
            </div>
          )}
        </dl>
        {w.rules && (
          <>
            <h2>Afspraken aan dit water</h2>
            <p className="pre">{w.rules}</p>
          </>
        )}
        <FeedRules water={w} settings={settings} />
        {comps.docs.length > 0 && (
          <>
            <h2>Komende wedstrijden hier</h2>
            <ul className="story-list">
              {comps.docs.map((c) => (
                <li key={c.id}>
                  <Link href={`/wedstrijden/${c.slug}`}>
                    <time>{fmtDate(c.date)}</time>
                    <strong>{c.title}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        {pastComps.length > 0 && (
          <>
            <h2>Eerder gevist hier</h2>
            <ul className="story-list">
              {pastComps.slice(0, 12).map((c) => (
                <li key={c.id}>
                  <Link href={`/wedstrijden/${c.slug}`}>
                    <time>{fmtDate(c.date)}</time>
                    <strong>{c.title}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
