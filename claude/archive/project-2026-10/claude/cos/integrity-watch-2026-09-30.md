# Integrity Watch — 2026-09-30

HEAD a81f607 · origin/main a81f607 · delta 0 · gate WARN 75/3/0 vs baseline 75/3/0

Fresh HTTPS clones this run: `/tmp/iw` (main, depth 30) and `/tmp/feed` (`price-data`). `git ls-remote origin refs/heads/main` returned `a81f607f78…` = local HEAD at 12:01Z. Gates on that clone: `audit-prices` 0 FAIL / 75 WARN · `audit-site` 0 / 3 (132 pages) · `audit-terminal --feed data/feed` 0 / 0 — equal to the Sep 29 desk/CoS baseline (0/75 · 0/3 (132) · 0/0).

Read at STEP 0 from the clone: LANE-RULES (**R1–R29**, incl. the GO-TIME cadence block), `claude/cos/STATE.md`, `claude/cos/NEEDS-MO.md`. Ledger: `data/pipeline.json` (202 proposals). All six of yesterday's `iw-2026-09-29-*` items are ruled (1–4 applied by the Sep 29 desk `85792dc`, 5–6 queued to today's weekly) — nothing below re-files them.

**Where my prompt is stale (the file wins):** prompt cites R1–R11 (file is R1–R29); prompt reads the feed from raw.githubusercontent (R19: `https://www.shopcardhub.com/feed/`, which I used; `ga4-*` read from the `price-data` clone); prompt's SV151 caveat is stale (SV151 live since Sep 25). **Correction to yesterday's report:** it flagged this lane firing on a Tuesday against a "Mon + Thu" cadence row. The GO-TIME block (Sep 27) makes Integrity Watch daily 05:00; only the table row is stale. No schedule fault.

**Headline: 0 FAIL · 1 HIGH · 2 MED · 2 LOW. Part A clean.** Every finding is R8/R9 — product naming — which is the class the gates cannot read.

---

## PART A — INSTRUMENTS: clean

Live `/feed/prices-latest.json` day **2026-09-29**, generated 14:51Z (21 h old at 12:01Z). Trailing reference = the 6 prior `price-data` snapshots (history starts at the Sep 23 reset; `iw-2026-09-24-6` still queued).

| Instrument | Today (Sep 29) | Reference | Verdict |
|---|---|---|---|
| Cards in feed | **41** | 41 × 6 | OK |
| Numeric `last` | **36** | 36 × 6 | OK |
| Signals | **41** (HOLD 29 · SELL 11 · BUY 1) | 41 × 6 | OK |
| Gated | **7** | median 10 (10·10·10·10·8·9) | −30%, OK |
| Auction closes, cumulative (`market-latest`) | **359** (+13) | daily adds 44·9·9·18·24·(+24 Sep 28), median 18 | −28%, OK |
| Live auctions watched | **177** | 165 · 167 | OK |

**Index cadence:** all 23 `live` tickers carry a 2026-09-28 mark; BF26 is `pre` (not checked). Today is Wednesday; the next Mon/Thu mark is due Thu Oct 1 on the 17 Mon/Thu tickers (the 12 classics' first move). Nothing missed.

**GA4:** `ga4-latest.json` generated 2026-09-29T15:11Z (21 h, inside 36 h); window ends Sep 28. Trailing median = the 11 prior `ga4-history` rows.

| Instrument | Value | Trailing median | Note |
|---|---|---|---|
| keyEventsYesterday / sessionsYesterday | **1 / 29** | 4 / 39 | sessions < 30 and KE ≠ 0 → no FAIL |
| clicks7 | **23** | 36 | −36%, under the 60% line. First uptick in seven days (22 → 23). buystrip 6, buybox 0 |
| organicKeyEventRate7 · blendedKeyEventRate7 | **11.36%** · **6.01%** | 9.72 · 5.51 | both OK |
| returningShare7 | **6.93%** | 4.36 | OK (small base) |
| nonUSTopCountry7 | Singapore **51** sessions @ 0.12 s = **39%** of US (130) | — | just under the 40% bar; already ruled (cos-2026-09-20-1/-4) |
| newsletterSignup7 | **0** | 0 | unchanged; R26 is the retention KPI, read by the weekly from MailerLite |

Last human GA4 read in STATE: the Sep 23 weekly, 7 days ago — at the LANE-RULES line, not over it; today's 11:00 weekly reads it.

---

## PART B — CLAIMS

Pages this run: `/` and `/bowman-bangers` (mandatory), plus four never read by any run and changed in the last 24 h: `/bowman-chrome-2026-index` (break math, `549e0e4`/`a824a25`), `/bowman-football-2026-index` (BF26 pre, `e8c6ba3`), `/charizard-ex-worth` and `/topps-holiday-baseball-2026` (league Sep 29). Also fetched to size findings: `/bowman-2026-index`, `/bowman-1st-chrome-index` (tier ladder). Outside sources read from the cloud: Checklist Insider's 2026 Bowman Chrome, 2026 Bowman Football and 2026 Topps Holiday checklists; PriceCharting item pages for CPA-SL and CPA-YM.

**Every finding below was re-fetched and reproduced on www.shopcardhub.com at 12:09Z, immediately before filing (R5).**

### FINDING 1 — HIGH · `/bowman-bangers`' buy strip leads with the **September 2026 Bowman Chrome** hobby box. None of the ten board autos is in that product.

- **Live:** strip title "2026 Bowman Chrome Baseball Hobby Box", primary button "Shop hobby boxes on eBay" (`customid=bowman-bangers-top`, query `Sealed Hobby Box Bowman Chrome Baseball 2026 …`). May's box is the secondary link. The phone dock (`js/buy-strip.js`) carries the primary product, so on a phone the Chrome box is the only product shown.
- **The data:** the September 2026 Bowman Chrome auto checklist (`data/sets/2026-bowman-chrome-baseball.json`, CPA group, 104 cards; confirmed against Checklist Insider this run) has **no CPA for any of the ten board names**: Holliday, Fischer, Arquette, Florentino, Kim, Gonzales, Aloy, Houston, Pierce, Jump. Holliday and Arquette appear there only as returning base cards (BCP-209, BCP-174).
- **The page contradicts its own strip.** It says "there is no Andrew Fischer autograph on the published 2026 Bowman Chrome checklist". R8 says the board class's 1st autos are in May's Bowman. R29 (yesterday) says "today its seats' autos are 2026 Bowman (May)".
- **Why HIGH:** R8 calls this the error the hobby catches first. It sits on the money link of a top-10 lander (the reason the strip exists), and a buyer who opens the headline box cannot pull any card ranked on the page.
- **R6:** this challenges a ruling, it does not re-file one. The Sep 26 decision (STATE "Shipped" table: "/bowman-bangers buy strip (Chrome hobby box · May box · case) … LIVE"; `data/buy-strip.json` `_why`) rests on "The board is the 1st Bowman Chrome Auto class; its sealed product is the Chrome hobby box". That premise is wrong on the checklist: the board's cards are May Bowman CPAs, and "Chrome" in the card name is not the Chrome product.
- **Remedy:** a config change in `data/buy-strip.json`, then re-run `build-buy-strip.mjs`:
  - primary → 2026 Bowman (May) hobby box, keeping the existing `-chrome` query;
  - Chrome box → secondary, labelled "Sep Bowman Chrome box (the next class)", or dropped;
  - the case query and `req` follow the primary.
- **No figure changes.** The strip's ask stays labelled as an ask (R11).

### FINDING 2 — MED · The Bowman index split matches names without folding accents. Two September 1st autos are filed under May's BB26 (one is priced live), one September *returning* auto sits in BB26/BOW26 as a 1st, and BCB26's "every 1st Bowman Chrome Auto — 95 cards" is 97.

- **Cause:** `tools/build-sector-index.mjs` `bowmanConfigs()` (l.119–137) keys the September checklist by `player.toLowerCase()` and matches SportsCardsPro names exactly. `may.auto = !isSepAuto(name)`. SCP spells the names without accents; the checklist has them. So:
  - **CPA-SL Sean Paul Liñan** (September, `first: true`) → misfiled to **BB26**. Live on `/bowman-2026-index` as "Sean Paul Linan #CPA-SL — 2026 Bowman": in the BB26 basket at $8.50, n30 7, w 1, and in BOW26. Absent from `/bowman-chrome-2026-index` (0 hits live).
  - **CPA-YM Yadier Muñoz** (September, `first: true`) → BB26/BOW26 universe, missing from BCB26.
  - **CPA-LP Luis Peña.** The September card is *not* a 1st (`first` absent; his CPA-LP is in `bowman-baseball-2025.json`). It still lands in the **BB26 and BOW26 universes as a 1st Bowman Chrome Auto**. It is not in either basket today.
- **The coverage claim:** the BCB26 hero says "Every 1st Bowman Chrome Auto in 2026 Bowman Chrome — **95 cards**", and `indices.json` BCB26 `universeComplete: true` with a 95-card universe. The same page's method note says 97 of 104 CPAs are 1sts. The two missing are exactly Liñan and Muñoz.
- **Why now:**
  - The rulebook's first-Monday-of-October reconstitution is **Mon Oct 5**. Liñan and Muñoz show 8 and 13 dated sales on PriceCharting since Sep 10 and Sep 15, so both look likely to clear the 6-comp entry. Read from the cloud, not screened for clean ungraded singles.
  - At that reconstitution they would enter the wrong release index, and Peña could enter BB26/BOW26 as a false 1st.
  - R9 rule 2: a returning card is never a 1st.
- **R6:** no ledger row or STATE line mentions accents, Liñan, Muñoz or Peña.
- **Remedy:**
  - fold diacritics (`normalize('NFD').replace(/\p{M}/gu,'')`) on both sides, or match on CPA code plus name;
  - re-run BB26/BCB26/BOW26 as a logged divisor adjustment (level unchanged) before Oct 5;
  - add a builder assertion: `|BCB26 universe| == count(first CPA in the September checklist)`.
  - The collision is real on the checklist too: CPA-AN is printed for both Angel Nunez and Alejandro Nunez, and the builder already keeps them apart by path. Fine as is; noted so nobody "dedupes" it.

### FINDING 3 — MED · Break math says "the floor is his non-auto 1st Bowman Chromes, which come in every case". For 34 of the 104 players it covers, this product has no non-auto 1st Bowman Chrome.

- **Live:** `/bowman-chrome-2026-index`, BREAKS:BCB26 block (`tools/build-break-math.mjs:89`).
- **Data:** in `data/sets/2026-bowman-chrome-baseball.json`:
  - **30** CPA players have no BCP card in September Chrome at all;
  - **4** more (Kilby, Quintero, Parker, Dalis) have a BCP that is not a 1st;
  - two of the 15 table rows are in the first group: **Enddy Azocar (#5)** and **Juan Torres (#12)**. Checklist Insider confirms both appear only as CPA-EA / CPA-JT.
- **Why MED:** it is R9 rule 1 in reverse — an auto does not imply a base 1st. R29 requires the math that rides with a break link to be exact. Both affected rows currently show "few spots listed", so no paid link carries the error today.
- **Scope note:** STATE (Sep 29 21:00) queues "non-auto 1st Bowman Chrome floor per case" to the **Thursday Oct 1 Chrome read**. That build must take the floor per player from the BCP group, and show "no 1st Bowman Chrome base in this product" where there is none.
- **R6:** no ruling.
- **Remedy:** reword now to "…his non-auto 1st Bowman Chrome, where this product has one (34 of 104 players have none here)". Or fold it into Thursday's floor build.

### FINDING 4 — LOW · BCB26's method note names the wrong product for the returning autos: "returning names (Holliday BCP-209, Kilby, Quintero, Arias …) had their 1sts in **May**".

- **Live** on `/bowman-chrome-2026-index`. Source: `tools/build-sector-index.mjs:149`.
- **What the repo's own checklists say:**
  - Kilby's 1st auto is CPA-DK in `bowman-draft-baseball-2025.json`;
  - Quintero and F. Arias are CPA-EQ / CPA-FA in `bowman-baseball-2025.json` (first: true);
  - J. Gonzalez's is in `bowman-chrome-baseball-2025.json`;
  - none of them is in May 2026;
  - Holliday has **no** auto in September Chrome — BCP-209 is his returning *base* card — so he does not belong in a list of excluded autos.
- **R6:** same generator note as queued `iw-2026-09-29-5` (method note → per-config sentence, today's weekly). No separate work; add this to that item's scope.
- **Remedy:** "returning autos (Kilby, Quintero, F. Arias, J. Gonzalez, Parker, Doyle, Peña) had their 1st Bowman autos in 2025 products and are excluded here".

### FINDING 5 — LOW · `/topps-holiday-baseball-2026` says Hidden Elf is "25 cards, five variations for each of five players". It is 25 cards, one each for 25 players.

- **Live** in the chase table (`topps-holiday-baseball-2026.html:949`).
- **Checklist Insider** "Hidden Elf Checklist, 25 cards": HE-1 Judge … HE-25 Chandler, 25 different players. The page's own rows cite HE-14 Anthony and HE-17 Murakami.
- The same cell's "Judge, Ohtani, Skenes and eleven rookies are on the list" already contradicts "five players".
- No price is involved. Every other card number I spot-checked matches: H82, H100, H131, H161, H170, H183, MNL-3/9/10, OO-16, OO-20.
- **R6:** none. Per R27, agent A owns the page, so the edit goes to the desk or the league integrator.

---

## CHECKED AND CLEARED

- **`/`:** board levels and the "Sep 28 · n marks" stamps match `indices.json` for all 23 tickers. The door-03 and pitch copy fixed yesterday are live.
  - "re-marked weekly" (×4) and "updated every week" are `iw-2026-09-29-6`, queued to today's weekly. Not re-filed.
  - The engine-screen labels "2026 Bowman Chrome 1st Bowman Auto CPA-WA/-FR/-AG/-LH" are all September 1sts (Asigen, Renteria, A. Gomez, L. Hernandez), so they are correct. The 2025 CPA-AG/-LH codes belong to different players.
  - The Bangers 30D composite is labelled ask-basis, an existing block allowed until Oct 7 (R20).
  - The release calendar's Bowman Football Sep 30 date is confirmed (Checklist Insider: Hobby Sep 30).
- **`/bowman-bangers` (apart from Finding 1):**
  - The five verdicts on the page (Fischer Hold, Holliday Hold, Gonzales Pass, Florentino Buy, Kim Pass) are consistent with the page's own Sep 22 correction. That correction says Holliday's verdict has been Hold since June, and the "Sell" was the engine's ask-side word.
  - The ranking rule now reads "sold mark" throughout, which is the Sep 29 method change.
  - There are no break links, which is correct under R29 (the seats' autos are May).
  - The signup pitch has the R26 wording.
- **`/bowman-chrome-2026-index` break math** (apart from Findings 3–4):
  - 20.5/104 = 0.197 autos/player/case.
  - Poisson P(0) is 82.1% for one case and 55.4% for three.
  - Zazueta's figure is $51 × 0.301 = $15.37.
  - Break links carry `data-break-until="2026-10-09"` on 13 players plus an all-players link, and every query names "2026 bowman chrome" (R29 ✓). No spot price is shown (R20).
  - Checklist Insider says "2 Autographs" per hobby box against 20.5/12 = 1.7 from the CPA odds. The gap is plausibly non-CPA autos, so not filed.
- **`/bowman-football-2026-index` (BF26 pre):** no level is printed. "Streets Wednesday, Sep 30" is confirmed. Chrome Prospect Autographs exist in the product. It is a pre-launch description, so nothing is overstated.
- **`/charizard-ex-worth`:** every index claim reconciles to `indices.json`:
  - SV151 #199 $342.35 is #1 of 207, 18.5% of $1,846.99, prev $350 on Sep 25;
  - PF25 #125 $672.33 is #1 of 36, 60.3%, prev $734 on Sep 18;
  - AH26 #294 $324.04 is #4 of 70, 6.8%, prev $327.44 on Sep 21.
  - The ratios hold: 4.3×, +$46, $1,030, 6.7×, 2.33×. Graded cells are title-verified or "Not read" (R18).
- **`/bowman-1st-chrome-index` tier ladder:** figures are sold-basis (SCP scan), and 1/1s are excluded. The /25 ≈ /50 multiple is already noted in STATE as a thin board. Not filed.

## STUMBLES — mine, this run

1. **Nearly filed Finding 1 as unruled.** The ledger grep came back empty. STATE's shipped table and `buy-strip.json` `_why` showed the Sep 26 decision, so I refiled it as a challenge to that ruling's premise and not as a fresh finding.
2. **Nearly filed CPA-AG / CPA-LH on the home engine screens as returning autos.** The codes appear in the 2025 set files too. They belong to different players (Asbel Gonzalez / Adonys Guzman, Landon Harmon). Withdrawn.
3. **A name-match false positive.** My first checklist grep put "Houston" on nine CPA/BCP codes. It was matching the Houston Astros. Discarded.
4. **Finding 2's entry claim is soft.** The Liñan/Muñoz sales counts are `td.date` cells from PriceCharting's 301 body (the redirect target, SportsCardsPro, 403s from the cloud). I did not screen them for clean ungraded singles. The misfiling itself is certain; "would enter Oct 5" is likely, not verified.
5. **Finding 3's count uses exact player names across the BCP and CPA groups.** A spelling variant between groups would inflate the 34. I spot-checked Azocar and Torres against Checklist Insider, but not all 34.
6. **Yesterday's cadence line was wrong** (see top): the GO-TIME block already made this lane daily.

## WHAT I DID NOT DO

- No git beyond clone, ls-remote, log, ls-files and read. No fix, commit or push. `data/pipeline.json` untouched (R1).
- No `/api/comps` or `/api/auctions` calls. No X, vendor or email contact.
- No listing titles copied.

**Proposals staged:** `claude/cos/integrity-watch-2026-09-30-proposals.json`, 5 entries, `awaiting-cos`.

**Watch (not findings):**

- **Thu Oct 1:** 17 Mon/Thu tickers should show an Oct 1 mark (the classics' first move).
- **Mon Oct 5:** the reconstitution (Finding 2 must land first).
- **clicks7:** 23 vs 36 median, flat at the bottom.
- **Singapore:** 39% of US sessions, one point under the bar.
