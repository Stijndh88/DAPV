import Link from 'next/link'
import type { Metadata } from 'next'
import { getSeasons, getStandings } from '@/lib/standings'
import { fmtKg, fmtShort } from '@/lib/format'

export const metadata: Metadata = { title: 'Klassement', description: 'Het seizoensklassement van de club.' }

type Props = { searchParams: Promise<{ seizoen?: string }> }

export default async function Klassement({ searchParams }: Props) {
  const seasons = await getSeasons()
  const sp = await searchParams
  const current = new Date().getFullYear()
  const season = Number(sp.seizoen) || (seasons.includes(current) ? current : seasons[0] ?? current)
  const s = await getStandings(season)
  const byWeight = s.method === 'weight'

  return (
    <div className="wrap">
      <header className="page-head">
        <h1>Klassement {season}</h1>
        <p>
          {byWeight
            ? 'Het totale gewicht over alle wedstrijden telt.'
            : 'Per wedstrijd krijgt de winnaar evenveel punten als er deelnemers zijn, de laatste krijgt 1 punt.'}{' '}
          {s.dropWorst === 1 && 'Het slechtste resultaat van elke visser valt weg.'}
          {s.dropWorst > 1 && `De ${s.dropWorst} slechtste resultaten van elke visser vallen weg.`} Na {s.competitions.length} van{' '}
          {s.plannedCount} wedstrijden.
        </p>
      </header>
      {seasons.length > 1 && (
        <nav className="season-switch" aria-label="Seizoen kiezen">
          {seasons.map((y) => (
            <Link key={y} href={`/klassement?seizoen=${y}`} aria-current={y === season ? 'page' : undefined}>
              {y}
            </Link>
          ))}
        </nav>
      )}
      {s.rows.length === 0 ? (
        <p className="empty">Er zijn nog geen uitslagen voor {season}.</p>
      ) : (
        <div className="board-scroll">
          <table className="board">
            <thead>
              <tr>
                <th scope="col">Plaats</th>
                <th scope="col">Visser</th>
                {s.competitions.map((c) => (
                  <th key={c.id} scope="col" className="num">
                    <Link href={`/wedstrijden/${c.slug}`} title={c.title ?? undefined}>
                      {fmtShort(c.date)}
                    </Link>
                  </th>
                ))}
                <th scope="col" className="num">Overwinningen</th>
                <th scope="col" className="num">Totaal kg</th>
                {!byWeight && <th scope="col" className="num">Punten</th>}
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r, i) => (
                <tr key={r.angler.id} className={i === 0 ? 'is-first' : undefined}>
                  <td className="pos">{i + 1}</td>
                  <td className="name">
                    {r.angler.name}
                    <small>{r.matches} {r.matches === 1 ? 'wedstrijd' : 'wedstrijden'}</small>
                  </td>
                  {s.competitions.map((c) => {
                    const m = r.perMatch[String(c.id)]
                    return (
                      <td key={c.id} className="num" style={m?.dropped ? { textDecoration: 'line-through', opacity: 0.5 } : undefined}>
                        {m ? (byWeight ? fmtKg(m.weight, 2) : m.points) : '·'}
                      </td>
                    )
                  })}
                  <td className="num">{r.wins || ''}</td>
                  <td className="num">{fmtKg(r.totalWeight, 2)}</td>
                  {!byWeight && <td className="num big">{r.total}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
