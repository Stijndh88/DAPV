"""The overview page that links the design proposals."""
from data import e, club

OPTIONS = [
    ("../", "huidig", "Boven en onder water", "Het huidige ontwerp",
     "Mistgrijs en diep water, met een oranje dobber als accent. Rustig en modern, de wedstrijd van de week staat bovenaan."),
    ("weegbrief/", "weegbrief", "Weegbrief", "Voorstel A",
     "De site als het voorgedrukte weegbriefje van de club, ingevuld met balpen. Rode formulierlijnen, handgeschreven namen en gewichten, een stempel op de laatste uitslag."),
    ("sinds-1969/", "sinds-1969", "Sinds 1969", "Voorstel B",
     "Een clubaffiche in twee kleuren: het blauw van de overalls en zonnegeel. Clubembleem, podium, koningschap, een tijdlijn sinds 1969 en het clublied om af te spelen."),
    ("viskaart/", "viskaart", "Viskaart", "Voorstel C",
     "Het seizoen op de kaart: alle wateren rond Aalst waar de club vist, de route van de kalender, en per water wat je mag voeren."),
]


def page():
    cards = "".join(
        f"""<li><a href="{href}"><img src="assets/preview-{img}.jpg" alt="Voorbeeld van {e(t)}" width="760" height="528" loading="lazy">
        <span class="k">{e(k)}</span><b>{e(t)}</b><span class="d">{e(d)}</span></a></li>"""
        for href, img, t, k, d in OPTIONS)
    return f"""<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ontwerpvoorstellen · {e(club['name'])}</title><meta name="robots" content="noindex">
<style>
:root {{ --bg: #E6EDEA; --ink: #0E3B43; --muted: #4B6468; --accent: #FF5A1F; --card: #F6F9F8; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--bg); color: var(--ink); font: 17px/1.55 system-ui, -apple-system, 'Segoe UI', sans-serif; }}
.wrap {{ max-width: 1180px; margin: 0 auto; padding: 56px 24px 72px; }}
h1 {{ font-size: clamp(32px, 5vw, 54px); line-height: 1.05; margin: 0 0 12px; letter-spacing: -.01em; }}
p.intro {{ max-width: 62ch; color: var(--muted); margin: 0 0 40px; }}
ul {{ list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 500px), 1fr)); gap: 28px; }}
a {{ display: flex; flex-direction: column; gap: 4px; color: inherit; text-decoration: none; background: var(--card); padding: 12px 12px 22px; border-radius: 6px; border: 1px solid rgba(14,59,67,.12); height: 100%; }}
a:hover b {{ text-decoration: underline; text-decoration-color: var(--accent); text-underline-offset: 4px; }}
a:focus-visible {{ outline: 3px solid var(--accent); outline-offset: 3px; }}
img {{ width: 100%; height: auto; display: block; border-radius: 3px; margin-bottom: 14px; border: 1px solid rgba(14,59,67,.1); }}
.k {{ font-size: 14px; color: var(--muted); padding: 0 6px; }}
b {{ font-size: 26px; padding: 0 6px; }}
.d {{ padding: 0 6px; color: var(--muted); }}
</style></head>
<body><div class="wrap">
<h1>Vier gezichten voor de Plasvissers</h1>
<p class="intro">Het huidige ontwerp en drie andere richtingen, allemaal met de echte clubinhoud: de kalender en uitslagen van 2026, het bestuur, de geschiedenis en de voederregels. Het zijn ontwerpvoorstellen om te vergelijken, de werkende site blijft het huidige ontwerp.</p>
<ul>{cards}</ul>
</div></body></html>
"""
