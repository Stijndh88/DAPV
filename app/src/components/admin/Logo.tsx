export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r="19" fill="#0E3B43" />
        <path d="M6 24c4-3 8-3 14 0s10 3 14 0" stroke="#9FC9C2" strokeWidth="2" fill="none" />
        <path d="M20 6v8" stroke="#F4F1E6" strokeWidth="2" />
        <ellipse cx="20" cy="17" rx="3" ry="4.5" fill="#FF5A1F" />
      </svg>
      <strong style={{ fontSize: 22 }}>De Aalsterse Plasvissers</strong>
    </div>
  )
}
export function Icon() {
  return (
    <svg width="26" height="26" viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="19" fill="#0E3B43" />
      <ellipse cx="20" cy="17" rx="3" ry="4.5" fill="#FF5A1F" />
      <path d="M6 24c4-3 8-3 14 0s10 3 14 0" stroke="#9FC9C2" strokeWidth="2" fill="none" />
    </svg>
  )
}
