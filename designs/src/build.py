"""Builds the design proposals into designs/site. Run: python3 designs/src/build.py"""
from pathlib import Path
import weegbrief
import sinds1969
import viskaart
import index_page

OUT = Path(__file__).resolve().parents[1] / "site"


def banner(current):
    return f"""<div style="font:500 13px/1.4 system-ui,sans-serif;background:#16202a;color:#e8eef2;padding:8px 16px;display:flex;gap:16px;flex-wrap:wrap;justify-content:space-between">
  <span>Ontwerpvoorstel: {current}. Echte clubinhoud, geen werkende site.</span>
  <a href="../" style="color:#9fd3ff">Alle voorstellen bekijken</a></div>"""


DESIGNS = [
    ("weegbrief", "Weegbrief", weegbrief.page),
    ("sinds-1969", "Sinds 1969", sinds1969.page),
    ("viskaart", "Viskaart", viskaart.page),
]

if __name__ == "__main__":
    for slug, title, render in DESIGNS:
        d = OUT / slug
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.html").write_text(render(banner(title)))
        print("wrote", d / "index.html")
    (OUT / "index.html").write_text(index_page.page())
    print("wrote", OUT / "index.html")
