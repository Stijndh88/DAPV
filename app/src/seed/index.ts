/**
 * Demo content so the site looks alive on first run.
 *   pnpm seed          seeds an empty database
 *   pnpm seed --force  wipes club content first (users are kept)
 *
 * Anglers, results, sponsors and news here are fictional demo data.
 * The migration script imports the real archive from the old WordPress site.
 */
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { doc, p, h, ul, b } from './lexical'
import { placeholderPhoto } from './images'

const force = process.argv.includes('--force')
const ctx = { disableRevalidate: true }

const anglerNames = [
  'Luc Verhoeven', 'Marleen Claes', 'Dirk Peeters', 'Johan Wouters', 'Patrick Maes', 'Rita Jacobs',
  'Geert Willems', 'Kurt Mertens', 'Stefaan De Smet', 'Hilde Goossens', 'Bart Vermeulen', 'Wim Aerts',
  'Jef Van Dyck', 'Nico Hendrickx', 'Sofie Lambrechts', 'Tuur Michiels',
]

async function upload(payload: Payload, seed: number, alt: string) {
  const data = await placeholderPhoto(seed)
  return payload.create({
    collection: 'media',
    data: { alt, credit: 'Demo' },
    file: { data, mimetype: 'image/jpeg', name: `demo-${seed}.jpg`, size: data.length },
    context: ctx,
  })
}

async function wipe(payload: Payload) {
  for (const collection of ['results', 'albums', 'news', 'competitions', 'anglers', 'waters', 'board-members', 'sponsors', 'pages', 'media'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } }, context: ctx })
  }
}

async function run() {
  const payload = await getPayload({ config })
  const existing = await payload.count({ collection: 'competitions' })
  if (existing.totalDocs > 0 && !force) {
    payload.logger.info('Database bevat al wedstrijden. Gebruik --force om opnieuw te seeden.')
    return
  }
  if (force) await wipe(payload)

  // Users
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@plasvissers.be'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'plasvissers-admin'
  const users = await payload.find({ collection: 'users', where: { email: { equals: adminEmail } } })
  if (!users.docs.length) {
    await payload.create({ collection: 'users', data: { email: adminEmail, password: adminPassword, name: 'Webmaster', role: 'admin' } })
    await payload.create({
      collection: 'users',
      data: { email: 'redactie@plasvissers.be', password: 'plasvissers-redactie', name: 'Marleen Claes', role: 'editor' },
    })
  }

  // Media
  const img = []
  for (let i = 0; i < 18; i++) img.push(await upload(payload, i + 1, `Sfeerbeeld aan het water ${i + 1}`))

  // Waters
  const waters = [
    await payload.create({
      collection: 'waters',
      context: ctx,
      data: {
        name: 'De Plas',
        town: 'Aalst',
        description: 'Voorbeeldwater: een oude put met vlakke oevers en genummerde stekken.',
        species: 'brasem, voorn, karper, zeelt, snoekbaars',
        rules: 'Leefnet verplicht. Geen voerboot. Na de wedstrijd de stek proper achterlaten.',
        image: img[0].id,
      },
    }),
    await payload.create({
      collection: 'waters',
      context: ctx,
      data: {
        name: 'Dender, sector jaagpad',
        town: 'Aalst',
        description: 'Voorbeeldwater: brede rivier met beschoeide kant. Vissen op 11 tot 13 meter, ideaal voor brasem.',
        species: 'brasem, blankvoorn, baars',
        image: img[1].id,
      },
    }),
    await payload.create({
      collection: 'waters',
      context: ctx,
      data: { name: 'Gemeentevijver', town: 'Aalst', description: 'Voorbeeldwater voor de jeugdwedstrijden.', species: 'voorn, rietvoorn, kleine karper', image: img[2].id },
    }),
  ]

  // Anglers
  const anglers = []
  for (const name of anglerNames) anglers.push(await payload.create({ collection: 'anglers', data: { name, member: true }, context: ctx }))

  // Competitions: a full season, past ones with results
  const today = new Date()
  const year = today.getFullYear()
  const plan: { m: number; d: number; title: string; type?: string; water?: number; standings?: boolean }[] = [
    { m: 3, d: 21, title: 'Openingswedstrijd' },
    { m: 4, d: 11, title: '2e clubwedstrijd' },
    { m: 4, d: 25, title: 'Koppelwedstrijd', type: 'koppel', water: 1, standings: false },
    { m: 5, d: 9, title: '3e clubwedstrijd' },
    { m: 5, d: 30, title: 'Jeugdwedstrijd', type: 'jeugd', water: 2, standings: false },
    { m: 6, d: 13, title: '4e clubwedstrijd', water: 1 },
    { m: 7, d: 4, title: 'Nachtwedstrijd', type: 'nacht', standings: false },
    { m: 8, d: 15, title: '5e clubwedstrijd' },
    { m: 9, d: 5, title: '6e clubwedstrijd', water: 1 },
    { m: 9, d: 26, title: 'Clubkampioenschap', type: 'kampioenschap' },
    { m: 10, d: 17, title: '7e clubwedstrijd' },
    { m: 11, d: 29, title: 'Slotwedstrijd' },
    { m: 12, d: 13, title: 'Kerstwedstrijd', type: 'vriendschappelijk', standings: false },
  ]
  let seed = 7
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (const item of plan) {
    const date = new Date(Date.UTC(year, item.m - 1, item.d, 12, 0, 0))
    const past = date < today
    const night = item.type === 'nacht'
    const comp = await payload.create({
      collection: 'competitions',
      context: ctx,
      data: {
        title: item.title,
        date: date.toISOString(),
        startTime: night ? '20:00' : '13:30',
        endTime: night ? '06:00' : '17:30',
        drawTime: night ? '19:15' : '12:30',
        water: waters[item.water ?? 0].id,
        type: (item.type ?? 'club') as 'club',
        price: item.type === 'jeugd' ? 'Gratis' : '€ 8',
        registration:
          item.type === 'jeugd'
            ? 'Inschrijven bij de jeugdverantwoordelijke of ter plaatse. Materiaal kan geleend worden.'
            : 'Ter plaatse vóór de loting, of vooraf in Café @ De Parking. Niet-leden betalen € 3 extra.',
        status: past ? 'gespeeld' : 'gepland',
        countsForStandings: item.standings ?? true,
      },
    })
    if (past) {
      const field = [...anglers].sort(() => rnd() - 0.5).slice(0, 10 + Math.floor(rnd() * 6))
      const paste = field
        .map((a) => {
          const kg = rnd() < 0.06 ? 0 : Math.round((0.4 + rnd() * rnd() * 9) * 1000) / 1000
          const fish = kg === 0 ? 0 : Math.max(1, Math.round(kg * (3 + rnd() * 8)))
          return `${a.name}\t${kg.toString().replace('.', ',')}\t${fish}`
        })
        .join('\n')
      await payload.create({ collection: 'results', context: ctx, data: { competition: comp.id, pasteImport: paste, pasteMode: 'replace' } })
    }
  }

  // Board
  const board = [
    ['Luc Verhoeven', 'Voorzitter', 'voorzitter@plasvissers.be'],
    ['Marleen Claes', 'Secretaris', 'secretaris@plasvissers.be'],
    ['Dirk Peeters', 'Penningmeester', undefined],
    ['Rita Jacobs', 'Wedstrijdleider', undefined],
    ['Tuur Michiels', 'Jeugdwerking', undefined],
  ] as const
  for (const [i, [name, role, email]] of board.entries()) {
    await payload.create({ collection: 'board-members', context: ctx, data: { name, role, email, order: i + 1 } })
  }

  // Sponsors
  for (const [name, tier] of [
    ['Hengelsport De Dobber', 'hoofd'],
    ['Café @ De Parking', 'partner'],
    ['Bakkerij Om De Hoek', 'partner'],
    ['Garage Voorbeeld', 'steun'],
  ] as const) {
    await payload.create({ collection: 'sponsors', context: ctx, data: { name, tier, active: true } })
  }

  // News
  const champ = await payload.find({ collection: 'competitions', where: { title: { equals: 'Clubkampioenschap' } }, limit: 1 })
  const news = [
    {
      title: 'Clubkampioenschap: spanning tot het laatste weegmoment',
      excerpt: 'Bij een stevige noordwestenwind werd er hard gevist. Pas bij de laatste weging viel de beslissing.',
      cat: 'verslag',
      comp: champ.docs[0]?.id,
      content: doc(
        p('Om 12u30 stonden er al meer dan twintig vissers klaar voor de loting. De wind zat pal op de oever, wat het voeren lastig maakte.'),
        p('Wie fijn en vaak voerde werd beloond: de brasem kwam pas na een uur, maar bleef dan komen. ', b('Proficiat aan alle deelnemers!')),
        h('Grootste vis'),
        p('Een prachtige zeelt van 1,8 kg aan stek 14. De foto’s staan in het album.'),
      ),
    },
    {
      title: 'Nieuwe kalender voor volgend seizoen',
      excerpt: 'Het bestuur legde de data vast. Noteer de openingswedstrijd alvast in je agenda.',
      cat: 'aankondiging',
      content: doc(
        p('De kalender voor het nieuwe seizoen staat online onder Wedstrijden. We vissen opnieuw zeven clubwedstrijden en een kampioenschap.'),
        ul('Lidgeld blijft € 25', 'Jeugd tot 16 jaar vist gratis', 'Nieuwe leden: eerste wedstrijd gratis'),
      ),
    },
    {
      title: 'Werkdag aan het water: wie helpt mee?',
      excerpt: 'Zaterdagvoormiddag snoeien we de oevers en zetten we de stekbordjes terug. Koffie en koeken voorzien.',
      cat: 'water',
      content: doc(p('Vele handen maken licht werk. Breng handschoenen en een snoeischaar mee als je hebt. We starten om 9u aan Café @ De Parking.')),
    },
    {
      title: 'Jeugdwedstrijd: 14 jonge vissers aan de waterkant',
      excerpt: 'Het was een topdag voor onze jeugdwerking. Iedereen ging naar huis met een prijs.',
      cat: 'verslag',
      content: doc(p('Met dank aan de ouders en vrijwilligers die hielpen met het materiaal. Volgend jaar doen we het zeker opnieuw.')),
    },
  ]
  for (const [i, n] of news.entries()) {
    const d = new Date(today.getTime() - (i * 17 + 3) * 86_400_000)
    await payload.create({
      collection: 'news',
      context: ctx,
      data: {
        title: n.title,
        excerpt: n.excerpt,
        category: n.cat as 'verslag',
        content: n.content,
        cover: img[3 + i].id,
        publishedAt: d.toISOString(),
        relatedCompetition: n.comp,
        _status: 'published',
      },
    })
  }

  // Albums
  await payload.create({
    collection: 'albums',
    context: ctx,
    data: {
      title: 'Clubkampioenschap',
      date: champ.docs[0]?.date ?? today.toISOString(),
      photos: img.slice(6, 15).map((m) => m.id),
      competition: champ.docs[0]?.id,
      description: 'Sfeerbeelden van de dag.',
    },
  })
  await payload.create({ collection: 'albums', context: ctx, data: { title: 'Werkdag aan het water', date: today.toISOString(), photos: img.slice(12, 18).map((m) => m.id) } })

  // Pages
  const pages = [
    {
      title: 'Lid worden',
      slug: 'lid-worden',
      intro: 'Iedereen met een geldige visvergunning is welkom, beginner of gevorderde.',
      content: doc(
        h('Zo werkt het'),
        ul('Kom eens meevissen op een wedstrijd: je eerste is gratis.', 'Lidgeld: € 25 per jaar, jeugd tot 16 jaar gratis.', 'Betalen kan in het clublokaal of via overschrijving.'),
        p('Vragen? Spreek iemand van het bestuur aan of stuur een mailtje.'),
      ),
    },
    {
      title: 'Reglement',
      slug: 'reglement',
      intro: 'De afspraken die elke wedstrijd eerlijk en gezellig houden.',
      content: doc(
        ul('Loting een uur voor aanvang.', 'Maximaal één hengel in het water.', 'Leefnet verplicht, vissen worden na de weging teruggezet.', 'Bij gelijk gewicht delen vissers dezelfde plaats.'),
        p('Het klassement telt de punten van alle clubwedstrijden.'),
      ),
    },
    {
      title: 'Praktische info',
      slug: 'praktisch',
      intro: 'Visvergunning, clublokaal en wat je best meebrengt.',
      content: doc(
        p('Een geldige Vlaamse visvergunning is verplicht. Die koop je online of bij de post.'),
        p('Na de wedstrijd verzamelen we in Café @ De Parking, Botermelkstraat 46 in Aalst, voor de prijsuitreiking.'),
      ),
    },
    {
      title: 'Geschiedenis',
      slug: 'geschiedenis',
      intro: 'Sinds 1969 aan het water.',
      content: doc(
        p('De Aalsterse Plasvissers werden opgericht in 1969 (stamnummer 02001). Dit is voorbeeldtekst: de echte geschiedenis wordt overgezet van de oude website.'),
      ),
    },
  ]
  for (const pg of pages) await payload.create({ collection: 'pages', context: ctx, data: { ...pg, _status: 'published' } })

  await payload.updateGlobal({
    slug: 'site-settings',
    context: ctx,
    data: {
      clubName: 'De Aalsterse Plasvissers',
      tagline: "Al meer dan 50 jaar de tofste club van 't stad!",
      founded: 1969,
      clubNumber: '02001',
      email: 'info@plasvissers.be',
      clubhouse: 'Café @ De Parking',
      address: 'Botermelkstraat 46\n9300 Aalst',
      standingsMethod: 'points',
      dropWorst: 1,
      membersOnly: true,
    },
  })

  payload.logger.info(`Seed klaar. Log in op /admin met ${adminEmail} / ${adminPassword}`)
}

await run()
process.exit(0)
