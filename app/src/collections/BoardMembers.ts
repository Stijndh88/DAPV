import type { CollectionConfig } from 'payload'
import { anyone, editors } from '../access'
import { revalidate } from '../hooks/revalidate'

export const BoardMembers: CollectionConfig = {
  slug: 'board-members',
  labels: { singular: 'Bestuurslid', plural: 'Bestuur' },
  admin: { useAsTitle: 'name', group: 'Club', defaultColumns: ['name', 'role', 'order'] },
  defaultSort: 'order',
  access: { read: anyone, create: editors, update: editors, delete: editors },
  hooks: { afterChange: [revalidate(['/club'])] },
  fields: [
    { name: 'name', label: 'Naam', type: 'text', required: true },
    { name: 'role', label: 'Functie', type: 'text', required: true, admin: { description: 'Bv. Voorzitter, Secretaris, Penningmeester' } },
    { name: 'photo', label: 'Foto', type: 'upload', relationTo: 'media' },
    {
      type: 'row',
      fields: [
        { name: 'email', label: 'E-mail', type: 'email' },
        { name: 'phone', label: 'Telefoon', type: 'text' },
      ],
    },
    { name: 'order', label: 'Volgorde', type: 'number', defaultValue: 10, admin: { position: 'sidebar', description: 'Lager = hoger in de lijst' } },
  ],
}
