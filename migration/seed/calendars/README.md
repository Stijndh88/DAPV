# Wedstrijdkalenders van papier

One file per season, `JJJJ.txt`, typed over from the printed calendar. `npm run transform` turns each
row into a competition. A result sheet in `seed/results/` on the same date completes that row
(results, real water) instead of adding a second match.

```
seizoen: 2026
bron: papieren kalender, foto van Stijn (21/11/2026)
---
# wedstrijd | S | datum | water | trekking | vissen van ... tot | twijfel (optional)
GP Fam. Arijs | S | 04/04/26 | Meerse Lijnvissers - Mere | 7u45 | 9u00-12u00/13u30-17u00
Koningschap |  | 20/06/26 | Vissershof - Mere | 15/06/26 | 9u30-12u00/13u30-17u00 | trekking is a date?
```

- `S` = counts for the Super Prestige (the `countsForStandings` flag). Kampioenschap rows always count.
- `9u00-12u00/13u30-17u00` = a match in two parts: start 09:00, break 12:00 to 13:30, end 17:00.
- A trekking cell that is not a time is kept as a note.
- Waters are matched like the result sheets (`seed/waters.json`, longest name or alias wins).
- The `twijfel` column goes to `data/import/report.json` (`calendarDoubts`), not to the site.
- A title with "trouwfeest" or "feest" is a club activity: it never counts for the standings.
