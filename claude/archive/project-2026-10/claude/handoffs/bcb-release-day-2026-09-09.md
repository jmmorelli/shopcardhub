# Handoff — /bowman-chrome-baseball-2026 release-day conversion (Sep 9, 2026)

**Status: COMMIT-READY, gates green.** Prepared by the Sep 9 daily/chat session (cloud-only — could not push). Mo asked to launch on street day.

- Scope: single file, `bowman-chrome-baseball-2026.html` — pre-release copy → live (meta/og descriptions, hero sub + badges, status banner with BCB26 activation note, market intro, sealed-box + Mega/Choice copy stops claiming configs are unannounced, JSON-LD dateModified 2026-09-09). No prices, calls, signals, methodology or affiliate links touched.
- Verified in the cloud clone at parent `2de6190`: `audit-prices` FAIL 0 / WARN 31 (all pre-existing incl. this page's non-numeric-price carve-out) and `audit-site` FAIL 0 / WARN 0. Local commit `63f84c3`, **tree `ada57fb`** — replay the patch below on the Mac and confirm the same tree hash before pushing (CHARTER §5).
- After push: `node tools/indexnow-ping.mjs` (at least /bowman-chrome-baseball-2026), live-verify with curl only (no browser load — GA4).
- NOT included, for the Monday weekly: nav label `Bowman Chrome — Aug 10` → `Bowman Chrome — Sep 9` in `data/nav.json` + build-nav (94-page rebuild); BCB26 activation is STEP 3.6's re-mark once verified asks cover ≥60% of basket value — do not force it.

## Patch (git apply)

```diff
diff --git a/bowman-chrome-baseball-2026.html b/bowman-chrome-baseball-2026.html
index 32aaf6c..fcb82b1 100644
--- a/bowman-chrome-baseball-2026.html
+++ b/bowman-chrome-baseball-2026.html
@@ -6,12 +6,12 @@
   <meta name="view-transition" content="same-origin">
   <link rel="icon" type="image/svg+xml" href="/favicon.svg">
   <title>2026 Bowman Chrome Baseball — Set Guide, 1st Chrome Autos, Red RC & Box Math | ShopCardHub</title>
-  <meta name="description" content="2026 Bowman Chrome Baseball guide: Aug 10 pre-order, early-September release. 1st Bowman Chrome prospect autos, the refractor rainbow, Red RC Fancash buyback, snack packs, and how to play the hobby's biggest prospecting release. Pre-release, August 2026.">
+  <meta name="description" content="2026 Bowman Chrome Baseball guide: live as of Sep 9, 2026. 1st Bowman Chrome prospect autos, the refractor rainbow, Red RC Fancash buyback, snack packs, and how to play the hobby's biggest prospecting release while comps form. Searchable checklist inside.">
   <meta name="keywords" content="2026 Bowman Chrome Baseball, 1st Bowman Chrome, Bowman Chrome checklist, Chrome Prospect Autographs, Bowman Chrome hobby box, Red RC, Bowman Chrome superfractor">
   <link rel="canonical" href="https://www.shopcardhub.com/bowman-chrome-baseball-2026">
   <meta property="og:type" content="article">
   <meta property="og:title" content="2026 Bowman Chrome Baseball — Set Guide, 1st Chrome Autos, Red RC & Box Math">
-  <meta property="og:description" content="2026 Bowman Chrome Baseball guide: Aug 10 pre-order, early-September release. 1st Bowman Chrome prospect autos, the refractor rainbow, Red RC Fancash buyback, snack packs, and how to play the hobby's biggest prospecting release. Pre-release, August 2026.">
+  <meta property="og:description" content="2026 Bowman Chrome Baseball guide: live as of Sep 9, 2026. 1st Bowman Chrome prospect autos, the refractor rainbow, Red RC Fancash buyback, snack packs, and how to play the hobby's biggest prospecting release while comps form. Searchable checklist inside.">
   <meta property="og:url" content="https://www.shopcardhub.com/bowman-chrome-baseball-2026">
   <meta property="og:site_name" content="ShopCardHub">
   <meta name="twitter:card" content="summary_large_image">
@@ -23,7 +23,7 @@
   <meta name='impact-site-verification' value='74b130d5-209e-4785-b837-d16afbf60555'>
   <meta name='impact-site-verification' value='b16c5bca-431e-4f3c-be15-6c3a1006e379'>
   <script type="application/ld+json">
-  {"@context":"https://schema.org","@type":"Article","headline":"2026 Bowman Chrome Baseball — Set Guide, 1st Chrome Autos, Red RC & Box Math","url":"https://www.shopcardhub.com/bowman-chrome-baseball-2026","publisher":{"@type":"Organization","name":"ShopCardHub","url":"https://www.shopcardhub.com"},"datePublished":"2026-06-18","dateModified":"2026-06-18"}
+  {"@context":"https://schema.org","@type":"Article","headline":"2026 Bowman Chrome Baseball — Set Guide, 1st Chrome Autos, Red RC & Box Math","url":"https://www.shopcardhub.com/bowman-chrome-baseball-2026","publisher":{"@type":"Organization","name":"ShopCardHub","url":"https://www.shopcardhub.com"},"datePublished":"2026-06-18","dateModified":"2026-09-09"}
   </script>
   <link rel="preload" href="/fonts/barlow-condensed-800.woff2" as="font" type="font/woff2" crossorigin>
   <link rel="preload" href="/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin>
@@ -847,10 +847,10 @@ section{animation:wire-pulse 5s ease-in-out infinite;}
       <figcaption class="hero-card-cap">2026 Bowman Chrome Baseball <b>Hobby Box</b> &middot; live eBay listing</figcaption>
     </figure>
     <h1>2026 Bowman Chrome<br><em>Baseball</em></h1>
-    <p class="hero-sub">The prospecting flagship. The 2026 1st Bowman class &mdash; Holliday, Arquette, Fischer and the rest &mdash; gets its Chrome debut: on-card 1st Bowman Chrome autos, the full refractor rainbow, and the chase that anchors prospect collecting every year. Pre-orders opened August 10 and the checklist is out; here's the chase and how to play it before comps exist.</p>
+    <p class="hero-sub">The prospecting flagship. The 2026 1st Bowman class &mdash; Holliday, Arquette, Fischer and the rest &mdash; gets its Chrome debut: on-card 1st Bowman Chrome autos, the full refractor rainbow, and the chase that anchors prospect collecting every year. It streeted September 9 and the checklist is out; here's the chase and how to play the opening weeks while comps form.</p>
     <div class="hero-meta">
-      <span>Pre-orders opened Aug 10, 2026</span>
-      <span>Street date Sep 9, 2026 &middot; Mega Box Sep 23</span>
+      <span>&#128994; Live &mdash; streeted Sep 9, 2026</span>
+      <span>Mega Box follows Sep 23</span>
       <span>&#9918; 100 Chrome Prospects &middot; CPA autos</span>
       <span>Checklist published &middot; <a href="#checklist" style="color:inherit;">see it below</a></span>
       <span>Set index &middot; <a href="/bowman-chrome-2026-index" style="color:var(--accent);">BCB26 &mdash; pre-activation</a></span>
@@ -891,7 +891,7 @@ section{animation:wire-pulse 5s ease-in-out infinite;}
 
   <div class="container">
   <div class="alert-bar" style="margin-top:48px;">
-    &#9888;&#65039; <strong>Pre-release &mdash; but the checklist is now out.</strong> Pre-orders opened Monday, Aug 10; the street date is <strong>Sep 9, 2026</strong> (Mega Box Sep 23). Topps published the checklist on <strong>Aug 21</strong> &mdash; 100 base, 100 Chrome Prospects (BCP-151&ndash;250) and a Chrome Prospect Autograph list that is still filling in; it's searchable <a href="#checklist" style="color:inherit;"><strong>below</strong></a>. Box configuration and MSRP are still unannounced &mdash; the 2025 baseline was a 60-card hobby box with 2 autos at ~$300 direct. <strong>No sold comps exist yet</strong> because nothing has shipped: every eBay link below is a live SEARCH, not a price claim. <em>Updated Aug 25, 2026.</em>
+    &#128994; <strong>Live &mdash; the set streeted Sep 9, 2026</strong> (Mega Box follows Sep 23). Boxes are shipping and the first singles are posting now. The checklist (published Aug 21 &mdash; 100 base, 100 Chrome Prospects BCP-151&ndash;250, and a Chrome Prospect Autograph list that was still filling in) is searchable <a href="#checklist" style="color:inherit;"><strong>below</strong></a>. <strong>Comps are still forming</strong> &mdash; release week trades on asks and rip hype, not sold history &mdash; so every eBay link below is a live SEARCH, not a price claim, and the <a href="/bowman-chrome-2026-index" style="color:inherit;"><strong>BCB26 set index</strong></a> activates only once the engine can verify asks across the chase basket. Confirm box configuration on any sealed listing before you pay. <em>Updated Sep 9, 2026.</em>
   </div>
 
   <section style="border-top:none; padding-top:20px; padding-bottom:0;">
@@ -948,9 +948,9 @@ section{animation:wire-pulse 5s ease-in-out infinite;}
   <section>
     <div class="section-eyebrow cyan">Where to Buy</div>
     <h2>Sealed &amp; Singles</h2>
-    <p class="section-intro">Pre-release, the market is asks and hype. Paper 1st autos of this exact class already trade daily &mdash; that's your best read on relative demand before Chrome comps exist.</p>
+    <p class="section-intro">Release week, the market is asks and rip hype. Paper 1st autos of this exact class already trade daily &mdash; that's your best read on relative demand while Chrome comps form.</p>
     <div class="product-grid">
-      <div class="product-item best"><div class="product-tag">Best for Value</div><div class="product-name">Snipe the Auto, Skip the Box</div><div class="product-price green">Varies</div><div class="product-desc">The paper 1st autos on our Bangers board already rank this class by real sold prices. When Chrome singles post, target the exact name and color &mdash; don't pay the release-week rip tax.</div><a href="https://www.ebay.com/sch/i.html?_nkw=2026+bowman+chrome+prospect+autograph&LH_BIN=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001&customid=bowman-chrome-baseball-2026" class="product-link" target="_blank" rel="noopener sponsored">Shop Singles on eBay &rarr;</a></div><div class="product-item highlight"><div class="product-tag">Sealed &middot; eBay</div><div class="product-name">Sealed Boxes on eBay</div><div class="product-price green">Live stock</div><div class="product-desc">2026 pricing and configs are TBA &mdash; eBay carries sealed Bowman Chrome from day one. Confirm configuration on the listing before committing.</div><a href="https://www.ebay.com/sch/i.html?_nkw=2026+bowman+chrome+baseball+hobby+box&LH_BIN=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001&customid=bowman-chrome-baseball-2026" class="product-link" target="_blank" rel="noopener sponsored">Shop Sealed Boxes on eBay &rarr;</a></div><div class="product-item"><div class="product-tag">Best for PC</div><div class="product-name">Browse Our COMC Store</div><div class="product-price">Varies</div><div class="product-desc">Hand-picked baseball singles, prospects, and parallels in our COMC storefront &mdash; no box variance, just the cards you actually want.</div><a href="https://comc.com/Users/DBCooper" class="product-link" target="_blank" rel="noopener sponsored">Shop COMC &rarr;</a></div>
+      <div class="product-item best"><div class="product-tag">Best for Value</div><div class="product-name">Snipe the Auto, Skip the Box</div><div class="product-price green">Varies</div><div class="product-desc">The paper 1st autos on our Bangers board already rank this class by real sold prices. When Chrome singles post, target the exact name and color &mdash; don't pay the release-week rip tax.</div><a href="https://www.ebay.com/sch/i.html?_nkw=2026+bowman+chrome+prospect+autograph&LH_BIN=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001&customid=bowman-chrome-baseball-2026" class="product-link" target="_blank" rel="noopener sponsored">Shop Singles on eBay &rarr;</a></div><div class="product-item highlight"><div class="product-tag">Sealed &middot; eBay</div><div class="product-name">Sealed Boxes on eBay</div><div class="product-price green">Live stock</div><div class="product-desc">eBay carries sealed 2026 Bowman Chrome from day one &mdash; confirm the configuration and card count on the listing before committing; release-week sealed carries a rip-tax premium.</div><a href="https://www.ebay.com/sch/i.html?_nkw=2026+bowman+chrome+baseball+hobby+box&LH_BIN=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001&customid=bowman-chrome-baseball-2026" class="product-link" target="_blank" rel="noopener sponsored">Shop Sealed Boxes on eBay &rarr;</a></div><div class="product-item"><div class="product-tag">Best for PC</div><div class="product-name">Browse Our COMC Store</div><div class="product-price">Varies</div><div class="product-desc">Hand-picked baseball singles, prospects, and parallels in our COMC storefront &mdash; no box variance, just the cards you actually want.</div><a href="https://comc.com/Users/DBCooper" class="product-link" target="_blank" rel="noopener sponsored">Shop COMC &rarr;</a></div>
     </div>
   </section>
 
@@ -966,7 +966,7 @@ section{animation:wire-pulse 5s ease-in-out infinite;}
     <div class="section-eyebrow cyan">Avoid</div>
     <h2>What to Skip</h2>
     <div class="avoid-list">
-      <div class="avoid-item"><span class="x">&#10007;</span><div><strong>Release-week auto premiums</strong> &mdash; Chrome 1st autos historically open hot and bleed for weeks as supply posts. The paper class already shows which names hold; let Chrome comps form.</div></div><div class="avoid-item"><span class="x">&#10007;</span><div><strong>Confusing paper and Chrome</strong> &mdash; a 2026 Bowman (paper) 1st auto and a Chrome 1st auto are different cards with different markets. Verify which one the listing actually is.</div></div><div class="avoid-item"><span class="x">&#10007;</span><div><strong>Mega/Choice gambling before configs are announced</strong> &mdash; format EV differs wildly. No config, no math, no buy.</div></div><div class="avoid-item"><span class="x">&#10007;</span><div><strong>Color on the wrong name</strong> &mdash; a /25 of a non-prospect is still a non-prospect. Serial numbers don't fix scouting reports.</div></div>
+      <div class="avoid-item"><span class="x">&#10007;</span><div><strong>Release-week auto premiums</strong> &mdash; Chrome 1st autos historically open hot and bleed for weeks as supply posts. The paper class already shows which names hold; let Chrome comps form.</div></div><div class="avoid-item"><span class="x">&#10007;</span><div><strong>Confusing paper and Chrome</strong> &mdash; a 2026 Bowman (paper) 1st auto and a Chrome 1st auto are different cards with different markets. Verify which one the listing actually is.</div></div><div class="avoid-item"><span class="x">&#10007;</span><div><strong>Mega/Choice gambling before you've done the config math</strong> &mdash; format EV differs wildly (Mega streets Sep 23). No config, no math, no buy.</div></div><div class="avoid-item"><span class="x">&#10007;</span><div><strong>Color on the wrong name</strong> &mdash; a /25 of a non-prospect is still a non-prospect. Serial numbers don't fix scouting reports.</div></div>
     </div>
   </section>
 
```
