import type { CollectionConfig } from 'payload'
import { adminOnly, isAdmin } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Gebruiker', plural: 'Gebruikers' },
  auth: { maxLoginAttempts: 10, lockTime: 10 * 60 * 1000 },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Beheer',
    hidden: ({ user }) => (user as { role?: string } | null)?.role !== 'admin',
  },
  access: {
    // Editors may only read and update themselves (password change).
    read: ({ req }) => (isAdmin({ req }) ? true : req.user ? { id: { equals: req.user.id } } : false),
    create: adminOnly,
    update: ({ req }) => (isAdmin({ req }) ? true : req.user ? { id: { equals: req.user.id } } : false),
    delete: adminOnly,
    // First user can always be created through the admin "create first user" screen.
  },
  fields: [
    { name: 'name', label: 'Naam', type: 'text', required: true },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Beheerder (alles, ook instellingen en gebruikers)', value: 'admin' },
        { label: 'Redacteur (nieuws, foto’s, kalender, uitslagen)', value: 'editor' },
      ],
      access: {
        update: ({ req }) => isAdmin({ req }),
      },
      hooks: {
        beforeChange: [
          async ({ req, operation, value }) => {
            // The very first account becomes admin automatically.
            if (operation === 'create') {
              const { totalDocs } = await req.payload.count({ collection: 'users', req })
              if (totalDocs === 0) return 'admin'
            }
            return value
          },
        ],
      },
    },
  ],
}
