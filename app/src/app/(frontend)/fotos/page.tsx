import Link from 'next/link'
import type { Metadata } from 'next'
import { payload } from '@/lib/payload'
import { fmtDate } from '@/lib/format'
import { Img } from '@/components/site/Img'

export const metadata: Metadata = { title: 'Foto’s' }

export default async function Fotos() {
  const p = await payload()
  const res = await p.find({ collection: 'albums', sort: '-date', limit: 100, depth: 1 })
  return (
    <div className="wrap">
      <header className="page-head">
        <h1>Foto’s</h1>
        <p>Vangsten, prijsuitreikingen en de mensen erachter.</p>
      </header>
      {res.docs.length === 0 && <p className="empty">Er zijn nog geen albums.</p>}
      <div className="albums">
        {res.docs.map((a) => {
          const cover = (a.cover && typeof a.cover === 'object' ? a.cover : null) ?? (Array.isArray(a.photos) ? a.photos[0] : null)
          return (
            <Link key={a.id} href={`/fotos/${a.slug}`} className="album-card">
              <div className="album-card__stack">
                <Img media={cover} size="card" sizes="(max-width: 640px) 100vw, 33vw" />
              </div>
              <strong>{a.title}</strong>
              <span>
                {fmtDate(a.date)}, {a.photos?.length ?? 0} foto’s
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
