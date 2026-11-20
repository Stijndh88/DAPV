import type { GlobalConfig } from 'payload'
import { anyone, isAdmin, editors } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Club & website',
  admin: { group: 'Beheer', description: 'Contactgegevens en algemene info die overal op de site staat.' },
  access: { read: anyone, update: ({ req }) => isAdmin({ req }) || Boolean(editors({ req } as never)) },
  hooks: {
    afterChange: [
      async ({ doc }) => {
        try {
          const { revalidatePath } = await import('next/cache')
          revalidatePath('/', 'layout')
        } catch {}
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Club',
          fields: [
            { name: 'clubName', label: 'Clubnaam', type: 'text', defaultValue: 'De Plasvissers', required: true },
            { name: 'tagline', label: 'Ondertitel', type: 'text', defaultValue: 'Hengelclub sinds 1976' },
            {
              name: 'welcome',
              label: 'Welkomsttekst op de homepagina',
              type: 'textarea',
              defaultValue:
                'Een gezellige hengelclub voor iedereen die graag aan de waterkant zit. Kom een keer mee vissen, je eerste wedstrijd is gratis.',
            },
            { name: 'clubSong', label: 'Clublied (mp3)', type: 'upload', relationTo: 'media', admin: { description: 'Wordt afgespeeld op de clubpagina.' } },
            { name: 'clubSongLyrics', label: 'Tekst van het clublied', type: 'textarea' },
          ],
        },
        {
          label: 'Contact',
          fields: [
            { name: 'email', label: 'E-mail', type: 'email' },
            { name: 'phone', label: 'Telefoon', type: 'text' },
            { name: 'clubhouse', label: 'Clublokaal', type: 'text' },
            { name: 'address', label: 'Adres', type: 'textarea' },
            { name: 'bankAccount', label: 'Rekeningnummer (lidgeld)', type: 'text' },
            {
              name: 'socials',
              label: 'Sociale media',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'platform', label: 'Platform', type: 'select', options: ['Facebook', 'Instagram', 'WhatsApp', 'YouTube'].map((v) => ({ label: v, value: v.toLowerCase() })) },
                    { name: 'url', label: 'Link', type: 'text' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Klassement',
          fields: [
            {
              name: 'standingsMethod',
              label: 'Hoe wordt het klassement berekend?',
              type: 'radio',
              defaultValue: 'points',
              options: [
                { label: 'Punten per wedstrijd (winnaar krijgt evenveel punten als er deelnemers zijn)', value: 'points' },
                { label: 'Totaal gewicht over het seizoen', value: 'weight' },
              ],
            },
            {
              name: 'dropWorst',
              label: 'Slechtste resultaten schrappen',
              type: 'number',
              defaultValue: 0,
              min: 0,
              admin: { description: 'Aantal slechtste wedstrijden per visser dat niet meetelt. 0 = alles telt.' },
            },
            { name: 'membersOnly', label: 'Alleen leden in het klassement', type: 'checkbox', defaultValue: true },
          ],
        },
      ],
    },
  ],
}
