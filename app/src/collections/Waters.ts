import type { CollectionConfig } from 'payload'
import { anyone, editors } from '../access'
import { slugField } from '../lib/slug'
import { baitOptions } from '../lib/bait'

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
    {
      name: 'feeding',
      label: 'Voeders en aas',
      type: 'group',
      admin: {
        description:
          'Wat mag er gevoederd en aan de haak, zoals op het voederblad. Vink de soorten aan: de site toont ze als labels bij dit water en bij elke wedstrijd hier.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'shallow',
              label: 'Ondiep vissen',
              type: 'select',
              options: [
                { label: 'Toegelaten', value: 'ja' },
                { label: 'Verboden', value: 'nee' },
              ],
              admin: { width: '33%' },
            },
            { name: 'clubKeepnet', label: 'Leefnet van de club gebruiken', type: 'checkbox', admin: { width: '33%' } },
            { name: 'clubPellets', label: 'Korrels kopen in de club', type: 'checkbox', admin: { width: '33%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'feedAllowed', label: 'Voederen: mag', type: 'select', hasMany: true, options: baitOptions, admin: { width: '50%' } },
            { name: 'feedForbidden', label: 'Voederen: mag niet', type: 'select', hasMany: true, options: baitOptions, admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'hookAllowed', label: 'Aan de haak: mag', type: 'select', hasMany: true, options: baitOptions, admin: { width: '50%' } },
            { name: 'hookForbidden', label: 'Aan de haak: mag niet', type: 'select', hasMany: true, options: baitOptions, admin: { width: '50%' } },
          ],
        },
        {
          name: 'limits',
          label: 'Hoeveelheden',
          labels: { singular: 'Hoeveelheid', plural: 'Hoeveelheden' },
          type: 'array',
          admin: { description: 'Bv. "Voeder of leem: 5 kg". Kies één of meer soorten die samen onder dezelfde grens vallen.', initCollapsed: true },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'baits', label: 'Soort(en)', type: 'select', hasMany: true, required: true, options: baitOptions, admin: { width: '60%' } },
                { name: 'amount', label: 'Maximum', type: 'text', required: true, admin: { width: '40%', placeholder: '5 kg' } },
              ],
            },
          ],
        },
        { name: 'note', label: 'Extra uitleg', type: 'textarea', admin: { description: 'Bv. "Per mande = 4 uur vissen."' } },
      ],
    },
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
