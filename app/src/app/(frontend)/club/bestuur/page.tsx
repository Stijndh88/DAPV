import Link from 'next/link'
import type { Metadata } from 'next'
import { payload } from '@/lib/payload'
import { Img } from '@/components/site/Img'

export const metadata: Metadata = { title: 'Bestuur' }

export default async function Bestuur() {
  const p = await payload()
  const res = await p.find({ collection: 'board-members', sort: 'order', limit: 50, depth: 1 })
  return (
    <div className="wrap">
      <header className="page-head">
        <Link href="/club" className="breadcrumb">De club</Link>
        <h1>Bestuur</h1>
        <p>Vragen over lidmaatschap, wedstrijden of de club? Spreek ons gerust aan.</p>
      </header>
      <ul className="board-members">
        {res.docs.map((m) => (
          <li key={m.id} className="person">
            {m.photo && typeof m.photo === 'object' ? (
              <Img media={m.photo} size="thumb" sizes="240px" alt={m.name} />
            ) : (
              <div className="person__ph" aria-hidden="true">{m.name.slice(0, 1)}</div>
            )}
            <strong>{m.name}</strong>
            <span className="role">{m.role}</span>
            {m.email && <div><a href={`mailto:${m.email}`}>{m.email}</a></div>}
            {m.phone && <div><a href={`tel:${m.phone.replace(/\s/g, '')}`}>{m.phone}</a></div>}
          </li>
        ))}
      </ul>
    </div>
  )
}
