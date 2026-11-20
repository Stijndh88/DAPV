import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { nl } from '@payloadcms/translations/languages/nl'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { News } from './collections/News'
import { Albums } from './collections/Albums'
import { Waters } from './collections/Waters'
import { Competitions } from './collections/Competitions'
import { Results } from './collections/Results'
import { Anglers } from './collections/Anglers'
import { BoardMembers } from './collections/BoardMembers'
import { Sponsors } from './collections/Sponsors'
import { Pages } from './collections/Pages'
import { SiteSettings } from './globals/SiteSettings'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const smtp = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.SMTP_FROM || 'website@plasvissers.be',
      defaultFromName: 'De Plasvissers',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      },
    })
  : undefined

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · Plasvissers beheer', title: 'Beheer' },
    components: {
      beforeDashboard: ['/components/admin/Welcome'],
      graphics: {
        Logo: '/components/admin/Logo#Logo',
        Icon: '/components/admin/Logo#Icon',
      },
    },
    dateFormat: 'd MMMM yyyy',
  },
  i18n: {
    supportedLanguages: { nl },
    fallbackLanguage: 'nl',
  },
  collections: [News, Albums, Media, Pages, Competitions, Results, Anglers, Waters, BoardMembers, Sponsors, Users],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || '' },
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: migrations,
    push: false,
  }),
  email: smtp,
  sharp,
  graphQL: { disable: true },
  upload: { limits: { fileSize: 25_000_000 } },
})
