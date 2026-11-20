import type { CollectionConfig } from 'payload'
import path from 'path'
import { anyone, editors } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Foto of bestand', plural: 'Mediabibliotheek' },
  admin: { group: 'Inhoud', defaultColumns: ['filename', 'alt', 'updatedAt'] },
  access: { read: anyone, create: editors, update: editors, delete: editors },
  upload: {
    staticDir: process.env.MEDIA_DIR || path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/*', 'application/pdf', 'audio/*'],
    focalPoint: true,
    crop: true,
    imageSizes: [
      { name: 'thumb', width: 480, height: 360, position: 'centre' },
      { name: 'card', width: 960, height: undefined },
      { name: 'large', width: 1920, height: undefined, withoutEnlargement: true },
    ],
    adminThumbnail: 'thumb',
    formatOptions: { format: 'webp', options: { quality: 82 } },
    resizeOptions: { width: 2560, withoutEnlargement: true },
  },
  fields: [
    {
      name: 'alt',
      label: 'Korte beschrijving',
      type: 'text',
      admin: { description: 'Wat staat er op de foto? Helpt blinde bezoekers en Google. Mag leeg.' },
    },
    { name: 'credit', label: 'Fotograaf', type: 'text' },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.alt && data.filename) {
          data.alt = String(data.filename).replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
        }
        return data
      },
    ],
  },
}
