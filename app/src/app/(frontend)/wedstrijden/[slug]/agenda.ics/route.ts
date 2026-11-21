import { payload } from '@/lib/payload'
import { icsResponse, toIcs } from '@/lib/calendar'

export const dynamic = 'force-dynamic'

/** One match as a calendar file (Apple, Outlook, Android). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await payload()
  const c = (await p.find({ collection: 'competitions', where: { slug: { equals: slug } }, depth: 1, limit: 1 })).docs[0]
  if (!c) return new Response('Wedstrijd niet gevonden', { status: 404 })
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  return icsResponse(toIcs([c], { name: c.title ?? 'Wedstrijd', siteUrl }), `${c.slug}.ics`)
}
