import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Media } from '@/payload-types'
import { payload } from '@/lib/payload'
import { fmtDate } from '@/lib/format'
import { Img } from '@/components/site/Img'

type Props = { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const p = await payload()
  return (await p.find({ collection: 'albums', where: { slug: { equals: slug } }, depth: 1, limit: 1 })).docs[0]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await load((await params).slug)
  return a ? { title: a.title } : {}
}

export default async function Album({ params }: Props) {
  const a = await load((await params).slug)
  if (!a) notFound()
  const photos = (a.photos ?? []).filter((x): x is Media => typeof x === 'object')
  return (
    <div className="wrap">
      <header className="page-head">
        <Link href="/fotos" className="breadcrumb">
          Foto’s
        </Link>
        <h1>{a.title}</h1>
        <p>
          {fmtDate(a.date)}, {photos.length} foto’s
          {a.competition && typeof a.competition === 'object' && (
            <>
              . Hoort bij <Link href={`/wedstrijden/${a.competition.slug}`}>{a.competition.title}</Link>
            </>
          )}
        </p>
        {a.description && <p className="pre">{a.description}</p>}
      </header>
      <div className="gallery">
        {photos.map((ph, i) => (
          <figure key={ph.id}>
            <a href={`#foto-${i + 1}`} aria-label={`Foto ${i + 1} groot bekijken`}>
              <Img media={ph} size="card" sizes="(max-width: 640px) 100vw, 33vw" />
            </a>
            {ph.alt && ph.alt !== ph.filename && <figcaption>{ph.alt}</figcaption>}
          </figure>
        ))}
      </div>
      {photos.map((ph, i) => (
        <div key={ph.id} id={`foto-${i + 1}`} className="lightbox" role="dialog" aria-label={`Foto ${i + 1} van ${photos.length}`}>
          <Img media={ph} size="large" sizes="100vw" />
          <a href="#" className="lightbox__close">Sluiten</a>
          {i > 0 && <a href={`#foto-${i}`} className="lightbox__nav lightbox__nav--prev">Vorige</a>}
          {i < photos.length - 1 && <a href={`#foto-${i + 2}`} className="lightbox__nav lightbox__nav--next">Volgende</a>}
        </div>
      ))}
    </div>
  )
}
