# Migration: plasvissers.be (WordPress) → new site (Payload)

Everything needed to move the old content into the new CMS. See [`docs/analysis.md`](../docs/analysis.md) for what the old site contains and why the content is modelled the way it is.

```
migration/
  seed/            facts read from the old site (board, members, waters, club data, every old URL)
  src/export.mjs   downloads posts, pages, media, gallery photos and sitemaps → data/raw, data/media
  src/transform.mjs  parses TablePress results and calendars → data/import/*.json (Payload-shaped)
  src/redirects.mjs  old URL → new URL map → redirects.json, redirects.next.json, redirects.caddy
  test/            fixture test for the transform (npm test)
app/scripts/import-wordpress.ts   writes data/import into Payload (Local API)
```

## Run it

Needs Node 20+ and a computer that can reach plasvissers.be.

```bash
cd migration
npm install
npm run all          # export + transform + redirects (a few minutes; media is cached on re-runs)
cat data/import/report.json   # check warnings and how result names were matched to members
```

Then, with the new site's database running (see `/infra`) and the app's `.env` filled in:

```bash
cd app
npm run migrate                                        # create the tables if this is a fresh database
npx payload run scripts/import-wordpress.ts --dry-run   # shows what would be written
npx payload run scripts/import-wordpress.ts
```

The importer upserts by slug or name (media by filename), so it is safe to run again after fixing something. It was tested against the app's real schema on a local PostgreSQL with fixture data: competitions, results (places and points calculated by the CMS), anglers, waters, board, news with a cover image, pages and a re-run without duplicates.

## What goes where

| Old site | New collection | Notes |
|---|---|---|
| Results posts (category *Wedstrijduitslagen 20xx*), TablePress tables | `competitions` + `results` + `anglers` | Columns Plaats / Naam / Nr. / Gewicht. Place and points are recalculated by the CMS. `Nr.` becomes `peg`. A `(v)` or `(s)` after a name becomes the angler's `category`. |
| `/kalender-20xx/` tables | `competitions` | Matched to a results post by link or by date (±1 day). Past matches without a result get a note "Geen uitslag gepubliceerd op de oude website". |
| `/vislocaties/` + subpages | `waters` | Names and towns from `seed/waters.json`; descriptions and photos from the subpages. Water cells in the calendar are matched by name or alias. |
| `/bestuur/` | `board-members` | From `seed/board.json`, in the site's order. |
| `/leden/` | `anglers` (`member: true`) | Short names in results ("Evert", "Pascal C.", "Neirinckx Freddy") are matched to the member list; every match is listed in `report.json` for checking. |
| News posts | `news` | First image becomes the cover; inline images are not copied into the text. |
| `/ontstaan/`, `/ontstaan/clubreglement/`, `/praktische-clubgegevens/`, `/lid-worden/` | `pages` (`geschiedenis`, `reglement`, `praktisch`, `lid-worden`) | Scripts, forms, iframes and widgets are removed. |
| Photo Gallery "Foto's 2022" | `albums` → `media` | The old gallery has no date; set to 31/12/2022. |
| Club song MP3 | `site-settings.clubSong` | |

## Redirects

`redirects.json` maps every old URL in the sitemaps (posts, pages, categories, monthly archives, feeds, `?page_id=` and `?p=` links) to its new route. Regenerate it after the transform (`npm run redirects`) so the competition slugs come from the real data. Use it in one of two ways:

- **Next.js:** the script also writes `app/redirects.json` (same content as `redirects.next.json`), which `next.config.ts` loads. Commit it after regenerating.
- **Caddy:** `import /srv/migration/redirects.caddy` inside the site block.

## Known limits

- **Koppel results** list a pair per row. The first name becomes the angler and the pair is kept in the entry's note.
- **Points** in the old tables are not imported; the new site calculates them from weights with the club's rules.
- **Members list** is public on the old site. Decide with the board whether it stays public.
