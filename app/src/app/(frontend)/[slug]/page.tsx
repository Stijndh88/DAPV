import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadPage } from '@/lib/page'
import { PageView } from '@/components/site/PageView'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pg = await loadPage((await params).slug)
  return pg ? { title: pg.title, description: pg.intro ?? undefined } : {}
}

export default async function Pagina({ params }: Props) {
  const pg = await loadPage((await params).slug)
  if (!pg) notFound()
  return <PageView page={pg} />
}
