#!/usr/bin/env python3
"""
content_soccer_jul06.py — 5 STAGED soccer player pages (Haaland, Mbappé, Kane, Ronaldo, Messi),
built Jul 6 2026 in the exact structure of lamine-yamal-rookie-cards.html
(hero → ranked card-entry blocks → Market Ceiling trophy banner → avoid list → social strip
→ supply callout → related reading → disclosure). Output: drafts/ready/ via build_soccer_jul06.py.

Sources (Jul 6, 2026):
  • Yahoo Sports / Goldin 2026 Global Football Auction (ended Jun 14-15):
    Haaland 2019-20 Chrome Bundesliga Auto Superfractor $610,000 (his record; prev $432K in 2021);
    Haaland 2019-20 Chrome UCL SuperFractor #74 RC 1/1 $226,920; Messi 2024-25 Donruss Kaboom!
    Gold /10 $212,280; Ronaldo 2021-22 Prizm PL Gold Power 1/1 $152,501; Pelé '58 $976K context.
  • ESPN: Messi 2004-05 Megacracks #71 (MBA Diamond, PSA 10) private sale $1.5M record;
    Goldin-brokered $1.1M PSA 10; PSA pop 838 total / 20 PSA 10s (#71), ~620 / 19 (#71BIS).
  • Sports Card Investor / eBay: Ronaldo 2002-03 Mega Craques #137 PSA 9 sold $50,000 (Feb 2026);
    PSA 5 ~$8,700.
  • Beckett / Cardboard Connection: Mbappé — 2016-17 Panini Foot sticker = earliest issue;
    2017-18 Topps Chrome UCL base PSA 10 ~$400-500; 2017-18 Select base PSA 10 ~$800-900
    (pop 103 PSA 10 / 291 graded); 2018 Prizm World Cup #80 PSA 10 ~$494 (30-day avg).
  • SCI / Topps Ripped: Kane rookie sticker PSA 10 last sale ~$1,439 (pop 14);
    Kane UCL Chrome debut SuperFractor $6,300 (Jan 2025).
"""
from content_jul2026 import meta

EBAY = "&LH_BIN=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339155990&toolid=10001"
EBAY_SOLD = "&LH_Sold=1&LH_Complete=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339155990&toolid=10001"

def _ebay(kw, cid, sold=False):
    from urllib.parse import quote_plus
    params = EBAY_SOLD if sold else EBAY
    return f"https://www.ebay.com/sch/i.html?_nkw={quote_plus(kw)}{params}&customid={cid}"

def _entry(rank, cls, tag, title, price_label, price_main, price_sub, stats, body, verdict, verdict_watch, kw, cid):
    stat_html = "".join(
        f'<div class="entry-stat"><div class="entry-stat-label">{l}</div><div class="entry-stat-value{(" " + c) if c else ""}">{v}</div></div>'
        for (l, v, c) in stats)
    vcls = "entry-verdict watch" if verdict_watch else "entry-verdict"
    ecls = f"card-entry {cls}".strip()
    return f'''
    <div class="{ecls}">
      <div class="entry-rank">0{rank}</div>
      <div class="entry-header">
        <div>
          <div class="entry-sport-tag">{tag}</div>
          <div class="entry-title">{title}</div>
        </div>
        <div class="entry-price-block">
          <div class="price-label">{price_label}</div>
          <div class="price-main">{price_main}</div>
          <div class="price-sub">{price_sub}</div>
        </div>
      </div>
      <div class="entry-stats">
        {stat_html}
      </div>
      <div class="entry-body">{body}</div>
      <div class="{vcls}"><strong>{verdict}</strong></div>
      <div class="entry-ctas">
        <a href="{_ebay(kw, cid)}" class="btn-primary" target="_blank" rel="noopener">Buy on eBay &rarr;</a>
        <a href="{_ebay(kw, cid, sold=True)}" class="btn-secondary" target="_blank" rel="noopener">eBay Sold Comps &rarr;</a>
      </div>
    </div>
'''

SUPPLY_CALLOUT = '''  <!-- SUPPLY-CALLOUT -->
  <section>
    <div class="section-eyebrow cyan">Protect Your Singles</div>
    <h2>Gear for the Cards You Just Bought</h2>
    <p class="section-intro">A raw card lives or dies on its corners and surface. Penny-sleeve it, top-load it, and put the keepers in a one-touch &mdash; pennies of protection on cards worth far more. Full breakdown below.</p>
    <div class="product-grid">
      <div class="product-item"><div class="product-tag">Every Card</div><div class="product-name">Penny Sleeves</div><div class="product-price green">~$5 / 100</div><div class="product-desc">Soft, acid-free first layer for every single. No PVC.</div><a href="https://www.amazon.com/s?k=Ultra+Pro+penny+sleeves+trading+cards+100+count&tag=shopcardhub-20" class="product-link" target="_blank" rel="noopener sponsored">Shop on Amazon &rarr;</a></div><div class="product-item"><div class="product-tag">Singles</div><div class="product-name">Top Loaders (3x4)</div><div class="product-price green">~$8 / 25</div><div class="product-desc">Rigid protection for sleeved cards. 35pt base.</div><a href="https://www.amazon.com/s?k=Ultra+Pro+top+loaders+3x4+35pt+trading+card&tag=shopcardhub-20" class="product-link" target="_blank" rel="noopener sponsored">Shop on Amazon &rarr;</a></div><div class="product-item"><div class="product-tag">The Keepers</div><div class="product-name">Magnetic One-Touch</div><div class="product-price green">~$15 / 5</div><div class="product-desc">Display-grade UV cases for the cards you'll hold.</div><a href="https://www.amazon.com/s?k=Ultra+Pro+one+touch+magnetic+card+holder+35pt&tag=shopcardhub-20" class="product-link" target="_blank" rel="noopener sponsored">Shop on Amazon &rarr;</a></div>
    </div>
    <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:24px;">
      <a href="/best-card-supplies" class="btn-primary cyan">Full Card Supplies Guide &rarr;</a>
    </div>
  </section>
'''

def _related(first_name):
    return f'''  <section>
    <div class="section-eyebrow">Related Reading</div>
    <h2>More From ShopCardHub</h2>
    <div class="related-grid">
      <div class="related-card">
        <div class="related-tag">World Cup 2026</div>
        <div class="related-title">FIFA World Cup 2026 Soccer Cards</div>
        <div class="related-desc">The tournament chase &mdash; top players, key rookies, and which 2026 World Cup cards to target.</div>
        <a href="/world-cup-2026-soccer-cards" class="related-link">Read Guide &rarr;</a>
      </div>
      <div class="related-card">
        <div class="related-tag">Young Phenom</div>
        <div class="related-title">Lamine Yamal Rookie Cards</div>
        <div class="related-desc">The other end of the soccer market &mdash; the teenage star whose record sale has already hit ~$220K.</div>
        <a href="/lamine-yamal-rookie-cards" class="related-link">Read Guide &rarr;</a>
      </div>
      <div class="related-card">
        <div class="related-tag">Grading</div>
        <div class="related-title">PSA Grading Guide 2026</div>
        <div class="related-desc">Centering makes or breaks the grade. Whether to submit {first_name} cards and which service tier makes sense.</div>
        <a href="/psa-grading-guide" class="related-link">Read Guide &rarr;</a>
      </div>
      <div class="related-card">
        <div class="related-tag">Inventory</div>
        <div class="related-title">Browse Our COMC Store</div>
        <div class="related-desc">Hand-picked soccer singles, rookies, and parallels &mdash; no box variance, just the cards you want.</div>
        <a href="https://comc.com/Users/DBCooper" class="related-link" target="_blank" rel="noopener sponsored">Read Guide &rarr;</a>
      </div>
    </div>
  </section>
'''

DISCLOSURE = '''  <div class="disclosure" style="margin-bottom:48px;">
    <strong>Affiliate Disclosure:</strong> ShopCardHub earns commissions when you buy through links on this page (eBay Partner Network 3&ndash;4%, Amazon Associates). Headline figures are <strong>attributed public auction/private sales</strong>; raw and graded prices move daily &mdash; always verify live eBay sold comps before buying. Not financial advice.
  </div>
'''

def render_player(p):
    slug = p["slug"]; cid = slug
    m = meta(p["title"], p["desc"], slug, p["keywords"])
    entries_html = "".join(
        _entry(i + 1, e["cls"], e["tag"], e["title"], e["price_label"], e["price_main"],
               e["price_sub"], e["stats"], e["body"], e["verdict"], e.get("watch", False),
               e["kw"], cid)
        for i, e in enumerate(p["entries"]))
    trophy_stats = "".join(
        f'<div class="banner-stat"><div class="banner-stat-label">{l}</div><div class="banner-stat-value{(" " + c) if c else ""}">{v}</div></div>'
        for (l, v, c) in p["trophy_stats"])
    avoid_html = "".join(
        f'<div class="avoid-item"><span class="x">&#10007;</span><div>{a}</div></div>' for a in p["avoid"])
    meta_spans = "".join(f"<span>{s}</span>\n      " for s in p["hero_meta"])

    body = f'''<section class="hero" style="border-top:none; padding-bottom:0;">
  <div class="container">
    <div class="hero-eyebrow">{p["eyebrow"]}</div>
    <h1>{p["h1a"]}<br><em>{p["h1b"]}</em></h1>
    <p class="hero-sub">{p["hero_sub"]}</p>
    <div class="hero-meta">
      {meta_spans}</div>
  </div>
</section>

<div class="container">


  <section style="border-top:none; padding-top:0;">
    <div class="section-eyebrow">Ranked by ROI</div>
    <h2>{p["ranked_h2"]}</h2>
    <p class="section-intro">{p["intro"]}</p>
{entries_html}
  </section>

  <section>
    <div class="section-eyebrow" style="color:var(--gold);">Market Ceiling</div>
    <h2>The Trophy Tier &mdash; Context, Not Checkout</h2>
    <p class="section-intro">{p["trophy_intro"]}</p>
    <div class="set-banner" style="border-left:3px solid var(--gold);">
      <div class="set-banner-grid">
        {trophy_stats}
      </div>
      <p style="font-size:14px; color:var(--text-dim); margin:14px 0 0;">No buy links here on purpose &mdash; these are auction/private results, not shopping targets. They mark where the top of the market sits and anchor the value of the attainable cards above. <em>Trophy-tier results as of Jul 6, 2026.</em></p>
    </div>
  </section>

  <section>
    <div class="section-eyebrow">Cards to Avoid</div>
    <h2>{p["avoid_h2"]}</h2>
    <div class="avoid-list">
      {avoid_html}
    </div>
  </section>
  <div class="social-strip">
    <div><h3>{p["h1a"]} Price Alerts</h3><p>{p["social"]}</p></div>
    <a href="https://twitter.com/shopcardhub" class="btn-twitter" target="_blank" rel="noopener">Follow @shopcardhub</a>
  </div>
{SUPPLY_CALLOUT}
{_related(p["first"])}
{DISCLOSURE}
</div>
'''
    return slug, m, body


# ═══════════════════════════════ PLAYER DATA ═══════════════════════════════

HAALAND = dict(
    slug="erling-haaland-rookie-cards", first="Haaland",
    title="Erling Haaland Rookie Cards — Best Cards, Prices & Where to Buy (2026)",
    desc="Erling Haaland rookie card guide: 2019-20 Topps Chrome UCL #74 RC, refractors, Sapphire, Bundesliga Chrome, the $610K record auto Superfractor and $226.9K RC SuperFractor sales. Ranked by ROI with live eBay sold comps.",
    keywords="Erling Haaland rookie cards, Haaland Topps Chrome UCL, Haaland RC 74, Haaland Sapphire, Haaland Superfractor, Haaland World Cup 2026",
    eyebrow="&#9917; Soccer Cards &middot; Manchester City &middot; Norway",
    h1a="Erling Haaland", h1b="Rookie Cards Guide",
    hero_sub="The most explosive scorer of his generation is finally on the World Cup stage &mdash; he announced himself with a brace in his tournament debut, and the Goldin June auction just set his all-time record: <strong>$610,000</strong> for the 2019-20 Chrome Bundesliga auto Superfractor. Every key Haaland rookie card ranked by ROI, liquidity, and upside, with live eBay sold comps.",
    hero_meta=["&#9679; Prices as of Jul 6, 2026", "&#9917; 5 Cards Ranked", "&#128202; ROI Analysis", "&#128176; eBay Sold Comps"],
    ranked_h2="The 5 Best Erling Haaland Rookie Cards",
    intro="Haaland's rookie market runs through one product: 2019-20 Topps Chrome &mdash; the UEFA Champions League set for his flagship RC and the Bundesliga set from his Dortmund breakout. Raw prices are ungraded; headline numbers are attributed auction sales. Heading into the knockout rounds, see our <a href=\"/world-cup-2026-soccer-cards\">2026 World Cup soccer card guide</a> for the broader chase.",
    entries=[
        dict(cls="basketball", tag="&#9917; Topps Chrome UCL &middot; Flagship RC",
             title="2019-20 Topps Chrome UCL<br>#74 Base RC",
             price_label="Market", price_main="See live comps", price_sub="THE Haaland rookie card",
             stats=[("Format", "Topps Chrome UCL", ""), ("Card", "#74 RC", "gold"), ("Liquidity", "Highest", "green"), ("Trend", "Hot into WC26", "green")],
             body="<strong>The definitive Haaland rookie.</strong> The 2019-20 Topps Chrome UCL #74 is the card the whole market prices from &mdash; its 1/1 SuperFractor just sold for $226,920 at Goldin. Base copies are the most liquid Haaland cards in existence and the natural entry for serious collectors. Centering is everything on Chrome; inspect before you buy.",
             verdict="Buy. The flagship RC — deepest market, most liquid, the reference card for his whole rainbow.",
             kw="2019-20 topps chrome ucl haaland 74 rookie"),
        dict(cls="gold-tier", tag="&#127752; Topps Chrome UCL &middot; Refractor Rainbow",
             title="2019-20 Topps Chrome UCL<br>Refractors &amp; Numbered Colors",
             price_label="Market", price_main="See live comps", price_sub="Attainable scarcity ladder",
             stats=[("Entry", "Base Refractor", "green"), ("Numbered", "/199 to /25", ""), ("Hold Quality", "Strong", ""), ("Appeal", "Color match", "")],
             body="The refractor ladder is where you buy <strong>real scarcity without auction-lot prices</strong>. Base Refractors stay attainable; numbered colors from /199 down to /25 climb steadily. With the 1/1 at the top of this exact rainbow printing $226.9K, the low-numbered middle tiers carry serious anchor value.",
             verdict="Buy. Best balance of scarcity and price — the attainable low-# play.", watch=True,
             kw="2019-20 topps chrome ucl haaland refractor numbered"),
        dict(cls="gold-tier", tag="&#128142; Premium Parallel &middot; Sapphire",
             title="2019-20 Topps Chrome Sapphire UCL<br>Haaland RC",
             price_label="Market", price_main="See live comps", price_sub="Glassy premium tier, tighter print",
             stats=[("Format", "Sapphire Edition", ""), ("Tier", "Premium parallel", ""), ("Print", "Tighter than Chrome", "gold"), ("Appeal", "High eyeball", "")],
             body="The <strong>Sapphire Edition</strong> RC carries the glassy, high-gloss finish collectors pay up for &mdash; a step above standard Chrome but still a buyable card rather than a trophy lot. Sapphire soccer has been one of the strongest hobby lanes of the decade (Yamal's Sapphire 1/1 went $326.9K at the same Goldin auction). Verify exact parallel and grade against live comps.",
             verdict="Strong buy for collectors with budget. Premium look, tighter print, durable demand.", watch=True,
             kw="2019-20 topps chrome sapphire haaland rookie"),
        dict(cls="", tag="&#127942; Breakout-Season Chrome &middot; Bundesliga",
             title="2019-20 Topps Chrome Bundesliga<br>Haaland RC",
             price_label="Attributed anchor", price_main="$610K (Auto Super)", price_sub="The record lives in this set",
             stats=[("Set", "Chrome Bundesliga", ""), ("Era", "Dortmund breakout", "gold"), ("Record", "$610K Auto Superfractor", "gold"), ("Base Tier", "Attainable", "green")],
             body="His Dortmund-era Chrome &mdash; and the set that holds his all-time record: the autographed Superfractor sold for <strong>$610,000</strong> at Goldin in June 2026 (it had sold for $432K in 2021 &mdash; a +41% move in five years). Base and refractor copies of the same set are attainable and ride the halo of that headline.",
             verdict="Buy the base/refractors for the association; the record card does the marketing for you.",
             kw="2019-20 topps chrome bundesliga haaland rookie"),
        dict(cls="", tag="&#128181; Budget Modern &middot; Premier League",
             title="Panini Prizm Premier League<br>Man City Era Cards",
             price_label="Market", price_main="See live comps", price_sub="Cheap, liquid, City-badge tier",
             stats=[("Format", "Prizm PL", ""), ("Era", "Man City", ""), ("Cost", "Budget-friendly", "green"), ("Use Case", "Low-cost PC", "")],
             body="The budget lane: Prizm Premier League base and color parallels from his City years. Not rookies &mdash; they won't lead a move &mdash; but they're cheap, liquid, and the right way to own the player without paying rookie premiums. Numbered Prizm colors are the only ones with hold quality.",
             verdict="Buy for PC only. Liquidity is fine; upside belongs to the rookies above.",
             kw="panini prizm premier league haaland"),
    ],
    trophy_intro="Haaland's biggest auction results &mdash; trophy cards, not buys. They anchor the gravity under the attainable Chrome cards above. If the top of his market holds, the cards you can actually checkout hold too.",
    trophy_stats=[("Record: Bundesliga Auto Superfractor (Jun 2026)", "$610,000", "gold"),
                  ("Same card, 2021 sale", "$432,000", ""),
                  ("UCL SuperFractor #74 RC 1/1", "$226,920", "gold"),
                  ("Venue", "Goldin Global Football", "")],
    avoid_h2="Erling Haaland Cards to Skip in 2026",
    avoid=[
        "<strong>Unlicensed / novelty issues at inflated prices</strong> &mdash; thin long-term demand vs. the 2019-20 Chrome sets that define his market.",
        "<strong>Off-center or surface-worn Chrome raw at full price</strong> &mdash; a soft-centered refractor is a low grade waiting to happen. Centering is the whole game on Chrome.",
        "<strong>Buying the World Cup hype peak</strong> &mdash; a brace in his debut already spiked the market once. Tournament momentum cuts both ways; size accordingly.",
        "<strong>Non-rookie City base as an 'investment'</strong> &mdash; the money follows the 2019-20 rookies. Everything else is PC material.",
    ],
    social="We post Haaland card movement and World Cup market signals in real time on @shopcardhub.",
)

MBAPPE = dict(
    slug="kylian-mbappe-rookie-cards", first="Mbapp&eacute;",
    title="Kylian Mbappé Rookie Cards — Best Cards, Prices & Where to Buy (2026)",
    desc="Kylian Mbappé rookie card guide: 2017-18 Topps Chrome UCL RC (PSA 10 ~$400-500), 2017-18 Select (PSA 10 ~$800-900), the 2016-17 Panini Foot earliest issue, and 2018 Prizm World Cup. Ranked by ROI with live eBay sold comps.",
    keywords="Kylian Mbappe rookie cards, Mbappe Topps Chrome UCL, Mbappe Select, Mbappe Panini Foot, Mbappe Prizm World Cup, Mbappe cards 2026",
    eyebrow="&#9917; Soccer Cards &middot; Real Madrid &middot; France",
    h1a="Kylian Mbapp&eacute;", h1b="Rookie Cards Guide",
    hero_sub="A World Cup winner at 19, a Real Madrid galactico now &mdash; and one of the deepest, most liquid card markets in soccer. His graded benchmarks are established: Chrome UCL RC PSA 10s trade ~$400&ndash;$500, Select PSA 10s ~$800&ndash;$900. Every key Mbapp&eacute; rookie card ranked by ROI, liquidity, and upside, with live eBay sold comps.",
    hero_meta=["&#9679; Prices as of Jul 6, 2026", "&#9917; 5 Cards Ranked", "&#128202; ROI Analysis", "&#128176; eBay Sold Comps"],
    ranked_h2="The 5 Best Kylian Mbapp&eacute; Rookie Cards",
    intro="Mbapp&eacute;'s rookie market centers on 2017-18 &mdash; the first year Topps brought Chrome to the Champions League &mdash; plus his earliest 2016-17 Panini Foot issue and the 2018 World Cup breakout cards. Raw prices are ungraded; graded benchmarks are attributed. For the tournament angle, see our <a href=\"/world-cup-2026-soccer-cards\">2026 World Cup soccer card guide</a>.",
    entries=[
        dict(cls="basketball", tag="&#9917; Topps Chrome UCL &middot; Flagship RC",
             title="2017-18 Topps Chrome UCL<br>Base RC",
             price_label="Graded benchmark", price_main="PSA 10 ~$400&ndash;$500", price_sub="First-year UCL Chrome",
             stats=[("Format", "Topps Chrome UCL", ""), ("Significance", "1st UCL Chrome year", "gold"), ("PSA 10", "~$400&ndash;$500", "gold"), ("Liquidity", "Highest", "green")],
             body="<strong>The flagship Mbapp&eacute; rookie.</strong> 2017-18 was the very first Topps Chrome UEFA Champions League set, which gives this RC first-year-product significance on top of the player. Base PSA 10s trade around $400&ndash;$500; raw copies are attainable and plentiful. The refractor rainbow above it scales hard. Centering decides everything.",
             verdict="Buy. Most liquid Mbappé RC and the reference card for his market.",
             kw="2017-18 topps chrome ucl mbappe rookie"),
        dict(cls="gold-tier", tag="&#127752; Topps Chrome UCL &middot; Refractor Rainbow",
             title="2017-18 Topps Chrome UCL<br>Refractors &amp; Numbered Colors",
             price_label="Market", price_main="See live comps", price_sub="Attainable scarcity ladder",
             stats=[("Entry", "Base Refractor", "green"), ("Numbered", "/250 to /25", ""), ("Hold Quality", "Strong", ""), ("Appeal", "Color match", "")],
             body="Real scarcity on the flagship RC without trophy-lot pricing. Numbered colors climb steadily from /250 down; low-serial copies of a first-year Chrome product on a generational player are the classic long hold. Buy clean copies only &mdash; the grading spread does the rest.",
             verdict="Buy. Best balance of scarcity and price on his flagship rookie.", watch=True,
             kw="2017-18 topps chrome ucl mbappe refractor numbered"),
        dict(cls="gold-tier", tag="&#128310; Premium Rookie &middot; Select",
             title="2017-18 Panini Select<br>Mbapp&eacute; RC",
             price_label="Graded benchmark", price_main="PSA 10 ~$800&ndash;$900", price_sub="Pop 103 in PSA 10",
             stats=[("Format", "Panini Select", ""), ("PSA 10 Pop", "103 (of 291 graded)", "gold"), ("PSA 10", "~$800&ndash;$900", "gold"), ("Tier", "Premium RC", "")],
             body="The premium Panini rookie: <strong>only 103 PSA 10s exist</strong> out of 291 graded &mdash; a genuinely tight gem population for a player of this magnitude. PSA 10s command roughly double the Chrome UCL benchmark. The pop report is the story here: condition-sensitive stock plus low submissions equals a durable graded premium.",
             verdict="Buy graded. The pop-report play — scarcer in gem than the market realizes.", watch=True,
             kw="2017-18 panini select mbappe rookie"),
        dict(cls="", tag="&#127942; Earliest Issue &middot; Panini Foot",
             title="2016-17 Panini Foot<br>Mbapp&eacute; Sticker",
             price_label="Market", price_main="See live comps", price_sub="His earliest card of note",
             stats=[("Issue", "Panini Foot 16-17", ""), ("Significance", "Earliest issue", "gold"), ("Region", "France / Ligue 1", ""), ("Type", "First-card chase", "")],
             body="The strongest claim to his <strong>true first card</strong> &mdash; Panini's French Foot sticker series, issued while he was a Monaco teenager. Earliest-issue pieces of generational players carry significance beyond print run, and graded gems of fragile sticker stock are genuinely hard. This is the historical-piece play.",
             verdict="Buy for collectors who want the earliest issue. Significance over scarcity.",
             kw="2016-17 panini foot mbappe sticker"),
        dict(cls="", tag="&#127757; Breakout Moment &middot; Prizm World Cup",
             title="2018 Panini Prizm World Cup<br>#80 Mbapp&eacute;",
             price_label="Graded benchmark", price_main="PSA 10 ~$494", price_sub="30-day average",
             stats=[("Format", "Prizm World Cup", ""), ("Moment", "2018 WC breakout", "gold"), ("PSA 10 (30d avg)", "~$494", ""), ("Appeal", "Tournament classic", "")],
             body="The card of the moment that made him &mdash; the 2018 World Cup where a 19-year-old Mbapp&eacute; tore through the tournament and lifted the trophy. Prizm World Cup is the definitive set for that run; PSA 10s have averaged ~$494 over the past 30 days, and every deep France run in 2026 puts a bid under it.",
             verdict="Buy on dips. Tournament cards spike with tournaments — trade the calendar.",
             kw="2018 panini prizm world cup mbappe 80"),
    ],
    trophy_intro="Mbapp&eacute;'s market ceiling is defined by graded benchmarks and pop reports rather than one famous 1/1 &mdash; the anchors below are what the attainable cards price from.",
    trophy_stats=[("Select RC PSA 10", "~$800&ndash;$900", "gold"),
                  ("Select PSA 10 Pop", "103 of 291 graded", ""),
                  ("Chrome UCL RC PSA 10", "~$400&ndash;$500", "gold"),
                  ("Prizm WC #80 PSA 10 (30d)", "~$494", "")],
    avoid_h2="Kylian Mbapp&eacute; Cards to Skip in 2026",
    avoid=[
        "<strong>Unlicensed / novelty issues at inflated prices</strong> &mdash; his real market runs through Chrome UCL, Select, Panini Foot, and Prizm WC. Everything else is noise.",
        "<strong>Off-center Chrome or Select raw at full price</strong> &mdash; both products are condition-sensitive; the gem pop on Select is low for a reason.",
        "<strong>Paying WC-run premiums on tournament cards mid-run</strong> &mdash; Prizm WC spikes with France's bracket and cools after. Buy the calendar, don't chase it.",
        "<strong>Raw sticker stock priced as gem</strong> &mdash; 2016-17 Foot stickers are fragile; assume a grade discount unless it's already slabbed.",
    ],
    social="We post Mbapp&eacute; card movement and World Cup market signals in real time on @shopcardhub.",
)

KANE = dict(
    slug="harry-kane-cards", first="Kane",
    title="Harry Kane Cards — Best Rookies, Key Cards & Prices (2026)",
    desc="Harry Kane card guide: his rookie sticker (PSA 10 ~$1,439, pop 14), UCL Chrome debut cards ($6.3K SuperFractor comp), modern Premier League Chrome, and England World Cup cards. Ranked by ROI with live eBay sold comps.",
    keywords="Harry Kane rookie cards, Harry Kane sticker, Kane Topps Chrome, Kane England World Cup cards, Harry Kane cards 2026",
    eyebrow="&#9917; Soccer Cards &middot; Bayern Munich &middot; England",
    h1a="Harry Kane", h1b="Card Guide",
    hero_sub="England's all-time leading scorer is chasing the one trophy missing from the resume &mdash; and his card market is one of the cheapest ways to own a top-five striker of his era. The rookie sticker (14 PSA 10s exist, last sale ~$1,439) is the real chase. Every key Kane card ranked by ROI, liquidity, and upside, with live eBay sold comps.",
    hero_meta=["&#9679; Prices as of Jul 6, 2026", "&#9917; 5 Cards Ranked", "&#128202; ROI Analysis", "&#128176; eBay Sold Comps"],
    ranked_h2="The 5 Best Harry Kane Cards",
    intro="Kane predates the modern soccer-card boom &mdash; his 2014-era rookie issues are stickers and early Premier League sets with tiny graded populations, while his liquid market lives in modern Topps Chrome. Raw prices are ungraded; headline numbers are attributed sales. For the tournament angle, see our <a href=\"/world-cup-2026-soccer-cards\">2026 World Cup soccer card guide</a>.",
    entries=[
        dict(cls="basketball", tag="&#127942; The Rookie Chase &middot; 2014-15 Sticker",
             title="2014-15 Rookie Sticker<br>Harry Kane",
             price_label="Attributed", price_main="PSA 10 ~$1,439", price_sub="Pop 14 in PSA 10",
             stats=[("Issue", "2014-15 sticker", ""), ("PSA 10 Pop", "Only 14", "gold"), ("Last PSA 10 Sale", "~$1,439", "gold"), ("Type", "True rookie chase", "")],
             body="<strong>The real Kane rookie chase.</strong> His rookie-year sticker has just <strong>14 copies in PSA 10</strong> &mdash; sticker stock from that era grades brutally &mdash; and the last gem sale printed ~$1,439. For a player with 60+ England goals, that's one of the thinnest gem populations among elite modern strikers. Lower grades are attainable; the 10 is the trophy.",
             verdict="Buy graded if you can find one. The pop-14 gem is the entire Kane chase.",
             kw="harry kane rookie sticker psa"),
        dict(cls="gold-tier", tag="&#9917; First UCL Chrome &middot; Topps",
             title="2017-18 Topps Chrome UCL<br>Kane — First Chrome Cards",
             price_label="Attributed anchor", price_main="$6,300 (Superfractor)", price_sub="Jan 2025 sale",
             stats=[("Format", "Topps Chrome UCL", ""), ("Anchor", "$6.3K SuperFractor", "gold"), ("Base Tier", "Cheap", "green"), ("Liquidity", "Good", "")],
             body="Kane's Champions League Chrome debut &mdash; the first-year UCL Chrome product that also carries Mbapp&eacute;'s flagship RC. His SuperFractor from the line sold for <strong>$6,300 in January 2025</strong>, which anchors the whole ladder. Base and refractor copies remain cheap for a striker of this class.",
             verdict="Buy refractors and numbered colors. The $6.3K top makes the middle tiers look mispriced.", watch=True,
             kw="2017-18 topps chrome ucl harry kane"),
        dict(cls="gold-tier", tag="&#127752; Modern Chrome &middot; Premier League / Golazo",
             title="Topps Chrome Premier League<br>Base, Golazo &amp; Parallels",
             price_label="Market", price_main="See live comps", price_sub="The liquid modern lane",
             stats=[("Format", "Topps Chrome PL", ""), ("Tier", "Modern liquid", "green"), ("Entry", "Budget-friendly", "green"), ("Numbered", "Only tier that holds", "")],
             body="The liquid lane: Topps holds the Premier League license and Kane appears across Chrome PL and the Golazo insert lines every year. Base is PC material; <strong>numbered refractors are the only modern tier with hold quality</strong>. Cheap enough to build a position while the rookie sticker does the appreciating.",
             verdict="Buy numbered only. Modern base is for the binder, not the portfolio.", watch=True,
             kw="topps chrome premier league harry kane"),
        dict(cls="", tag="&#127757; Tournament Tier &middot; England WC 2026",
             title="England World Cup 2026<br>Topps Cards &amp; Topps NOW",
             price_label="Market", price_main="See live comps", price_sub="The catalyst in progress",
             stats=[("Angle", "WC 2026 run", "gold"), ("Format", "Topps / Topps NOW", ""), ("Risk", "Momentum-driven", ""), ("Catalyst", "England bracket", "")],
             body="The live catalyst: England's captain chasing the only medal he's missing. Tournament cards and Topps NOW moments spike with every knockout goal &mdash; and a Kane-lifts-the-trophy moment card would be the most collected England issue in years. This is a momentum lane, not a hold lane.",
             verdict="Trade it, don't marry it. Tournament cards are event trades with expiry dates.",
             kw="harry kane england world cup 2026 topps"),
        dict(cls="", tag="&#9997;&#65039; Signature Tier &middot; Autographs",
             title="Topps Kane Autographs<br>Chrome &amp; Premium Sets",
             price_label="Market", price_main="See live comps", price_sub="On-card England ink",
             stats=[("Type", "On-card autos", ""), ("Supply", "Steady across sets", ""), ("Sweet Spot", "Low-numbered Chrome", "gold"), ("Use Case", "Signature PC", "")],
             body="Kane signs across Topps' Chrome and premium lines, which keeps auto supply steady and prices reasonable &mdash; low-numbered Chrome autos are the sweet spot. A World Cup win would reprice every England-shirt signature overnight; that's the embedded option you're buying.",
             verdict="Buy low-numbered autos. Reasonably priced ink with a live tournament option attached.",
             kw="harry kane autograph topps chrome"),
    ],
    trophy_intro="Kane's market ceiling is modest next to Messi or Haaland &mdash; which is exactly the appeal. These anchors mark the top of a market where the entry tiers are still cheap.",
    trophy_stats=[("Rookie Sticker PSA 10", "~$1,439", "gold"),
                  ("PSA 10 Population", "Only 14", "gold"),
                  ("UCL Chrome SuperFractor", "$6,300 (Jan 2025)", ""),
                  ("The Catalyst", "England's WC26 run", "")],
    avoid_h2="Harry Kane Cards to Skip in 2026",
    avoid=[
        "<strong>Modern base as an 'investment'</strong> &mdash; Topps prints Kane across every PL product. Unnumbered modern stock will never be scarce.",
        "<strong>Raw vintage-era stickers priced as gems</strong> &mdash; 14 PSA 10s exist for a reason. Assume grade risk on any raw sticker.",
        "<strong>Buying the England-run peak</strong> &mdash; tournament cards correct fast when the bracket ends, win or lose. Trade the momentum; don't hold the top.",
        "<strong>Overpaying sticker autos and oddball relics</strong> &mdash; the signature market is deep; low-numbered on-card Chrome is the only auto tier worth a premium.",
    ],
    social="We post Kane card movement and England World Cup market signals in real time on @shopcardhub.",
)

RONALDO = dict(
    slug="cristiano-ronaldo-cards", first="Ronaldo",
    title="Cristiano Ronaldo Cards — Best Rookies, Key Cards & Prices (2026)",
    desc="Cristiano Ronaldo card guide: the 2002-03 Mega Craques #137 RC (PSA 9 sold $50K), Manchester United-era early cards, modern Chrome and Prizm (Gold Power 1/1 sold $152.5K), and his 6th World Cup. Ranked by ROI with live eBay sold comps.",
    keywords="Cristiano Ronaldo rookie cards, Ronaldo Mega Craques 137, Ronaldo rookie card PSA, Ronaldo Prizm, Ronaldo World Cup 2026 cards",
    eyebrow="&#9917; Soccer Cards &middot; Al-Nassr &middot; Portugal",
    h1a="Cristiano Ronaldo", h1b="Card Guide",
    hero_sub="Six World Cups. The most recognizable athlete on earth, still scoring on the biggest stage at 41 &mdash; and a card market that spans from a five-figure 2002 rookie to modern 1/1s like the Prizm Gold Power that just sold for <strong>$152,501</strong> at Goldin. Every key Ronaldo card ranked by ROI, liquidity, and upside, with live eBay sold comps.",
    hero_meta=["&#9679; Prices as of Jul 6, 2026", "&#9917; 5 Cards Ranked", "&#128202; ROI Analysis", "&#128176; eBay Sold Comps"],
    ranked_h2="The 5 Best Cristiano Ronaldo Cards",
    intro="Ronaldo's market has two poles: the 2002-03 Panini Mega Craques rookie at the vintage end and the deep modern Chrome/Prizm ecosystem at the liquid end. Raw prices are ungraded; headline numbers are attributed sales. For the tournament angle, see our <a href=\"/world-cup-2026-soccer-cards\">2026 World Cup soccer card guide</a>.",
    entries=[
        dict(cls="basketball", tag="&#127942; The Rookie Grail &middot; Mega Craques",
             title="2002-03 Panini Mega Craques<br>#137 Ronaldo RC",
             price_label="Attributed", price_main="$50,000 (PSA 9)", price_sub="Feb 2026 eBay sale",
             stats=[("Issue", "Mega Craques #137", ""), ("PSA 9 Sale", "$50,000", "gold"), ("PSA 5 Level", "~$8,700", ""), ("Type", "True RC grail", "gold")],
             body="<strong>The Ronaldo rookie.</strong> His 2002-03 Panini Sports Mega Craques #137 &mdash; the teenage Sporting Lisbon issue &mdash; is the card his entire vintage market prices from. A PSA 9 sold for <strong>$50,000 in February 2026</strong>, and even a PSA 5 runs ~$8,700. Twenty-plus years of authenticated demand; buy slabbed only at this tier.",
             verdict="Buy graded, any grade you can afford. The grail — mid-grades are the attainable entry.",
             kw="2002-03 panini mega craques ronaldo 137"),
        dict(cls="gold-tier", tag="&#128308; Early Career &middot; Manchester United Era",
             title="2003-04 Manchester United Era<br>Early Panini &amp; Upper Deck Issues",
             price_label="Market", price_main="See live comps", price_sub="The affordable early tier",
             stats=[("Era", "Man Utd arrival", "gold"), ("Makers", "Panini / Upper Deck", ""), ("Tier", "Early career", ""), ("Cost", "Below-grail entry", "green")],
             body="The tier under the grail: his first Manchester United seasons produced early Panini and Upper Deck club issues that carry real early-career significance at a fraction of Mega Craques money. Graded copies of clean examples are the play &mdash; this era's stock wasn't handled kindly.",
             verdict="Buy graded early-career pieces. Significance without the five-figure ticket.", watch=True,
             kw="2003-04 ronaldo manchester united card"),
        dict(cls="gold-tier", tag="&#127752; Modern Liquid &middot; Topps Chrome UCL",
             title="Topps Chrome UCL<br>Ronaldo Base &amp; Refractors",
             price_label="Market", price_main="See live comps", price_sub="The liquid modern lane",
             stats=[("Format", "Topps Chrome UCL", ""), ("Liquidity", "Very high", "green"), ("Entry", "Budget-friendly", "green"), ("Hold Tier", "Numbered only", "")],
             body="The most liquid way to own him: Champions League Chrome from his Real Madrid and Juventus years trades constantly and cheaply. Numbered refractors are the only modern tier with hold quality &mdash; the unnumbered stock is printed for the binder.",
             verdict="Buy numbered refractors on dips. Maximum liquidity, honest prices.", watch=True,
             kw="topps chrome ucl cristiano ronaldo refractor"),
        dict(cls="", tag="&#128310; Modern Premium &middot; Prizm",
             title="Panini Prizm (PL / World Cup)<br>Ronaldo Parallels",
             price_label="Attributed anchor", price_main="$152.5K (Gold Power 1/1)", price_sub="Goldin, Jun 2026",
             stats=[("Anchor", "$152,501 · 1/1", "gold"), ("Set", "2021-22 Prizm PL", ""), ("Attainable", "Color parallels", "green"), ("Appeal", "Modern premium", "")],
             body="The modern-premium pole: his 2021-22 Prizm Premier League Gold Power 1/1 printed <strong>$152,501</strong> at Goldin's June auction. You're not buying that card &mdash; you're buying the numbered Prizm colors underneath it, which reprice off exactly these headlines. Prizm World Cup parallels work the same way.",
             verdict="Buy numbered Prizm colors. The 1/1 headlines do the anchoring for you.",
             kw="panini prizm cristiano ronaldo numbered"),
        dict(cls="", tag="&#127757; The Farewell &middot; WC 2026 + Topps NOW",
             title="World Cup 2026 Cards<br>The Sixth World Cup",
             price_label="Market", price_main="See live comps", price_sub="History in real time",
             stats=[("Angle", "6th World Cup", "gold"), ("Format", "Topps / Topps NOW", ""), ("Risk", "Momentum-driven", ""), ("Narrative", "Farewell tour", "gold")],
             body="No player has scored in six World Cups &mdash; every Ronaldo goal this tournament is a record and a Topps NOW card. Farewell-narrative cards are pure momentum: enormous volume, fast spikes, faster cooldowns. One for the moment, not the portfolio.",
             verdict="Trade the moments. Buy one for the PC; don't stack event cards as holds.",
             kw="cristiano ronaldo world cup 2026 topps now"),
    ],
    trophy_intro="Ronaldo's biggest results span two decades &mdash; the vintage rookie at one end, modern 1/1s at the other. They anchor everything attainable in between.",
    trophy_stats=[("Prizm PL Gold Power 1/1 (Jun 2026)", "$152,501", "gold"),
                  ("Mega Craques #137 PSA 9 (Feb 2026)", "$50,000", "gold"),
                  ("Mega Craques #137 PSA 5 level", "~$8,700", ""),
                  ("Venue", "Goldin / eBay", "")],
    avoid_h2="Cristiano Ronaldo Cards to Skip in 2026",
    avoid=[
        "<strong>Raw Mega Craques at graded prices</strong> &mdash; at five figures, authentication is not optional. Slabbed or skip.",
        "<strong>Unnumbered modern base as an 'investment'</strong> &mdash; two decades of print runs means modern unnumbered Ronaldo is functionally infinite.",
        "<strong>Farewell-hype event cards at the spike</strong> &mdash; Topps NOW moments print to demand. The moment card cools the week after the moment.",
        "<strong>Sticker-era oddballs at rookie-adjacent prices</strong> &mdash; only Mega Craques carries true RC premium; adjacent 2002-04 issues are early-career, not rookies. Price them accordingly.",
    ],
    social="We post Ronaldo card movement and World Cup market signals in real time on @shopcardhub.",
)

MESSI = dict(
    slug="lionel-messi-cards", first="Messi",
    title="Lionel Messi Cards — Best Rookies, Key Cards & Prices (2026)",
    desc="Lionel Messi card guide: the 2004-05 Megacracks #71 RC ($1.5M record sale, 20 PSA 10s), the #71BIS variant, modern Chrome, Prizm World Cup, and Kaboom! inserts (Gold /10 sold $212K). Ranked by ROI with live eBay sold comps.",
    keywords="Lionel Messi rookie cards, Messi Megacracks 71, Messi rookie card PSA 10, Messi Kaboom, Messi Prizm World Cup, Messi cards 2026",
    eyebrow="&#9917; Soccer Cards &middot; Inter Miami &middot; Argentina",
    h1a="Lionel Messi", h1b="Card Guide",
    hero_sub="The greatest of all time, opening his final World Cup with a hat trick &mdash; and the only soccer player with a <strong>$1.5 million</strong> card sale. His 2004-05 Megacracks rookie holds the record for any soccer card. Every key Messi card ranked by ROI, liquidity, and upside, with live eBay sold comps.",
    hero_meta=["&#9679; Prices as of Jul 6, 2026", "&#9917; 5 Cards Ranked", "&#128202; ROI Analysis", "&#128176; eBay Sold Comps"],
    ranked_h2="The 5 Best Lionel Messi Cards",
    intro="Messi's market runs from the record-holding 2004-05 Panini Megacracks rookie down to some of the deepest, most liquid modern inventory in the hobby. Raw prices are ungraded; headline numbers are attributed sales. For the tournament angle, see our <a href=\"/world-cup-2026-soccer-cards\">2026 World Cup soccer card guide</a>.",
    entries=[
        dict(cls="basketball", tag="&#127942; The Record Holder &middot; Megacracks",
             title="2004-05 Panini Megacracks<br>#71 Messi RC",
             price_label="Attributed", price_main="$1.5M record", price_sub="MBA Diamond PSA 10 private sale",
             stats=[("Issue", "Megacracks #71", ""), ("Record Sale", "$1,500,000", "gold"), ("PSA 10 Pop", "20 (of 838 graded)", "gold"), ("Type", "Soccer's #1 card", "gold")],
             body="<strong>The most valuable soccer card ever sold.</strong> The 2004-05 Megacracks #71 &mdash; teenage Messi's Barcelona rookie &mdash; set the all-time soccer record at <strong>$1.5M</strong> (MBA Diamond-certified PSA 10), with a second PSA 10 brokered privately at $1.1M by Goldin. Only 20 PSA 10s exist out of 838 graded. Mid-grade copies are the realistic entry to the grail &mdash; slabbed only.",
             verdict="Buy graded at whatever grade fits the budget. The single most important card in soccer.",
             kw="2004-05 panini megacracks messi 71"),
        dict(cls="gold-tier", tag="&#128142; The Variant &middot; #71BIS",
             title="2004-05 Panini Megacracks<br>#71BIS Variant",
             price_label="Market", price_main="See live comps", price_sub="19 PSA 10s of ~620 graded",
             stats=[("Issue", "#71BIS variant", ""), ("PSA 10 Pop", "19 (of ~620)", "gold"), ("Gem Rate", "&lt;4%", ""), ("Tier", "Grail-adjacent", "gold")],
             body="The companion rookie: the <strong>#71BIS</strong> variant from the same Megacracks run, with an even thinner census &mdash; roughly 620 graded and just 19 gems (&lt;4% gem rate). It trades at a discount to the #71 while sharing the same rookie-year DNA. The value-side entry to the grail tier.",
             verdict="Buy graded. Same rookie DNA as the record card at a structural discount.", watch=True,
             kw="2004-05 panini megacracks messi 71 bis"),
        dict(cls="gold-tier", tag="&#127752; Modern Liquid &middot; Topps Chrome",
             title="Topps Chrome UCL Era<br>Messi Base &amp; Refractors",
             price_label="Market", price_main="See live comps", price_sub="The liquid modern lane",
             stats=[("Format", "Topps Chrome UCL", ""), ("Liquidity", "Very high", "green"), ("Entry", "Budget-friendly", "green"), ("Hold Tier", "Numbered only", "")],
             body="The most liquid Messi lane: Champions League Chrome from his Barcelona and PSG years trades constantly. Numbered refractors hold; unnumbered base is binder material. This is where you own the GOAT for double digits &mdash; and why his market never lacks a bid.",
             verdict="Buy numbered refractors on dips. Maximum liquidity, honest entry prices.", watch=True,
             kw="topps chrome ucl lionel messi refractor"),
        dict(cls="", tag="&#127757; Tournament Classics &middot; Prizm World Cup",
             title="Panini Prizm World Cup<br>2014 / 2018 / 2022 Messi",
             price_label="Market", price_main="See live comps", price_sub="The Qatar-triumph tier",
             stats=[("Sets", "Prizm WC 14/18/22", ""), ("Key Year", "2022 (the trophy)", "gold"), ("Demand", "Every WC cycle", "green"), ("Appeal", "Moment cards", "")],
             body="Prizm World Cup is the definitive tournament line, and Messi's 2022 cards &mdash; the World Cup he finally won &mdash; are modern classics with structural demand every cycle. The 2026 farewell run puts a live bid under all three tournament years. Numbered silvers and colors lead.",
             verdict="Buy numbered on dips. Tournament classics with a live 2026 catalyst.",
             kw="panini prizm world cup messi"),
        dict(cls="", tag="&#128165; Case-Hit Tier &middot; Kaboom!",
             title="Panini Donruss Kaboom!<br>Messi Inserts",
             price_label="Attributed anchor", price_main="$212K (Gold /10)", price_sub="Goldin, Jun 2026",
             stats=[("Anchor", "$212,280 · Gold /10", "gold"), ("Set", "2024-25 Donruss FIFA", ""), ("Attainable", "Base Kaboom!", "green"), ("Appeal", "Case-hit art", "")],
             body="The case-hit pole: his 2024-25 Donruss FIFA Kaboom! Gold /10 printed <strong>$212,280</strong> at Goldin's June auction &mdash; during a World Cup he opened with a hat trick. Base Kaboom! inserts remain the attainable version of the same comic-art demand that drives the number.",
             verdict="Buy base Kaboom! for the art, numbered for the hold. The $212K print anchors both.",
             kw="donruss kaboom messi"),
    ],
    trophy_intro="Messi owns the soccer record books on cardboard too. These are the results that anchor every attainable tier below them.",
    trophy_stats=[("Record: Megacracks #71 PSA 10 (MBA Diamond)", "$1,500,000", "gold"),
                  ("Megacracks #71 PSA 10 (private, Goldin)", "$1,100,000", "gold"),
                  ("Kaboom! Gold /10 (Jun 2026)", "$212,280", ""),
                  ("Megacracks PSA 10 Pop", "20 of 838", "")],
    avoid_h2="Lionel Messi Cards to Skip in 2026",
    avoid=[
        "<strong>Raw Megacracks at graded prices</strong> &mdash; at this tier, authentication is the product. Slabbed or skip, no exceptions.",
        "<strong>Unnumbered modern base as an 'investment'</strong> &mdash; twenty years of global print runs. It's binder material, priced accordingly.",
        "<strong>Farewell-hype event cards at the spike</strong> &mdash; every 2026 Messi moment gets a card. Moment cards cool the week after the moment.",
        "<strong>\"Rookie-adjacent\" 2005-06 issues at RC premiums</strong> &mdash; only the 2004-05 Megacracks pair carries true rookie premium. Later Barcelona issues are early-career cards.",
    ],
    social="We post Messi card movement and World Cup market signals in real time on @shopcardhub.",
)

PLAYERS = [HAALAND, MBAPPE, KANE, RONALDO, MESSI]
PAGES = [(lambda p: (lambda: render_player(p)))(p) for p in PLAYERS]
