/** The site's signature: a gently rippled water surface separating "above" (mist) from "below" (deep water). */
export function Waterline({ flip = false, className = '' }: { flip?: boolean; className?: string }) {
  return (
    <svg
      className={`waterline ${flip ? 'waterline--flip' : ''} ${className}`}
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="waterline__fill"
        d="M0 22 C 120 14, 240 30, 360 22 S 600 14, 720 22 S 960 30, 1080 22 S 1320 14, 1440 22 L1440 48 L0 48 Z"
      />
      <path
        className="waterline__ripple"
        d="M0 22 C 120 14, 240 30, 360 22 S 600 14, 720 22 S 960 30, 1080 22 S 1320 14, 1440 22"
      />
    </svg>
  )
}

/** A classic pole-fishing float. The orange tip is the site's only loud colour. */
export function Bobber({ className = '' }: { className?: string }) {
  return (
    <svg className={`bobber ${className}`} viewBox="0 0 40 160" aria-hidden="true">
      <line x1="20" y1="0" x2="20" y2="26" className="bobber__line" />
      <rect x="18" y="26" width="4" height="40" rx="2" className="bobber__tip" />
      <rect x="18" y="52" width="4" height="6" className="bobber__band" />
      <path d="M20 66 C 30 80, 31 100, 20 128 C 9 100, 10 80, 20 66 Z" className="bobber__body" />
      <line x1="20" y1="128" x2="20" y2="160" className="bobber__stem" />
    </svg>
  )
}
