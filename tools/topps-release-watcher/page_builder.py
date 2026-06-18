#!/usr/bin/env python3
"""
page_builder.py — ShopCardHub page generator (skeleton method).

Extracts the VERBATIM design shell (fonts + <style> + GA, the <nav>/mobile drawer,
and the <footer>/scripts) from a canonical template page, then renders a new page by
injecting page-specific <head> meta and body HTML into that shell. This guarantees
every generated page inherits the exact site design system with zero CSS drift.

Used by:
  - generate_release_pages.py  (builds full set-guide pages from content.py)
  - topps_release_watcher.py    (scaffolds draft stubs for newly-detected releases)
"""
import os, re
from urllib.parse import quote_plus

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_TEMPLATE = os.path.join(REPO, "topps-series-1-2026.html")

# ── Affiliate constants (verbatim from SESSION_NOTES) ────────────────────────
EBAY_BIN = "&LH_BIN=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339155990&toolid=10001"
COMC = "https://comc.com/Users/DBCooper"

def ebay(keywords, customid):
    return (f"https://www.ebay.com/sch/i.html?_nkw={quote_plus(keywords)}"
            f"{EBAY_BIN}&customid={customid}")

# Amazon Associates store ID (approved Jun 18, 2026).
AMAZON_TAG = "shopcardhub-20"
def amazon(keywords):
    return f"https://www.amazon.com/s?k={quote_plus(keywords)}&tag={AMAZON_TAG}"

# ── New release links to weave into the nav across the whole site ────────────
# (topps slug-ish key -> (our_href, nav_label, mobile_label_with_emoji, sport))
NEW_RELEASES = [
    ("topps-chrome-baseball-2026",         "Topps Chrome Baseball",   "⚾ Topps Chrome Baseball",   "baseball"),
    ("topps-inception-baseball",           "Topps Inception",         "⚾ Topps Inception",         "baseball"),
    ("topps-cosmic-chrome-football",       "Cosmic Chrome Football",  "🏈 Cosmic Chrome Football", "football"),
    ("topps-chrome-cactus-jack-basketball","Chrome Cactus Jack",      "🏀 Chrome Cactus Jack",     "basketball"),
]

# ── Shell extraction ─────────────────────────────────────────────────────────
def _slice(text, start_marker, end_marker, include_end=False):
    i = text.index(start_marker)
    j = text.index(end_marker, i)
    return text[i:(j + len(end_marker)) if include_end else j]

def load_shell(template_path=DEFAULT_TEMPLATE):
    with open(template_path, encoding="utf-8") as f:
        t = f.read()
    head_common = _slice(t, '<link rel="preconnect" href="https://fonts.googleapis.com">',
                         '</head>', include_end=True)
    nav_block = _slice(t, '<nav class="nav">', '<section class="hero"')
    footer_block = _slice(t, '<footer>', '</html>', include_end=True)
    return {"head_common": head_common,
            "nav": inject_nav(nav_block),
            "footer": footer_block}

# ── Nav injection (idempotent) ───────────────────────────────────────────────
def inject_nav(nav):
    def after(anchor, *new_lines, indent="          "):
        nonlocal nav
        if anchor not in nav:
            return
        add = "".join(l for l in new_lines if l.strip('\n ') not in nav)
        if add:
            nav = nav.replace(anchor, anchor + add, 1)

    # Desktop — Baseball > Set Guides (after Bowman Sapphire)
    after('<a href="/bowman-sapphire-2026">Bowman Sapphire</a>',
          '\n          <a href="/topps-chrome-baseball-2026">Topps Chrome Baseball</a>',
          '\n          <a href="/topps-inception-baseball">Topps Inception</a>')
    # Desktop — Basketball > NBA 2026 (after Topps Chrome Basketball)
    after('<a href="/topps-chrome-basketball-2026">Topps Chrome Basketball</a>',
          '\n          <a href="/topps-chrome-cactus-jack-basketball">Chrome Cactus Jack</a>')
    # Desktop — Football: add a Set Guides subsection (after Best Cards Under $50)
    after('<a href="/best-football-cards-under-50">Best Cards Under $50</a>',
          '\n          <hr>\n          <div class="dd-label">Set Guides</div>'
          '\n          <a href="/topps-cosmic-chrome-football">Cosmic Chrome Football</a>')

    # Mobile drawer
    after('<a href="/bowman-sapphire-2026">⚾ Bowman Sapphire</a>',
          '\n  <a href="/topps-chrome-baseball-2026">⚾ Topps Chrome Baseball</a>'
          '\n  <a href="/topps-inception-baseball">⚾ Topps Inception</a>', indent="  ")
    after('<a href="/topps-chrome-basketball-2026">🏀 Topps Chrome Basketball</a>',
          '\n  <a href="/topps-chrome-cactus-jack-basketball">🏀 Chrome Cactus Jack</a>', indent="  ")
    after('<a href="/best-football-cards-under-50">🏈 Best Cards Under $50</a>',
          '\n  <a href="/topps-cosmic-chrome-football">🏈 Cosmic Chrome Football</a>', indent="  ")

    # ── "Grading" → "Grading & Supplies" ──────────────────────────────────────
    # Mobile FIRST: before the desktop rename, "PSA Grading Guide" is mobile-only,
    # so this targets the drawer link (not the desktop dropdown we add below).
    if '<a href="/best-card-supplies">Card Supplies Guide</a>' not in nav:
        nav = nav.replace(
            '<a href="/psa-grading-guide">PSA Grading Guide</a>',
            '<a href="/psa-grading-guide">PSA Grading Guide</a>'
            '\n  <a href="/best-card-supplies">Card Supplies Guide</a>', 1)
    # Desktop: convert the single "Grading" nav-item into a dropdown. The
    # <div class="nav-item"> wrapper means this never touches the footer "Grading" link.
    nav = re.sub(
        r'<div class="nav-item">\s*<a href="/psa-grading-guide">Grading</a>\s*</div>',
        ('<div class="nav-item">\n'
         '        <a href="/psa-grading-guide">Grading &amp; Supplies <span class="chevron">▾</span></a>\n'
         '        <div class="nav-dropdown">\n'
         '          <div class="dd-label">Grading &amp; Supplies</div>\n'
         '          <a href="/psa-grading-guide">PSA Grading Guide</a>\n'
         '          <a href="/best-card-supplies">Best Card Supplies</a>\n'
         '        </div>\n'
         '      </div>'),
        nav, count=1)
    return nav

# ── Render ───────────────────────────────────────────────────────────────────
def render_page(meta_block, body_html, shell):
    return (
        "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n"
        "  <meta charset=\"UTF-8\">\n"
        "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
        "  <link rel=\"icon\" type=\"image/svg+xml\" href=\"/favicon.svg\">\n"
        f"{meta_block}\n"
        "  " + shell["head_common"] + "\n"
        "</head>\n<body>\n\n"
        + shell["nav"] + "\n"
        + body_html + "\n\n"
        + shell["footer"] + "\n"
    )

# ── Small content helpers (keep page data concise + consistent) ──────────────
def banner_stat(label, value, cls=""):
    c = f" {cls}" if cls else ""
    return (f'<div class="banner-stat"><div class="banner-stat-label">{label}</div>'
            f'<div class="banner-stat-value{c}">{value}</div></div>')

def rarity_item(label, name, count, cls=""):
    c = f" {cls}" if cls else ""
    return (f'<div class="rarity-item"><div class="rarity-label{c}">{label}</div>'
            f'<div class="rarity-name">{name}</div>'
            f'<div class="rarity-count">{count}</div></div>')

def chase_row(name, sub, price, why, verdict, vclass, kw, customid):
    return (
        f'<tr><td><span class="roi-name">{name}</span><span class="roi-sub">{sub}</span></td>'
        f'<td><span class="roi-price">{price}</span></td>'
        f'<td><span class="roi-sub">{why}</span></td>'
        f'<td><span class="verdict-tag {vclass}">{verdict}</span></td>'
        f'<td><a href="{ebay(kw, customid)}" target="_blank" rel="noopener sponsored" '
        f'class="roi-sub" style="color:var(--accent);white-space:nowrap;">eBay &rarr;</a></td></tr>')

def product_item(tag, name, price, price_cls, desc, link_text, link, cls=""):
    pc = f" {price_cls}" if price_cls else ""
    extra = f" {cls}" if cls else ""
    return (
        f'<div class="product-item{extra}"><div class="product-tag">{tag}</div>'
        f'<div class="product-name">{name}</div>'
        f'<div class="product-price{pc}">{price}</div>'
        f'<div class="product-desc">{desc}</div>'
        f'<a href="{link}" class="product-link" target="_blank" rel="noopener sponsored">{link_text} &rarr;</a></div>')

def watch_item(level, tag, name, body):
    return (f'<div class="watch-item {level}"><div class="watch-tag {level}">{tag}</div>'
            f'<div class="watch-name">{name}</div>'
            f'<div class="watch-body">{body}</div></div>')

def avoid_item(body):
    return f'<div class="avoid-item"><span class="x">&#10007;</span><div>{body}</div></div>'

def related_card(href, eyebrow, title, sponsored=False):
    rel = ' target="_blank" rel="noopener sponsored"' if sponsored else ''
    return (f'<a href="{href}"{rel} class="related-card">'
            f'<div class="section-eyebrow">{eyebrow}</div>'
            f'<h3 style="font-family:var(--fd); color:var(--text-head);">{title}</h3></a>')
