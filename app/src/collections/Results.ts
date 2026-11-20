import type { CollectionConfig } from 'payload'
import { anyone, editors } from '../access'
import { parseResultsPaste, rankEntries } from '../lib/results'
import { revalidate } from '../hooks/revalidate'

type Entry = {
  angler: number | string | { id: number | string }
  weight?: number | null
  fishCount?: number | null
  place?: number | null
  points?: number | null
  disqualified?: boolean | null
  note?: string | null
}

export const Results: CollectionConfig = {
  slug: 'results',
  labels: { singular: 'Uitslag', plural: 'Uitslagen' },
  admin: {
    useAsTitle: 'label',
    group: 'Wedstrijden',
    defaultColumns: ['label', 'competition', 'updatedAt'],
    description:
      'Snelste manier: kies de wedstrijd en plak de uitslag uit Excel in het vak "Uitslag plakken". Plaatsen en punten worden automatisch berekend.',
  },
  access: { read: anyone, create: editors, update: editors, delete: editors },
  hooks: {
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        // 1. Parse pasted text into entries (creating unknown anglers on the fly).
        const paste: string | undefined = data.pasteImport
        if (paste && paste.trim()) {
          const lines = parseResultsPaste(paste)
          const fromPaste: Entry[] = []
          for (const line of lines) {
            const found = await req.payload.find({
              collection: 'anglers',
              where: { name: { like: line.name } },
              limit: 5,
              req,
              depth: 0,
            })
            const exact = found.docs.find((d) => d.name.toLowerCase() === line.name.toLowerCase())
            const angler =
              exact ??
              (await req.payload.create({ collection: 'anglers', data: { name: line.name, member: true, category: line.category }, req }))
            fromPaste.push({ angler: angler.id, weight: line.weight, fishCount: line.fishCount ?? null, note: line.note ?? null })
          }
          const existing: Entry[] = data.pasteMode === 'append' ? (data.entries ?? originalDoc?.entries ?? []) : []
          data.entries = [...existing, ...fromPaste]
          data.pasteImport = ''
        }
        // 2. Rank.
        if (Array.isArray(data.entries)) data.entries = rankEntries(data.entries as Entry[])
        // 3. Human label for lists.
        const compId = typeof data.competition === 'object' ? data.competition?.id : data.competition
        if (compId) {
          const comp = await req.payload.findByID({ collection: 'competitions', id: compId, depth: 0, req }).catch(() => null)
          if (comp) {
            const d = new Date(comp.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
            data.label = `${d} · ${comp.title}`
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, previousDoc }) => {
        // A result means the competition was fished.
        const compId = typeof doc.competition === 'object' ? doc.competition?.id : doc.competition
        if (compId && !previousDoc?.id) {
          await req.payload
            .update({ collection: 'competitions', id: compId, data: { status: 'gespeeld' }, req, context: { disableRevalidate: true } })
            .catch(() => undefined)
        }
        return doc
      },
      revalidate(['/', '/wedstrijden', '/klassement']),
    ],
  },
  fields: [
    {
      name: 'competition',
      label: 'Wedstrijd',
      type: 'relationship',
      relationTo: 'competitions',
      required: true,
      unique: true,
      admin: { description: 'Elke wedstrijd heeft één uitslag.' },
    },
    {
      type: 'collapsible',
      label: 'Uitslag plakken uit Excel of tekst',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'pasteImport',
          label: 'Uitslag plakken',
          type: 'textarea',
          admin: {
            rows: 8,
            placeholder: 'Jan Peeters\t4,350\t12\nMarc Janssens\t3,120\t9\n...',
            description:
              'Eén visser per regel: naam, gewicht (kg of gram), aantal vissen. Kolommen mogen gescheiden zijn door tab (Excel), ; of twee spaties. Na opslaan verschijnt de lijst hieronder.',
          },
        },
        {
          name: 'pasteMode',
          label: 'Wat met de bestaande lijst?',
          type: 'radio',
          defaultValue: 'replace',
          options: [
            { label: 'Vervangen', value: 'replace' },
            { label: 'Aanvullen', value: 'append' },
          ],
          admin: { layout: 'horizontal' },
        },
      ],
    },
    {
      name: 'entries',
      label: 'Deelnemers',
      type: 'array',
      labels: { singular: 'Deelnemer', plural: 'Deelnemers' },
      admin: {
        initCollapsed: true,
        components: { RowLabel: '/components/admin/EntryRowLabel#EntryRowLabel' },
        description: 'Gesorteerd op gewicht. Plaats en punten worden bij opslaan berekend.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'angler', label: 'Visser', type: 'relationship', relationTo: 'anglers', required: true, admin: { width: '40%' } },
            { name: 'weight', label: 'Gewicht (kg)', type: 'number', min: 0, admin: { width: '20%', step: 0.01 } },
            { name: 'fishCount', label: 'Aantal vissen', type: 'number', min: 0, admin: { width: '20%' } },
            { name: 'disqualified', label: 'Uitgesloten', type: 'checkbox', admin: { width: '20%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'place', label: 'Plaats', type: 'number', admin: { readOnly: true, width: '20%' } },
            { name: 'points', label: 'Punten', type: 'number', admin: { readOnly: true, width: '20%' } },
            { name: 'peg', label: 'Stek', type: 'text', admin: { width: '20%' } },
            { name: 'note', label: 'Opmerking', type: 'text', admin: { width: '40%', placeholder: 'Bv. grootste vis 2,1 kg' } },
          ],
        },
      ],
    },
    {
      name: 'biggestFish',
      label: 'Grootste vis',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'angler', label: 'Visser', type: 'relationship', relationTo: 'anglers' },
            { name: 'species', label: 'Soort', type: 'text' },
            { name: 'weight', label: 'Gewicht (kg)', type: 'number' },
          ],
        },
      ],
    },
    { name: 'report', label: 'Kort verslag', type: 'textarea' },
    { name: 'label', type: 'text', admin: { hidden: true } },
  ],
}
