# plasvissers.be: analysis of the current site and plan for the new one

_Analysis date: 20 November 2026. Source: the live site, its WordPress REST API (`/wp-json/`) and its Yoast sitemaps, read through a page reader. Direct downloads from this cloud environment were blocked, so exact counts should be confirmed by running the exporter in [`/migration`](../migration/README.md)._

## 1. Summary

The site of **De Aalsterse Plasvissers** (founded 1969, stamnummer 02001, clublokaal Café @ De Parking, Botermelkstraat 46, 9300 Aalst) is a WordPress site on a hosted package (one.com tooling on junda.nl hosting) with the free **Poseidon** theme by ThemeZee. It holds about **41 posts**, **17 pages**, **one photo gallery** (20 photos, 2022), a club song MP3 and a set of fishing locations.

Almost all "news" is really **competition results**: 17 results posts for 2021, 21 for 2022 and 2 for 2023, with just one real news item. Results and calendars are **TablePress tables pasted inside posts and pages**, so the site can't calculate a ranking, link a calendar entry to its result, or show an angler's history.

The site has gone stale. The last post dates from **15 April 2023**, the last calendar is **2024** (with no results), and the last media upload is from **May 2024**. That is the core problem the rebuild has to fix. Publishing must be so easy that a board member can post a result from their phone at the waterside in two minutes.

## 2. Inventory

### 2.1 Navigation (as it is today)

| Menu | Submenu | URL |
|---|---|---|
| Home | | `/` |
| Club | Ontstaan | `/ontstaan/` |
| | Leden | `/leden/` |
| | Bestuur | `/bestuur/` |
| | Clubreglement | `/ontstaan/clubreglement/` |
| | Praktische clubgegevens | `/praktische-clubgegevens/` |
| Foto's | | `/fotos/` |
| Wedstrijden | Kalender 2024 | `/kalender-2024/` |
| | Archief wedstrijden → Kalender 2021, 2022, 2023 | `/archief-wedstrijden/`, `/kalender-20xx/` |
| Clubnieuws | | `/clubnieuws/` |

Not in the menu but published: `/nieuws/` (the WordPress posts page, page id 58), `/lid-worden/`, `/vislocaties/` and two location subpages.

### 2.2 Pages (17, from `page-sitemap.xml`)

| WP id | URL | Content | Becomes |
|---|---|---|---|
| 60 | `/` | Welcome text, latest 5 posts, club song player, monthly archive | New homepage (generated) |
| 22 | `/ontstaan/` | Club history: founded 1969 by Petrus Bassleer in café 't Plasken; first chairman Jozef Bassleer; max. 50 members; 35 years of yearly matches against Schwerte (DE); 2004 jubilee at De Snip; 50-year jubilee in 2019 | `pages` → `/geschiedenis` |
| 232 | `/ontstaan/clubreglement/` | 4 rules (pure weight for koningschap, marathon, GP and koppel; drop worst match in kampioenschap; absence from reeksen = no title; tie-break on 4 reeksen) | `pages` → `/club/reglement` |
| 23 | `/leden/` | Plain list of 28 names | `anglers` (member = true) → `/club/leden` |
| (id ?) | `/bestuur/` | 6 board members with role and @plasvissers.be email | `board-members` → `/club/bestuur` |
| 242 | `/praktische-clubgegevens/` | Club facts table, clublokaal address, map, Facebook link of the café | `site-settings` + `pages` → `/club/praktisch` |
| 98 | `/lid-worden/` | Contact Form 7 form (name, email) | `/lid-worden` with a new form |
| 208, ?, 804, 885 | `/kalender-2021/` … `/kalender-2024/` | 22-row TablePress schedule each: Wedstrijd / S (Super Prestige) / Datum / Water / Trekking / Vissen van…tot… | `competitions` → `/wedstrijden?seizoen=20xx` |
| ? | `/archief-wedstrijden/` | One link to Kalender 2021 | Dropped (season filter) |
| ? | `/clubnieuws/` | Duplicate of the homepage widgets, plus one featured post | Dropped → `/nieuws` |
| 755 | `/fotos/` | Photo Gallery (10Web) masonry grid, 20 photos, tag "2022" | `albums` → `/fotos` |
| 368 | `/vislocaties/` | 9 locations, names and photos only | `waters` → `/visplaatsen` |
| ? | `/vislocaties/dendervissers-gijzegem/` | Address, map, images | `waters` |
| 862 | `/vislocaties/meerse-lijnvissers-mere/` | Address (Biezeputstraat 10, 9420 Erpe-Mere), weather widget, Google Maps iframe, photo | `waters` |

Fishing locations named on `/vislocaties/`: Donkvissers (Mere), Koutervissers (Viane), Vissershof (Mere), Warm Water (Vilvoorde), Gespoelde Put (Grembergen), Dendervissers (Gijzegem), De Meerse Lijnvissers (Mere), Meldert vijver, De Donkere Wolk (Geraardsbergen).

### 2.3 Posts (41 published, from `post-sitemap.xml`)

| Category | Count | What they are |
|---|---|---|
| Wedstrijduitslagen 2021 | 17 | One post per match: GP's, koningschap, koppelwedstrijd, avondvissing, marathon |
| Wedstrijduitslagen 2022 | 21 | Same, plus 4 kampioenschap reeksen and België–Duitsland |
| Wedstrijduitslagen 2023 | 2 | GP Fam. Arijs, 1e reeks kampioenschap |
| Nieuws | 1 | "Trekking koppelvissing 26/06" (2021): the drawn pairs |

Every results post body is one TablePress table (`tablepress-NN`) with columns **Plaats / Naam ("Visserke vis") / Nr. / Gewicht** (kg with a comma decimal, e.g. `24,840`). Some names carry a suffix such as `(v)` or `(s)`. No tags, no featured images, one author account.

### 2.4 Media

- Uploads in `/wp-content/uploads/2019…2024/`: location photos, the café logo, two event photos, a 2024 header image, the site icon (`cropped-fish.png`).
- `/wp-content/uploads/photo-gallery/`: the 20 gallery photos (Photo Gallery plugin, its own storage, not in the media library).
- `/wp-content/uploads/2019/06/t-Plasvisserslieken.mp3`: the club song. **Keep it**; it's the site's most charming feature.

### 2.5 Plugins and technical signals

| Signal | What it means |
|---|---|
| Poseidon theme (ThemeZee) | Generic free blog theme, not designed for a club |
| TablePress | All results and calendars are tables: content, not data |
| Photo Gallery by 10Web (`bwg_*`) + NextGEN (`ngg/v1`) | Two gallery plugins installed, only one used |
| Smush, lazyload | Image optimisation, needed because the theme is heavy |
| Yoast SEO 28.9 | Sitemaps and meta; the one plugin doing useful work |
| Contact Form 7 | Join form (name + email only) |
| Google Site Kit 1.192 | Analytics |
| `onecom-plugins`, `hub-connector` | Hosting vendor tooling |
| `cpt_staff_lst` custom type | A staff-list plugin once used for the board, now orphaned |
| Application passwords enabled | Open attack surface on an unmaintained install |
| weatherwidget.io, Google Maps iframes | Third-party embeds without consent handling (GDPR) |

## 3. Weaknesses

1. **Results are not data.** You can't compute a kampioenschap ranking, see a personal best or compare seasons. Each result is retyped into a table by hand.
2. **Too hard to publish, so nobody does.** WordPress + TablePress needs a desktop and admin skills. The content stopped in 2023.
3. **Calendar and results are disconnected.** In 2023 only two calendar rows link to a result; in 2021, 2022 and 2024 none do. A new page has to be made for each season.
4. **Duplicated and contradictory navigation.** `/clubnieuws/` and `/nieuws/` show the same posts; the homepage links to the 2023 calendar while the menu says 2024; the member counts differ (28 on Leden, 25 on Praktische clubgegevens).
5. **No mobile-first design.** Wide tables don't fit a phone, which is where anglers look up the draw and results.
6. **Privacy.** A full list of member names, board email addresses and third-party embeds, with no privacy notice or consent.
7. **Plugin sprawl** on an unmaintained WordPress: a security and maintenance risk.
8. **SEO.** The page titles are generic, there's no structured data for events, and `?page_id=58` appears in the sitemap.

## 4. Recommendations for the new site

**Language:** stays Dutch (nl-BE), with the club's own tone ("de tofste club van 't stad").

### 4.1 Content model (matches the Payload schema in `/app`)

| Old | New collection | Gain |
|---|---|---|
| Results posts + TablePress | `competitions` + `results` with `anglers` | Automatic places, points and season rankings; angler profiles |
| Kalender-20xx pages | `competitions` with `season`, `status`, `type` | One calendar, filter by season; "afgelast / verplaatst" status |
| Vislocaties pages | `waters` | Map, directions, species; each competition links to its water |
| Bestuur page / staff plugin | `board-members` | Ordered, with photo; email shown via a contact form |
| Leden page | `anglers` (member flag) | One list, used by the results too |
| Photo Gallery | `albums` → `media` | Albums per event, linked to a competition |
| Nieuws category | `news` | Real news: eetfestijn, trekking, clubfeest |
| Ontstaan / Reglement / Praktisch / Lid worden | `pages` (`/geschiedenis`, `/club/reglement`, `/club/praktisch`, `/lid-worden`) | Editable rich text |
| Club facts, lokaal, socials, club song | `site-settings` global | One place to change |

### 4.2 Editor experience (the most important part)

- **Roles:** `admin` (Stijn) and `editor` (board members). Editors can only do content.
- **Results in under two minutes:** pick the competition, paste lines like `Evert;24,840;12` and the system creates anglers, places and points. Works from a phone.
- **Calendar for a new season:** duplicate last season's competitions and change the dates.
- **Photos:** drag and drop many photos into an album; automatic resizing (WebP/AVIF) replaces Smush.
- Drafts and preview for news, so a post can be checked before it goes live.

### 4.3 Visitor experience

- Homepage: **next competition** (date, water, draw time, countdown), **latest result** podium, current **klassement** top 5, latest news, photo strip, club song player.
- `/wedstrijden`: a season timeline, mobile cards instead of wide tables, and a link from each match to its results.
- `/klassement`: the kampioenschap standings, computed with the club rules (drop worst match, tie-break on the 4 reeksen).
- Angler profile page (optional): an angler's results history and personal best.
- Waters with an embedded map loaded only after consent, or a static map with a "route" link.
- `/lid-worden` form that emails the secretary; no public email addresses.

### 4.4 Technical

- Self-hosted Next.js + Payload CMS 3 + PostgreSQL behind Caddy (HTTPS), see `/infra`.
- Remove every plugin dependency; no third-party scripts without consent; privacy-friendly analytics (e.g. Plausible/Umami) instead of Site Kit.
- SEO: clean Dutch URLs, `schema.org/SportsEvent` for competitions, a generated sitemap, and **301 redirects for every old URL** ([`migration/redirects.json`](../migration/redirects.json)) so Google and old links keep working.
- Privacy: the members page is shown only as first name + initial, or only to logged-in members; to be decided by the board.

## 5. Migration plan

1. **Export** (`migration/export`): pulls every post, page, category and media item through the WordPress REST API, parses the TablePress tables into structured rows, and downloads all media, the gallery photos and the MP3 into `migration/data/`. Run it anywhere that can reach plasvissers.be.
2. **Transform**: results posts become `competitions` + `results`; calendar tables become `competitions` (matched to results by date); locations become `waters`.
3. **Import** (`migration/import`): a Payload Local API script that is idempotent (upsert by slug), so it can be re-run safely.
4. **Redirects**: `migration/redirects.json` maps every old URL to its new route, ready for Next.js `redirects()` or Caddy.
5. **Check**: compare counts (41 posts, 17 pages, media) and spot-check five results against the old site before switching DNS.

## 6. Open questions for the club

- What do the `(v)` and `(s)` suffixes after names mean (vrouw / senior / substitute)? This affects the `anglers` model.
- How are kampioenschap points awarded per place? The reglement only describes dropping the worst match and the tie-break.
- Should the member list stay public?
- Who besides Stijn will publish (names for editor accounts)?
- Is the 2024 season (and 2025/2026) available somewhere else, e.g. on paper or in a Facebook group, so it can be entered?
