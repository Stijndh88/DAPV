import type { CollectionConfig } from 'payload'
import { anyone, editors } from '../access'
import { slugify } from '../lib/slug'
import { revalidate } from '../hooks/revalidate'

export const competitionTypes = [
  { label: 'Clubwedstrijd', value: 'club' },
  { label: 'Kampioenschap', value: 'kampioenschap' },
  { label: 'Koppelwedstrijd', value: 'koppel' },
  { label: 'Jeugdwedstrijd', value: 'jeugd' },
  { label: 'Nachtwedstrijd', value: 'nacht' },
  { label: 'Vriendschappelijk', value: 'vriendschappelijk' },
  { label: 'Andere', value: 'andere' },
] as const

export const competitionStatuses = [
  { label: 'Gepland', value: 'gepland' },
  { label: 'Gespeeld', value: 'gespeeld' },
  { label: 'Verplaatst', value: 'verplaatst' },
  { label: 'Afgelast', value: 'afgelast' },
] as const

export const Competitions: CollectionConfig = {
  slug: 'competitions',
  labels: { singular: 'Wedstrijd', plural: 'Wedstrijdkalender' },
  admin: {
    useAsTitle: 'title',
    group: 'Wedstrijden',
    defaultColumns: ['date', 'title', 'water', 'type', 'status'],
    listSearchableFields: ['title'],
    description: 'Alle wedstrijden van het seizoen. Kopieer een bestaande wedstrijd (⋯ > Dupliceren) om sneller te werken.',
    pagination: { defaultLimit: 50 },
  },
  defaultSort: 'date',
  access: { read: anyone, create: editors, update: editors, delete: editors },
  hooks: {
    afterChange: [revalidate(['/', '/wedstrijden', '/klassement'])],
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        if (data.date && !data.season) data.season = new Date(data.date).getFullYear()
        if (!data.title && data.date) {
          const d = new Date(data.date)
          data.title = `Wedstrijd ${d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}`
        }
        if (!data.slug && data.title && data.date) {
          data.slug = slugify(`${data.season}-${data.title}`)
        }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          label: 'Datum',
          type: 'date',
          required: true,
          index: true,
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly', displayFormat: 'EEEE d MMMM yyyy' } },
        },
        { name: 'startTime', label: 'Aanvang', type: 'text', defaultValue: '13:30', admin: { width: '25%', placeholder: '13:30' } },
        { name: 'endTime', label: 'Einde', type: 'text', defaultValue: '17:30', admin: { width: '25%', placeholder: '17:30' } },
      ],
    },
    { name: 'title', label: 'Naam', type: 'text', admin: { description: 'Bv. "3e clubwedstrijd" of "Kampioenschap". Leeg = automatisch.' } },
    {
      type: 'row',
      fields: [
        { name: 'water', label: 'Viswater', type: 'relationship', relationTo: 'waters', admin: { width: '50%' } },
        { name: 'type', label: 'Soort', type: 'select', defaultValue: 'club', options: [...competitionTypes], admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'drawTime', label: 'Loting', type: 'text', defaultValue: '12:30', admin: { width: '33%', placeholder: '12:30' } },
        { name: 'price', label: 'Inschrijfgeld', type: 'text', admin: { width: '33%', placeholder: '€ 10' } },
        { name: 'maxParticipants', label: 'Max. deelnemers', type: 'number', admin: { width: '33%' } },
      ],
    },
    {
      name: 'registration',
      label: 'Inschrijven',
      type: 'textarea',
      admin: { description: 'Hoe schrijf je in? Bv. "Ter plaatse vóór 7u" of "Bij Jan, 0470 12 34 56".' },
    },
    { name: 'notes', label: 'Extra info', type: 'textarea' },
    {
      name: 'result',
      label: 'Uitslag',
      type: 'join',
      collection: 'results',
      on: 'competition',
      admin: { description: 'Voeg de uitslag toe via Wedstrijden > Uitslagen.' },
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'gepland',
      options: [...competitionStatuses],
      admin: { position: 'sidebar' },
    },
    {
      name: 'countsForStandings',
      label: 'Telt mee voor het klassement',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'season',
      label: 'Seizoen',
      type: 'number',
      index: true,
      admin: { position: 'sidebar', description: 'Automatisch het jaar van de datum.' },
    },
    { name: 'slug', type: 'text', unique: true, index: true, admin: { position: 'sidebar', description: 'Automatisch: seizoen + naam.' } },
  ],
}
