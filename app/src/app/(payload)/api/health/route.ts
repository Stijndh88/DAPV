import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const p = await getPayload({ config })
    await p.count({ collection: 'users' })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 503 })
  }
}
