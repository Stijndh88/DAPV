import Link from 'next/link'
import type { ServerProps } from 'payload'

const actions = [
  { href: '/admin/collections/news/create', title: 'Nieuwsbericht schrijven', text: 'Verslag, aankondiging of clubnieuws' },
  { href: '/admin/collections/albums/create', title: 'Foto’s toevoegen', text: 'Maak een album en sleep je foto’s erin' },
  { href: '/admin/collections/competitions/create', title: 'Wedstrijd plannen', text: 'Datum, viswater en inschrijving' },
  { href: '/admin/collections/results/create', title: 'Uitslag invoeren', text: 'Plak de lijst uit Excel, punten gaan vanzelf' },
]

export default function Welcome({ user }: ServerProps) {
  const name = (user as { name?: string } | undefined)?.name?.split(' ')[0]
  return (
    <section className="pv-welcome">
      <h2>{name ? `Dag ${name}, wat wil je doen?` : 'Wat wil je doen?'}</h2>
      <div className="pv-welcome__grid">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className="pv-welcome__card">
            <strong>{a.title}</strong>
            <span>{a.text}</span>
          </Link>
        ))}
      </div>
      <p className="pv-welcome__help">
        Hulp nodig? Alles wat je opslaat als concept is nog niet zichtbaar. Pas na <em>Publiceren</em> staat het op de site.{' '}
        <a href="/" target="_blank" rel="noreferrer">Bekijk de website</a>
      </p>
    </section>
  )
}
