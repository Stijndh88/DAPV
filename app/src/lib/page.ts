import { draftMode } from 'next/headers'
import { payload } from './payload'

export async function loadPage(slug: string) {
  const p = await payload()
  const { isEnabled } = await draftMode()
  const res = await p.find({
    collection: 'pages',
    where: isEnabled ? { slug: { equals: slug } } : { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    draft: isEnabled,
    depth: 1,
    limit: 1,
  })
  return res.docs[0]
}
