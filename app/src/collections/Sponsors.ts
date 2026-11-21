import type { CollectionConfig } from 'payload'
import { anyone, editors } from '../access'
import { revalidate } from '../hooks/revalidate'

export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  labels: { singular: 'Sponsor', plural: 'Sponsors' },
  admin: { useAsTitle: 'name', group: 'Club', defaultColumns: ['name', 'tier', 'active'] },
  defaultSort: 'name',
  access: { read: anyone, create: editors, update: editors, delete: editors },
  hooks: { afterChange: [revalidate(['/', '/club'])] },
  fields: [
    { name: 'name', label: 'Naam', type: 'text', required: true },
    { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
    { name: 'url', label: 'Website', type: 'text' },
    {
      name: 'tier',
      label: 'Soort',
      type: 'select',
      defaultValue: 'partner',
      options: [
        { label: 'Hoofdsponsor', value: 'hoofd' },
        { label: 'Partner', value: 'partner' },
        { label: 'Steunt de club', value: 'steun' },
      ],
    },
    { name: 'active', label: 'Tonen op de site', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
