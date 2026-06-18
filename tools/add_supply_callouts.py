#!/usr/bin/env python3
"""
add_supply_callouts.py — Insert an Amazon supply callout into top-traffic guides.

Adds a "what you'll need" section (real shopcardhub-20 Amazon links + a link to
/best-card-supplies) before the Related Reading section on the PSA grading guide and
the best-hobby-boxes page. Idempotent (skips if the callout marker is already present).
Run: python3 tools/add_supply_callouts.py
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "topps-release-watcher"))
import page_builder as pb

REPO = pb.REPO
MARKER = "<!-- SUPPLY-CALLOUT -->"
ANCHOR = '  <section>\n    <div class="section-eyebrow">Related Reading</div>'

def item(tag, name, price, desc, kw):
    return pb.product_item(tag, name, price, "green", desc, "Shop on Amazon", pb.amazon(kw))

def section(eyebrow, h2, intro, items):
    return (f'  {MARKER}\n  <section>\n'
            f'    <div class="section-eyebrow cyan">{eyebrow}</div>\n'
            f'    <h2>{h2}</h2>\n'
            f'    <p class="section-intro">{intro}</p>\n'
            f'    <div class="product-grid">\n      {"".join(items)}\n    </div>\n'
            f'    <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:24px;">\n'
            f'      <a href="/best-card-supplies" class="btn-primary cyan">Full Card Supplies Guide &rarr;</a>\n'
            f'    </div>\n  </section>\n\n')

PSA = section(
    "Before You Submit", "What You'll Need to Grade",
    "PSA wants cards penny-sleeved inside a semi-rigid Card Saver &mdash; not top loaders (those get bounced). Here's the exact stack, with our full supplies breakdown.",
    [item("Step 1", "Penny Sleeves", "~$5 / 100", "Soft, acid-free first layer for every card. No PVC.", "card penny sleeves soft acid free"),
     item("PSA-Ready", "Card Savers I", "~$10 / 50", "The semi-rigid holder PSA asks you to submit in.", "card savers 1 semi rigid psa"),
     item("Ship Safe", "Team Bags", "~$6 / 100", "Resealable sleeves to bag the Card Saver before shipping.", "card team bags resealable 4x6")])

BOXES = section(
    "Before You Rip", "Gear Up Before You Open a Box",
    "Pulled a hit? Protect it the second it's out of the pack. The basics every ripper should have on hand &mdash; full guide linked below.",
    [item("Every Card", "Penny Sleeves", "~$5 / 100", "First layer for the whole box. Buy in bulk.", "card penny sleeves soft acid free"),
     item("Singles", "Top Loaders (3x4)", "~$8 / 25", "Rigid protection for sleeved cards. 35pt base, thicker for patches.", "card top loaders 3x4 35pt"),
     item("Your Hits", "Magnetic One-Touch", "~$15 / 5", "Display-grade UV cases for the keepers.", "magnetic one touch card holder 35pt uv"),
     item("Storage", "500ct Boxes", "~$12 / 3pk", "Sort and store the bulk. Cool, dry, not overstuffed.", "baseball card storage boxes 500 count")])

TARGETS = {"psa-grading-guide.html": PSA, "best-hobby-boxes-2026.html": BOXES}

if __name__ == "__main__":
    for fname, block in TARGETS.items():
        path = os.path.join(REPO, fname)
        html = open(path, encoding="utf-8").read()
        if MARKER in html:
            print(f"{fname}: already has callout — skipped")
            continue
        if ANCHOR not in html:
            print(f"{fname}: ANCHOR not found — SKIPPED (check manually)")
            continue
        html = html.replace(ANCHOR, block + ANCHOR, 1)
        open(path, "w", encoding="utf-8").write(html)
        o, c = html.count("<div"), html.count("</div>")
        print(f"{fname}: callout inserted  div {o}/{c}  {'OK' if o==c else 'MISMATCH'}")
