"""Design A: 'Weegbrief' — the site as the club's pre-printed weigh slip, filled in by hand."""
from data import (e, club, house, board, season, last, last_entries, standings, name, guest,
                  nl_date, kg, history, rules, feed_rules, TYPE_LABEL, SEASON)


def page(head):
    rows_last = "".join(
        f"""<tr{' class="gast"' if guest(x) else ''}>
          <td class="num">{i}</td><td class="hand">{e(name(x['anglerSlug']))}{' <small>gast</small>' if guest(x) else ''}</td>
          <td class="num hand">{x['peg']}</td><td class="num hand">{kg(x['weight'])}</td></tr>"""
        for i, x in enumerate(last_entries, 1)
    )

    cal = []
    for i, c in enumerate(season, 1):
        place = f", {e(c['place'])}" if c["place"] else ""
        draw = c.get("drawTime") or "–"
        start = c.get("startTime") or "–"
        mark = '<span class="tick" title="Uitslag binnen">✓</span>' if c["result"] else '<span class="tick dim" title="Gespeeld">✓</span>'
        cal.append(f"""<tr>
          <td class="num">{i}</td>
          <td><span class="hand">{nl_date(c['date'], weekday=True)}</span></td>
          <td><strong>{e(c['title'])}</strong><br><span class="kind">{TYPE_LABEL.get(c['type'], '')}</span></td>
          <td class="hand">{e(c['waterName'])}{place}</td>
          <td class="num hand">{draw}</td><td class="num hand">{start}</td>
          <td class="num">{mark}</td></tr>""")

    stand = "".join(
        f"""<li><span class="pos">{i}</span><span class="hand who">{e(r['name'])}</span>
        <span class="dots"></span><span class="hand w">{kg(r['weight'])}</span></li>"""
        for i, r in enumerate(standings[:10], 1)
    )
    bestuur = "".join(f"<li><span>{e(b['role'])}</span><span class='hand'>{e(b['name'])}</span></li>" for b in board)

    return f"""<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Weegbrief · De Aalsterse Plasvissers</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@400;600;700&family=Archivo:wght@400;600&family=Nanum+Pen+Script&display=swap" rel="stylesheet">
<style>
:root {{
  --paper: #F5EFC4; --paper-2: #EFE6AE; --form: #C1272D; --rule: rgba(193,39,45,.38);
  --pen: #1D3C9C; --print: #2A2620; --soft: #6E6552;
}}
* {{ box-sizing: border-box; }}
html {{ background: var(--paper); }}
body {{ margin: 0; color: var(--print); font: 400 17px/1.55 Archivo, system-ui, sans-serif;
  background: var(--paper) repeating-linear-gradient(transparent 0 31px, rgba(29,60,156,.06) 31px 32px); }}
a {{ color: var(--pen); }}
a:focus-visible, button:focus-visible {{ outline: 3px solid var(--pen); outline-offset: 3px; }}
.hand {{ font-family: 'Nanum Pen Script', cursive; color: var(--pen); font-size: 1.45em; line-height: 1.05; }}
.wrap {{ max-width: 1120px; margin: 0 auto; padding: 0 24px; }}
h1, h2, h3, .label {{ font-family: 'Archivo Narrow', sans-serif; color: var(--form); }}
h2 {{ font-size: clamp(30px, 4vw, 44px); line-height: 1.05; margin: 0 0 6px; font-weight: 700; }}
.sub {{ color: var(--soft); margin: 0 0 24px; max-width: 60ch; }}

/* Pre-printed header */
.top {{ border-bottom: 3px double var(--form); }}
.top .wrap {{ display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 12px 24px; padding-block: 18px 12px; }}
.brand {{ font-family: 'Archivo Narrow'; color: var(--form); line-height: 1.1; }}
.brand b {{ display: block; font-size: 24px; }}
.brand span {{ font-size: 14px; }}
nav ul {{ display: flex; flex-wrap: wrap; gap: 4px 20px; margin: 0; padding: 0; list-style: none; font-family: 'Archivo Narrow'; font-weight: 600; }}
nav a {{ color: var(--form); text-decoration: none; border-bottom: 1px solid var(--rule); }}
nav a:hover {{ border-color: var(--form); }}

/* Hero: the filled-in slip */
.hero {{ padding: 48px 0 64px; display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 48px; align-items: start; }}
.slip {{ position: relative; background: #FBF7DD; border: 2px solid var(--form); padding: 22px 24px 26px;
  box-shadow: 0 1px 0 var(--paper-2), 6px 8px 0 -2px rgba(42,38,32,.08); }}
.slip::before {{ content: ''; position: absolute; left: 0; right: 0; top: -9px; height: 9px;
  background: radial-gradient(circle at 6px 9px, var(--paper) 4px, transparent 4.5px) 0 0/16px 9px repeat-x; }}
.slip h1 {{ margin: 0 0 14px; font-size: 15px; font-weight: 700; display: flex; justify-content: space-between; border-bottom: 1px solid var(--form); padding-bottom: 8px; }}
.fields {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; margin-bottom: 18px; }}
.field {{ border-bottom: 1px solid var(--rule); padding: 4px 0 2px; min-height: 48px; }}
.field.wide {{ grid-column: 1 / -1; }}
.field .label {{ display: block; font-size: 12.5px; font-weight: 600; }}
.field .hand {{ font-size: 30px; }}
table {{ width: 100%; border-collapse: collapse; }}
th {{ font-family: 'Archivo Narrow'; font-weight: 600; font-size: 13px; color: var(--form); text-align: left; border-bottom: 1.5px solid var(--form); padding: 4px 8px 4px 0; }}
td {{ border-bottom: 1px solid var(--rule); padding: 4px 8px 4px 0; vertical-align: baseline; }}
td.num, th.num {{ text-align: right; white-space: nowrap; }}
.slip td.hand {{ font-size: 26px; }}
tr.gast td {{ opacity: .7; }}
small {{ font-family: Archivo; font-size: 12px; color: var(--soft); }}
.stamp {{ position: absolute; right: 20px; bottom: 16px; transform: rotate(-9deg); border: 3px solid var(--form); color: var(--form);
  font: 700 15px/1.15 'Archivo Narrow'; text-align: center; padding: 8px 12px; border-radius: 6px; opacity: .82; mix-blend-mode: multiply;
  background: radial-gradient(rgba(193,39,45,.08), transparent 70%); }}
.stamp b {{ display: block; font-size: 24px; }}
.signed {{ display: flex; justify-content: space-between; gap: 16px; margin-top: 18px; min-height: 84px; font-size: 13px; color: var(--form); font-family: 'Archivo Narrow'; }}
.signed .hand {{ font-size: 34px; display: block; transform: rotate(-3deg); }}
.side figure {{ margin: 0; position: relative; transform: rotate(1.6deg); background: #fff; padding: 10px 10px 34px; box-shadow: 0 2px 4px rgba(0,0,0,.12); }}
.side figure::before {{ content: ''; position: absolute; top: -12px; left: 38%; width: 90px; height: 26px; background: rgba(240,234,190,.75); transform: rotate(-4deg); border: 1px solid rgba(0,0,0,.05); }}
.side img {{ width: 100%; height: auto; display: block; aspect-ratio: 4/3; object-fit: cover; }}
.side figcaption {{ position: absolute; bottom: 4px; left: 12px; }}
.side .note {{ margin-top: 30px; }}
.side .note p {{ margin: 0 0 12px; }}
.btn {{ display: inline-block; font: 700 16px 'Archivo Narrow'; color: #fff; background: var(--form); padding: 10px 18px; text-decoration: none; border-radius: 2px; }}
.btn.ghost {{ background: none; color: var(--form); border: 1.5px solid var(--form); }}

section {{ padding: 56px 0; border-top: 3px double var(--form); }}
.register {{ overflow-x: auto; }}
.register table {{ min-width: 760px; }}
.register td {{ padding: 8px 10px 6px 0; }}
.register .hand {{ font-size: 25px; }}
.kind {{ font-size: 13px; color: var(--soft); }}
.tick {{ font-family: 'Nanum Pen Script'; font-size: 34px; color: var(--pen); line-height: .6; }}
.tick.dim {{ opacity: .35; }}

.two {{ display: grid; grid-template-columns: 1fr 1fr; gap: 56px; }}
.tally {{ list-style: none; margin: 0; padding: 0; }}
.tally li {{ display: grid; grid-template-columns: 34px auto 1fr auto; align-items: baseline; gap: 8px; border-bottom: 1px solid var(--rule); padding: 6px 0; }}
.tally .pos {{ font-family: 'Archivo Narrow'; color: var(--form); font-weight: 700; }}
.tally .who, .tally .w {{ font-size: 28px; }}
.tally .dots {{ border-bottom: 2px dotted rgba(29,60,156,.3); transform: translateY(-6px); }}
.card {{ background: #FBF7DD; border: 2px solid var(--form); border-radius: 10px; padding: 22px 24px; position: relative; }}
.card h3 {{ margin: 0; font-size: 26px; }}
.card .no {{ position: absolute; right: 22px; top: 22px; font-family: 'Archivo Narrow'; color: var(--form); font-size: 13px; text-align: right; }}
.card .no .hand {{ display: block; font-size: 30px; }}
.card ul {{ list-style: none; padding: 0; margin: 18px 0; }}
.card li {{ display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--rule); padding: 4px 0; font-size: 14px; color: var(--form); font-family: 'Archivo Narrow'; align-items: baseline; }}
.card li .hand {{ font-size: 26px; }}
.history p {{ max-width: 68ch; }}
.history p:first-child::first-letter {{ font: 700 3.4em/0.8 'Archivo Narrow'; color: var(--form); float: left; padding: 6px 8px 0 0; }}
footer {{ border-top: 3px double var(--form); padding: 32px 0 48px; font-size: 13px; color: var(--soft); }}
footer .cols {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }}
footer h3 {{ font-size: 15px; margin: 0 0 6px; }}
footer ol {{ margin: 0; padding-left: 18px; }}
.copy {{ margin-top: 28px; font-family: 'Archivo Narrow'; color: var(--form); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }}

@media (max-width: 860px) {{
  .hero, .two, footer .cols {{ grid-template-columns: 1fr; }}
  .hero {{ gap: 40px; }}
}}
@media (max-width: 520px) {{
  .wrap {{ padding: 0 16px; }}
  .fields {{ grid-template-columns: 1fr; }}
  .slip {{ padding: 18px 14px; }}
  .slip td.hand {{ font-size: 22px; }}
}}
@media (prefers-reduced-motion: no-preference) {{
  .stamp {{ animation: thump .5s cubic-bezier(.2,1.6,.4,1) .5s both; }}
  @keyframes thump {{ from {{ transform: rotate(-9deg) scale(1.6); opacity: 0; }} }}
}}
</style>
</head>
<body>
{head}
<header class="top"><div class="wrap">
  <div class="brand"><b>{e(club['name'])}</b><span>Opgericht in {club['founded']}, stamnummer {club['stamnummer']}</span></div>
  <nav aria-label="Hoofdmenu"><ul>
    <li><a href="#uitslag">Uitslag</a></li><li><a href="#kalender">Kalender</a></li>
    <li><a href="#stand">Stand</a></li><li><a href="#club">De club</a></li><li><a href="#reglement">Reglement</a></li></ul></nav>
</div></header>

<main>
<div class="wrap hero" id="uitslag">
  <article class="slip" aria-labelledby="slip-title">
    <h1 id="slip-title"><span>Weegbrief</span><span>Seizoen {SEASON}</span></h1>
    <div class="fields">
      <div class="field wide"><span class="label">Wedstrijd</span><span class="hand">{e(last['title'])}</span></div>
      <div class="field"><span class="label">Datum</span><span class="hand">{nl_date(last['date'], weekday=True, year=True)}</span></div>
      <div class="field"><span class="label">Water</span><span class="hand">{e(last['waterName'])}, {e(last['place'] or '')}</span></div>
      <div class="field"><span class="label">Loting</span><span class="hand">{last['drawTime']}</span></div>
      <div class="field"><span class="label">Aanvang</span><span class="hand">{last['startTime']}</span></div>
    </div>
    <table>
      <thead><tr><th class="num">Pl.</th><th>Visser</th><th class="num">Stek</th><th class="num">Gewicht</th></tr></thead>
      <tbody>{rows_last}</tbody>
    </table>
    <div class="signed"><span>Voor echt verklaard<span class="hand">het bestuur</span></span></div>
    <div class="stamp" aria-hidden="true">Laatste uitslag<b>{nl_date(last['date'])}</b>{len(last_entries)} vissers</div>
  </article>

  <aside class="side">
    <figure><img src="../assets/karper-meer.jpg" alt="Een clublid toont een karper aan de waterkant" width="1200" height="900">
      <figcaption class="hand">uit het fotoboek</figcaption></figure>
    <div class="note">
      <p class="hand" style="font-size:34px">{e(club['tagline'])}</p>
      <p>We vissen van april tot oktober op wateren rond Aalst, met een grote prijs of een reeks van het kampioenschap bijna elke zaterdag. Iedereen weegt op hetzelfde blad.</p>
      <p><a class="btn" href="#club">Lid worden</a> <a class="btn ghost" href="#kalender">Kalender {SEASON}</a></p>
    </div>
  </aside>
</div>

<section id="kalender"><div class="wrap">
  <h2>Kalender {SEASON}</h2>
  <p class="sub">Alle {len(season)} wedstrijden van het seizoen. Een vinkje betekent dat de uitslag op de site staat.</p>
  <div class="register"><table>
    <thead><tr><th class="num">Nr.</th><th>Datum</th><th>Wedstrijd</th><th>Water</th><th class="num">Loting</th><th class="num">Aanvang</th><th class="num">Uitslag</th></tr></thead>
    <tbody>{''.join(cal)}</tbody></table></div>
</div></section>

<section id="stand"><div class="wrap two">
  <div>
    <h2>Seizoensgewicht</h2>
    <p class="sub">Opgeteld over de grote prijzen van {SEASON} met een gepubliceerde uitslag, enkel leden.</p>
    <ol class="tally">{stand}</ol>
  </div>
  <div class="history" id="club">
    <h2>Sinds {club['founded']}</h2>
    {''.join(f'<p>{e(p)}</p>' for p in history[:2])}
  </div>
</div></section>

<section><div class="wrap two">
  <div class="card" aria-labelledby="lidkaart">
    <div class="no">Lidnummer<span class="hand">…</span></div>
    <h3 id="lidkaart">Lidkaart {SEASON + 1}</h3>
    <p style="margin:6px 0 0;max-width:34ch">Maximum vijftig leden, al sinds de eerste vergadering. Er is nog plaats.</p>
    <ul>{bestuur}</ul>
    <a class="btn" href="mailto:{e(board[0]['email'])}">Vraag een lidkaart aan</a>
  </div>
  <div>
    <h2>Clublokaal</h2>
    <p class="hand" style="font-size:40px;margin:8px 0 4px">{e(house['name'])}</p>
    <p>{e(house['street'])}<br>{house['postalCode']} {e(house['city'])}</p>
    <p>Hier wordt na elke wedstrijd nagekaart, en hier hangt de stand aan de muur.</p>
    <p><a href="{e(house['facebook'])}">Café @ De Parking op Facebook</a></p>
  </div>
</div></section>
</main>

<footer id="reglement"><div class="wrap">
  <div class="cols">
    <div><h3>Reglement</h3><ol>{''.join(f'<li>{e(r)}</li>' for r in rules)}</ol></div>
    <div><h3>Voederregels</h3><ol>{''.join(f'<li>{e(r)}</li>' for r in feed_rules)}</ol></div>
    <div><h3>Contact</h3><p>{e(board[0]['name'])}, voorzitter<br><a href="mailto:{e(board[0]['email'])}">{e(board[0]['email'])}</a></p></div>
  </div>
  <div class="copy"><span>{e(club['name'])}, stamnummer {club['stamnummer']}</span><span>Exemplaar voor de visser</span></div>
</div></footer>
</body></html>
"""
