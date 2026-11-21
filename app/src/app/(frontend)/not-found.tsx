import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="wrap page-head">
      <h1>Niets aan de haak</h1>
      <p>Deze pagina bestaat niet (meer). Misschien vind je het via de kalender of het nieuws.</p>
      <p>
        <Link className="btn btn--primary" href="/">Naar de startpagina</Link>
      </p>
    </div>
  )
}
