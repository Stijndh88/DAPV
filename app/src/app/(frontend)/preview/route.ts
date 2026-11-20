import { draftMode, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { payload } from '@/lib/payload'

/** Admin "Preview" lands here: only logged-in editors can switch on draft mode. */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const path = url.searchParams.get('path') || '/'
  const p = await payload()
  const { user } = await p.auth({ headers: await headers() })
  if (!user) return new Response('Log eerst in via /admin', { status: 401 })
  ;(await draftMode()).enable()
  redirect(path.startsWith('/') ? path : '/')
}
