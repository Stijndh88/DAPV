import Link from 'next/link'
import type { Metadata } from 'next'
import { payload } from '@/lib/payload'

export const metadata: Metadata = { title: 'Leden' }

export default async function Leden() {
  const p = await payload()
  const res = await p.find({ collection: 'anglers', where: { member: { equals: true } }, sort: 'name', limit: 500, depth: 0, pagination: false })
  return (
    <div className="wrap">
      <header className="page-head">
        <Link href="/club" className="breadcrumb">De club</Link>
        <h1>Leden</h1>
        <p>{res.docs.length} vissers. Zin om erbij te horen? <Link href="/lid-worden">Zo word je lid</Link>.</p>
      </header>
      <ul className="member-list">
        {res.docs.map((a) => (
          <li key={a.id}>{a.name}</li>
        ))}
      </ul>
    </div>
  )
}
