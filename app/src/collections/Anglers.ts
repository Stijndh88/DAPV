import type { CollectionConfig } from 'payload'
import { anyone, editors } from '../access'
import { slugField } from '../lib/slug'

export const Anglers: CollectionConfig = {
  slug: 'anglers',
  labels: { singular: 'Visser', plural: 'Vissers' },
  admin: {
    useAsTitle: 'name',
    group: 'Wedstrijden',
    defaultColumns: ['name', 'member', 'updatedAt'],
    description: 'Deelnemers aan wedstrijden. Nieuwe namen uit geplakte uitslagen worden hier automatisch toegevoegd.',
  },
  defaultSort: 'name',
  access: { read: anyone, create: editors, update: editors, delete: editors },
  fields: [
    { name: 'name', label: 'Naam', type: 'text', required: true, unique: true },
    {
      name: 'member',
      label: 'Lid van de club',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Alleen leden tellen mee in het clubklassement.' },
    },
    {
      name: 'category',
      label: 'Categorie',
      type: 'text',
      admin: { description: 'Optioneel: "s" (senior), "v" (veteraan) of "j" (junior). Uit oude uitslagen overgenomen.' },
    },
    slugField('name'),
  ],
}
