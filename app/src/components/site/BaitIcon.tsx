import type { ReactNode } from 'react'
import { baitLabel, sortBaits } from '@/lib/bait'

/** Line pictograms on a 24×24 grid, one per bait kind (see lib/bait.ts). */
const glyphs: Record<string, ReactNode> = {
  // a heap of groundbait in a ball
  voeder: (
    <>
      <circle cx="12" cy="13" r="6.5" />
      <path d="M8.5 11.5h.01M12 9.5h.01M14.5 13h.01M10.5 15h.01M13 16.2h.01" strokeWidth="2.2" />
    </>
  ),
  // a block of clay
  leem: <path d="M4 17.5 7 9h10l3 8.5Z M9 13h6" />,
  // a segmented maggot
  'witte-maden': <path d="M6 15c0-4 3-7 7-7.5 3-.3 5 1.3 5 3.3 0 2.5-3 3.2-5 4.2-2.3 1.2-3 3-5 3-1.3 0-2-1-2-3Z M10 10.5l1.5 2.5 M13.5 9.2l.8 2.8" />,
  // a darker, shorter caster shell
  casters: (
    <>
      <ellipse cx="12" cy="12" rx="7" ry="4" transform="rotate(-25 12 12)" />
      <path d="M8 14.5 15.5 8.8" />
    </>
  ),
  'rode-maden': (
    <>
      <path d="M6 15c0-4 3-7 7-7.5 3-.3 5 1.3 5 3.3 0 2.5-3 3.2-5 4.2-2.3 1.2-3 3-5 3-1.3 0-2-1-2-3Z" />
      <circle cx="16" cy="10.5" r="1" fill="currentColor" />
    </>
  ),
  // thin wriggling bloodworm
  muggenlarven: <path d="M4 15c2-4 3 2 5-2s3 2 5-2 3 2 6-3" />,
  // a thicker earthworm
  pieren: <path d="M4 16c3 0 3-6 6-6s3 6 6 6 3-4 4-6" strokeWidth="2.6" />,
  insecten: (
    <>
      <ellipse cx="12" cy="13" rx="3" ry="5" />
      <path d="M12 8V6M9.5 6.5 8 5M14.5 6.5 16 5M9 11H5.5M9 14l-3.5 2M15 11h3.5M15 14l3.5 2" />
    </>
  ),
  granen: <path d="M12 20V7 M12 9c-3-.5-4-2.5-4-4 2 0 3.5 1 4 3 M12 9c3-.5 4-2.5 4-4-2 0-3.5 1-4 3 M12 14c-3-.5-4-2.5-4-4 2 0 3.5 1 4 3 M12 14c3-.5 4-2.5 4-4-2 0-3.5 1-4 3" />,
  mais: (
    <>
      <path d="M12 4c3.5 0 5 4 5 8s-2 8-5 8-5-4-5-8 1.5-8 5-8Z" />
      <path d="M8 9h8M7.3 13h9.4M8 17h8M12 4v16" />
    </>
  ),
  korrels: (
    <>
      <circle cx="8" cy="9" r="2.6" />
      <circle cx="15.5" cy="8" r="2.6" />
      <circle cx="11.5" cy="15.5" r="2.6" />
    </>
  ),
  // a pellet below the water surface
  zinkers: (
    <>
      <path d="M3 8c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
      <circle cx="12" cy="16" r="2.8" />
      <path d="M12 10.5v1.5" />
    </>
  ),
  // a crust on the water surface
  drijvend: (
    <>
      <path d="M3 15c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
      <path d="M8 13V9.5C8 8 9.5 7 12 7s4 1 4 2.5V13" />
    </>
  ),
  deeg: <path d="M5 15c-1-3 1-6 4-6 1-2 5-2 6 0 3 0 5 3 4 6-1 2-3 2.5-7 2.5S6 17 5 15Z" />,
  pasta: <path d="M7 6c3 1 7 1 10 0M7 10c3 1 7 1 10 0M7 14c3 1 7 1 10 0M7 18c3 1 7 1 10 0M8 5l8 14" />,
  'den-bol': (
    <>
      <circle cx="12" cy="12" r="6" />
      <path d="M8 9.5c2.5 1.2 5.5 1.2 8 0M6.3 13c3.5 1.4 7.9 1.4 11.4 0" />
    </>
  ),
  aasvisjes: (
    <>
      <path d="M3.5 12c2.5-3.5 6-5 9.5-5 3 0 5 2 6 5-1 3-3 5-6 5-3.5 0-7-1.5-9.5-5Z M19 12l2-3v6Z" />
      <circle cx="15.5" cy="11" r=".9" fill="currentColor" />
    </>
  ),
}

export function BaitIcon({ kind, forbidden = false, size = 28 }: { kind: string; forbidden?: boolean; size?: number }) {
  return (
    <svg
      className="bait-icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyphs[kind] ?? <circle cx="12" cy="12" r="5" />}
      {forbidden && <path className="bait-icon__ban" d="M3 21 21 3" strokeWidth="2.4" />}
    </svg>
  )
}

/** A row of labels; each says what it is in words too, so it reads without the icons. */
export function BaitLabels({ kinds, forbidden = false, limits }: { kinds?: readonly string[] | null; forbidden?: boolean; limits?: Record<string, string> }) {
  const list = sortBaits(kinds)
  if (!list.length) return null
  return (
    <ul className={`bait-labels ${forbidden ? 'bait-labels--no' : ''}`}>
      {list.map((k) => (
        <li key={k} className="bait">
          <span className="bait__badge">
            <BaitIcon kind={k} forbidden={forbidden} />
          </span>
          <span className="bait__name">
            {baitLabel(k)}
            {limits?.[k] && <small>{limits[k]}</small>}
          </span>
        </li>
      ))}
    </ul>
  )
}
