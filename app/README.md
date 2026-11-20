# plasvissers.be: website en CMS

De nieuwe website van **De Aalsterse Plasvissers** (opgericht 1969, stamnummer 02001).
Eén app: de publieke site én de beheeromgeving voor vrijwilligers.

- **Next.js 16** (App Router) voor de site
- **Payload CMS 3**, ingebouwd in dezelfde app, beheer op `/admin`
- **PostgreSQL** als database, foto's op schijf (`MEDIA_DIR`)

## Voor redacteurs (in het kort)

Log in op `/admin`. Het startscherm toont vier knoppen:

| Je wil… | Waar | Tip |
| --- | --- | --- |
| Nieuws plaatsen | Nieuwsbericht schrijven | Pas na **Publiceren** staat het online. Met **Voorbeeld** zie je het eerst. |
| Foto's delen | Foto's toevoegen | Maak een album, klik bij *Foto's* op *Nieuwe toevoegen* en sleep tientallen foto's tegelijk. |
| Wedstrijd plannen | Wedstrijd plannen | Loting 12:30, vissen 13:30 tot 17:30 staan al ingevuld. Dupliceer een vorige wedstrijd om tijd te winnen. |
| Uitslag invoeren | Uitslag invoeren | Kies de wedstrijd en **plak de lijst uit Excel** (naam, gewicht, aantal). Plaatsen, punten en het klassement volgen vanzelf. Nieuwe namen worden automatisch als visser toegevoegd. |

Plakken werkt met tab (Excel), `;` of twee spaties tussen de kolommen. Gewicht mag in kg (`4,350`) of gram (`4350`).
Een achtervoegsel zoals `(v)` achter een naam wordt als categorie bewaard.

**Rollen**

- *Redacteur*: nieuws, foto's, pagina's, wedstrijden, uitslagen, vissers, viswaters, bestuur, sponsors.
- *Beheerder*: alles, plus gebruikers en de instellingen (*Club & website*: contact, clublied, klassementsregels).

De eerste account die je aanmaakt, wordt automatisch beheerder.

## Klassement

Per wedstrijd die *meetelt voor het klassement*:

- plaatsen volgens gewicht, gelijk gewicht = gedeelde plaats;
- punten: winnaar krijgt evenveel punten als er deelnemers zijn, laatste 1 punt, uitgesloten 0;
- optioneel: alleen leden, en de *N* slechtste resultaten schrappen.

Of kies "totaal gewicht" in *Club & website → Klassement*.
De logica staat in `src/lib/results.ts` (rangschikking) en `src/lib/standings.ts` (seizoen).

## Lokaal ontwikkelen

```bash
cp .env.example .env            # vul DATABASE_URI en PAYLOAD_SECRET in
pnpm install
pnpm migrate                    # maakt de tabellen
pnpm seed                       # demo-inhoud (fictieve namen en uitslagen)
pnpm dev                        # http://localhost:3000 en /admin
```

Demo-logins na `pnpm seed`: `admin@plasvissers.be` / `plasvissers-admin` en
`redactie@plasvissers.be` / `plasvissers-redactie`. Verander of verwijder ze in productie.
`pnpm seed --force` wist eerst alle clubinhoud (gebruikers blijven).

Na een wijziging aan een collectie:

```bash
pnpm migrate:create naam-van-de-wijziging
pnpm generate:types
```

Tests (parser en rangschikking): `pnpm test`.

## Productie (Docker)

```bash
docker build -t plasvissers ./app
docker run -p 3000:3000 \
  -e DATABASE_URI=postgres://… \
  -e PAYLOAD_SECRET=$(openssl rand -hex 32) \
  -e NEXT_PUBLIC_SERVER_URL=https://plasvissers.be \
  -v plasvissers-media:/app/media \
  plasvissers
```

- De build heeft geen database nodig.
- Migraties draaien automatisch bij het opstarten (`prodMigrations`).
- `GET /api/health` geeft 200 als de app en de database werken.
- De container draait als uid 1001; `/app/media` moet beschrijfbaar zijn en hoort in de back-up.
- Optioneel: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` voor wachtwoord-reset mails.

Zie `../infra` voor Docker Compose, Caddy en back-ups.

## Oude URL's

`next.config.ts` laadt 301-redirects uit `app/redirects.json` (of, lokaal, `../migration/redirects.next.json`):
een JSON-array van `{ "source", "destination", "permanent" }`.

## Routes

| Pad | Inhoud |
| --- | --- |
| `/` | Volgende wedstrijd, klassement, laatste uitslag, nieuws, foto's |
| `/wedstrijden`, `?seizoen=2023` | Kalender per maand met winnaars |
| `/wedstrijden/[slug]` | Details, inschrijving en volledige uitslag |
| `/klassement` | Seizoensklassement met punten per wedstrijd |
| `/nieuws`, `/nieuws/[slug]` | Berichten |
| `/fotos`, `/fotos/[slug]` | Albums met lightbox (werkt zonder JavaScript) |
| `/visplaatsen`, `/visplaatsen/[slug]` | Viswaters |
| `/club`, `/club/bestuur`, `/club/leden`, `/club/[pagina]` | Club, bestuur, leden, reglement, praktisch, clublied |
| `/[pagina]` | Vrije pagina's (bv. `/lid-worden`, `/geschiedenis`) |

## Ontwerp

"Boven en onder water": mistig lichtgroen boven de waterlijn, diep water eronder.
De enige felle kleur is de oranje top van een dobber (`#FF5A1F`), gebruikt voor de belangrijkste knop en de leider.
Lettertypes: *Big Shoulders Display* (koppen en cijfers, als een scorebord) en *Atkinson Hyperlegible Next* (tekst, gemaakt voor leesbaarheid).
Licht en donker thema volgen het toestel.
