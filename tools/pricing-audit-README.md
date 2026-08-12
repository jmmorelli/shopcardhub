# Pricing Integrity — audit + rules

**Goal:** `$$`-style price placeholders never appear on shopcardhub.com again, every displayed price is a real number from recent eBay sold-market comps, and drift gets caught automatically.

## The rule (applies to ALL content, human or agent-written)

1. **Never publish `$$`, `$$$`, `$$-$$$`, `$$$+` or any symbol-only price.** If you can't research a number, either drop the row or write the most recent cached number with "as of <date>" — never symbols.
2. Every price is a **numeric point or tight range** ("$325-$410", "~$220") based on recent (≤30-day) eBay sold comps. SportsCardsPro/PriceCharting pages aggregate eBay solds and are the fastest lookup; `/api/comps` gives live asks (label asks as asks, never as solds — house rule).
3. Every price table carries a stamp directly under it:
   `<p class="price-asof" data-prices-updated="YYYY-MM-DD" style="font-size:12px;color:var(--text-dim);margin:10px 2px 0;">Prices updated <date> &middot; recent eBay sold-market comps &middot; ranges are estimates &mdash; verify against live solds before buying.</p>`
   The `data-prices-updated` attribute is machine-read by the audit — keep the format exact and bump the date whenever you refresh the numbers.
4. Every eBay link keeps the mandatory EPN params (`mkevt=1`, `campid=5339155990`, `mkcid=1`, `mkrid=711-53200-19255-0`, `siteid=0`, `toolid=10001`, `customid=<page-slug>`).

## The audit

```
node tools/audit-prices.mjs              # human-readable
node tools/audit-prices.mjs --json r.json  # + JSON report
```

FAILs (exit 1): placeholder symbols in visible text; eBay search links missing `mkevt=1`/`campid`.
WARNs (exit 0): price cells with no digits ("Grail", "Varies", "TBD"); `data-prices-updated` stamps older than 21 days; price tables with no "sold comps" disclaimer.

Run it locally before any push that touches page HTML.

## Weekly automation

`tools/price-audit.yml` → copy to `.github/workflows/price-audit.yml` **via the GitHub web UI** (the terminal PAT lacks the `workflow` scope; a normal push of that path will be rejected). Runs every Monday ~8am PT plus on every push that changes HTML: red run + GitHub email + a `pricing-audit`-labeled issue containing the report whenever a FAIL appears.

## Current known-WARN backlog (Aug 12, 2026)

~20 Topps product pages use word labels in `roi-price` cells ("Top hit", "Case hit", "Premium"). These are editorial tier labels, not `$$` placeholders — the audit tracks them as WARNs. Converting them to researched numbers is a page-by-page content project; chip away when a page gets its next content pass.

## History

- **Aug 12, 2026** — 14 `$$`-style placeholders removed across 5 pages (bowman-sapphire-2026, wnba-cards-2026, topps-series-2-2026, roman-anthony-rookie-cards, munetaka-murakami-rookie-cards), all replaced with sold-comp ranges; audit script + weekly action created. Also fixed: Roman Anthony 1st Bowman Chrome mislabeled 2024 (is 2023) and its base price overstated ~10x ($40-$70 → ~$3-$8 raw).
