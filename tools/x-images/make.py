#!/usr/bin/env python3
"""
ShopCardHub — tools/x-images/make.py
Renders 1200x675 PNGs for X posts from data/indices.json (site brand: dark
#07090C, cyan #00ccf5, Barlow / Barlow Condensed / JetBrains Mono).

Rule (Mo, Sep 3 2026): every @shopcardhub tweet ships with an image. Images
are generated from live data at post/schedule time, never reused stale.

Usage:
  python3 tools/x-images/make.py inclusion AH26           # divisor-adjustment math card
  python3 tools/x-images/make.py skew AH26                # right-skew histogram of basket marks
  python3 tools/x-images/make.py levels                   # all five tickers, level vs 100
  python3 tools/x-images/make.py movers AH26              # top/bottom movers vs prevPrice
  python3 tools/x-images/make.py vault                    # Vault pitch card (public data only)
  python3 tools/x-images/make.py og --out og              # og/indices.png link preview (1200x630), re-run each Monday; also stamps ?v=<mark date> on every page's og:image so X/Discord refetch
  python3 tools/x-images/make.py bangers                  # THE TUESDAY BOARD tape: top-5 parsed straight off bowman-bangers.html (added Sep 8 2026)
  python3 tools/x-images/make.py bcb26                    # BCB26 pre-activation / release-window card from indices.json (added Sep 8 2026; shows the level once live)
  python3 tools/x-images/make.py call v-bb-florentino-buy # accountability card for ONE published call, straight from data/calls.json (added Sep 15 2026)
  python3 tools/x-images/make.py drawdown               # chase-tier drawdown, Aug-24-inception indices only (matched window), levels + w/w (added Sep 30 2026)
  python3 tools/x-images/make.py all AH26

Output: --out DIR (default: ../Card Hub/x-images/<YYYY-MM-DD>/). Prints paths.
Needs: Pillow, matplotlib, fonttools+brotli (woff2 -> ttf, cached in /tmp/schfonts).
"""
import json, os, sys, math, statistics, datetime, argparse, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "indices.json"
FONTS_SRC = ROOT / "fonts"
FONT_CACHE = pathlib.Path("/tmp/schfonts")

BG, PANEL, CYAN, TXT, DIM, GREEN, RED, GRID = "#07090C", "#0c1017", "#00ccf5", "#e4f0f4", "#7a969e", "#00e07a", "#ff4d6d", "#16202a"
W, H = 1200, 675

# ---------- fonts ----------
def _ttf(name):
    FONT_CACHE.mkdir(exist_ok=True)
    out = FONT_CACHE / f"{name}.ttf"
    if not out.exists():
        from fontTools.ttLib import TTFont
        f = TTFont(FONTS_SRC / f"{name}.woff2"); f.flavor = None; f.save(out)
    return str(out)

from PIL import Image, ImageDraw, ImageFont
def F(name, size): return ImageFont.truetype(_ttf(name), size)
COND9 = lambda s: F("barlow-condensed-900", s)
COND7 = lambda s: F("barlow-condensed-700", s)
BAR4 = lambda s: F("barlow-400", s)
BAR6 = lambda s: F("barlow-600", s)
MONO = lambda s: F("jetbrains-mono-var", s)

# ---------- canvas ----------
def canvas(eyebrow, title, sub=None, tag="//  SET INDICES · SOLD COMPS ONLY"):
    im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im)
    for x in range(0, W, 60): d.line([(x, 0), (x, H)], fill="#0a1218")
    for y in range(0, H, 60): d.line([(0, y), (W, y)], fill="#0a1218")
    d.text((48, 34), "SHOPCARD", font=COND9(26), fill=TXT)
    d.text((48 + d.textlength("SHOPCARD", font=COND9(26)), 34), "HUB", font=COND9(26), fill=CYAN)
    d.text((240, 42), tag, font=MONO(12), fill=DIM)
    d.line([(48, 76), (W - 48, 76)], fill="#0e3a45", width=1)
    d.line([(48, 106), (80, 106)], fill=CYAN, width=2)
    d.text((94, 96), eyebrow.upper(), font=MONO(13), fill=CYAN)
    d.text((48, 118), title.upper(), font=COND9(64), fill=TXT)
    if sub: d.text((48, 190), sub, font=BAR4(20), fill=DIM)
    return im, d

def footer(d, asof, extra=""):
    d.line([(48, H - 52), (W - 48, H - 52)], fill="#0e3a45", width=1)
    d.text((48, H - 40), f"marks as of {asof} · shopcardhub.com/indices  {extra}".strip(), font=MONO(13), fill=DIM)

def money(v): return f"${v:,.0f}" if v >= 100 else f"${v:,.2f}"

def stats(p):
    n = len(p); m = statistics.mean(p); sd = statistics.pstdev(p)
    sk = sum(((x - m) / sd) ** 3 for x in p) / n if sd else 0
    ku = sum(((x - m) / sd) ** 4 for x in p) / n - 3 if sd else 0
    return dict(n=n, mean=m, median=statistics.median(p), sd=sd, skew=sk, kurt=ku, mn=min(p), mx=max(p))

# ---------- cards ----------
def card_inclusion(ix, key, out):
    h = ix["history"]; last, prev = h[-1], h[-2] if len(h) > 1 else h[-1]
    logs = ix.get("divisorLog") or []
    im, d = canvas(f"{key} · inclusion math", ix["name"].replace(" Chase Index", " Index"),
                   "A card enters the basket only when it has a sourced sold comp. The divisor absorbs it so the level never jumps.")
    cols = [("BEFORE", prev), ("AFTER", last)]
    x0 = 48
    for i, (lbl, row) in enumerate(cols):
        x = x0 + i * 560; y = 250
        d.rounded_rectangle([x, y, x + 520, y + 300], 8, fill=PANEL, outline="#16303a")
        d.text((x + 24, y + 18), lbl, font=MONO(13), fill=CYAN)
        d.text((x + 400, y + 18), row["date"], font=MONO(13), fill=DIM)
        rows = [("cards priced", f"{row['priced']}"), ("basket value", money(row["basketValue"])),
                ("divisor", f"{row['divisor']:.4f}"), ("index level", f"{row['level']:.2f}")]
        for j, (a, b) in enumerate(rows):
            yy = y + 62 + j * 56
            d.text((x + 24, yy), a.upper(), font=MONO(14), fill=DIM)
            d.text((x + 496 - d.textlength(b, font=COND7(40)), yy - 8), b, font=COND7(40), fill=TXT if a != "index level" else CYAN)
    cx, cy = W // 2, 400; d.line([(cx - 22, cy), (cx + 18, cy)], fill=CYAN, width=6); d.polygon([(cx + 10, cy - 16), (cx + 30, cy), (cx + 10, cy + 16)], fill=CYAN)
    d.text((48, 574), f"new divisor = old × (basket after ÷ basket before) = {prev['divisor']:.4f} × {last['basketValue']/prev['basketValue']:.4f} = {last['divisor']:.4f}",
           font=MONO(15), fill=TXT)
    footer(d, last["date"], f"· {len(logs)} divisor events logged")
    p = out / f"{key.lower()}-inclusion.png"; im.save(p); return p

def card_skew(ix, key, out):
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    from matplotlib import font_manager as fm
    prices = sorted(x["price"] for x in ix["basket"]); s = stats(prices); asof = ix["history"][-1]["date"]
    under10 = sum(1 for p in prices if p < 10); over = sum(1 for p in prices if p >= 500)
    im, d = canvas(f"{key} · distribution of {s['n']} marks", "Right skew, in one picture",
                   f"{under10} of {s['n']} cards sit under $10. {over} sit above $500. The mean lives where almost no card does.")
    # histogram on log-x
    fp_m = fm.FontProperties(fname=_ttf("jetbrains-mono-var"))
    fig = plt.figure(figsize=(7.6, 3.6), dpi=100, facecolor=PANEL); ax = fig.add_axes([0.07, 0.2, 0.9, 0.74]); ax.set_facecolor(PANEL)
    # powers of two spanning every mark (Oct 5 2026: fixed $1-$2,048 bins dropped TU19's 92 sub-$1 cards and its $2,750 top card)
    import math; lo = 2.0 ** math.floor(math.log2(max(min(prices), 0.01))); hi = 2.0 ** (math.floor(math.log2(max(prices))) + 1)
    bins = [lo * 2 ** i for i in range(int(round(math.log2(hi / lo))) + 1)]
    ax.hist(prices, bins=bins, color=CYAN, alpha=0.85, edgecolor=BG)
    ax.set_xscale("log"); ax.set_xticks([1, 10, 100, 1000]); ax.set_xticklabels(["$1", "$10", "$100", "$1,000"], fontproperties=fp_m, color=DIM, fontsize=9)
    ax.tick_params(axis="y", colors=DIM, labelsize=8); ax.grid(axis="y", color=GRID, lw=0.6)
    for sp in ax.spines.values(): sp.set_color(GRID)
    ax.axvline(s["median"], color=GREEN, lw=2); ax.axvline(s["mean"], color=RED, lw=2)
    ax.text(0.98, 0.93, f"median {money(s['median'])}", color=GREEN, fontproperties=fp_m, fontsize=10, ha="right", transform=ax.transAxes)
    ax.text(0.98, 0.83, f"mean {money(s['mean'])}", color=RED, fontproperties=fp_m, fontsize=10, ha="right", transform=ax.transAxes)
    import io; buf = io.BytesIO(); fig.savefig(buf, format="png", facecolor=PANEL); plt.close(fig); buf.seek(0)
    im.paste(Image.open(buf), (48, 236))
    # stat panel
    x, y = 840, 236; d.rounded_rectangle([x, y, W - 48, y + 360], 8, fill=PANEL, outline="#16303a")
    rows = [("n", f"{s['n']}"), ("mean", money(s["mean"])), ("median", money(s["median"])), ("std dev", money(s["sd"])),
            ("skew", f"{s['skew']:+.2f}"), ("excess kurtosis", f"{s['kurt']:+.1f}"), ("max / median", f"{s['mx']/s['median']:.0f}×")]
    for j, (a, b) in enumerate(rows):
        yy = y + 18 + j * 48
        d.text((x + 20, yy + 6), a.upper(), font=MONO(13), fill=DIM)
        d.text((W - 68 - d.textlength(b, font=COND7(32)), yy - 2), b, font=COND7(32), fill=CYAN if a in ("skew", "excess kurtosis") else TXT)
    footer(d, asof, "· box EV uses the mean; your box gets the median")
    p = out / f"{key.lower()}-skew.png"; im.save(p); return p

def card_levels(idx, out):
    keys = [k for k in ("PB26", "CR26", "AH26", "PRIS25", "DR25") if k in idx]
    asof = max(idx[k]["history"][-1]["date"] for k in keys)
    im, d = canvas("five tickers · base 100.00", "The week's tape", "Level = basket of sold comps ÷ divisor. Inception Aug 24, 2026. Not a call, a measurement.")
    y = 250
    for k in keys:
        ix = idx[k]; h = ix["history"]; lv = h[-1]["level"]; pv = h[-2]["level"] if len(h) > 1 else 100.0
        chg = lv - pv; col = GREEN if chg > 0 else RED if chg < 0 else DIM
        d.rounded_rectangle([48, y, W - 48, y + 66], 6, fill=PANEL, outline="#16303a")
        d.text((70, y + 14), k, font=COND9(36), fill=CYAN)
        d.text((190, y + 22), ix["name"].replace(" Chase Index", ""), font=BAR6(22), fill=TXT)
        d.text((640, y + 30), f"{len(ix['basket'])} cards priced", font=MONO(12), fill=DIM)
        d.text((880 - d.textlength(f"{lv:.2f}", font=COND7(40)), y + 10), f"{lv:.2f}", font=COND7(40), fill=TXT)
        d.text((920, y + 20), f"{chg:+.2f} w/w", font=MONO(18), fill=col)
        # sparkline
        pts = [r["level"] for r in h];
        if len(pts) > 1:
            lo, hi = min(pts), max(pts); rng = (hi - lo) or 1
            xs = [1040 + i * (100 / (len(pts) - 1)) for i in range(len(pts))]
            ys = [y + 52 - (p - lo) / rng * 36 for p in pts]
            d.line(list(zip(xs, ys)), fill=col, width=3)
        y += 76
    footer(d, asof)
    p = out / "levels.png"; im.save(p); return p

def card_movers(ix, key, out):
    b = [x for x in ix["basket"] if x.get("prevPrice")]
    asof = ix["history"][-1]["date"]
    for x in b: x["_chg"] = (x["price"] - x["prevPrice"]) / x["prevPrice"]
    b.sort(key=lambda x: x["_chg"]); losers, gainers = b[:5], b[-5:][::-1]
    im, d = canvas(f"{key} · week over week", ix["name"].replace(" Chase Index", " movers"), f"{len(b)} cards with two dated marks. Sold comps, not asks.")
    for i, (lbl, rows, col) in enumerate((("UP", gainers, GREEN), ("DOWN", losers, RED))):
        x = 48 + i * 560; y = 240
        d.text((x, y), lbl, font=MONO(13), fill=col)
        for j, r in enumerate(rows):
            yy = y + 28 + j * 62
            d.rounded_rectangle([x, yy, x + 540, yy + 54], 6, fill=PANEL, outline="#16303a")
            nm = f"#{r['num']} {r['name']}"; nm = nm if len(nm) < 30 else nm[:29] + "…"
            d.text((x + 16, yy + 8), nm, font=BAR6(20), fill=TXT)
            d.text((x + 16, yy + 32), f"{money(r['prevPrice'])} -> {money(r['price'])}", font=MONO(13), fill=DIM)  # ASCII arrow: the mono woff2 lacks U+2192 (tofu)
            s = f"{r['_chg']*100:+.0f}%"; d.text((x + 524 - d.textlength(s, font=COND7(34)), yy + 8), s, font=COND7(34), fill=col)
    footer(d, asof)
    p = out / f"{key.lower()}-movers.png"; im.save(p); return p

def card_vault(out):
    """Vault pitch card. Rows = REAL live-ask marks from data/card-images.json (engine, dated).
    Never invents prices or shows Mo's costs/quantities (pricing-integrity + corner-data rules)."""
    ci = json.load(open(ROOT / "data" / "card-images.json"))["cards"]
    rows = [(v["label"], v["price"], v["d"]) for v in ci.values() if v.get("price") and v.get("label") and " — " in v["label"]]
    rows.sort(key=lambda r: -r[1]); rows = rows[:5]; asof = max(r[2] for r in rows)
    im, d = canvas("the vault · free, no account", "Your cards. Live comps. One grid.",
                   "Import your COMC CSV, star what you're hunting, and every row links to sold comps and live asks.")
    cols = ["CARD", "LIVE ASK", "AS OF", "TRACK"]; xs = [70, 760, 900, 1060]
    y = 244; d.rounded_rectangle([48, y, W - 48, y + 46 + 52 * len(rows)], 8, fill=PANEL, outline="#16303a")
    for c, x in zip(cols, xs): d.text((x, y + 14), c, font=MONO(12), fill=DIM)
    for j, (nm, pr, dt) in enumerate(rows):
        yy = y + 50 + j * 52
        d.line([(60, yy - 6), (W - 60, yy - 6)], fill="#122028")
        d.text((70, yy + 8), nm if len(nm) < 52 else nm[:51] + "…", font=BAR6(20), fill=TXT)
        d.text((xs[1], yy + 10), money(pr), font=MONO(16), fill=TXT)
        d.text((xs[2], yy + 10), dt, font=MONO(16), fill=DIM)
        d.text((xs[3], yy + 6), "* Track", font=BAR6(18), fill=CYAN)
    d.text((48, 600), "live asks = trimmed median of lowest fixed-price eBay asks, engine-dated · your data stays in your browser", font=MONO(12), fill=DIM)
    footer(d, asof, "· shopcardhub.com/watchlist")
    p = out / "vault.png"; im.save(p); return p

def card_og(idx, out):
    """og/indices.png (1200x630) — the link-preview image for /indices and every index page.
    Replaces the Sep 1 static mock (fabricated 118.42 composite, wrong arrows). Every number
    here is a real level from data/indices.json; no composite because none is published.
    Re-run after each Monday re-mark: python3 tools/x-images/make.py og --out og"""
    keys = [k for k in ("PB26", "CR26", "AH26", "PRIS25", "DR25") if k in idx]
    asof = max(idx[k]["history"][-1]["date"] for k in keys)
    OH = 630
    im = Image.new("RGB", (W, OH), BG); d = ImageDraw.Draw(im)
    for x in range(0, W, 60): d.line([(x, 0), (x, OH)], fill="#0a1218")
    for y in range(0, OH, 60): d.line([(0, y), (W, y)], fill="#0a1218")
    d.text((48, 34), "SHOPCARD", font=COND9(26), fill=TXT)
    d.text((48 + d.textlength("SHOPCARD", font=COND9(26)), 34), "HUB", font=COND9(26), fill=CYAN)
    d.text((240, 42), "//  SPORTS CARD INTELLIGENCE", font=MONO(12), fill=DIM)
    d.line([(48, 76), (W - 48, 76)], fill="#0e3a45", width=1)
    d.line([(48, 106), (80, 106)], fill=CYAN, width=2)
    d.text((94, 96), "LIVE TAPE · SOLD-BASIS · 100 = RELEASE MONTH", font=MONO(13), fill=CYAN)
    d.text((48, 118), "SET", font=COND9(120), fill=TXT)
    d.text((48, 222), "INDICES", font=COND9(120), fill=CYAN)
    d.text((48, 352), "Every set as a ticker. Price-weighted,", font=BAR4(22), fill=DIM)
    d.text((48, 382), "sold-basis. No calls, just the tape.", font=BAR4(22), fill=DIM)
    # ticker panel — real levels, since-inception change, w/w direction
    px, py, pw = 640, 118, W - 48 - 640
    d.rounded_rectangle([px, py, px + pw, py + 66 * len(keys) + 20], 8, fill=PANEL, outline="#16303a")
    for j, k in enumerate(keys):
        h = idx[k]["history"]; lv = h[-1]["level"]; pv = h[-2]["level"] if len(h) > 1 else 100.0
        chg = lv - 100.0; col = GREEN if chg > 0 else RED if chg < 0 else DIM
        wk = GREEN if lv > pv else RED if lv < pv else DIM
        yy = py + 14 + j * 66
        d.polygon([(px + 20, yy + 30), (px + 32, yy + 30), (px + 26, yy + 20 if lv >= pv else yy + 40)], fill=wk)
        d.text((px + 46, yy + 6), k, font=COND9(34), fill=CYAN)
        nm = idx[k]["name"].replace(" Chase Index", "")
        d.text((px + 160, yy + 16), nm, font=BAR6(17), fill=TXT)
        s = f"{lv:.2f}"; d.text((px + pw - 110 - d.textlength(s, font=COND7(34)), yy + 6), s, font=COND7(34), fill=TXT)
        d.text((px + pw - 98, yy + 16), f"{chg:+.1f}%", font=MONO(16), fill=col)
    d.text((px + 20, py + 66 * len(keys) + 30), "% since each set's release month · arrow = week over week", font=MONO(12), fill=DIM)
    d.line([(48, OH - 52), (W - 48, OH - 52)], fill="#0e3a45", width=1)
    d.text((48, OH - 40), f"marks as of {asof} · shopcardhub.com/indices", font=MONO(13), fill=DIM)
    p = out / "indices.png"; im.save(p)
    # Cache-bust (Sep 29 2026): X, Discord and iMessage cache a preview image by URL for days,
    # so a re-marked og/indices.png kept showing old levels under new posts. When the image is
    # written into the site's og/ folder, stamp every page's reference with ?v=<mark date>.
    if out.resolve() == (ROOT / "og").resolve():
        import re
        # v = the day the image was drawn, not the mark date: the Sep 30 2026 rebase redrew it with no new mark
        import datetime as _dt
        v = _dt.date.today().strftime("%Y%m%d")
        for f in ROOT.glob("*.html"):
            t = f.read_text(encoding="utf-8")
            n = re.sub(r"og/indices\.png(\?v=\d+)?", "og/indices.png?v=" + v, t)
            if n != t: f.write_text(n, encoding="utf-8")
    return p

def card_bangers(out):
    """The Tuesday Board tape (STEP 4.25). Every number is parsed off bowman-bangers.html itself —
    rank, name, the price-sub line (SCP raw / engine ask / PSA 10 / context / date) and the callout
    headline — so the image can never show a number the live page doesn't. Added Sep 8 2026."""
    import re, html as _h
    page = open(ROOT / "bowman-bangers.html", encoding="utf8").read()
    strip = lambda t: _h.unescape(re.sub(r"<[^>]+>", "", t)).replace("\u2212", "-").replace("\u2192", "->").replace("\u2014", "-").strip()
    stamp = re.search(r'data-prices-updated="(\d{4}-\d{2}-\d{2})"', page).group(1)
    head = strip(re.search(r'&#9889; <strong>(.*?)</strong>', page, re.S).group(1))
    # A dated "Correction · <date>" block NEWER than the tape column supersedes the column's callout (Sep 21
    # 2026: the image printed "Gonzales takes #4 from Florentino" under a table seating him #3). Same rule as
    # tools/build-x-board.mjs — the two artifacts must never disagree with each other or with the page.
    _MON = {m: i for i, m in enumerate(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], 1)}
    for _cm in re.finditer(r'<div class="section-eyebrow">Correction\s*(?:&middot;|\u00b7)\s*([A-Z][a-z]{2}) (\d{1,2}), (\d{4})</div>\s*<div class="alert-bar"[^>]*>(.*?)</div>', page, re.S):
        _iso = f"{_cm.group(3)}-{_MON[_cm.group(1)]:02d}-{int(_cm.group(2)):02d}"
        if _iso <= stamp: continue
        _seats = re.search(r'seats now read[^.]*\.', strip(_cm.group(4)))
        head = f"Correction ({_cm.group(1)} {_cm.group(2)}): " + (("The " + _seats.group(0)) if _seats else strip(re.search(r'<strong>(.*?)</strong>', _cm.group(4), re.S).group(1)))
    rows = []
    for m in re.finditer(r'<div class="entry-rank">(\d\d)</div>(.*?)<div class="entry-since">', page, re.S):
        rk, blk = m.group(1), m.group(2)
        nm = strip(re.search(r'<div class="entry-title">(.*?)<br>', blk, re.S).group(1))
        sub = strip(re.search(r'<div class="price-sub">(.*?)</div>', blk, re.S).group(1))
        parts = [x.strip() for x in sub.split("\u00b7")]
        # Sep 29 2026: seats print "Sold mark $X" (30-day median of dated sales) — the cell takes the figure only;
        # the basis sits in the column header and the rule line. Legacy "SCP raw" lines still parse.
        raw = next((x for x in parts if x.startswith("Sold mark") or x.startswith("SCP raw")), "")
        raw = re.sub(r"^(Sold mark|SCP raw)\s*", "", raw)
        # A mark that is not the 30-day median (Kim: a 90-day median, no sale inside 30 days) says so under the figure.
        rawnote = "90-day median" if "90-day" in raw else ""
        raw = raw.split(" (")[0].strip()
        if rawnote: raw = raw + "|" + rawnote
        eng = next((x for x in parts if x.startswith("engine")), "").replace("engine ", "")
        psa = next((x for x in parts if x.startswith("PSA 10")), "").replace("PSA 10 ", "")
        ctx = next((x for x in parts[2:] if re.match(r"^[+\-\u2212]\d|^no sale|^unchanged", x)), parts[3] if len(parts) > 4 else "")
        ctx = re.split(r"[;,]|\s-\s", ctx)[0].strip()  # first clause only (em-dash already normalised to "-") — the rest is on the page
        rows.append((rk, nm, raw, eng, psa, ctx))
    rows = rows[:5]
    # The headline may not seat a player at a number the table beside it does not — affirmative seatings only.
    for rk, nm, *_ in rows:
        _sn = re.escape(nm.split()[-1])
        for _mm in re.finditer(rf"(?:#?\b(\d)\s+{_sn}\b|{_sn}\s+(?:takes|to|at|holds|moves to|climbs to|drops to)\s+#(\d))", head):
            _n = int(_mm.group(1) or _mm.group(2))
            if _n != int(rk): raise SystemExit(f"tape headline seats {nm} #{_n} but the table seats him #{int(rk)}: {head!r}")
    dt = datetime.date.fromisoformat(stamp)
    # The ranking rule is READ OFF THE PAGE, never hardcoded. It changed on 2026-09-17, and a baked-in
    # sentence would publish a methodology the page no longer uses. First <p class="section-intro"> is the rule.
    rule_m = re.search(r'<p class="section-intro">(.*?)</p>', page, re.S)
    rule = strip(rule_m.group(1)) if rule_m else ""
    # R20 (Sep 25 2026): the page no longer prints an ask-derived "engine $" mark, so the column and the sentence
    # about it only appear when at least one row still carries one. An empty column is not honesty, it is a hole.
    has_eng = any(r[3] for r in rows)
    sub = (rule + ("  Engine = the same night's eBay ask, labeled, never blended into a sold figure." if has_eng else "")).strip()
    im, d = canvas("the tuesday board · 1st bowman chrome autos", f"The Tuesday Board — {dt.strftime('%b %-d')}",
                   None, tag="//  BOWMAN BANGERS · " + ("SOLD COMPS + LABELED ASKS" if has_eng else "SOLD COMPS ONLY"))
    _sw, _sl, _sc = sub.split(), [], ""
    for _w in _sw:
        _t = (_sc + " " + _w).strip()
        if d.textlength(_t, font=BAR4(17)) > W - 96: _sl.append(_sc); _sc = _w
        else: _sc = _t
    _sl.append(_sc)
    for _i, _ln in enumerate(_sl[:2]): d.text((48, 188 + _i * 22), _ln, font=BAR4(17), fill=DIM)

    def fit(txt, font, width):
        """Ellipsize to fit its column. No cell may ever run into its neighbour."""
        if d.textlength(txt, font=font) <= width: return txt
        while txt and d.textlength(txt + "…", font=font) > width: txt = txt[:-1]
        return (txt.rstrip() + "…") if txt else ""

    if has_eng:
        cols = ["#", "PLAYER", "SOLD MARK", "PSA 10", "ENGINE ASK", "THIS WEEK"]
        xs   = [64, 110, 430, 548, 792, 900]
        wid  = [40, 306, 106, 232, 96, 252]
    else:
        cols = ["#", "PLAYER", "SOLD MARK", "PSA 10", "THIS WEEK"]
        xs   = [64, 110, 430, 548, 900]
        wid  = [40, 306, 106, 336, 252]
    y = 236; d.rounded_rectangle([48, y, W - 48, y + 44 + 50 * len(rows)], 8, fill=PANEL, outline="#16303a")
    for c, x in zip(cols, xs): d.text((x, y + 14), c, font=MONO(12), fill=DIM)
    for j, (rk, nm, raw, eng, psa, ctx) in enumerate(rows):
        yy = y + 48 + j * 50
        d.line([(60, yy - 6), (W - 60, yy - 6)], fill="#122028")
        d.text((xs[0], yy + 6), rk, font=COND9(30), fill=CYAN)
        d.text((xs[1], yy + 10), fit(nm, BAR6(22), wid[1]), font=BAR6(22), fill=TXT)
        if "|" in raw:
            _r, _n = raw.split("|", 1)
            d.text((xs[2], yy + 4), fit(_r, MONO(16), wid[2]), font=MONO(16), fill=TXT)
            d.text((xs[2], yy + 26), fit(_n, MONO(11), wid[2] + 10), font=MONO(11), fill=DIM)
        else:
            d.text((xs[2], yy + 12), fit(raw, MONO(17), wid[2]), font=MONO(17), fill=TXT)
        # The PSA 10 cell carries its own sale count ("$720.00 (1 dated sale, Aug 6 2026)") or says there
        # is none. That count IS the honesty of the figure, so it is never dropped - it wraps to line two.
        if "(" in psa:
            head_, paren = psa.split("(", 1)
            d.text((xs[3], yy + 4), fit(head_.strip(), MONO(16), wid[3]), font=MONO(16), fill=TXT)
            d.text((xs[3], yy + 26), fit("(" + paren.strip(), MONO(11), wid[3]), font=MONO(11), fill=DIM)
        elif psa and not psa.startswith("$"):
            d.text((xs[3], yy + 14), fit(psa, MONO(13), wid[3]), font=MONO(13), fill=DIM)
        else:
            d.text((xs[3], yy + 12), fit(psa, MONO(17), wid[3]), font=MONO(17), fill=TXT)
        if has_eng: d.text((xs[4], yy + 12), fit(eng, MONO(17), wid[4]), font=MONO(17), fill=DIM)
        col = GREEN if ctx.startswith("+") else RED if ctx.startswith("-") or ctx.startswith("−") else DIM
        d.text((xs[-1], yy + 14), fit(ctx, MONO(13), wid[-1]), font=MONO(13), fill=col)
    # headline = the page's own market-check callout, wrapped
    words, lines, cur = head.split(), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if d.textlength(t, font=BAR4(17)) > W - 96: lines.append(cur); cur = w_
        else: cur = t
    lines.append(cur)
    for i, ln in enumerate(lines[:2]): d.text((48, 556 + i * 24), ln, font=BAR4(17), fill=TXT if i == 0 else DIM)
    d.line([(48, H - 52), (W - 48, H - 52)], fill="#0e3a45", width=1)
    d.text((48, H - 40), f"marks as of {stamp} \u00b7 shopcardhub.com/bowman-bangers \u00b7 every call graded at 6 and 12 months", font=MONO(13), fill=DIM)
    p = out / f"bangers-tape-{stamp}.png"; im.save(p)
    # The vendor desk consumes a FIXED path, overwritten every run (claude/lanes/bowman-bangers-tuesday.md).
    # Writing only the dated file is what left og/x/board-latest.png 404 from Sep 8 to Sep 19.
    latest = out / "board-latest.png"; im.save(latest); print(latest)
    return p

def card_call(cid, out):
    """Accountability card for a single published call (STEP 4's draft #1 is always the accountability tweet).
    Every number comes from data/calls.json — the same file /track-record renders — so the image cannot show a
    grade or a price the public Scorecard does not. Never prints an 8-week read as RIGHT/WRONG (grading v3).
    Added Sep 15 2026."""
    calls = json.load(open(ROOT / "data" / "calls.json", encoding="utf8"))["calls"]
    c = next((x for x in calls if x.get("id") == cid), None)
    if c is None: raise SystemExit(f"no call {cid} in data/calls.json")
    entry, read = float(c["entry"]), float(c["read"])
    mv = (read / entry - 1) * 100
    act = str(c.get("action", "")).split("@")[0].strip().upper().replace("WAIT", "PASS")
    who = (c.get("player") or c.get("name") or c.get("card") or cid.replace("v-bb-", "").replace("-", " ")).title()
    im, d = canvas("the scorecard \u00b7 one call, in public", "We said it. Here it is.",
                   "Published calls carry their own number, up or down. First real grade at 6 months, then 12.",
                   tag="//  SHOPCARDHUB SCORECARD · SOLD COMPS ONLY")
    y = 250
    d.rounded_rectangle([48, y, W - 48, y + 300], 8, fill=PANEL, outline="#16303a")
    d.text((80, y + 30), who.upper(), font=COND9(46), fill=TXT)
    sub = str(c.get("readLabel", "") or "")
    if sub.lower().startswith(str(c.get("card", "") or "").lower()[:12]): sub = ""
    d.text((80, y + 92), (sub or str(c.get("card", "")))[:78], font=MONO(14), fill=DIM)
    cells = [("OUR CALL", f"{act} @ ${entry:,.2f}", CYAN), ("CALLED", str(c.get("callDate", "")), TXT),
             ("LATEST SOLD", f"${read:,.2f}", TXT), ("MOVE", f"{mv:+.1f}%", GREEN if mv >= 0 else RED)]
    for i, (k, v, col) in enumerate(cells):
        x = 80 + i * 268
        d.text((x, y + 160), k, font=MONO(13), fill=DIM)
        d.text((x, y + 184), v, font=COND7(40), fill=col)
    # grading clock — never a public RIGHT/WRONG on the 8-week read
    d.text((80, y + 252), "PUBLIC GRADE: EARLY \u00b7 first real grade at +6 months, then +12 \u00b7 the 8-week read is shown, never graded",
           font=MONO(14), fill=DIM)
    d.text((48, 580), f"read {c.get('readDate','')} \u00b7 SportsCardsPro raw sold \u00b7 entry, projection and call date are immutable once published",
           font=BAR4(17), fill=TXT)
    footer(d, c.get("readDate", ""), "\u00b7 shopcardhub.com/track-record")
    p_ = out / f"call-{cid}.png"; im.save(p_); return p_

def card_bcb26(idx, out):
    """BCB26 release-window card. PRE: universe counts + the activation rule, no prices (none exist that the
    site can attribute). LIVE: level, w/w, priced count — same fields as `levels`. Added Sep 8 2026."""
    ix = idx["BCB26"]; uni = ix.get("universe") or []; tabs = {}
    for u in uni: tabs[u.get("tab", "?")] = tabs.get(u.get("tab", "?"), 0) + 1
    live = ix.get("status") == "live" and ix.get("history")
    im, d = canvas("BCB26 · 2026 bowman chrome · per-set index", "The Chrome index" if live else "Streets today. Index armed.",
                   ("Ask basis, labeled on every row, until sold coverage allows a hammer restatement. Not a call, a measurement." if live else
                    "Opens at 100.00 the moment 60% of the chase basket carries a verified ask. Until then: no level, no prices, no guesses."),
                   tag="//  BOWMAN PER-SET INDEX · ASK BASIS, LABELED")
    y = 250
    rows = [("UNIVERSE", f"{len(uni)} cards on the published checklist"),
            ("TABS", f"BASE {tabs.get('base', 0)} · AUTOS {tabs.get('autos', 0)} (15% single-card cap) · PARALLELS later"),
            ("STREET DATE", ix.get("releaseDate", "2026-09-09")),
            ("STATUS", "LIVE" if live else "PRE-ACTIVATION"),
            ("RE-MARKS", "every board-touching run through street +21 days, then weekly")]
    if live:
        h = ix["history"]; lv = h[-1]["level"]
        marked = len([r for r in (ix.get("basket") or []) if r.get("price") is not None])
        total = len(ix.get("basket") or [])
        # at inception there is no prior level to move against — say "inception", never a fake +0.00 w/w
        chg = "inception" if len(h) == 1 else f"{lv - h[-2]['level']:+.2f} w/w"
        rows.insert(0, ("LEVEL", f"{lv:.2f}  ({chg}) · {marked} of {total} basket cards marked"))
    for k, v in rows:
        d.rounded_rectangle([48, y, W - 48, y + 52], 6, fill=PANEL, outline="#16303a")
        d.text((70, y + 18), k, font=MONO(13), fill=CYAN)
        d.text((260, y + 12), v, font=BAR6(22), fill=TXT)
        y += 60
    footer(d, ix["history"][-1]["date"] if live else idx.get("updated", ""), "· shopcardhub.com/bowman-chrome-2026-index")
    p = out / "bcb26.png"; im.save(p); return p

def card_drawdown(idx, out):
    """Chase-tier drawdown, matched window only (added Sep 30 2026, league F shareable).
    Plots only the chase indices that share the Aug 24 inception, so every line covers the same
    dates. Levels straight from data/indices.json history; all baskets are sold comps
    (PriceCharting ungraded). Later-inception indices (e.g. PF25) are left off, never stitched in."""
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    from matplotlib import font_manager as fm
    keys = [k for k in ("PB26", "CR26", "AH26", "DR25", "PRIS25") if k in idx]
    start = min(idx[k]["history"][0]["date"] for k in keys)
    keys = [k for k in keys if idx[k]["history"][0]["date"] == start]
    asof = min(idx[k]["history"][-1]["date"] for k in keys)
    ser = {k: [r for r in idx[k]["history"] if r["date"] <= asof] for k in keys}
    keys.sort(key=lambda k: ser[k][-1]["level"])
    under = sum(1 for k in keys if ser[k][-1]["level"] < 100)
    fmt = lambda s: datetime.date.fromisoformat(s).strftime("%b %-d")
    im, d = canvas(f"pokemon chase indices · {fmt(start)} to {fmt(asof)}, same window",
                   f"{under} of {len(keys)} under 100", f"Every line starts at 100.00 on {fmt(start)}, 2026. Level = basket of sold comps / divisor. A measurement, not a call.")
    COLS = ["#00ccf5", "#ffb020", "#ff5fa2", "#9b8cff", "#7ee0c3"]
    fp_m = fm.FontProperties(fname=_ttf("jetbrains-mono-var"))
    fig = plt.figure(figsize=(6.9, 3.95), dpi=100, facecolor=PANEL); ax = fig.add_axes([0.09, 0.12, 0.88, 0.84]); ax.set_facecolor(PANEL)
    dates = [r["date"] for r in ser[keys[0]]]
    for i, k in enumerate(keys):
        ys = [r["level"] for r in ser[k]]
        ax.plot(range(len(ys)), ys, color=COLS[i], lw=2.6 if i == 0 else 2, marker="o", ms=3.5)
    ax.axhline(100, color=DIM, lw=1, ls=(0, (4, 3)))
    ax.set_xticks(range(len(dates))); ax.set_xticklabels([fmt(x) for x in dates], fontproperties=fp_m, color=DIM, fontsize=9)
    ax.set_yticks([80, 85, 90, 95, 100]); ax.set_yticklabels(["80", "85", "90", "95", "100"], fontproperties=fp_m, color=DIM, fontsize=9)
    ax.set_ylim(79, 103); ax.tick_params(length=0); ax.grid(axis="y", color=GRID, lw=0.6)
    for sp in ax.spines.values(): sp.set_color(GRID)
    import io; buf = io.BytesIO(); fig.savefig(buf, format="png", facecolor=PANEL); plt.close(fig); buf.seek(0)
    im.paste(Image.open(buf), (48, 228))
    x, y = 760, 228; d.rounded_rectangle([x, y, W - 48, y + 395], 8, fill=PANEL, outline="#16303a")
    d.text((x + 20, y + 14), f"LEVEL {fmt(asof).upper()}", font=MONO(12), fill=DIM)
    d.text((x + 220, y + 14), "VS 100", font=MONO(12), fill=DIM); d.text((x + 310, y + 14), "WK PTS", font=MONO(12), fill=DIM)
    for i, k in enumerate(keys):
        h = ser[k]; lv = h[-1]["level"]; wk = lv - h[-2]["level"]; yy = y + 42 + i * 70
        d.rectangle([x + 20, yy + 8, x + 26, yy + 50], fill=COLS[i])
        d.text((x + 38, yy + 2), k, font=COND9(26), fill=TXT)
        d.text((x + 38, yy + 34), idx[k]["name"].replace(" Chase Index", ""), font=BAR4(15), fill=DIM)
        s = f"{lv:.2f}"; d.text((x + 205 - d.textlength(s, font=COND7(28)), yy), s, font=COND7(28), fill=TXT)
        d.text((x + 220, yy + 12), f"{lv - 100:+.1f}%", font=MONO(15), fill=RED if lv < 100 else GREEN)
        d.text((x + 310, yy + 12), f"{wk:+.2f}", font=MONO(15), fill=RED if wk < 0 else GREEN)
    d.line([(48, H - 52), (W - 48, H - 52)], fill="#0e3a45", width=1)
    d.text((48, H - 40), f"marks as of {asof} · source: sold comps, PriceCharting ungraded · WK PTS = change vs {fmt(ser[keys[0]][-2]['date'])} mark · shopcardhub.com/indices", font=MONO(12), fill=DIM)
    p = out / "drawdown.png"; im.save(p); return p


# ---------- release-base cards (Sep 30 2026, the rebase: 100 = each set's release month) ----------
def _bm(ix): return datetime.date.fromisoformat(ix["baseDate"] + "-01").strftime("%b %Y")
def _levels_rows(idx, keys, out, name, eyebrow, title, sub, note):
    asof = max(idx[k]["history"][-1]["date"] for k in keys)
    keys = sorted(keys, key=lambda k: idx[k]["history"][-1]["level"])
    im, d = canvas(eyebrow, title, sub)
    y, rh = 232, min(62, (H - 300) // len(keys))
    hi = max(idx[k]["history"][-1]["level"] for k in keys + []) ; hi = max(hi, 100)
    for k in keys:
        ix = idx[k]; lv = ix["history"][-1]["level"]; col = GREEN if lv >= 100 else RED
        d.rounded_rectangle([48, y, W - 48, y + rh - 8], 6, fill=PANEL, outline="#16303a")
        d.text((66, y + (rh - 8) / 2 - 16), k, font=COND9(30), fill=CYAN)
        d.text((190, y + (rh - 8) / 2 - 12), ix["name"].replace(" Chase Index", "").replace(" Set Index", ""), font=BAR6(20), fill=TXT)
        d.text((500, y + (rh - 8) / 2 - 8), "100 = " + _bm(ix), font=MONO(13), fill=DIM)
        x0, x1 = 700, 1010; bx = x0 + (x1 - x0) * min(lv, hi) / hi; x100 = x0 + (x1 - x0) * 100 / hi
        d.rectangle([x0, y + (rh - 8) / 2 - 7, bx, y + (rh - 8) / 2 + 7], fill=col)
        d.line([(x100, y + 6), (x100, y + rh - 14)], fill=DIM, width=2)
        s = f"{lv:.1f}"; d.text((W - 66 - d.textlength(s, font=COND7(32)), y + (rh - 8) / 2 - 18), s, font=COND7(32), fill=TXT)
        y += rh
    footer(d, asof, note)
    p = out / name; im.save(p); return p

def card_vintage(idx, out):
    keys = [k for k in ("BS99", "JU99", "FO99", "TR00", "NG00", "ND02", "AQ03", "SK03") if k in idx]
    return _levels_rows(idx, keys, out, "vintage.png", "wotc + e-card sets · every card · sold comps",
        "Vintage, from the first reliable month",
        "100 = the first month PriceCharting's ungraded sold history reliably covers each set (2021-22). Line = 100.",
        "· 100 = first reliable month")

def card_chase_release(idx, out):
    keys = [k for k in ("PB26", "CR26", "AH26", "PRIS25", "DR25", "PF25") if k in idx]
    return _levels_rows(idx, keys, out, "chase-release.png", "pokemon chase tiers · sold comps · 100 = release",
        "Every new chase tier is under 100",
        "Each index = the set's chase cards (SIR/IR/UR tier), 100 = its first month of sold data after release. Line = 100.",
        "· 100 = release month")

def card_release_log(idx, out):
    """Whole-set indices from their release month, log scale: reconstructed months dashed, live marks solid."""
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    from matplotlib import font_manager as fm
    from matplotlib.ticker import FixedLocator, NullLocator
    keys = [k for k in ("EVS21", "SV151", "CZ23", "CEL21") if k in idx]
    asof = max(idx[k]["history"][-1]["date"] for k in keys)
    im, d = canvas("whole-set indices · every card · log scale", "From release day to now",
                   "100 = each set's first month of sold data after release. Dashed = rebuilt from monthly sold history; solid = live.")
    COLS = ["#00ccf5", "#ffb020", "#ff5fa2", "#9b8cff"]
    fp_m = fm.FontProperties(fname=_ttf("jetbrains-mono-var"))
    fig = plt.figure(figsize=(7.4, 3.95), dpi=100, facecolor=PANEL); ax = fig.add_axes([0.08, 0.11, 0.9, 0.85]); ax.set_facecolor(PANEL)
    for i, k in enumerate(keys):
        ix = idx[k]
        rc = [(datetime.date.fromisoformat(r["month"] + "-15"), r["level"]) for r in ix.get("recon", [])]
        lv = [(datetime.date.fromisoformat(r["date"]), r["level"]) for r in ix["history"]]
        ax.plot([a for a, _ in rc + lv[:1]], [b for _, b in rc + lv[:1]], color=COLS[i], lw=2, ls=(0, (4, 2)))
        ax.plot([a for a, _ in lv], [b for _, b in lv], color=COLS[i], lw=2.6)
    ax.set_yscale("log"); ax.yaxis.set_major_locator(FixedLocator([25, 50, 100, 200, 400])); ax.yaxis.set_minor_locator(NullLocator())
    ax.set_yticklabels(["25", "50", "100", "200", "400"], fontproperties=fp_m, color=DIM, fontsize=9); ax.set_ylim(28, 300)
    ax.axhline(100, color=DIM, lw=1, ls=(0, (4, 3)))
    for t in ax.get_xticklabels(): t.set_fontproperties(fp_m); t.set_color(DIM); t.set_fontsize(9)
    ax.tick_params(length=0, colors=DIM); ax.grid(axis="y", color=GRID, lw=0.6)
    for sp in ax.spines.values(): sp.set_color(GRID)
    import io; buf = io.BytesIO(); fig.savefig(buf, format="png", facecolor=PANEL); plt.close(fig); buf.seek(0)
    im.paste(Image.open(buf), (48, 228))
    x, y = 810, 228; d.rounded_rectangle([x, y, W - 48, y + 395], 8, fill=PANEL, outline="#16303a")
    d.text((x + 20, y + 14), "SEP 28 LEVEL · LOW", font=MONO(12), fill=DIM)
    for i, k in enumerate(sorted(keys, key=lambda k: -idx[k]["history"][-1]["level"])):
        ix = idx[k]; lv = ix["history"][-1]["level"]; lo = min(ix["recon"], key=lambda r: r["level"]); yy = y + 44 + i * 86
        c = COLS[keys.index(k)]; d.rectangle([x + 20, yy + 6, x + 26, yy + 66], fill=c)
        d.text((x + 38, yy), k, font=COND9(26), fill=TXT)
        d.text((x + 38, yy + 30), ix["name"].replace(" Set Index", "") + " · 100 = " + _bm(ix), font=BAR4(14), fill=DIM)
        d.text((x + 38, yy + 50), f"low {lo['level']:.0f} ({datetime.date.fromisoformat(lo['month'] + '-01').strftime('%b %Y')})", font=MONO(12), fill=DIM)
        s = f"{lv:.1f}"; d.text((W - 66 - d.textlength(s, font=COND7(30)), yy), s, font=COND7(30), fill=GREEN if lv >= 100 else RED)
    footer(d, asof, "· 100 = release month · log scale")
    p = out / "release-log.png"; im.save(p); return p

# ---------- main ----------
if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("kind"); ap.add_argument("ticker", nargs="?"); ap.add_argument("--out")
    a = ap.parse_args(); idx = json.load(open(DATA))
    out = pathlib.Path(a.out) if a.out else (ROOT.parent / "Card Hub" / "x-images" / datetime.date.today().isoformat())
    out.mkdir(parents=True, exist_ok=True)
    k = (a.ticker or "AH26").upper(); ix = idx.get(k)
    done = []
    if a.kind in ("inclusion", "all"): done.append(card_inclusion(ix, k, out))
    if a.kind in ("skew", "all"): done.append(card_skew(ix, k, out))
    if a.kind in ("levels", "all"): done.append(card_levels(idx, out))
    if a.kind in ("movers", "all"): done.append(card_movers(ix, k, out))
    if a.kind in ("vault", "all"): done.append(card_vault(out))
    if a.kind == "og": done.append(card_og(idx, out))
    if a.kind in ("vintage", "release"): done.append(card_vintage(idx, out))
    if a.kind in ("chase-release", "release"): done.append(card_chase_release(idx, out))
    if a.kind in ("release-log", "release"): done.append(card_release_log(idx, out))
    if a.kind == "bangers": done.append(card_bangers(out))
    if a.kind == "bcb26": done.append(card_bcb26(idx, out))
    if a.kind == "call": done.append(card_call(a.ticker, out))
    if a.kind == "drawdown": done.append(card_drawdown(idx, out))
    for p in done: print(p)
