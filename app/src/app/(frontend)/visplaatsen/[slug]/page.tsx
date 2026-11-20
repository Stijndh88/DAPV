import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { payload } from '@/lib/payload'
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
  const comps = await p.find({
    collection: 'competitions',
    where: { and: [{ water: { equals: w.id } }, { date: { greater_than_equal: new Date().toISOString() } }] },
    sort: 'date',
    limit: 5,
    depth: 0,
  })
  const address = [w.address, w.town].filter(Boolean).join(', ')
  const map = w.mapUrl || (address ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}` : null)
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
                <a href={map} target="_blank" rel="noreferrer">Open de kaart</a>
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
      </div>
    </div>
  )
}
