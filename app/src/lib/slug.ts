import type { FieldHook, TextField } from 'payload'

export const slugify = (input: string): string =>
  input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const formatSlug =
  (from: string): FieldHook =>
  ({ value, data, originalDoc }) => {
    if (typeof value === 'string' && value.length > 0) return slugify(value)
    const source = data?.[from] ?? originalDoc?.[from]
    return typeof source === 'string' ? slugify(source) : value
  }

/** Slug field that fills itself from another field. Editors never need to touch it. */
export const slugField = (from = 'title'): TextField => ({
  name: 'slug',
  label: 'Webadres (slug)',
  type: 'text',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'Wordt automatisch ingevuld. Alleen aanpassen als je weet wat je doet.',
  },
  hooks: { beforeValidate: [formatSlug(from)] },
})
