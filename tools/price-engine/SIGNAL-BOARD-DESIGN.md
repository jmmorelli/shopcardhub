# Prospect Signal Board — design spec (build to this, don't improvise)

Goal: a filterable BUY/HOLD/SELL table below the editorial top-10 on
`/bowman-bangers`, that looks like it was always part of the page. **Reuse the
page's existing tokens and components only — introduce no new colors, fonts, or
component styles.** Curator rule: if it isn't already in the page's `:root` or
`<style>`, don't add it.

## Reuse the page's own color language (this is the key to it not looking bolted-on)
The editorial section already trains the eye: green = Buy, gold = Watch, red =
Avoid. The signal chips MUST match that, 1:1:

| Signal | Token | Hex | Already used on page as |
|---|---|---|---|
| **BUY** | `--green` | `#00e07a` | `.entry-verdict` (Verdict: Buy) |
| **HOLD** | `--gold` | `#f5c800` | `.entry-verdict.watch` (Watch) |
| **SELL** | `--red` | `#ff2e55` | `.entry-verdict.avoid` (Avoid) |
| **Building history / n<20** | `--text-dim` | `#5a7880` | neutral, no false precision |

Chip style = the existing badge idiom: small `--fm` (JetBrains Mono) uppercase
label, the signal color as text/left-accent on a dim background
(`--green-dim` / `--orange-dim` exist; for gold/red use a low-alpha fill inline).

## Structure — mirror every other section on the page
```
<section>
  <div class="section-eyebrow">⚾ Live Signals · Updated Daily</div>
  <h2>Every 1st Bowman Chrome Auto — Signal Board</h2>
  <p class="section-intro">…one-liner: chart-derived BUY/HOLD/SELL on the full
     prospect list, not just our top 10. Updated nightly from sold-market data.</p>
  <!-- filter input + the table -->
</section>
```
- `<section>` already gives the 64px padding + top border that separates blocks.
- Heading uses `h2` (Barlow Condensed, the page default) — don't restyle.

## The table — extend `.roi-table`, don't make a new one
- Apply the existing `.roi-table` class so row hover (`inset 2px 0 0 var(--accent)`)
  and spacing come for free.
- Columns: **Prospect** (label, links to `slug` if present) · **Card**
  (1st Bowman Chrome Auto / "Chrome · no auto" when `cardType:"chrome-base"`) ·
  **Last** (price, `--fm`) · **30d** (roc30, green/red by sign) · **Signal** (chip).
- Header row in `--fm`, `--text-dim`, uppercase — matches existing table headers.
- Thin-volume or `points<20` rows: show the neutral chip + a small "building"
  note; never show a confident call on thin data.

## Filter / "search bar"
- A single `<input>` styled to match: `background:var(--bg3)`,
  `border:1px solid var(--border2)`, `--fm` text, 2px radius (same as buttons).
  Placeholder: "Filter prospects…". Pure client-side `.filter()` on the rows.
- Optional segmented filter chips (All / Buy / Hold / Sell) using `.btn-secondary`
  styling, active state = border + text in `--accent`. No new button class.

## Data source
- Fetch `prices-latest.json` from the `price-data` branch raw URL on load,
  render rows. Empty/unbuilt → show a tasteful "Signals begin once nightly
  history accrues" placeholder, not an error.

## Mobile
- The page uses `grid-template-columns:repeat(auto-fit,minmax(...))` patterns and
  a responsive table elsewhere; let the table scroll-x on narrow screens
  (`overflow-x:auto` wrapper) rather than reflowing — consistent with existing
  `.roi-table` behavior. Verify at 380px.

## Acceptance check before go-live
1. Side-by-side with the editorial section, the chips read in the SAME colors as
   the verdicts above them.
2. No new font family, no new accent color, no new button shape introduced.
3. `<div>` balance unchanged; existing top-10 untouched.
4. Renders cleanly with an EMPTY feed (pre-history) and a populated one.
5. Looks right at 380px and desktop.
