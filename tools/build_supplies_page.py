#!/usr/bin/env python3
"""
build_supplies_page.py — Build /best-card-supplies (Amazon-monetized supplies guide).

Run:  python3 tools/build_supplies_page.py
Reuses the same design shell as the Topps pages (page_builder). Amazon links use a
PLACEHOLDER Associates tag (AMZN_ASSOC_TAG) — swap once the application is approved.
Nothing is pushed; Mo reviews then pushes.
"""
import os, sys, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "topps-release-watcher"))
import page_builder as pb

REPO = pb.REPO
slug = "best-card-supplies"
AMZ = "<!-- AMAZON AFFILIATE: Associates tag shopcardhub-20 (approved Jun 18, 2026) -->"

meta_block = f'''  <title>Best Sports Card Supplies — Sleeves, Top Loaders, Card Savers & Storage | ShopCardHub</title>
  <meta name="description" content="The card supplies that actually matter: penny sleeves, top loaders, Card Savers for PSA submission, magnetic one-touches, semi-rigid holders, and storage. What to use, when, and where to buy.">
  <meta name="keywords" content="best card supplies, penny sleeves, top loaders, card savers, PSA submission supplies, magnetic one touch, semi rigid card holders, card storage boxes">
  <link rel="canonical" href="https://www.shopcardhub.com/{slug}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="Best Sports Card Supplies — Sleeves, Top Loaders, Card Savers & Storage">
  <meta property="og:description" content="The card supplies that actually matter: penny sleeves, top loaders, Card Savers for PSA submission, magnetic one-touches, semi-rigid holders, and storage.">
  <meta property="og:url" content="https://www.shopcardhub.com/{slug}">
  <meta property="og:site_name" content="ShopCardHub">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@shopcardhub">
  <meta property="og:image" content="https://www.shopcardhub.com/og/default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="628">
  <meta name="twitter:image" content="https://www.shopcardhub.com/og/default.png">
  <meta name='impact-site-verification' value='74b130d5-209e-4785-b837-d16afbf60555'>
  <meta name='impact-site-verification' value='b16c5bca-431e-4f3c-be15-6c3a1006e379'>
  <script type="application/ld+json">
  {{"@context":"https://schema.org","@type":"Article","headline":"Best Sports Card Supplies","url":"https://www.shopcardhub.com/{slug}","publisher":{{"@type":"Organization","name":"ShopCardHub","url":"https://www.shopcardhub.com"}},"datePublished":"2026-06-18","dateModified":"2026-06-18"}}
  </script>'''

def amz_item(tag, name, price, desc, kw):
    return pb.product_item(tag, name, price, "green", desc, "Shop on Amazon", pb.amazon(kw))

body = f'''<section class="hero" style="border-top:none; padding-bottom:0;">
  <div class="container">
    <div class="hero-eyebrow">Guide &middot; Supplies &middot; Protect Your Cards</div>
    <h1>Best Sports Card<br><em>Supplies</em></h1>
    <p class="hero-sub">The gear that actually matters &mdash; the sleeves, holders, and storage that keep a raw card grade-ready, and the exact Card Savers PSA wants for submission. No clutter, just what to use, when to use it, and where to buy it.</p>
    <div class="hero-meta"><span>Penny sleeves &rarr; one-touches</span><span>&#9989; PSA-submission ready</span><span>Updated June 2026</span></div>
  </div>
</section>
  <div class="container">
  <div class="alert-bar" style="margin-top:48px;">
    &#128161; <strong>How to use this page.</strong> Match the supply to the card's value: penny sleeve + top loader for the bulk, semi-rigid Card Savers for anything heading to PSA, one-touches for the keepers. Links go to Amazon. {AMZ}
  </div>

  <section style="border-top:none; padding-top:20px; padding-bottom:0;">
    <div class="set-banner">
      <div class="entry-tag cyan" style="margin-bottom:8px;">&#129521; Supplies &middot; By Use Case</div>
      <h2 style="margin-bottom:4px;">The Protection Ladder</h2>
      <p style="font-size:15px; color:var(--text-dim); margin-bottom:0;">Every card sits somewhere on a ladder &mdash; from $0.50 commons that just need a sleeve, to grade-worthy hits that need a one-touch. Buy to the card, not above it.</p>
      <div class="set-banner-grid">
        {pb.banner_stat("Bulk / Commons", "Penny Sleeve + Toploader")}
        {pb.banner_stat("PSA Submission", "Card Saver I", "gold")}
        {pb.banner_stat("Keepers / Hits", "Magnetic One-Touch", "green")}
        {pb.banner_stat("Raw Storage", "500ct + Team Bags")}
        {pb.banner_stat("Golden Rule", "Sleeve before toploader", "cyan")}
        {pb.banner_stat("Never Use", "PVC / soft PVC sleeves", "red")}
      </div>
    </div>
  </section>

  <section>
    <div class="section-eyebrow cyan">The Essentials</div>
    <h2>Supplies That Actually Matter</h2>
    <p class="section-intro">Six things cover 95% of what any collector needs. Approximate prices move with Amazon &mdash; tap through for live pricing. Buy quantity on the cheap stuff; don't cheap out on anything touching a card you'd grade.</p>
    <div class="product-grid">
      {amz_item("Step 1 &middot; Every Card", "Penny Sleeves", "~$5 / 100", "The first layer for literally every card. Soft polypropylene, acid-free, no PVC. Buy in bulk &mdash; you will always use more than you think.", "Ultra Pro penny sleeves trading cards 100 count")}
      {amz_item("Step 2 &middot; Rigid Protection", "Top Loaders (3x4)", "~$8 / 25", "Rigid PVC holders for sleeved cards. The workhorse for shipping, storing, and showing singles. Standard 35pt for base; thicker (55&ndash;130pt) for jersey/patch cards.", "Ultra Pro top loaders 3x4 35pt trading card")}
      {amz_item("For Grading &middot; PSA", "Card Savers I", "~$10 / 50", "Semi-rigid holders &mdash; <strong>this is what PSA asks you to submit cards in</strong>, not top loaders. Flexible enough to insert/remove safely. Essential if you're grading.", "Cardboard Gold Card Saver 1 semi rigid PSA")}
      {amz_item("Keepers &middot; Display", "Magnetic One-Touch", "~$15 / 5", "Premium magnetic-close acrylic cases for your best raw cards and hits. UV-protective, display-grade. Match the point size to the card (35pt base, 75&ndash;180pt for thick).", "Ultra Pro one touch magnetic card holder 35pt")}
      {amz_item("Submission &middot; Safety", "Semi-Rigid + Team Bags", "~$6 / 100", "Resealable sleeves to bag a sleeved-and-saved card before shipping or submitting &mdash; keeps the Card Saver closed and dust out. Cheap insurance.", "BCW resealable team bags trading cards")}
      {amz_item("Storage &middot; Bulk", "Cardboard Storage Boxes", "~$12 / 3-pack", "500ct / 800ct boxes for raw bulk and sets. Label by sport/year. Keep them somewhere cool and dry &mdash; humidity warps cardboard and chrome.", "BCW trading card storage box 800 count")}
    </div>
  </section>

  <section>
    <div class="section-eyebrow cyan">Grading Tie-In</div>
    <h2>The PSA Submission Kit</h2>
    <div class="mechanic-block">
      <h3>Sending Cards to PSA? Here's the Exact Stack</h3>
      <p>PSA wants cards <strong>penny-sleeved, then in a semi-rigid Card Saver I</strong> &mdash; not in top loaders or one-touches (they reject those and slow your order). Bag the lot in team bags, fill out the submission online, and ship. Get the supplies right and your order processes faster.</p>
      <div class="rule-callout pb-rule"><strong>Stack:</strong> Penny Sleeve &rarr; Card Saver I &rarr; Team Bag &rarr; bubble mailer. That's it.</div>
    </div>
    <div style="display:flex; gap:12px; flex-wrap:wrap; margin:24px 0 0;">
      <a href="/psa-grading-guide" class="btn-primary cyan">Read the PSA Grading Guide &rarr;</a>
      <a href="/hobby-box-roi-calculator" class="btn-secondary">Is Grading Worth It? Run the Math</a>
    </div>
  </section>

  <section>
    <div class="section-eyebrow cyan">Avoid</div>
    <h2>Supply Mistakes That Cost You</h2>
    <div class="avoid-list">
      {pb.avoid_item("<strong>PVC / &ldquo;soft PVC&rdquo; sleeves</strong> &mdash; they off-gas and damage card surfaces over time. Use polypropylene/acid-free only. This is the #1 way collectors quietly ruin cards.")}
      {pb.avoid_item("<strong>Top loaders for PSA submission</strong> &mdash; PSA wants Card Savers. Submitting in top loaders gets cards bounced and slows your turnaround.")}
      {pb.avoid_item("<strong>Forcing a thick card into a 35pt holder</strong> &mdash; jersey/patch/relic cards need 55&ndash;130pt+. Jamming them dings corners.")}
      {pb.avoid_item("<strong>Overstuffing storage boxes</strong> &mdash; tight-packed cards get edge wear every time you flip through. Leave room.")}
      {pb.avoid_item("<strong>Cheap no-name one-touches</strong> on real hits &mdash; weak magnets pop open and some aren't truly UV. For keepers, buy a known brand.")}
    </div>
  </section>

''' + f'''  <div class="social-strip">
    <div><h3>Protect Before You Profit</h3><p>Supply tips, grading math, and live card deals &mdash; no fluff.</p></div>
    <a href="https://twitter.com/shopcardhub" target="_blank" rel="noopener" class="btn-twitter">@shopcardhub on X &rarr;</a>
  </div>
  <section>
    <div class="section-eyebrow cyan">Keep Going</div>
    <h2>Related Guides</h2>
    <div class="related-grid">
      {pb.related_card("/psa-grading-guide", "Grading", "PSA Grading Guide 2026")}
      {pb.related_card("/hobby-box-roi-calculator", "Free Tool", "Hobby Box ROI Calculator")}
      {pb.related_card("/best-hobby-boxes-2026", "What to Rip", "Best Hobby Boxes 2026")}
      {pb.related_card("/best-baseball-cards-under-50", "Budget Buys", "Best Baseball Cards Under $50")}
      {pb.related_card("/blog", "All Guides", "The Hub")}
      {pb.related_card(pb.COMC, "Inventory", "Browse Our COMC Store", sponsored=True)}
    </div>
  </section>
  </div>
'''

if __name__ == "__main__":
    shell = pb.load_shell()
    html = pb.render_page(meta_block, body, shell)
    out = os.path.join(REPO, f"{slug}.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    opens, closes = html.count("<div"), html.count("</div>")
    print(f"wrote {slug}.html  {len(html)} bytes  div {opens}/{closes}  {'OK' if opens==closes else 'MISMATCH'}")
    # sitemap
    sm = os.path.join(REPO, "sitemap.xml")
    xml = open(sm, encoding="utf-8").read()
    loc = f"https://www.shopcardhub.com/{slug}"
    if loc not in xml:
        entry = (f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{datetime.date.today().isoformat()}</lastmod>\n"
                 f"    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n")
        open(sm, "w", encoding="utf-8").write(xml.replace("</urlset>", entry + "</urlset>"))
        print("sitemap: added", slug)
    else:
        print("sitemap: already present")
