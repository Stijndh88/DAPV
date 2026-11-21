import type { Competition, Water } from '@/payload-types'
import { tz, typeLabel } from './format'

/** "2026-09-12" in Brussels for a stored date (dates are saved as noon UTC). */
export const localDay = (d: string | Date) => new Date(d).toLocaleDateString('sv-SE', { timeZone: tz })

/** Brussels wall-clock time on a day → UTC "YYYYMMDDTHHMMSSZ". */
export function brusselsToUtc(day: string, hhmm: string) {
  const [y, m, d] = day.split('-').map(Number)
  const [h, min] = hhmm.split(':').map(Number)
  const guess = new Date(Date.UTC(y, m - 1, d, h, min))
  // the offset of Brussels at that moment, e.g. "GMT+2"
  const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(guess).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+1'
  const r = name.match(/GMT([+-]\d+)(?::(\d+))?/)
  const offsetMin = r ? Number(r[1]) * 60 + Math.sign(Number(r[1])) * Number(r[2] ?? 0) : 60
  return new Date(guess.getTime() - offsetMin * 60_000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

const water = (c: Competition) => (c.water && typeof c.water === 'object' ? (c.water as Water) : null)

export const place = (c: Competition) => {
  const w = water(c)
  if (!w) return ''
  const known = `${w.name} ${w.address ?? ''}`.toLowerCase()
  return [w.name, w.address, w.town && !known.includes(w.town.toLowerCase()) ? w.town : null].filter(Boolean).join(', ')
}

/** The day's times: arrive for the draw, go home after the weigh-in. */
export function eventTimes(c: Competition) {
  const day = localDay(c.date)
  const from = c.drawTime || c.startTime
  if (!from) return { day, allDay: true as const }
  const to = c.endTime && c.endTime > from ? c.endTime : null
  return { day, allDay: false as const, start: brusselsToUtc(day, from), end: to ? brusselsToUtc(day, to) : null }
}

export function describe(c: Competition, siteUrl = '') {
  const lines = [
    typeLabel[c.type ?? 'club'] + (c.countsForStandings ? ', telt mee voor de Super Prestige' : ''),
    c.drawTime && `Loting ${c.drawTime}`,
    c.startTime && `Vissen ${fishingTimes(c)}`,
    c.registration && `Inschrijven: ${c.registration}`,
    c.notes,
    siteUrl && `${siteUrl}/wedstrijden/${c.slug}`,
  ]
  return lines.filter(Boolean).join('\n')
}

/** "09:00 tot 17:00" or "09:00 tot 12:00 en 13:30 tot 17:00" */
export function fishingTimes(c: Pick<Competition, 'startTime' | 'endTime' | 'breakStart' | 'breakEnd'>) {
  if (!c.startTime) return ''
  if (c.breakStart && c.breakEnd && c.endTime) return `${c.startTime} tot ${c.breakStart} en ${c.breakEnd} tot ${c.endTime}`
  return c.endTime ? `${c.startTime} tot ${c.endTime}` : c.startTime
}

export function googleCalendarUrl(c: Competition, siteUrl = '') {
  const t = eventTimes(c)
  const next = (d: string) => {
    const x = new Date(`${d}T12:00:00Z`)
    x.setUTCDate(x.getUTCDate() + 1)
    return x.toISOString().slice(0, 10).replace(/-/g, '')
  }
  const dates = t.allDay ? `${t.day.replace(/-/g, '')}/${next(t.day)}` : `${t.start}/${t.end ?? t.start}`
  const q = new URLSearchParams({ action: 'TEMPLATE', text: `Plasvissers: ${c.title}`, dates, details: describe(c, siteUrl), location: place(c) })
  return `https://calendar.google.com/calendar/render?${q}`
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
/** Lines longer than 75 octets are folded (RFC 5545). */
const fold = (line: string) => {
  const out: string[] = []
  let rest = line
  while (Buffer.byteLength(rest) > 74) {
    let n = 74
    while (Buffer.byteLength(rest.slice(0, n)) > 74) n--
    out.push(rest.slice(0, n))
    rest = ' ' + rest.slice(n)
  }
  out.push(rest)
  return out.join('\r\n')
}

export function toIcs(comps: Competition[], { name, siteUrl = '', host = 'plasvissers.be' }: { name: string; siteUrl?: string; host?: string }) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//De Aalsterse Plasvissers//Wedstrijdkalender//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`,
    `X-WR-TIMEZONE:${tz}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
  ]
  for (const c of comps) {
    const t = eventTimes(c)
    const day = t.day.replace(/-/g, '')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${c.slug}@${host}`,
      `DTSTAMP:${stamp}`,
      ...(t.allDay ? [`DTSTART;VALUE=DATE:${day}`] : [`DTSTART:${t.start}`, ...(t.end ? [`DTEND:${t.end}`] : [])]),
      `SUMMARY:${esc(`${c.status === 'afgelast' ? 'AFGELAST: ' : ''}${c.title}`)}`,
      `DESCRIPTION:${esc(describe(c, siteUrl))}`,
      ...(place(c) ? [`LOCATION:${esc(place(c))}`] : []),
      ...(siteUrl ? [`URL:${siteUrl}/wedstrijden/${c.slug}`] : []),
      `STATUS:${c.status === 'afgelast' ? 'CANCELLED' : 'CONFIRMED'}`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

export const icsResponse = (body: string, filename: string) =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'public, max-age=900',
    },
  })

/** Directions to a water: its own map link, else a search on its address or name + town. */
export function directionsUrl(w: Water | null) {
  if (!w) return null
  if (w.mapUrl) return w.mapUrl
  const q = [w.address, w.name, w.town].filter(Boolean).join(', ')
  return q ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}` : null
}
