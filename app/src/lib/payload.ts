import { getPayload } from 'payload'
import config from '@payload-config'
import { cache } from 'react'

export const payload = cache(async () => getPayload({ config }))

export const getSettings = cache(async () => {
  const p = await payload()
  return p.findGlobal({ slug: 'site-settings', depth: 1 })
})
