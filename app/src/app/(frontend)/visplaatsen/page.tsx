import Link from 'next/link'
import type { Metadata } from 'next'
import { payload } from '@/lib/payload'
import { Img } from '@/components/site/Img'

export const metadata: Metadata = { title: 'Visplaatsen', description: 'De wateren waar de club vist.' }

export default async function Visplaatsen() {
  const p = await payload()
  const res = await p.find({ collection: 'waters', sort: 'name', limit: 100, depth: 1 })
  return (
    <div className="wrap">
      <header className="page-head">
        <h1>Visplaatsen</h1>
        <p>Hier vissen we onze wedstrijden. Klik door voor adres, route en wat er zwemt.</p>
      </header>
      {res.docs.length === 0 && <p className="empty">Nog geen visplaatsen toegevoegd.</p>}
      <div className="waters">
        {res.docs.map((w) => (
          <Link key={w.id} href={`/visplaatsen/${w.slug}`} className="water">
            {w.image ? <Img media={w.image} size="thumb" sizes="220px" /> : <div className="water__ph" aria-hidden="true" />}
            <div>
              <h2>{w.name}</h2>
              <p className="muted">{[w.address, w.town].filter(Boolean).join(', ')}</p>
              {w.species && <p>Vissoorten: {w.species}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
