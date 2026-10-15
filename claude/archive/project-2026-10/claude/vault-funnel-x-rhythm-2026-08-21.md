# Vault funnel + X rhythm (Aug 21, 2026, later session)

Mo's direction: the Vault (/watchlist) and Bowman Bangers are THE destinations; player/set pages are SEO on-ramps. X moves to a long-hold rhythm (Mon tape · Wed "Chasing" · Fri Vault image). Measure before redesigning the Vault visually.

## Shipped locally (Mo pushes)
1. **Vault share images** (`watchlist.html`, appended block "VAULT SHARE CARDS" before `</body>`): `shareCardImg(id)` per position (I OWN IT → P/L headline + in/now/value + price-log spark; HUNTING → target distance) and `shareVaultImg()` (P/L on cost, paid/worth/best, biggest-movers panel). 1200×675 canvas, brand fonts, no libs. Modal: Save PNG / Copy image (ClipboardItem, hidden if unsupported) / Post on X (caption only — `xShare(text, null)` now omits the URL; link goes in the first reply). Demo-vault guarded. GA: `vault_share_img`, `vault_share_card_img`, `_download`, `_copy`, `_post`. Old text shares `shareCard()`/`shareVault()` remain as functions; buttons now call the image versions.
2. **Destination strip** — `tools/dest.py` (repo), run on Mo's machine: Vault + Bowman Bangers tiles under the hero of **60 pages** (skips index, watchlist, bowman-bangers, track-record, about, privacy, disclosure, dungeon, research, blog). Markers `DEST:START/END` → idempotent; pages without Track buttons get "Open your Vault" copy instead of "Tap ★ Track". GA event `dest_strip {dest, page}`. Re-run after new pages are built (the scaffold generator won't add it).
3. **X rhythm** — Point 8 appended to `Card Hub/X-Twitter-Strategy-Reset-Plan.md`; System Reference §8 Tuesday line now = 3 drafts Mon/Wed/Fri; `Card Hub/tweet-drafts-2026-08-24.md` written (Mon Holliday PSA10-vs-raw · Wed Chasing Florentino under $80 / alt Kim PASS "my number is $100" · Fri Vault image + caption · bonus "I changed how I grade myself").

## QA
Playwright: share images render for own/hunting/vault with a seeded localStorage vault, 0 errors; strip renders on player/set/guide pages + 390px mobile, 0 errors; all 60 strip pages have exactly one DEST pair and one NAV pair; tools/audit-prices.mjs FAIL 0 (26 pre-existing WARNs).

## Push list
`watchlist.html`, `tools/dest.py`, plus the 60 strip pages → `git add -A` is appropriate this time.

## Next (measure first)
GA after 2–3 weeks: `dest_strip` clicks by dest, `vault_share_img*`, X-referred sessions landing on /watchlist. Then the Vault visual pass (hero, "what's in Mo's vault" view) built around what moved.
