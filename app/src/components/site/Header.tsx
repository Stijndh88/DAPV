import Link from 'next/link'

const nav = [
  { href: '/wedstrijden', label: 'Wedstrijden' },
  { href: '/klassement', label: 'Klassement' },
  { href: '/nieuws', label: 'Nieuws' },
  { href: '/fotos', label: 'Foto’s' },
  { href: '/visplaatsen', label: 'Visplaatsen' },
  { href: '/club', label: 'Club' },
]

export function Header({ clubName, extra = [] }: { clubName: string; extra?: { href: string; label: string }[] }) {
  const items = [...nav, ...extra]
  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <Link href="/" className="brand" aria-label={`${clubName}, naar de startpagina`}>
          <svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true">
            <circle cx="20" cy="20" r="19" className="brand__disc" />
            <path d="M5 25c5-3.5 10-3.5 15 0s10 3.5 15 0" className="brand__wave" />
            <path d="M20 5v8" className="brand__line" />
            <ellipse cx="20" cy="17" rx="3" ry="4.6" className="brand__tip" />
          </svg>
          <span>{clubName}</span>
        </Link>
        <nav aria-label="Hoofdmenu" className="nav nav--wide">
          <ul>
            {items.map((i) => (
              <li key={i.href}>
                <Link href={i.href}>{i.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <details className="nav nav--compact">
          <summary>Menu</summary>
          <ul>
            {items.map((i) => (
              <li key={i.href}>
                <Link href={i.href}>{i.label}</Link>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </header>
  )
}
