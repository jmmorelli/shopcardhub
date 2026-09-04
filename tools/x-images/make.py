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
  python3 tools/x-images/make.py og --out og              # og/indices.png link preview (1200x630), re-run each Monday
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
def canvas(eyebrow, title, sub=None):
    im = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(im)
    for x in range(0, W, 60): d.line([(x, 0), (x, H)], fill="#0a1218")
    for y in range(0, H, 60): d.line([(0, y), (W, y)], fill="#0a1218")
    d.text((48, 34), "SHOPCARD", font=COND9(26), fill=TXT)
    d.text((48 + d.textlength("SHOPCARD", font=COND9(26)), 34), "HUB", font=COND9(26), fill=CYAN)
    d.text((240, 42), "//  SET INDICES · SOLD COMPS ONLY", font=MONO(12), fill=DIM)
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
    bins = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]
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
            d.text((x + 16, yy + 32), f"{money(r['prevPrice'])} → {money(r['price'])}", font=MONO(13), fill=DIM)
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
    d.text((94, 96), "LIVE TAPE · RE-MARKED WEEKLY · 100.00 BASE", font=MONO(13), fill=CYAN)
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
    d.text((px + 20, py + 66 * len(keys) + 30), "since inception 2026-08-24 · arrow = week over week", font=MONO(12), fill=DIM)
    d.line([(48, OH - 52), (W - 48, OH - 52)], fill="#0e3a45", width=1)
    d.text((48, OH - 40), f"marks as of {asof} · shopcardhub.com/indices", font=MONO(13), fill=DIM)
    p = out / "indices.png"; im.save(p); return p

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
    for p in done: print(p)
