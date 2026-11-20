import Link from 'next/link'
import type { Page } from '@/payload-types'
import { RichText } from './RichText'

export function PageView({ page, crumb }: { page: Page; crumb?: { href: string; label: string } }) {
  return (
    <article className="wrap">
      <header className="page-head article">
        {crumb && (
          <Link href={crumb.href} className="breadcrumb">
            {crumb.label}
          </Link>
        )}
        <h1>{page.title}</h1>
        {page.intro && <p>{page.intro}</p>}
      </header>
      <div className="article">
        <RichText data={page.content} />
      </div>
    </article>
  )
}
