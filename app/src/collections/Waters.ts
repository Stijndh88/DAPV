import type { CollectionConfig } from 'payload'
import { anyone, editors } from '../access'
import { slugField } from '../lib/slug'

export const Waters: CollectionConfig = {
  slug: 'waters',
  labels: { singular: 'Viswater', plural: 'Viswaters' },
  admin: { useAsTitle: 'name', group: 'Wedstrijden', defaultColumns: ['name', 'town'] },
  access: { read: anyone, create: editors, update: editors, delete: editors },
  fields: [
    { name: 'name', label: 'Naam', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'address', label: 'Adres', type: 'text' },
        { name: 'town', label: 'Gemeente', type: 'text' },
      ],
    },
    { name: 'description', label: 'Beschrijving', type: 'textarea' },
    { name: 'species', label: 'Vissoorten', type: 'text', admin: { description: 'Bv. karper, brasem, voorn, zeelt' } },
    { name: 'rules', label: 'Reglement / afspraken', type: 'textarea' },
    { name: 'image', label: 'Foto', type: 'upload', relationTo: 'media' },
    {
      name: 'mapUrl',
      label: 'Link naar kaart',
      type: 'text',
      admin: { description: 'Plak een Google Maps of OpenStreetMap link.' },
    },
    slugField('name'),
  ],
}
