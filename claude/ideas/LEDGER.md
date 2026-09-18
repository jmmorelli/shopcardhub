# Earnings ideas ledger — every idea ever proposed, one line each

Status vocabulary: `proposed` (desk filed it, CoS has not ruled) · `adopted` (in `pipeline.json` with an owner) · `parked` (with its revive trigger) · `declined` (with the reason) · `live` (shipped) · `retired` (was live, stopped) · `never` (a standing rule forbids it — listed so it is not re-proposed).

**The desk reads this whole file before proposing.** Re-proposing a line here without a materially new mechanism is a defect. Seeded 2026-09-18 by the CoS from everything on the record.

| # | Date | Idea | Lever | Rung | Status | Note |
|---|---|---|---|---|---|---|
| 1 | 2026-09-18 | **Faceless YouTube channel** — Mo recalls this from an earlier session; the details are not on file. Sketch: the nightly tape and Tuesday board already render as PNGs (`tools/x-images/make.py`, `og/x/board-latest.png`); a 45–60 s vertical "tonight's tape" with synthetic voice, one per night, links to the board and the index pages. | clicks | M1 | **proposed** | Desk: re-derive as a full nine-line idea on its first run; the open questions are channel economics (YouTube Shorts pay ~nothing; the value is the link and the search presence), production cost per clip, and whether the board's copy rules (R9, R10 never-post list) can be enforced on a script. Mo to add anything he remembers. |
| 2 | 2026-09-12 | Paid contributors (Seeking-Alpha style articles/advice) | clicks | M2 | **parked** | Mo: "not sure we are ready… maybe when we get some more ROI." Revive trigger: M0 held two consecutive months AND returning ≥ 20% for 4 weeks (`claude/cos/ROADMAP.md`). |
| 3 | 2026-09-17 | Sealed-product buy strip above the fold on every commercial page (R11) | $/click | M0 | **live** | Shipped Sep 17 on 58 pages + the 30th module; Gengar Monday beat grades it; per-product EPN custom IDs. First clean read Sep 18+. |
| 4 | 2026-09-18 | Deep-link buy strips and engine blocks to the **cheapest clean live listing** instead of a search URL | $/click | M0 | **adopted** | From the gap analysis G3 (listing-level links converted 39% on the Sep 4 read). Wed build session. |
| 5 | 2026-09-18 | Dashboard (`/`) eBay links + `click` telemetry + distinct `customid=home-*` | $/click | M0 | **adopted** | Gap analysis G1. Wed build session. |
| 6 | 2026-09-15 | Triggered "Signal Alert" email (one send/day max, real crossings only) | clicks | M0 | **parked** | Approved by Mo; gated on 40 confirmed subscribers (email program). |
| 7 | 2026-09-17 | Weekly Tape Recap email to the list | clicks | M0 | **live** | 4 active subscribers; "send it every week or cancel it" (email program). |
| 8 | 2026-09-18 | RSS/JSON feed of the nightly marks + Tuesday Tape (`/feed.xml`) | clicks | M0 | **proposed** | Repo scan §3.9. Cheap; word-of-mouth surface for investors who won't give an email. |
| 9 | 2026-09-08 | Auction Desk (`/auctions`, `customid=auctions`) as the intent lever | $/click | M0 | **live** | Bid watch only until close-time capture exists; no ask-vs-sold gap figure may be published. |
| 10 | 2026-08 | Amazon Associates on `/best-card-supplies` | $/click | M0 | **live, at risk** | Needs 3 qualifying sales by ~late Dec 2026 or the account closes. Decision at the Oct 1 roster review: earn them or convert the page to eBay deliberately. |
| 11 | 2026-09-04 | Bowman set indices per set (BOW26, BCB26) as the high-end-chaser destination | $/click | M1 | **live** | Mo's thesis: high-end buyers want the indices; per-set, fixed universe. |
| 12 | 2026-09-15 | Sector-model Pokémon set indices (SV151 first) → each index page sells the set's sealed product | $/click | M1 | **adopted** | SV151 rebuild in progress (screen run 207/207 Sep 17). Sealed rows live on the 5 Pokémon indices since Sep 13. |
| 13 | 2026-09-15 | Zero-knowledge Vault sync (cross-device, no accounts) | clicks | M1 | **adopted** | Retention; W4 Oct 6–12. Cashes out only via return visits → clicks; the desk should not re-propose accounts/PII variants (ruled out). |
| 14 | 2026-09-16 | One real off-site link **submission** (not a comment) — board ranking-rule change or the 151 index as the material — measured on GA4 referral sessions | clicks | M1 | **adopted** | Needs Mo's human account. The r/baseballcards and 151 drafts are held (numbers retracted / page not live). |
| 15 | 2026-09-17 | X account run by Grok Bot (vendor) with CoS direction; link in the main post | clicks | M1 | **live** | R10: nothing on this project posts. Ideas may brief the vendor via the CoS only. |
| 16 | 2026-07 | Card Dungeon "YouTube Break Monitor" (detect break videos before price spikes) | clicks | M1 | **parked** | Dungeon-era spec (Mo's persistent layer, hands-off). Revive only as a desk idea with a concrete mechanism and a source of break-video data. |
| 17 | 2026-07 | Card Dungeon "Discord Hype Aggregator" | clicks | M1 | **declined** | No data source we can read without scraping private servers. |
| 18 | 2026-07 | Card Dungeon "Wax Variant Tracker" (hobby vs retail vs blaster spread) | $/click | M1 | **parked** | Overlaps the sealed rows + buy strips; revive if a per-variant sealed row proves out on one Pokémon index. |
| 19 | 2026-07 | PSA grading ROI calculator / hobby-box ROI calculator | $/click | M0 | **live** | `/hobby-box-roi-calculator`, `/psa-grading-guide` exist; both are R11-exempt utility pages. |
| 20 | 2026-09-08 | "My AI bids on cards" — SportsCardRadio's posts, flagged by Mo for review | — | — | **proposed** | Mo asked Claude to watch @SportsCardRadio and @WatchTheBreaks for AI-in-cards ideas that fit. Desk: read what they actually do (public posts only) and file the one mechanism that fits our engine, or decline. |
| 21 | — | Topps direct affiliate | — | — | **retired** (Aug 23) | Product sells out in minutes; clicks can't convert. Do not retry. |
| 22 | — | Fanatics Collect affiliate | — | — | **retired** (Aug 23) | Same sold-out-inventory logic. Do not retry. |
| 23 | — | Google Ads / paid acquisition | — | — | **never** | Ruled out Jul 28; $0.28/click cannot clear any CPC. |
| 24 | — | AdSense / display ads | — | — | **never** | Competes with affiliate clicks, junks UX (Jul 28). |
| 25 | — | Paywall / subscription / charging readers | — | — | **never** | Mo's value: free advice, compensated infrastructure (Aug 19). |
| 26 | — | Kit (ConvertKit) as a second email list | — | — | **retired** (Sep 3) | MailerLite is the one list; never propose a second. |
| 27 | — | Publishing Mo's COMC positions / inventory on the site | — | — | **never** | Sep 16 ruling; "small potatoes, loses site trust." |
| 28 | — | Hammer/auction-close prices as a tape on Home | $/click | M0 | **parked** | Ruled no chart; two-number stat tile only, and nothing until close-time capture is fixed (Sep 16 retraction). |
| 29 | 2026-09-18 | GA4 read-only service account so cloud runs read analytics daily | — | M0 | **proposed → NEEDS-MO** | Not an earnings idea; the instrument every earnings idea is graded on. Repo scan §1.1. |
