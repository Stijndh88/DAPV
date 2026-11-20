import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/big-shoulders-display'
import '@fontsource-variable/atkinson-hyperlegible-next'
import './styles.css'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { getSettings, payload } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings().catch(() => null)
  const name = s?.clubName ?? 'De Aalsterse Plasvissers'
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
    title: { default: `${name}, hengelclub`, template: `%s | ${name}` },
    description: s?.welcome ?? 'De Aalsterse Plasvissers, hengelclub uit Aalst sinds 1969: wedstrijden, uitslagen, klassement en clubnieuws.',
    openGraph: { siteName: name, locale: 'nl_BE', type: 'website' },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E6EDEA' },
    { media: '(prefers-color-scheme: dark)', color: '#0A2E35' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const p = await payload()
  const [settings, sponsors, menuPages] = await Promise.all([
    getSettings(),
    p.find({ collection: 'sponsors', where: { active: { equals: true } }, depth: 1, limit: 50, sort: 'tier' }),
    p.find({ collection: 'pages', where: { and: [{ showInMenu: { equals: true } }, { _status: { equals: 'published' } }] }, sort: 'menuOrder', depth: 0, limit: 5 }),
  ])
  return (
    <html lang="nl-BE">
      <body>
        <a href="#inhoud" className="skip">Naar de inhoud</a>
        <Header clubName={settings.clubName} extra={menuPages.docs.map((pg) => ({ href: `/${pg.slug}`, label: pg.title }))} />
        <main id="inhoud">{children}</main>
        <Footer settings={settings} sponsors={sponsors.docs} />
      </body>
    </html>
  )
}
