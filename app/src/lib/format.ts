export const tz = 'Europe/Brussels'

export const fmtDate = (d: string | Date, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Date(d).toLocaleDateString('nl-BE', { timeZone: tz, ...opts })

export const fmtWeekday = (d: string | Date) => fmtDate(d, { weekday: 'long' })
export const fmtDayMonth = (d: string | Date) => fmtDate(d, { day: 'numeric', month: 'long' })
export const fmtShort = (d: string | Date) => fmtDate(d, { day: 'numeric', month: 'short' })

export const fmtKg = (kg?: number | null, digits = 3) =>
  typeof kg === 'number' ? kg.toLocaleString('nl-BE', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '–'

export const daysUntil = (d: string | Date) => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const t = new Date(d)
  t.setHours(0, 0, 0, 0)
  return Math.round((t.getTime() - start.getTime()) / 86_400_000)
}

export const relativeDay = (d: string | Date) => {
  const n = daysUntil(d)
  if (n === 0) return 'vandaag'
  if (n === 1) return 'morgen'
  if (n > 1 && n < 7) return `over ${n} dagen`
  if (n >= 7 && n < 14) return 'volgende week'
  if (n >= 14) return `over ${Math.round(n / 7)} weken`
  return ''
}

export const typeLabel: Record<string, string> = {
  club: 'Clubwedstrijd',
  kampioenschap: 'Kampioenschap',
  koppel: 'Koppelwedstrijd',
  jeugd: 'Jeugdwedstrijd',
  nacht: 'Nachtwedstrijd',
  vriendschappelijk: 'Vriendschappelijk',
  andere: 'Wedstrijd',
}

export const ucfirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
