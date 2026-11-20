import type { CollectionConfig } from 'payload'
import { anyone, editors } from '../access'
import { slugField } from '../lib/slug'
import { revalidate } from '../hooks/revalidate'

export const Albums: CollectionConfig = {
  slug: 'albums',
  labels: { singular: 'Fotoalbum', plural: 'Fotoalbums' },
  admin: {
    useAsTitle: 'title',
    group: 'Inhoud',
    defaultColumns: ['title', 'date', 'updatedAt'],
    description:
      'Tip: bij "Foto’s" kun je met "Nieuwe toevoegen" meteen tientallen foto’s tegelijk slepen (bulkupload).',
  },
  defaultSort: '-date',
  access: { read: anyone, create: editors, update: editors, delete: editors },
  hooks: { afterChange: [revalidate(['/', '/fotos'])] },
  fields: [
    { name: 'title', label: 'Titel', type: 'text', required: true },
    {
      name: 'date',
      label: 'Datum',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } },
    },
    {
      name: 'photos',
      label: 'Foto’s',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      admin: { description: 'Sleep foto’s om de volgorde te wijzigen. De eerste foto is de omslag, tenzij je hieronder een andere kiest.' },
    },
    { name: 'description', label: 'Beschrijving', type: 'textarea' },
    {
      name: 'cover',
      label: 'Omslagfoto (optioneel)',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'competition',
      label: 'Hoort bij wedstrijd',
      type: 'relationship',
      relationTo: 'competitions',
      admin: { position: 'sidebar' },
    },
    slugField('title'),
  ],
}
