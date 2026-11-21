"""Loads the real club content (migration/data/import) for the design proposals."""
import json
import re
from collections import defaultdict
from datetime import date
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
IMPORT = ROOT / "migration" / "data" / "import"

MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli",
          "augustus", "september", "oktober", "november", "december"]
DAYS = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"]

# Approximate town centres, only used to place the waters on the schematic map.
PLACES = {
    "Mere": (50.923, 3.968), "Gijzegem": (50.978, 4.063), "Humbeek": (50.968, 4.383),
    "Liedekerke": (50.870, 4.090), "Meldert": (50.942, 4.137), "Okegem": (50.866, 4.058),
    "Nederzwalm": (50.888, 3.668), "Hamme": (51.098, 4.136), "Idegem": (50.802, 3.926),
    "Baasrode": (51.035, 4.160), "Schellebelle": (51.020, 3.930), "Denderhoutem": (50.880, 4.010),
    "Aalst": (50.953, 4.061),
}


def load(name):
    return json.loads((IMPORT / f"{name}.json").read_text())


def strip_tags(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html or "")).strip()


def paragraphs(html):
    return [strip_tags(p) for p in re.findall(r"<p>(.*?)</p>", html or "", re.S) if strip_tags(p)]


def nl_date(iso, weekday=False, year=False):
    d = date.fromisoformat(iso[:10])
    s = f"{d.day} {MONTHS[d.month - 1]}"
    if weekday:
        s = f"{DAYS[d.weekday()]} {s}"
    if year:
        s += f" {d.year}"
    return s


def kg(x):
    return f"{x:,.2f}".replace(",", " ").replace(".", ",") + " kg"


settings = load("site-settings")
board = sorted(load("board-members"), key=lambda b: b["order"])
waters = {w["slug"]: w for w in load("waters")}
anglers = {a["slug"]: a for a in load("anglers")}
pages = {p["slug"]: p for p in load("pages")}
results = {r["competitionSlug"]: r for r in load("results")}
competitions = load("competitions")

SEASON = 2026
season = sorted([c for c in competitions if c["season"] == SEASON], key=lambda c: c["date"])
for c in season:
    w = waters.get(c["waterSlug"]) or {}
    c["waterName"] = w.get("name") or "nog te bepalen"
    c["place"] = w.get("place")
    c["result"] = results.get(c["slug"])


def name(slug):
    a = anglers.get(slug)
    return a["name"] if a else slug.replace("-", " ").title()


def guest(entry):
    return bool(entry.get("note")) or (anglers.get(entry["anglerSlug"]) or {}).get("member") is False


played_with_result = [c for c in season if c["result"]]
last = played_with_result[-1]
last_entries = sorted(last["result"]["entries"], key=lambda e: -e["weight"])

# Season weight table over the 2026 matches that have a published result (members only).
_tot = defaultdict(lambda: {"weight": 0.0, "matches": 0, "wins": 0, "best": 0.0})
for c in played_with_result:
    ents = sorted(c["result"]["entries"], key=lambda e: -e["weight"])
    for i, e in enumerate(ents):
        if guest(e):
            continue
        t = _tot[e["anglerSlug"]]
        t["weight"] += e["weight"]
        t["matches"] += 1
        t["best"] = max(t["best"], e["weight"])
        if i == 0:
            t["wins"] += 1
standings = sorted(
    ({"slug": s, "name": name(s), **v} for s, v in _tot.items()),
    key=lambda r: (-r["weight"], -r["wins"]),
)

history = paragraphs(pages["geschiedenis"]["html"])
rules = [strip_tags(li) for li in re.findall(r"<li>(.*?)</li>", pages["reglement"]["html"], re.S)]
feed_rules = [r["text"] for r in settings["feedRules"]]
club = settings
house = settings["clubhouse"]

# Waters fished in 2026, in order of first visit.
season_waters = []
for c in season:
    if c["waterSlug"] in waters and c["waterSlug"] not in [w["slug"] for w in season_waters]:
        season_waters.append({**waters[c["waterSlug"]], "dates": []})
    for w in season_waters:
        if w["slug"] == c["waterSlug"]:
            w["dates"].append(c)

BAIT = {
    "witte-maden": "witte maden", "rode-maden": "rode maden", "casters": "casters",
    "korrels": "korrels", "mais": "maïs", "granen": "granen", "muggenlarven": "muggenlarven",
    "voeder": "voeder", "pieren": "pieren", "insecten": "insecten", "zinkers": "zinkers",
    "pasta": "pasta", "den-bol": "den bol", "drijvend": "drijvend aas", "vers-de-vase": "vers-de-vase",
}


def bait(x):
    return BAIT.get(x, x.replace("-", " "))


TYPE_LABEL = {
    "club": "Grote prijs", "kampioenschap": "Kampioenschap", "andere": "Clubfeest",
    "vriendschappelijk": "Vriendschappelijk", "nacht": "Avondvissing", "koppel": "Koppelvissing",
}

e = escape
