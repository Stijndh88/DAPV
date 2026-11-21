# Uitslagen van papieren bladen

One `.txt` file per match, named `JJJJ-MM-DD-korte-naam.txt`. `npm run transform` turns each file
into a competition with its result, in the same way as the old website's results.

```
datum: 2026-09-12
titel: GP Evert & Rudy
water: Kyma - Baasrode
super prestige: ja
bron: handgeschreven blad, foto van Stijn (21/11/2026)
---
# plaats | naam | nr. | gewicht | twijfel (optional, not shown on the site)
1 | Werner | 8 | 96,150
2 | Jurgen (S) | 12 | 61,820 | weight hard to read
```

- Names may be short ("Werner", "Diego (S)") or "Last First": they are matched to anglers with
  `seed/members.json` and `seed/angler-aliases.json`. Add an alias there when a new nickname appears.
- `(S)` senior, `(V)` veteraan, `(J)` junior after a name is kept as the angler's category.
- `(D)` after a guest's name is a country (Duitsland), shown as "Gastvisser uit Duitsland". Also `(NL)`, `(F)`, `(L)`.
- A fifth column is a reading doubt. It goes into `data/import/report.json` ("sheetDoubts") so someone
  can check the photo, and is not shown on the site.
- `water` is matched by name or alias in `seed/waters.json`; an unknown water is created and reported.
- Places and points are recalculated by the CMS from the weights.

After the club has the new site, new results are entered in the CMS (paste from Excel) instead.
