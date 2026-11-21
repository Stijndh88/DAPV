"""Design B: 'Sinds 1969' — two-colour screenprint club poster in the blue of the club overalls."""
from collections import OrderedDict
from datetime import date
from data import (e, club, house, board, season, last, last_entries, standings, name, guest,
                  nl_date, kg, history, MONTHS, TYPE_LABEL, SEASON)

FISH = ("M10 50C30 18 90 10 140 36L176 14C180 12 184 15 182 19L170 50L182 81C184 85 180 88 176 86L140 64C90 90 30 82 10 50Z"
        "M64 24C80 2 112 4 124 30Z")


def patch():
    return f"""<svg class="patch" viewBox="0 0 400 400" role="img" aria-label="Clubembleem: De Aalsterse Plasvissers, Aalst, sinds 1969">
  <defs><path id="ring" d="M200,200 m-150,0 a150,150 0 1,1 300,0 a150,150 0 1,1 -300,0"/></defs>
  <circle cx="200" cy="200" r="196" fill="var(--blue)"/>
  <circle cx="200" cy="200" r="186" fill="none" stroke="var(--sun)" stroke-width="3" stroke-dasharray="7 6"/>
  <circle cx="200" cy="200" r="112" fill="var(--sun)"/>
  <text class="ring" fill="var(--sun)"><textPath href="#ring" startOffset="2%">De Aalsterse Plasvissers ★ Aalst ★ stamnummer 02001 ★</textPath></text>
  <g transform="translate(108 122)" fill="var(--blue)"><path d="{FISH}"/><circle cx="38" cy="46" r="5" fill="var(--sun)"/><path d="M58 34c8 10 8 22 0 32" fill="none" stroke="var(--sun)" stroke-width="3"/></g>
  <text x="200" y="270" text-anchor="middle" class="year" fill="var(--blue)">1969</text>
</svg>"""


def page(head):
    podium = standings[:3]
    order = [podium[1], podium[0], podium[2]]
    steps = "".join(
        f"""<li class="step s{p}"><span class="who">{e(r['name'])}</span><span class="w">{kg(r['weight'])}</span>
        <span class="block"><span class="pl">{p}</span></span></li>"""
        for p, r in zip((2, 1, 3), order)
    )
    rest = "".join(
        f"<li><span>{i}</span><span>{e(r['name'])}</span><span>{kg(r['weight'])}</span></li>"
        for i, r in enumerate(standings[3:10], 4)
    )

    months = OrderedDict()
    for c in season:
        months.setdefault(int(c["date"][5:7]), []).append(c)
    cal = "".join(
        f"""<div class="month"><h3>{MONTHS[m - 1].capitalize()}</h3><ul>{''.join(
            f'''<li><span class="d">{int(c['date'][8:])}</span><span><b>{e(c['title'])}</b>
            <small>{e(c['waterName'])}{', ' + e(c['place']) if c['place'] else ''}</small></span></li>'''
            for c in cs)}</ul></div>"""
        for m, cs in months.items()
    )

    timeline = [
        ("1969", "Petrus Bassleer richt de club op in café ’t Plasken. Zoon Jozef wordt de eerste voorzitter."),
        ("50", "Al sinds de eerste vergadering geldt een maximum van vijftig leden. Die regel staat nog altijd."),
        ("2004", "Feestzaal De Snip viert 35 jaar voorzitterschap van Jozef Bassleer, met de Duitse vrienden uit Schwerte."),
        ("2019", "De club bestaat 50 jaar."),
        (str(SEASON), f"{len(season)} wedstrijden, van {nl_date(season[0]['date'])} tot {nl_date(season[-1]['date'])}."),
    ]
    tl = "".join(f"<li><b>{y}</b><p>{e(t)}</p></li>" for y, t in timeline)
    bestuur = "".join(f"<li><b>{e(b['name'])}</b><span>{e(b['role'])}</span></li>" for b in board)
    koning = next(c for c in season if c["title"] == "Koningschap")

    return f"""<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sinds 1969 · De Aalsterse Plasvissers</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shrikhand&family=Public+Sans:ital,wght@0,400;0,600;0,800;1,400&display=swap" rel="stylesheet">
<style>
:root {{ --blue: #1F4FA3; --blue-d: #143672; --sun: #F2C230; --ink: #10233F; --white: #F3F5F7; --red: #D63A2F; }}
* {{ box-sizing: border-box; }}
html {{ background: var(--sun); }}
body {{ margin: 0; font: 400 17px/1.6 'Public Sans', system-ui, sans-serif; color: var(--ink); background: var(--white); }}
a {{ color: inherit; }}
a:focus-visible, button:focus-visible {{ outline: 3px solid var(--red); outline-offset: 3px; }}
.wrap {{ max-width: 1180px; margin: 0 auto; padding: 0 24px; }}
h1, h2, h3 {{ font-family: Shrikhand, serif; font-weight: 400; line-height: 1.02; margin: 0; }}
h2 {{ font-size: clamp(38px, 6vw, 72px); color: var(--blue); }}

.bar {{ background: var(--blue); color: var(--sun); }}
.bar .wrap {{ display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding-block: 14px; }}
.bar .logo {{ font-family: Shrikhand; font-size: 22px; text-decoration: none; }}
.bar ul {{ display: flex; gap: 6px 22px; flex-wrap: wrap; list-style: none; margin: 0; padding: 0; font-weight: 800; font-size: 15px; }}
.bar ul a {{ text-decoration: none; }}
.bar ul a:hover {{ text-decoration: underline; text-underline-offset: 4px; }}

.hero {{ background: var(--sun); position: relative; overflow: hidden; }}
.hero .wrap {{ display: grid; grid-template-columns: 420px 1fr; gap: 56px; align-items: center; padding-block: 64px 0; }}
.patch {{ width: 100%; max-width: 420px; display: block; }}
.patch .ring {{ font: 800 25px 'Public Sans'; letter-spacing: 1.5px; }}
.patch .year {{ font: 50px Shrikhand; }}
@media (prefers-reduced-motion: no-preference) {{
  .patch {{ animation: spin-in 1.1s cubic-bezier(.2,.8,.2,1) both; }}
  @keyframes spin-in {{ from {{ transform: rotate(-200deg) scale(.6); opacity: 0; }} }}
}}
.hero h1 {{ font-size: clamp(46px, 7.2vw, 104px); color: var(--blue); transform: rotate(-3deg); transform-origin: left; }}
.hero p.lead {{ font-size: 20px; max-width: 34ch; margin: 28px 0; font-weight: 600; }}
.btns {{ display: flex; gap: 12px; flex-wrap: wrap; }}
.btn {{ display: inline-block; padding: 13px 22px; border-radius: 999px; font-weight: 800; text-decoration: none; background: var(--blue); color: var(--sun); border: 3px solid var(--blue); }}
.btn.alt {{ background: transparent; color: var(--blue); }}
.duo {{ position: relative; background: var(--blue); overflow: hidden; }}
.duo img {{ display: block; width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.25) brightness(1.1); mix-blend-mode: screen; opacity: .95; }}
.duo::after {{ content: ''; position: absolute; inset: 0; background: radial-gradient(var(--blue) 26%, transparent 28%) 0 0/5px 5px; mix-blend-mode: multiply; opacity: .35; pointer-events: none; }}
.duo.sun {{ background: var(--sun); }}
.duo.sun img {{ mix-blend-mode: multiply; filter: grayscale(1) contrast(1.4) brightness(1.05); }}
.strip {{ height: clamp(220px, 34vw, 440px); margin-top: 64px; }}
.strip img {{ object-position: 50% 30%; }}
.cap {{ background: var(--sun); color: var(--ink); font-size: 14px; padding: 10px 0; }}

section {{ padding: 88px 0; }}
.season {{ display: grid; grid-template-columns: 1.1fr .9fr; gap: 64px; align-items: end; }}
.season p {{ max-width: 46ch; }}
.podium {{ list-style: none; margin: 40px 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; align-items: end; }}
.step {{ text-align: center; display: flex; flex-direction: column; gap: 2px; }}
.step .who {{ font-weight: 800; line-height: 1.2; }}
.step .w {{ font-size: 15px; margin-bottom: 10px; }}
.step .block {{ background: var(--blue); color: var(--sun); display: grid; place-items: center; border-radius: 10px 10px 0 0; }}
.step .pl {{ font: 64px Shrikhand; }}
.s1 .block {{ height: 220px; background: var(--red); }}
.s2 .block {{ height: 160px; }}
.s3 .block {{ height: 120px; }}
.rest {{ list-style: none; margin: 0; padding: 0; }}
.rest li {{ display: grid; grid-template-columns: 36px 1fr auto; gap: 8px; padding: 10px 0; border-bottom: 2px solid var(--blue); font-weight: 600; }}
.rest li span:first-child {{ font-family: Shrikhand; color: var(--blue); }}
.note {{ font-size: 14px; color: #48566b; margin-top: 16px; }}

.king {{ background: var(--blue); color: var(--white); }}
.king .wrap {{ display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }}
.king h2 {{ color: var(--sun); }}
.king .duo {{ aspect-ratio: 4/5; border-radius: 50% 50% 12px 12px; }}
.king p {{ font-size: 19px; max-width: 40ch; }}
.king .last {{ background: var(--sun); color: var(--ink); border-radius: 14px; padding: 20px 24px; margin-top: 28px; }}
.king .last b {{ font-family: Shrikhand; font-weight: 400; font-size: 30px; display: block; color: var(--blue); }}

.timeline {{ list-style: none; margin: 48px 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; border-top: 6px solid var(--blue); }}
.timeline li {{ padding: 18px 18px 0 0; position: relative; }}
.timeline li::before {{ content: ''; position: absolute; top: -15px; left: 0; width: 24px; height: 24px; border-radius: 50%; background: var(--sun); border: 5px solid var(--blue); }}
.timeline b {{ font: 46px Shrikhand; color: var(--blue); display: block; margin-top: 8px; }}
.timeline p {{ margin: 6px 0 0; font-size: 15px; }}

.cal {{ background: var(--sun); }}
.months {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 28px 32px; margin-top: 40px; }}
.month h3 {{ font-size: 32px; color: var(--blue); border-bottom: 4px solid var(--blue); padding-bottom: 4px; margin-bottom: 8px; }}
.month ul {{ list-style: none; margin: 0; padding: 0; }}
.month li {{ display: grid; grid-template-columns: 44px 1fr; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(31,79,163,.35); }}
.month .d {{ font: 30px/1 Shrikhand; color: var(--red); }}
.month b {{ display: block; line-height: 1.25; }}
.month small {{ font-size: 14px; }}

.club .wrap {{ display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }}
.board {{ list-style: none; margin: 28px 0 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }}
.board li {{ background: var(--blue); color: var(--white); border-radius: 12px; padding: 16px; }}
.board b {{ display: block; color: var(--sun); font-size: 18px; }}
.song {{ background: var(--ink); color: var(--white); border-radius: 18px; padding: 26px; margin-top: 28px; }}
.song h3 {{ color: var(--sun); font-size: 30px; }}
.song audio {{ width: 100%; margin-top: 14px; }}
footer {{ background: var(--blue); color: var(--sun); padding: 40px 0 56px; font-weight: 600; }}
footer .wrap {{ display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; }}
footer .big {{ font-family: Shrikhand; font-size: 30px; font-weight: 400; }}

@media (max-width: 900px) {{
  .hero .wrap, .season, .king .wrap, .club .wrap {{ grid-template-columns: 1fr; gap: 40px; }}
  .patch {{ max-width: 300px; }}
  .timeline {{ grid-template-columns: 1fr; border-top: 0; border-left: 6px solid var(--blue); padding-left: 24px; }}
  .timeline li {{ padding: 0 0 20px; }}
  .timeline li::before {{ left: -39px; top: 14px; }}
}}
@media (max-width: 520px) {{
  .wrap {{ padding: 0 16px; }}
  .board {{ grid-template-columns: 1fr; }}
  .step .pl {{ font-size: 44px; }}
  .s1 .block {{ height: 160px; }} .s2 .block {{ height: 120px; }} .s3 .block {{ height: 90px; }}
  .step .who {{ font-size: 14px; }}
}}
</style>
</head>
<body>
{head}
<header class="bar"><div class="wrap">
  <a class="logo" href="#">Plasvissers</a>
  <nav aria-label="Hoofdmenu"><ul><li><a href="#seizoen">Seizoen {SEASON}</a></li><li><a href="#kalender">Kalender</a></li>
  <li><a href="#geschiedenis">Geschiedenis</a></li><li><a href="#club">Bestuur</a></li></ul></nav>
</div></header>

<main>
<div class="hero">
  <div class="wrap">
    {patch()}
    <div>
      <h1>Al meer dan 50 jaar de tofste club van ’t stad!</h1>
      <p class="lead">De Aalsterse Plasvissers vissen sinds {club['founded']} samen op de wateren rond Aalst. Elke zaterdag van april tot oktober, in het blauw.</p>
      <div class="btns"><a class="btn" href="#club">Kom erbij</a><a class="btn alt" href="#kalender">Bekijk de kalender</a></div>
    </div>
  </div>
  <div class="duo strip"><img src="../assets/groep-staand.jpg" alt="Clubleden in hun blauwe overalls aan de waterkant" width="1200" height="533"></div>
  <div class="cap"><div class="wrap">De ploeg aan het water, uit het fotoboek van 2022.</div></div>
</div>

<section id="seizoen"><div class="wrap season">
  <div>
    <h2>Seizoen {SEASON}</h2>
    <p>Wie ving het meest? Het totale gewicht over de grote prijzen van dit seizoen waarvan de uitslag op de site staat.</p>
    <ol class="podium" aria-label="Top drie">{steps}</ol>
  </div>
  <div>
    <ol class="rest" start="4">{rest}</ol>
    <p class="note">Enkel leden. Gastvissers tellen niet mee voor de stand.</p>
  </div>
</div></section>

<section class="king"><div class="wrap">
  <div class="duo sun"><img src="../assets/koning.jpg" alt="De koning van 2021 met zijn kroon" width="1050" height="1400"></div>
  <div>
    <h2>Lang leve de koning</h2>
    <p>Eén dag per jaar vissen we om de kroon. Het koningschap van {SEASON} viel op {nl_date(koning['date'], weekday=True)}, aan {e(koning['waterName'])} in {e(koning['place'])}. Op de foto: de koning van 2021.</p>
    <div class="last">Laatste uitslag, {e(last['title'])}<b>{e(name(last_entries[0]['anglerSlug']))}, {kg(last_entries[0]['weight'])}</b>
      {nl_date(last['date'], weekday=True)} aan {e(last['waterName'])}, {e(last['place'])}. {len(last_entries)} vissers.</div>
  </div>
</div></section>

<section id="geschiedenis"><div class="wrap">
  <h2>Sinds 1969</h2>
  <ol class="timeline">{tl}</ol>
</div></section>

<section class="cal" id="kalender"><div class="wrap">
  <h2>De kalender</h2>
  <div class="months">{cal}</div>
</div></section>

<section class="club" id="club"><div class="wrap">
  <div>
    <h2>Het bestuur</h2>
    <ul class="board">{bestuur}</ul>
  </div>
  <div>
    <h2>Kom erbij</h2>
    <p>We spreken af in {e(house['name'])}, {e(house['street'])}, {house['postalCode']} {e(house['city'])}. Er is plaats voor vijftig leden. Mail de voorzitter op <a href="mailto:{e(board[0]['email'])}">{e(board[0]['email'])}</a>.</p>
    <div class="song">
      <h3>’t Plasvisserslieken</h3>
      <p style="margin:6px 0 0">Het clublied. Zet het luid.</p>
      <audio controls preload="none" src="../assets/plasvisserslieken.mp3"></audio>
    </div>
  </div>
</div></section>
</main>

<footer><div class="wrap"><span class="big">{e(club['name'])}</span><span>Stamnummer {club['stamnummer']}, opgericht in {club['founded']}</span></div></footer>
</body></html>
"""
