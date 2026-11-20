import Link from 'next/link'
import type { Metadata } from 'next'
import { payload, getSettings } from '@/lib/payload'

export const metadata: Metadata = { title: 'De club' }

export default async function Club() {
  const p = await payload()
  const settings = await getSettings()
  const pages = await p.find({ collection: 'pages', where: { _status: { equals: 'published' } }, sort: 'menuOrder', depth: 0, limit: 50 })
  const href = (slug: string) => (['reglement', 'praktisch'].includes(slug) ? `/club/${slug}` : `/${slug}`)
  const song = settings.clubSong && typeof settings.clubSong === 'object' ? settings.clubSong : null
  const links = [
    { href: '/club/bestuur', title: 'Bestuur', text: 'Wie trekt de club, en hoe bereik je ze.' },
    { href: '/club/leden', title: 'Leden', text: 'Iedereen die dit seizoen meevist.' },
    ...pages.docs.map((pg) => ({ href: href(pg.slug ?? ''), title: pg.title, text: pg.intro ?? '' })),
  ]
  return (
    <div className="wrap">
      <header className="page-head">
        <h1>De club</h1>
        {settings.welcome && <p>{settings.welcome}</p>}
      </header>
      <ul className="links-grid">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>
              <strong>{l.title}</strong>
              <span>{l.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      {song?.url && (
        <section className="section song" aria-labelledby="song">
          <h2 id="song">Ons clublied</h2>
          <audio controls preload="none" src={song.url}>
            <a href={song.url}>Download het clublied</a>
          </audio>
          {settings.clubSongLyrics && <p className="pre">{settings.clubSongLyrics}</p>}
        </section>
      )}
    </div>
  )
}
