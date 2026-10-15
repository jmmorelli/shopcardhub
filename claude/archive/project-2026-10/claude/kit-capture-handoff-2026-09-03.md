# Lead capture wiring — CLOSED Sep 3 2026 (Kit retired; MailerLite shipped)

**Outcome (Sep 3 PM, Mac-linked session):** Mo didn't know what Kit was and, told that his MailerLite account already works end-to-end (`/api/subscribe` live on Vercel), chose MailerLite and no second list. Result:
- `1d82ec2` — the three Signal Alerts blocks now post to `/api/subscribe`, fire `newsletter_signup {method:'mailerlite', location:'signal-<page>'}`, and activate per page from `data/newsletter.json` → `{"provider":"mailerlite","pages":["roy-watch"]}`. Live on /roy-watch-2026 only (homepage and /bowman-bangers already carry the Tuesday Tape form). Block copy promises the weekly Tape Recap only — the "instant BUY/SELL flip alerts" line is gone (no such automation; Aug 21 hold-oriented rule).
- GA4: `newsletter_signup` starred as a key event in property ShopCardHub (a397485386/p541047014) — Qualified Leads counts it now.
- `9f7ac6e` — the Fischer hotfix shipped first, as planned.
- Not done, by decision: Kit account, Kit form, `KIT_API_KEY`, Kit domain verification. `tools/price-engine/newsletter.mjs` (Kit-only) is inert; STATE has a weekly item to delete or port it.

Current state of email capture lives in `claude/cos/STATE.md` → "Email capture — how it works now". The original plan below is kept for the record only.

---

## Original handoff (superseded)

Goal: turn on the Signal Alerts email capture (built Jul 30–31, shipped dark) and make GA4 "Qualified Leads" count it. Status check Sep 3: all code is on `main` already — signup blocks on /bowman-bangers, /, /roy-watch-2026 (render only when `data/newsletter.json` has a `kitFormId`), `tools/price-engine/newsletter.mjs` in the nightly Action (inert without `KIT_API_KEY`), and a `newsletter_signup` gtag event already fires on successful subscribe. The ONLY missing pieces are account-side.

Mo does: create/log into the free Kit account; paste the API key into GitHub as `KIT_API_KEY`; later, Kit domain verification.
CoS does: create the "Signal Alerts" inline form, set `kitFormId`, commit + push, verify live, generate the V4 key, mark `newsletter_signup` as a GA4 key event, flip gtag `method` to `'kit'`, apply the Fischer hotfix first, watch the Vercel deploy.

Full original build notes: `claude/email-signal-alerts-2026-07-31.md`.
