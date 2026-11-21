import Link from 'next/link'
import type { Metadata } from 'next'
import { payload } from '@/lib/payload'
import { fmtDate } from '@/lib/format'
import { Img } from '@/components/site/Img'

export const metadata: Metadata = { title: 'Nieuws' }

type Props = { searchParams: Promise<{ pagina?: string }> }

export default async function Nieuws({ searchParams }: Props) {
  const page = Math.max(1, Number((await searchParams).pagina) || 1)
  const p = await payload()
  const res = await p.find({ collection: 'news', where: { _status: { equals: 'published' } }, sort: '-publishedAt', limit: 12, page, depth: 1 })
  return (
    <div className="wrap">
      <header className="page-head">
        <h1>Nieuws</h1>
        <p>Verslagen, aankondigingen en wat er verder leeft in de club.</p>
      </header>
      {res.docs.length === 0 && <p className="empty">Nog geen berichten.</p>}
      <div className="news-grid">
        {res.docs.map((n) => (
          <Link key={n.id} href={`/nieuws/${n.slug}`} className="story">
            {n.cover ? <Img media={n.cover} size="card" sizes="(max-width: 700px) 100vw, 33vw" /> : null}
            <time dateTime={n.publishedAt}>{fmtDate(n.publishedAt)}</time>
            <h3>{n.title}</h3>
            {n.excerpt && <p>{n.excerpt}</p>}
          </Link>
        ))}
      </div>
      {res.totalPages > 1 && (
        <nav className="season-switch" aria-label="Pagina’s" style={{ marginTop: '3rem' }}>
          {Array.from({ length: res.totalPages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={`/nieuws?pagina=${n}`} aria-current={n === page ? 'page' : undefined}>
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
