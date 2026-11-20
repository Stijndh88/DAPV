import type { Access, FieldAccess } from 'payload'

type U = { role?: 'admin' | 'editor' } | null | undefined

export const isAdmin = ({ req }: { req: { user?: unknown } }) => (req.user as U)?.role === 'admin'
export const isLoggedIn = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

export const adminOnly: Access = ({ req }) => isAdmin({ req })
export const editors: Access = ({ req }) => isLoggedIn({ req })
export const anyone: Access = () => true

/** Public sees published only; logged-in editors see drafts too. */
export const publishedOrLoggedIn: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}

export const adminFieldOnly: FieldAccess = ({ req }) => (req.user as U)?.role === 'admin'
