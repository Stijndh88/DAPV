import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadPage } from '@/lib/page'
import { PageView } from '@/components/site/PageView'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pg = await loadPage((await params).slug)
  return pg ? { title: pg.title } : {}
}

export default async function ClubPagina({ params }: Props) {
  const pg = await loadPage((await params).slug)
  if (!pg) notFound()
  return <PageView page={pg} crumb={{ href: '/club', label: 'De club' }} />
}
