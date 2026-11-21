import { payload } from '@/lib/payload'
import { icsResponse, toIcs } from '@/lib/calendar'

export const dynamic = 'force-dynamic'

/** Subscribe feed: every match from last season on, so phones keep it up to date. */
export async function GET() {
  const p = await payload()
  const from = new Date().getFullYear() - 1
  const comps = await p.find({ collection: 'competitions', where: { season: { greater_than_equal: from } }, sort: 'date', depth: 1, limit: 500, pagination: false })
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  return icsResponse(toIcs(comps.docs, { name: 'Plasvissers wedstrijden', siteUrl }), 'plasvissers-kalender.ics')
}
