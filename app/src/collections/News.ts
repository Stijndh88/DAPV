import type { CollectionConfig } from 'payload'
import { editors, publishedOrLoggedIn } from '../access'
import { slugField } from '../lib/slug'
import { revalidate } from '../hooks/revalidate'

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'Nieuwsbericht', plural: 'Nieuws' },
  admin: {
    useAsTitle: 'title',
    group: 'Inhoud',
    defaultColumns: ['title', 'publishedAt', '_status'],
    description: 'Verslagen, aankondigingen en clubnieuws. Klik op "Publiceren" om het op de site te zetten.',
    preview: (doc) => `/nieuws/${doc.slug}`,
  },
  defaultSort: '-publishedAt',
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrLoggedIn, create: editors, update: editors, delete: editors },
  hooks: { afterChange: [revalidate(['/', '/nieuws'])], afterDelete: [revalidate(['/', '/nieuws'])] },
  fields: [
    { name: 'title', label: 'Titel', type: 'text', required: true },
    {
      name: 'cover',
      label: 'Hoofdfoto',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Liggende foto werkt het best.' },
    },
    {
      name: 'excerpt',
      label: 'Korte samenvatting',
      type: 'textarea',
      maxLength: 280,
      admin: { description: 'Eén of twee zinnen voor het overzicht. Leeg = begin van de tekst.' },
    },
    { name: 'content', label: 'Tekst', type: 'richText', required: true },
    {
      name: 'publishedAt',
      label: 'Publicatiedatum',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy HH:mm' } },
    },
    {
      name: 'category',
      label: 'Soort',
      type: 'select',
      defaultValue: 'nieuws',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Clubnieuws', value: 'nieuws' },
        { label: 'Wedstrijdverslag', value: 'verslag' },
        { label: 'Aankondiging', value: 'aankondiging' },
        { label: 'Viswater', value: 'water' },
      ],
    },
    {
      name: 'relatedCompetition',
      label: 'Hoort bij wedstrijd',
      type: 'relationship',
      relationTo: 'competitions',
      admin: { position: 'sidebar' },
    },
    slugField('title'),
  ],
}
