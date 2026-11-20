import Link from 'next/link'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import type { Metadata } from 'next'
import { payload } from '@/lib/payload'
import { fmtDate } from '@/lib/format'
import { Img } from '@/components/site/Img'
import { RichText } from '@/components/site/RichText'

type Props = { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const p = await payload()
  const { isEnabled } = await draftMode()
  const res = await p.find({
    collection: 'news',
    where: isEnabled ? { slug: { equals: slug } } : { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    draft: isEnabled,
    depth: 2,
    limit: 1,
  })
  return res.docs[0]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = await load((await params).slug)
  if (!n) return {}
  const img = n.cover && typeof n.cover === 'object' ? n.cover.sizes?.card?.url ?? n.cover.url : undefined
  return { title: n.title, description: n.excerpt ?? undefined, openGraph: { images: img ? [img] : undefined, type: 'article' } }
}

export default async function Bericht({ params }: Props) {
  const n = await load((await params).slug)
  if (!n) notFound()
  const comp = n.relatedCompetition && typeof n.relatedCompetition === 'object' ? n.relatedCompetition : null
  return (
    <article className="wrap">
      <header className="page-head article">
        <Link href="/nieuws" className="breadcrumb">
          Nieuws
        </Link>
        <h1>{n.title}</h1>
        <p>
          <time dateTime={n.publishedAt}>{fmtDate(n.publishedAt)}</time>
        </p>
      </header>
      {n.cover && typeof n.cover === 'object' && (
        <figure className="article__cover" style={{ maxWidth: 1000 }}>
          <Img media={n.cover} size="large" sizes="(max-width: 1000px) 100vw, 1000px" priority />
          {n.cover.credit && <figcaption className="muted">Foto: {n.cover.credit}</figcaption>}
        </figure>
      )}
      <div className="article">
        <RichText data={n.content} />
        {comp && (
          <p className="catch" style={{ marginTop: '2rem' }}>
            Bekijk de <Link href={`/wedstrijden/${comp.slug}`}>uitslag en details van {comp.title}</Link>.
          </p>
        )}
      </div>
    </article>
  )
}
