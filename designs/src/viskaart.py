"""Design C: 'Viskaart' — the season as a map of the waters around Aalst."""
from collections import OrderedDict
from data import (e, club, house, board, season, season_waters, last, last_entries, standings, name,
                  guest, nl_date, kg, history, feed_rules, bait, PLACES, TYPE_LABEL, SEASON)

LNG0, LNG1, LAT0, LAT1 = 3.60, 4.45, 50.755, 51.14
K = 0.629  # cos(51°)
S = 1000 / ((LNG1 - LNG0) * K)
W, H = 1000, round((LAT1 - LAT0) * S)


def xy(lat, lng):
    return round((lng - LNG0) * K * S, 1), round((LAT1 - lat) * S, 1)


def line(points):
    pts = [xy(*p) for p in points]
    d = f"M{pts[0][0]} {pts[0][1]}"
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        d += f" Q{x0} {y0} {(x0 + x1) / 2} {(y0 + y1) / 2}"
    return d + f" L{pts[-1][0]} {pts[-1][1]}"


DENDER = [(50.76, 3.86), (50.773, 3.882), (50.80, 3.925), (50.835, 4.02), (50.862, 4.05), (50.885, 4.07),
          (50.915, 4.05), (50.94, 4.045), (50.978, 4.06), (51.01, 4.08), (51.03, 4.10)]
SCHELDE = [(50.84, 3.64), (50.885, 3.67), (50.93, 3.66), (50.98, 3.69), (51.03, 3.73), (51.0, 3.80),
           (51.0, 3.88), (51.015, 3.93), (51.005, 3.97), (51.03, 4.01), (51.03, 4.10), (51.04, 4.16),
           (51.09, 4.19), (51.125, 4.21), (51.15, 4.25)]
DURME = [(51.10, 3.98), (51.095, 4.06), (51.09, 4.12), (51.07, 4.16), (51.04, 4.16)]
ZENNE = [(50.90, 4.43), (50.93, 4.43), (50.97, 4.38), (51.02, 4.37), (51.06, 4.36), (51.08, 4.36)]


def page(head):
    places = OrderedDict()
    for w in season_waters:
        key = w["place"] if w["place"] in PLACES else None
        places.setdefault(key, []).append(w)

    markers, legend = [], []
    for i, (pl, ws) in enumerate([(k, v) for k, v in places.items() if k], 1):
        x, y = xy(*PLACES[pl])
        n = sum(len(w["dates"]) for w in ws)
        r = 9 + 3 * n
        pid = f"p-{pl.lower()}"
        anchor = "end" if x > 820 or pl in ("Okegem", "Denderhoutem") else "start"
        dx = -(r + 6) if anchor == "end" else r + 6
        markers.append(f"""<g class="mk" data-p="{pid}" transform="translate({x} {y})">
          <circle r="{r}" class="halo"/><circle r="7" class="dot"/>
          <text x="{dx}" y="5" text-anchor="{anchor}" class="lbl">{e(pl)}</text></g>""")
        items = "".join(
            f"<li><i>{e(w['name'])}</i><span>{', '.join(nl_date(c['date']) for c in w['dates'])}</span></li>" for w in ws)
        legend.append(f"""<li id="{pid}" data-p="{pid}"><button type="button" aria-controls="{pid}">
          <b>{e(pl)}</b><span class="n">{n}×</span></button><ul>{items}</ul></li>""")
    other = [w for k, v in places.items() if not k for w in v]
    for w in other:
        where = w["place"] or "plaats volgt"
        legend.append(f"""<li class="off"><button type="button" disabled><b>{e(w['name'])}</b><span class="n">{len(w['dates'])}×</span></button>
          <ul><li><i>{e(where)}</i><span>{', '.join(nl_date(c['date']) for c in w['dates'])}</span></li></ul></li>""")

    hx, hy = xy(house["lat"], house["lng"])
    rp = [xy(*PLACES[c["place"]]) for c in season if c["place"] in PLACES]
    route = "M" + " L".join(f"{x} {y}" for x, y in rp)

    rows = "".join(
        f"<tr{' class=\"g\"' if guest(x) else ''}><td>{i}</td><td>{e(name(x['anglerSlug']))}{' (gast)' if guest(x) else ''}</td><td>{x['peg']}</td><td>{kg(x['weight'])}</td></tr>"
        for i, x in enumerate(last_entries, 1))
    stand = "".join(
        f"<tr><td>{i}</td><td>{e(r['name'])}</td><td>{r['matches']}</td><td>{kg(r['weight'])}</td></tr>"
        for i, r in enumerate(standings[:8], 1))

    cards = []
    for w in season_waters:
        f = w.get("feeding") or {}
        if not f:
            continue
        lim = "".join(f"<li>{', '.join(bait(b) for b in l['baits'])}: {e(l['amount'])}</li>" for l in f.get("limits", []))
        cards.append(f"""<article class="water">
          <h3>{e(w['name'])}<small>{e(w['place'])}</small></h3>
          <dl>
            <dt>Voeren</dt><dd>{', '.join(bait(b) for b in f['feedAllowed']) or '–'}</dd>
            <dt>Niet voeren</dt><dd class="no">{', '.join(bait(b) for b in f['feedForbidden']) or '–'}</dd>
            <dt>Aan de haak</dt><dd>{', '.join(bait(b) for b in f['hookAllowed']) or '–'}</dd>
            <dt>Niet aan de haak</dt><dd class="no">{', '.join(bait(b) for b in f['hookForbidden']) or '–'}</dd>
          </dl>
          {f'<ul class="lim">{lim}</ul>' if lim else ''}
          {f'<p class="fn">{e(f["note"])}</p>' if f.get('note') else ''}
          <p class="when">In {SEASON}: {', '.join(nl_date(c['date']) for c in w['dates'])}</p>
        </article>""")

    grid = "".join(f'<line x1="{x}" y1="0" x2="{x}" y2="{H}"/>' for x in range(0, W + 1, 100)) + \
           "".join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>' for y in range(0, H + 1, 100))

    return f"""<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Viskaart · De Aalsterse Plasvissers</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,500;0,700;1,500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
<style>
:root {{ --land: #E3EAD9; --wood: #CBDBB7; --water: #7FB3CF; --water-l: #B9D7E6; --ink: #1F2D3A; --muted: #56656F;
  --red: #C8402F; --panel: #F8FAF6; --line: #B8C6B0; }}
* {{ box-sizing: border-box; }}
html {{ background: var(--land); }}
body {{ margin: 0; font: 400 17px/1.6 'Source Serif 4', Georgia, serif; color: var(--ink); background: var(--panel); }}
a {{ color: var(--ink); text-decoration-color: var(--red); text-underline-offset: 3px; }}
:focus-visible {{ outline: 3px solid var(--red); outline-offset: 2px; }}
h1, h2, h3, .cond {{ font-family: 'Barlow Condensed', sans-serif; font-weight: 700; line-height: 1.05; }}
.wrap {{ max-width: 1240px; margin: 0 auto; padding: 0 24px; }}

header.top {{ border-bottom: 1px solid var(--line); background: var(--panel); }}
header.top .wrap {{ display: flex; justify-content: space-between; align-items: center; gap: 12px 24px; flex-wrap: wrap; padding-block: 14px; }}
.brand {{ font: 700 22px 'Barlow Condensed'; text-decoration: none; }}
.brand small {{ font: italic 500 16px 'Barlow Condensed'; color: var(--muted); margin-left: 8px; }}
nav ul {{ display: flex; gap: 4px 22px; flex-wrap: wrap; margin: 0; padding: 0; list-style: none; font: 500 18px 'Barlow Condensed'; }}
nav a {{ text-decoration: none; }} nav a:hover {{ text-decoration: underline; }}

.atlas {{ display: grid; grid-template-columns: minmax(0, 1fr) 360px; background: var(--land); border-bottom: 1px solid var(--line); }}
.map {{ position: relative; padding: 20px; }}
.map svg {{ width: 100%; height: auto; display: block; }}
.map .grid line {{ stroke: #fff; stroke-opacity: .55; stroke-width: 1; }}
.river {{ fill: none; stroke: var(--water); stroke-linecap: round; stroke-linejoin: round; }}
.rname {{ font: italic 500 17px 'Barlow Condensed'; fill: #3E7FA3; letter-spacing: 3px; }}
.route {{ fill: none; stroke: var(--red); stroke-width: 1.6; stroke-dasharray: 2 6; stroke-linecap: round; opacity: .7; }}
@media (prefers-reduced-motion: no-preference) {{
  .route {{ stroke-dasharray: 2 6; animation: draw 2.4s ease-out .3s both; }}
  @keyframes draw {{ from {{ stroke-dashoffset: 1400; opacity: 0; }} }}
}}
.mk .halo {{ fill: var(--red); fill-opacity: .14; stroke: var(--red); stroke-opacity: .5; transition: fill-opacity .2s; }}
.mk .dot {{ fill: var(--red); stroke: #fff; stroke-width: 2.5; }}
.mk .lbl {{ font: italic 500 19px 'Barlow Condensed'; fill: var(--ink); paint-order: stroke; stroke: var(--land); stroke-width: 5px; stroke-linejoin: round; }}
.mk.on .halo {{ fill-opacity: .45; }}
.mk.on .lbl {{ font-weight: 700; font-style: normal; }}
.home .sq {{ fill: var(--ink); }}
.home text {{ font: 700 19px 'Barlow Condensed'; fill: var(--ink); paint-order: stroke; stroke: var(--land); stroke-width: 5px; }}
.cartouche {{ position: absolute; left: 36px; top: 34px; background: var(--panel); border: 1px solid var(--ink); padding: 14px 18px; max-width: 330px; box-shadow: 4px 4px 0 var(--ink); }}
.cartouche h1 {{ margin: 0; font-size: clamp(28px, 3.2vw, 42px); }}
.cartouche p {{ margin: 6px 0 0; font-size: 15px; }}
.scale {{ position: absolute; right: 36px; bottom: 30px; font: 500 14px 'Barlow Condensed'; text-align: right; }}
.scale span {{ display: block; height: 6px; border: 1.5px solid var(--ink); border-top: 0; margin-top: 2px; background: linear-gradient(90deg, var(--ink) 50%, transparent 50%); }}

.legend {{ background: var(--panel); border-left: 1px solid var(--line); padding: 26px 24px; max-height: 760px; overflow: auto; }}
.legend h2 {{ margin: 0 0 4px; font-size: 26px; }}
.legend > p {{ margin: 0 0 14px; font-size: 15px; color: var(--muted); }}
.legend ol {{ list-style: none; margin: 0; padding: 0; }}
.legend > ol > li {{ border-top: 1px solid var(--line); }}
.legend button {{ all: unset; box-sizing: border-box; cursor: pointer; display: flex; justify-content: space-between; width: 100%; padding: 8px 0 2px; font: 700 20px 'Barlow Condensed'; }}
.legend button:focus-visible {{ outline: 3px solid var(--red); }}
.legend li.on button, .legend button:hover {{ color: var(--red); }}
.legend .off button {{ cursor: default; color: var(--muted); }}
.legend .n {{ font-weight: 500; color: var(--muted); }}
.legend ul {{ list-style: none; margin: 0 0 8px; padding: 0; font-size: 14.5px; }}
.legend ul li {{ display: flex; justify-content: space-between; gap: 10px; }}
.legend ul span {{ color: var(--muted); text-align: right; }}

section {{ padding: 72px 0; border-bottom: 1px solid var(--line); }}
section h2 {{ font-size: clamp(32px, 4vw, 48px); margin: 0 0 8px; }}
.lede {{ color: var(--muted); max-width: 62ch; margin: 0 0 28px; }}
.two {{ display: grid; grid-template-columns: 1fr 1fr; gap: 56px; }}
table {{ width: 100%; border-collapse: collapse; font-size: 16px; }}
th {{ font: 500 15px 'Barlow Condensed'; color: var(--muted); text-align: left; border-bottom: 2px solid var(--ink); padding: 6px 8px 6px 0; }}
td {{ padding: 7px 8px 7px 0; border-bottom: 1px solid var(--line); }}
td:first-child {{ font: 700 18px 'Barlow Condensed'; width: 36px; }}
td:last-child, th:last-child {{ text-align: right; white-space: nowrap; }}
tr.g td {{ color: var(--muted); }}
.meta {{ font: italic 500 19px 'Barlow Condensed'; margin: 0 0 14px; }}

.waters {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0; border-top: 2px solid var(--ink); }}
.water {{ padding: 20px 22px 20px 0; border-bottom: 1px solid var(--line); }}
.water h3 {{ font-size: 28px; margin: 0 0 10px; }}
.water h3 small {{ display: block; font-size: 17px; font-style: italic; font-weight: 500; color: var(--muted); }}
.water dl {{ margin: 0; display: grid; grid-template-columns: 112px 1fr; gap: 4px 10px; font-size: 15px; }}
.water dt {{ font: 500 15px 'Barlow Condensed'; color: var(--muted); }}
.water dd {{ margin: 0; }}
.water dd.no {{ color: var(--red); }}
.lim {{ margin: 10px 0 0; padding-left: 18px; font-size: 14.5px; }}
.fn, .when {{ font-size: 14.5px; color: var(--muted); margin: 8px 0 0; }}
.rules {{ margin-top: 32px; max-width: 70ch; font-size: 15.5px; }}

.base {{ background: var(--ink); color: #E8EEF0; }}
.base h2 {{ color: #fff; }}
.base a {{ color: #fff; }}
.coord {{ font: 500 20px 'Barlow Condensed'; color: var(--water-l); }}
.base ul {{ list-style: none; padding: 0; margin: 0; }}
.base li {{ display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,.15); padding: 8px 0; }}
.base li span {{ color: #9FB1BC; font: 500 17px 'Barlow Condensed'; }}
footer {{ padding: 28px 0 44px; font-size: 14px; color: var(--muted); }}

@media (max-width: 980px) {{
  .atlas {{ grid-template-columns: 1fr; }}
  .legend {{ border-left: 0; border-top: 1px solid var(--line); max-height: none; }}
  .two {{ grid-template-columns: 1fr; }}
}}
@media (max-width: 640px) {{
  .wrap {{ padding: 0 16px; }}
  .map {{ padding: 8px; }}
  .cartouche {{ position: static; margin: 0 0 10px; max-width: none; box-shadow: none; }}
  .scale {{ display: none; }}
  .mk .lbl {{ font-size: 34px; }}
}}
</style>
</head>
<body>
{head}
<header class="top"><div class="wrap">
  <a class="brand" href="#">{e(club['name'])}<small>Aalst, sinds {club['founded']}</small></a>
  <nav aria-label="Hoofdmenu"><ul><li><a href="#kaart">Kaart</a></li><li><a href="#uitslag">Uitslag</a></li>
    <li><a href="#wateren">Wateren</a></li><li><a href="#club">Club</a></li></ul></nav>
</div></header>

<main>
<div class="atlas" id="kaart">
  <div class="map">
    <div class="cartouche">
      <h1>Seizoen {SEASON} op de kaart</h1>
      <p>{len(season)} wedstrijden op {len(season_waters)} wateren. De stippellijn volgt de kalender, van {nl_date(season[0]['date'])} tot {nl_date(season[-1]['date'])}.</p>
    </div>
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Schematische kaart van de wateren rond Aalst waar de club in {SEASON} viste">
      <rect width="{W}" height="{H}" fill="var(--land)"/>
      <g fill="var(--wood)" opacity=".8">
        <ellipse cx="{xy(50.86, 3.80)[0]}" cy="{xy(50.86, 3.80)[1]}" rx="70" ry="38"/>
        <ellipse cx="{xy(50.81, 4.18)[0]}" cy="{xy(50.81, 4.18)[1]}" rx="90" ry="42"/>
        <ellipse cx="{xy(51.06, 3.95)[0]}" cy="{xy(51.06, 3.95)[1]}" rx="55" ry="26"/>
      </g>
      <g class="grid">{grid}</g>
      <path class="river" d="{line(SCHELDE)}" stroke-width="9"/>
      <path class="river" d="{line(DENDER)}" stroke-width="6"/>
      <path class="river" d="{line(DURME)}" stroke-width="5"/>
      <path class="river" d="{line(ZENNE)}" stroke-width="4"/>
      <text class="rname" transform="translate({xy(50.905, 4.075)[0] + 10} {xy(50.905, 4.075)[1]}) rotate(-62)">Dender</text>
      <text class="rname" transform="translate({xy(51.012, 3.83)[0]} {xy(51.012, 3.83)[1] - 12})">Schelde</text>
      <text class="rname" transform="translate({xy(51.0, 4.375)[0] - 12} {xy(51.0, 4.375)[1]}) rotate(-84)">Zenne</text>
      <path class="route" d="{route}"/>
      {''.join(markers)}
      <g class="home" transform="translate({hx} {hy})"><rect class="sq" x="-8" y="-8" width="16" height="16" transform="rotate(45)"/>
        <text x="14" y="-10">Clublokaal</text></g>
      <g transform="translate({W - 20} {xy(50.83, 4.4)[1]})"><path d="M-46 0h40m-10-8 10 8-10 8" stroke="var(--ink)" stroke-width="2" fill="none"/>
        <text x="-6" y="26" text-anchor="end" class="cond" style="font:italic 500 17px 'Barlow Condensed'">Schwerte, ±220 km</text></g>
    </svg>
    <div class="scale">10 km<span style="width:{round(10 / 111 * S)}px"></span></div>
  </div>
  <aside class="legend" aria-label="Wateren per gemeente">
    <h2>Waar we visten</h2>
    <p>Kies een gemeente om ze op de kaart aan te duiden.</p>
    <ol>{''.join(legend)}</ol>
  </aside>
</div>

<section id="uitslag"><div class="wrap two">
  <div>
    <h2>Laatste uitslag</h2>
    <p class="meta">{e(last['title'])}, {nl_date(last['date'], weekday=True)}, {e(last['waterName'])} in {e(last['place'])}</p>
    <table><thead><tr><th>Pl.</th><th>Visser</th><th>Stek</th><th>Gewicht</th></tr></thead><tbody>{rows}</tbody></table>
  </div>
  <div>
    <h2>Seizoensgewicht</h2>
    <p class="meta">Totaal over de grote prijzen van {SEASON} met uitslag, enkel leden</p>
    <table><thead><tr><th>Pl.</th><th>Visser</th><th>Wedstr.</th><th>Totaal</th></tr></thead><tbody>{stand}</tbody></table>
  </div>
</div></section>

<section id="wateren"><div class="wrap">
  <h2>Wat mag waar</h2>
  <p class="lede">Elk water heeft zijn eigen voederregels. Dit zijn de afspraken voor de wateren van dit seizoen waarvoor we ze kennen.</p>
  <div class="waters">{''.join(cards)}</div>
  <div class="rules"><h3 class="cond" style="font-size:24px;margin:0 0 6px">Altijd geldig in onze club</h3>
    <ul>{''.join(f'<li>{e(r)}</li>' for r in feed_rules)}</ul></div>
</div></section>

<section class="base" id="club"><div class="wrap two">
  <div>
    <h2>Thuisbasis</h2>
    <p class="coord">{house['lat']:.4f}° N, {house['lng']:.4f}° O</p>
    <p>{e(house['name'])}<br>{e(house['street'])}<br>{house['postalCode']} {e(house['city'])}</p>
    <p>{e(history[0].split('.')[0])}. Sindsdien vertrekken we van hieruit naar de wateren van de streek.</p>
    <p><a href="mailto:{e(board[0]['email'])}">Lid worden? Mail de voorzitter</a></p>
  </div>
  <div>
    <h2>Bestuur</h2>
    <ul>{''.join(f"<li>{e(b['name'])}<span>{e(b['role'])}</span></li>" for b in board)}</ul>
  </div>
</div></section>
</main>
<footer><div class="wrap">{e(club['name'])}, stamnummer {club['stamnummer']}. Kaart schematisch, ligging van de wateren bij benadering.</div></footer>

<script>
(() => {{
  const items = document.querySelectorAll('.legend li[data-p]');
  const marks = document.querySelectorAll('.mk');
  const pick = (id) => {{
    items.forEach((li) => li.classList.toggle('on', li.dataset.p === id));
    marks.forEach((m) => m.classList.toggle('on', m.dataset.p === id));
  }};
  items.forEach((li) => {{
    const b = li.querySelector('button');
    b.addEventListener('click', () => pick(li.dataset.p));
    li.addEventListener('mouseenter', () => pick(li.dataset.p));
  }});
  marks.forEach((m) => m.addEventListener('mouseenter', () => pick(m.dataset.p)));
}})();
</script>
</body></html>
"""
