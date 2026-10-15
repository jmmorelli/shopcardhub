# Resume: Bowman tiers build — DONE Sep 29 ~19:05 PT (see STATE run log)

- Shipped `e8c6ba3`: BOW26 serial tier ladder (TIERS:BOW26 on /bowman-1st-chrome-index, data/tiers.json) from a full Sep 30 SCP scan (827 cards, 1,125 dated sales); /bowman-football-2026-index BF26 PRE; BOW26/BB26 strip fix.
- Held: /one-of-one-watch (sightings lost with the old clone; 0 SuperFractor sales in 120 d). Script kept at `Card Hub/Claude outputs/tiers/build-one-of-one.mjs`. Revive when there are sourced sightings or a dated 1/1 sale.
- Still open: after Sep 30, once SCP lists the 2026 Bowman Football console, add a BF26 CONFIG to build-sector-index.mjs and --init. Tier ladder re-read is by hand in Chrome (SCP blocks servers and Actions); page ttl 10 days.
- Scan method that works: page the console by POST, fetch item pages sequentially in the page context, wait with a MessageChannel spin (hidden-tab setTimeout is throttled to ~1/min), Blob-download to ~/Downloads and verify before closing the tab.
