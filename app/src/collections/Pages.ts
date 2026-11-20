import type { CollectionConfig } from 'payload'
import { editors, publishedOrLoggedIn } from '../access'
import { slugField } from '../lib/slug'
import { revalidate } from '../hooks/revalidate'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Pagina', plural: 'Pagina’s' },
  admin: {
    useAsTitle: 'title',
    group: 'Inhoud',
    defaultColumns: ['title', 'slug', '_status'],
    description: 'Vaste pagina’s zoals Lid worden, Reglement of Geschiedenis.',
    preview: (doc) => `/preview?path=/${doc.slug}`,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrLoggedIn, create: editors, update: editors, delete: editors },
  hooks: { afterChange: [revalidate([])] },
  fields: [
    { name: 'title', label: 'Titel', type: 'text', required: true },
    { name: 'intro', label: 'Inleiding', type: 'textarea' },
    { name: 'content', label: 'Tekst', type: 'richText' },
    {
      name: 'showInMenu',
      label: 'Tonen in het menu',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    { name: 'menuOrder', label: 'Volgorde in menu', type: 'number', defaultValue: 50, admin: { position: 'sidebar' } },
    slugField('title'),
  ],
}
