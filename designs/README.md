# Design proposals

Three alternative visual directions for the public site, built with the real club content
from `migration/data/import`. They are static mock-ups for comparison, not part of the app.

| Proposal | Idea |
| --- | --- |
| `weegbrief/` | The club's pre-printed weigh slip, filled in by hand. |
| `sinds-1969/` | Two-colour club poster in the blue of the club overalls and sunflower yellow. |
| `viskaart/` | The season as a map of the waters around Aalst, with feeding rules per water. |

Live on the Pages demo at `/DAPV/designs/` (the Pages workflow copies `designs/site` there).

Rebuild after changing a template or the content: `python3 designs/src/build.py`
(Python 3.12+, no dependencies). Generated files in `designs/site` are committed.
