import Link from 'next/link'
import type { SiteSetting, Sponsor } from '@/payload-types'
import { Img } from './Img'
import { Waterline } from './Waterline'

export function Footer({ settings, sponsors }: { settings: SiteSetting; sponsors: Sponsor[] }) {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <Waterline />
      <div className="deep">
        {sponsors.length > 0 && (
          <section className="wrap sponsors" aria-labelledby="sponsors-title">
            <h2 id="sponsors-title" className="sponsors__title">Met dank aan onze sponsors</h2>
            <ul className="sponsors__list">
              {sponsors.map((s) => (
                <li key={s.id} className={`sponsor sponsor--${s.tier ?? 'partner'}`}>
                  <a href={s.url || undefined} target="_blank" rel="noreferrer">
                    {s.logo && typeof s.logo === 'object' ? <Img media={s.logo} size="thumb" sizes="160px" alt={s.name} /> : <span>{s.name}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="wrap site-footer__grid">
          <div>
            <p className="site-footer__name">{settings.clubName}</p>
            {settings.tagline && <p>{settings.tagline}</p>}
            {(settings.founded || settings.clubNumber) && (
              <p className="muted">
                {settings.founded ? `Opgericht in ${settings.founded}` : ''}
                {settings.founded && settings.clubNumber ? ', ' : ''}
                {settings.clubNumber ? `stamnummer ${settings.clubNumber}` : ''}
              </p>
            )}
          </div>
          <div>
            <h2 className="site-footer__h">Contact</h2>
            <ul className="plain">
              {settings.clubhouse && <li>{settings.clubhouse}</li>}
              {settings.address && <li className="pre">{settings.address}</li>}
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </li>
              )}
              {settings.phone && (
                <li>
                  <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h2 className="site-footer__h">De club</h2>
            <ul className="plain">
              <li><Link href="/lid-worden">Lid worden</Link></li>
              <li><Link href="/club/bestuur">Bestuur</Link></li>
              <li><Link href="/club/reglement">Reglement</Link></li>
              {(settings.socials ?? []).map((s) => (
                <li key={s.id}>
                  <a href={s.url ?? '#'} target="_blank" rel="noreferrer" className="cap">{s.platform}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="wrap site-footer__base">
          <span>© {year} {settings.clubName}</span>
          <Link href="/admin">Inloggen voor redactie</Link>
        </div>
      </div>
    </footer>
  )
}
